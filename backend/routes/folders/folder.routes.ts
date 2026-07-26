// backend/routes/folders/folder.routes.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Folder from '../../models/Folder';
import DocumentFolder from '../../models/DocumentFolder';
import Document from '../../models/Document';
import { protect } from '../../middleware/auth';
import { verifyOwnership } from '../../middleware/ownership';
import { validateBody } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas for folder create/update
const createFolderSchema = z.object({
    folderName: z.string().min(1),
    color: z.string().optional(),
    icon: z.string().optional(),
});
const updateFolderSchema = z.object({
    folderName: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
});

// POST /folders – create folder
router.post(
    '/',
    protect,
    validateBody(createFolderSchema),
    async (req: Request, res: Response) => {
        try {
            const { folderName, color, icon } = req.body as any;
            const folder = await Folder.create({
                ownerId: (req as any).user.id,
                folderName,
                color,
                icon,
            });
            res.status(201).json(folder);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Failed to create folder' });
        }
    }
);

// GET /folders – list user's folders
router.get('/', protect, async (req: Request, res: Response) => {
    const folders = await Folder.find({ ownerId: (req as any).user.id });
    res.json(folders);
});

// PATCH /folders/:id – update folder (ownership verified)
router.patch(
    '/:id',
    protect,
    verifyOwnership(Folder, 'id'),
    validateBody(updateFolderSchema),
    async (req: Request, res: Response) => {
        const updates = req.body as any;
        const folder = await Folder.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(folder);
    }
);

// Move folder (change parentId)
router.patch(
    '/:id/move',
    protect,
    verifyOwnership(Folder, 'id'),
    async (req: Request, res: Response) => {
        const { parentId } = req.body as any;
        const folder = await Folder.findByIdAndUpdate(
            req.params.id,
            { parentId: parentId ? new mongoose.Types.ObjectId(parentId) : undefined },
            { new: true }
        );
        res.json(folder);
    }
);

// Get child folders
router.get(
    '/:id/children',
    protect,
    async (req: Request, res: Response) => {
        const children = await Folder.find({ parentId: req.params.id, ownerId: (req as any).user.id });
        res.json(children);
    }
);

router.patch(
    '/:id',
    protect,
    verifyOwnership(Folder, 'id'),
    validateBody(updateFolderSchema),
    async (req: Request, res: Response) => {
        const updates = req.body as any;
        const folder = await Folder.findByIdAndUpdate(req.params.id, updates, { new: true });
        res.json(folder);
    }
);

// DELETE /folders/:id – delete folder (soft delete could be added later)
router.delete('/:id', protect, verifyOwnership(Folder, 'id'), async (req: Request, res: Response) => {
    await Folder.findByIdAndDelete(req.params.id);
    // Also remove any DocumentFolder links
    await DocumentFolder.deleteMany({ folderId: req.params.id });
    res.json({ message: 'Folder deleted' });
});

// POST /folders/:id/documents – add document to folder
router.post(
    '/:id/documents',
    protect,
    verifyOwnership(Folder, 'id'),
    async (req: Request, res: Response) => {
        const { documentId } = req.body as any;
        if (!documentId) return res.status(400).json({ message: 'documentId required' });
        // Ensure document belongs to user

        const doc = await Document.findOne({ _id: documentId, ownerId: (req as any).user.id });
        if (!doc) return res.status(404).json({ message: 'Document not found or not owned' });
        const link = await DocumentFolder.create({ documentId, folderId: new mongoose.Types.ObjectId(req.params.id as string) });
        res.status(201).json(link);
    }
);

// GET /folders/:id/documents – list documents in folder
router.get('/:id/documents', protect, verifyOwnership(Folder, 'id'), async (req: Request, res: Response) => {
    const links = await DocumentFolder.find({ folderId: req.params.id }).populate('documentId');
    const docs = links.map(l => (l as any).documentId);
    res.json(docs);
});

export default router;
