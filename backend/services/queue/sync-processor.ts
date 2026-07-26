// backend/services/queue/sync-processor.ts
// Fallback synchronous processor when Redis/BullMQ is unavailable
import fs from 'fs';
import sharp from 'sharp';
import path from 'path';
import DocumentModel from '../../models/Document';
import { scanFile } from '../security/virus-scan.service';
import { uploadToCloudinary, isCloudinaryConfigured } from '../storage/cloudinary.service';
import { extractTextFromImage } from '../ocr/ocr.service';
import { extractFromPDF } from '../pdf/pdf.service';

export interface SyncProcessData {
    documentId: string;
    filePath: string;
    mimeType: string;
}

/**
 * Synchronous document processing fallback when Redis/BullMQ is not available.
 * Runs the entire pipeline sequentially in the request handler context.
 * This is NOT used in production – only in dev when Redis is not running.
 */
export async function processSynchronously(data: SyncProcessData): Promise<void> {
    const { documentId, filePath, mimeType } = data;
    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    console.log(`🔄 Sync processing document ${documentId} (no Redis)`);

    await DocumentModel.findByIdAndUpdate(documentId, {
        $set: { extractionStatus: 'processing' },
    });

    // 1. Virus scan
    try {
        const scanResult = await scanFile(filePath);
        const scanStatus = scanResult.skipped ? 'skipped' : scanResult.clean ? 'clean' : 'infected';
        await DocumentModel.findByIdAndUpdate(documentId, {
            $set: { virusScanStatus: scanStatus },
        });
        if (!scanResult.clean) {
            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: { extractionStatus: 'failed' },
            });
            try { fs.unlinkSync(filePath); } catch { }
            return;
        }
    } catch { /* skip */ }

    // 2. Image compression
    let compressedPath = filePath;
    if (isImage) {
        try {
            const ext = path.extname(filePath).toLowerCase();
            compressedPath = filePath.replace(ext, `-compressed${ext}`);
            await sharp(filePath)
                .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85, mozjpeg: true })
                .toFile(compressedPath);
        } catch {
            compressedPath = filePath;
        }
    }

    // 3. Cloud upload
    try {
        if (isCloudinaryConfigured()) {
            const uploadPath = isImage ? compressedPath : filePath;
            const cloudResult = await uploadToCloudinary(uploadPath, {
                folder: 'studybuddy/documents',
                resourceType: isPdf ? 'image' : 'auto',
            });
            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    cloudPublicId: cloudResult.publicId,
                    cloudUrl: cloudResult.secureUrl,
                    compressedUrl: cloudResult.compressedUrl,
                    cloudStoragePath: cloudResult.secureUrl,
                    thumbnails: cloudResult.thumbnails,
                    thumbnail: cloudResult.thumbnails.medium,
                },
            });
        }
    } catch (err) {
        console.error('Sync cloud upload error:', err);
    }

    // 4. Local thumbnails (if no Cloudinary)
    if (isImage && !isCloudinaryConfigured()) {
        try {
            const thumbDir = path.join(path.dirname(filePath), 'thumbs');
            fs.mkdirSync(thumbDir, { recursive: true });
            const baseName = path.basename(filePath, path.extname(filePath));
            const thumbMedium = path.join(thumbDir, `${baseName}-400.jpg`);
            await sharp(filePath).resize(400).jpeg({ quality: 80 }).toFile(thumbMedium);
            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    thumbnail: `/uploads/thumbs/${path.basename(thumbMedium)}`,
                },
            });
        } catch { /* skip */ }
    }

    // 5. OCR / PDF parsing
    let extractedText = '';
    try {
        if (isImage) {
            const buffer = fs.readFileSync(filePath);
            const ocrResult = await extractTextFromImage(buffer);
            extractedText = ocrResult.text;
            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    extractedText: ocrResult.text,
                    ocrProvider: ocrResult.provider,
                    ocrConfidence: ocrResult.confidence,
                    ocrBlocks: ocrResult.blocks.map(b => ({
                        type: b.type,
                        text: b.text,
                        confidence: b.confidence,
                    })),
                },
            });
        } else if (isPdf) {
            const buffer = fs.readFileSync(filePath);
            const pdfResult = await extractFromPDF(buffer);
            extractedText = pdfResult.text;

            let ocrProvider: string | undefined;
            let ocrConfidence: number | undefined;

            // OCR fallback for image-based PDFs
            if (!pdfResult.text.trim() && pdfResult.pageCount > 0) {
                try {
                    const ocrResult = await extractTextFromImage(buffer);
                    extractedText = ocrResult.text;
                    ocrProvider = ocrResult.provider;
                    ocrConfidence = ocrResult.confidence;
                } catch { /* skip */ }
            }

            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    extractedText,
                    pageCount: pdfResult.pageCount,
                    headings: pdfResult.headings.map(h => h.text),
                    tables: pdfResult.tables,
                    bookmarks: pdfResult.bookmarks,
                    imageCount: pdfResult.imageCount,
                    pdfMetadata: pdfResult.metadata,
                    ...(ocrProvider && { ocrProvider }),
                    ...(ocrConfidence !== undefined && { ocrConfidence }),
                },
            });
        }
    } catch (err) {
        console.error('Sync extraction error:', err);
    }

    // Finalize
    await DocumentModel.findByIdAndUpdate(documentId, {
        $set: { extractionStatus: extractedText ? 'completed' : 'failed' },
    });

    // Cleanup compressed file
    if (compressedPath !== filePath) {
        try { fs.unlinkSync(compressedPath); } catch { }
    }

    console.log(`✅ Sync processing complete for ${documentId}`);
}
