// backend/routes/documents/document.routes.ts
import { Router } from 'express';
import mongoose from 'mongoose';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import Document from '../../models/Document';
import Job from '../../models/Job';
import Folder from '../../models/Folder';
import DocumentFolder from '../../models/DocumentFolder';
import { protect } from '../../middleware/auth';
import { verifyOwnership } from '../../middleware/ownership';
import { validateBody } from '../../middleware/validation';
import { cache } from '../../middleware/cache';
import { searchDocuments } from '../../services/search/search.service';
import { uploadDocumentSchema, updateDocumentSchema } from '../../validation/document';
import { addDocumentJob, isQueueAvailable } from '../../services/queue/queue.service';
import { processSynchronously } from '../../services/queue/sync-processor';
import fs from 'fs';

const router = Router();

// Ensure the uploads directory exists
fs.mkdirSync('uploads', { recursive: true });

// ── Allowed MIME types ─────────────────────────────────────────────────────────
const ALLOWED_MIMES: Record<string, boolean> = {
    'application/pdf': true,
    'image/png': true,
    'image/jpeg': true,
    'image/jpg': true,
    'image/heic': true,
    'image/heif': true,
};

// ── Multer config ──────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        cb(null, unique);
    },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_MIMES[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, PNG, JPEG, JPG, HEIC`));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter,
});

// ── POST /upload – production upload pipeline ──────────────────────────────────
router.post(
    '/upload',
    protect,
    upload.single('file'),
    validateBody(uploadDocumentSchema),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'File missing' });
            }

            const { title, subject, description, tags } = req.body as any;
            const { mimetype, path: filePath, originalname, size } = req.file;
            const userId = (req as any).user.id;

            // Determine upload source
            const uploadSource = (req.body.uploadSource === 'camera') ? 'camera' : 'upload';

            // Create Document record immediately with pending status
            const doc = await Document.create({
                ownerId: userId,
                title,
                subject,
                description,
                originalFilename: originalname,
                storedFilename: filePath,
                mimeType: mimetype,
                fileSize: size,
                uploadSource,
                extractionStatus: 'pending',
                virusScanStatus: 'pending',
                tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
            });

            // ── Queue-based processing (production) ────────────────────────────
            if (isQueueAvailable()) {
                // Create Job record in MongoDB
                const jobRecord = await Job.create({
                    bullJobId: 'pending',
                    type: 'document-processing',
                    status: 'queued',
                    documentId: doc._id,
                    ownerId: userId,
                    progress: 0,
                    steps: {
                        virusScan: 'pending',
                        compression: 'pending',
                        cloudUpload: 'pending',
                        thumbnails: 'pending',
                        ocr: 'pending',
                        pdfParsing: 'pending',
                    },
                });

                const bullJobId = await addDocumentJob({
                    documentId: (doc._id as any).toString(),
                    ownerId: userId,
                    filePath,
                    mimeType: mimetype,
                    jobRecordId: (jobRecord._id as any).toString(),
                });

                if (bullJobId) {
                    // Update records with BullMQ job ID
                    await Job.findByIdAndUpdate(jobRecord._id, { $set: { bullJobId } });
                    await Document.findByIdAndUpdate(doc._id, { $set: { jobId: bullJobId } });
                }

                return res.status(201).json({
                    document: doc,
                    jobId: (jobRecord._id as any).toString(),
                    bullJobId: bullJobId,
                    processing: 'queued',
                    message: 'Document uploaded. Processing in background.',
                });
            }

            // ── Synchronous fallback (dev without Redis) ───────────────────────
            console.log('⚠️  Redis unavailable – processing synchronously');

            // Process in background (non-blocking) but still sync within the server
            processSynchronously({
                documentId: (doc._id as any).toString(),
                filePath,
                mimeType: mimetype,
            }).catch(err => console.error('Sync processing error:', err));

            return res.status(201).json({
                document: doc,
                processing: 'synchronous',
                message: 'Document uploaded. Processing started (no queue available).',
            });
        } catch (err: any) {
            console.error('Upload error:', err);
            // Handle multer errors
            if (err.message?.includes('Unsupported file type')) {
                return res.status(400).json({ message: err.message });
            }
            res.status(500).json({ message: 'Upload failed' });
        }
    }
);

// ── GET / – list with pagination, sorting, filtering, search ───────────────────
router.get('/', protect, async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
        page = '1',
        limit = '20',
        sort = 'newest', // matches search service options
        query = '',
        subject,
        tags,
        fileType,
        folderId,
        favorite,
        archived,
        uploadSource,
        dateFrom,
        dateTo,
    } = req.query as any;

    const result = await searchDocuments({
        userId,
        query,
        subject,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined,
        fileType,
        folderId,
        favorite: favorite !== undefined ? favorite === 'true' : undefined,
        archived: archived !== undefined ? archived === 'true' : undefined,
        uploadSource,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        sort,
        page: Number(page),
        limit: Number(limit),
    });

    res.json({ total: result.total, page: Number(page), limit: Number(limit), docs: result.docs });
});

// ── GET /:id – single document ─────────────────────────────────────────────────
router.get('/:id', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    const doc = await Document.findById(req.params.id);
    res.json(doc);
});

// ── PATCH /:id – update mutable fields ─────────────────────────────────────────
router.patch(
    '/:id',
    protect,
    verifyOwnership(Document),
    validateBody(updateDocumentSchema),
    async (req: Request, res: Response) => {
        const updates = req.body as any;
        const doc = await Document.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(doc);
    }
);

// ── DELETE /:id – soft delete ──────────────────────────────────────────────────
router.delete('/:id', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    await Document.findByIdAndUpdate(req.params.id, { deleted: true });
    res.json({ message: 'Document soft‑deleted' });
});

// ── POST /:id/restore – restore soft‑deleted ──────────────────────────────────
router.post('/:id/restore', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    await Document.findByIdAndUpdate(req.params.id, { deleted: false });
    res.json({ message: 'Document restored' });
});


// ── PATCH /:id/move – move document to another folder
router.patch('/:id/move', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    const { folderId } = req.body as any;
    const doc = await Document.findByIdAndUpdate(
        req.params.id,
        { folderId: folderId ? new mongoose.Types.ObjectId(folderId) : undefined },
        { new: true }
    );
    res.json(doc);
});

// ── POST /:id/duplicate – duplicate document
router.post('/:id/duplicate', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    const original = await Document.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Document not found' });
    const dup = new Document({
        ...original.toObject(),
        _id: undefined,
        title: original.title + ' (Copy)',
        createdAt: undefined,
        updatedAt: undefined,
    });
    await dup.save();
    res.status(201).json(dup);
});

// ── POST /:id/bookmark – set bookmark page
router.post('/:id/bookmark', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    const { page } = req.body as any;
    const doc = await Document.findByIdAndUpdate(req.params.id, { bookmarkPage: page }, { new: true });
    res.json(doc);
});

// ── PATCH /:id/archive – archive document
router.patch('/:id/archive', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    const doc = await Document.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
    res.json(doc);
});

// ── DELETE /:id/permanent – permanent delete
router.delete('/:id/permanent', protect, verifyOwnership(Document), async (req: Request, res: Response) => {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document permanently deleted' });
});

export default router;

