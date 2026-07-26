// backend/services/queue/document.worker.ts
import { Worker, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import DocumentModel from '../../models/Document';
import JobModel from '../../models/Job';
import { scanFile } from '../security/virus-scan.service';
import { uploadToCloudinary, isCloudinaryConfigured } from '../storage/cloudinary.service';
import { extractTextFromImage } from '../ocr/ocr.service';
import { extractFromPDF } from '../pdf/pdf.service';
import { DocumentJobData, getRedisConnection } from './queue.service';

// ── Step helpers ───────────────────────────────────────────────────────────────

async function updateJobStep(
    jobRecordId: string,
    step: string,
    status: 'completed' | 'failed' | 'skipped',
    progress: number,
    extra?: Record<string, any>
) {
    const update: any = {
        [`steps.${step}`]: status,
        progress,
        ...(extra || {}),
    };
    await JobModel.findByIdAndUpdate(jobRecordId, { $set: update });
}

// ── Main Processing Function ───────────────────────────────────────────────────

async function processDocument(job: Job<DocumentJobData>): Promise<void> {
    const { documentId, filePath, mimeType, jobRecordId } = job.data;

    console.log(`🔄 Processing document ${documentId} (job ${job.id})`);

    // Mark job as processing
    await JobModel.findByIdAndUpdate(jobRecordId, {
        $set: { status: 'processing' },
        $inc: { attempts: 1 },
    });
    await DocumentModel.findByIdAndUpdate(documentId, {
        $set: { extractionStatus: 'processing' },
    });

    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    // ── Step 1: Virus Scan (10%) ───────────────────────────────────────────────
    try {
        const scanResult = await scanFile(filePath);
        if (!scanResult.clean) {
            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    virusScanStatus: 'infected',
                    extractionStatus: 'failed',
                },
            });
            await updateJobStep(jobRecordId, 'virusScan', 'failed', 10, {
                status: 'failed',
                error: `Infected: ${scanResult.viruses.join(', ')}`,
            });
            // Clean up the infected file
            try { fs.unlinkSync(filePath); } catch { }
            throw new Error(`File infected: ${scanResult.viruses.join(', ')}`);
        }
        const scanStatus = scanResult.skipped ? 'skipped' : 'clean';
        await DocumentModel.findByIdAndUpdate(documentId, {
            $set: { virusScanStatus: scanStatus },
        });
        await updateJobStep(
            jobRecordId,
            'virusScan',
            scanResult.skipped ? 'skipped' : 'completed',
            10
        );
    } catch (err: any) {
        if (err.message?.startsWith('File infected')) throw err;
        console.error('Virus scan error:', err);
        await updateJobStep(jobRecordId, 'virusScan', 'skipped', 10);
    }
    await job.updateProgress(10);

    // ── Step 2: Image Compression (25%) ────────────────────────────────────────
    let compressedPath = filePath;
    try {
        if (isImage) {
            const ext = path.extname(filePath).toLowerCase();
            compressedPath = filePath.replace(ext, `-compressed${ext}`);

            // Handle HEIC separately – sharp supports it natively
            await sharp(filePath)
                .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 85, mozjpeg: true })
                .toFile(compressedPath);

            await updateJobStep(jobRecordId, 'compression', 'completed', 25);
        } else {
            // PDFs: no compression step
            compressedPath = filePath;
            await updateJobStep(jobRecordId, 'compression', 'skipped', 25);
        }
    } catch (err) {
        console.error('Compression error:', err);
        compressedPath = filePath; // fallback to original
        await updateJobStep(jobRecordId, 'compression', 'failed', 25);
    }
    await job.updateProgress(25);

    // ── Step 3: Cloud Upload (45%) ─────────────────────────────────────────────
    let cloudResult: any = null;
    try {
        if (isCloudinaryConfigured()) {
            const uploadPath = isImage ? compressedPath : filePath;
            cloudResult = await uploadToCloudinary(uploadPath, {
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
            await updateJobStep(jobRecordId, 'cloudUpload', 'completed', 45);
        } else {
            console.warn('⚠️  Cloudinary not configured – skipping cloud upload');
            await updateJobStep(jobRecordId, 'cloudUpload', 'skipped', 45);
        }
    } catch (err) {
        console.error('Cloud upload error:', err);
        await updateJobStep(jobRecordId, 'cloudUpload', 'failed', 45);
    }
    await job.updateProgress(45);

    // ── Step 4: Thumbnail Generation (55%) ─────────────────────────────────────
    try {
        if (cloudResult && cloudResult.thumbnails) {
            // Thumbnails already generated via Cloudinary transformations
            await updateJobStep(jobRecordId, 'thumbnails', 'completed', 55);
        } else if (isImage) {
            // Generate local thumbnails with sharp
            const thumbDir = path.join(path.dirname(filePath), 'thumbs');
            fs.mkdirSync(thumbDir, { recursive: true });

            const baseName = path.basename(filePath, path.extname(filePath));
            const thumbSmall = path.join(thumbDir, `${baseName}-150.jpg`);
            const thumbMedium = path.join(thumbDir, `${baseName}-400.jpg`);
            const thumbLarge = path.join(thumbDir, `${baseName}-800.jpg`);

            await Promise.all([
                sharp(filePath).resize(150, 150, { fit: 'cover' }).jpeg({ quality: 70 }).toFile(thumbSmall),
                sharp(filePath).resize(400).jpeg({ quality: 80 }).toFile(thumbMedium),
                sharp(filePath).resize(800).jpeg({ quality: 85 }).toFile(thumbLarge),
            ]);

            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    thumbnails: {
                        small: `/uploads/thumbs/${path.basename(thumbSmall)}`,
                        medium: `/uploads/thumbs/${path.basename(thumbMedium)}`,
                        large: `/uploads/thumbs/${path.basename(thumbLarge)}`,
                    },
                    thumbnail: `/uploads/thumbs/${path.basename(thumbMedium)}`,
                },
            });
            await updateJobStep(jobRecordId, 'thumbnails', 'completed', 55);
        } else {
            await updateJobStep(jobRecordId, 'thumbnails', 'skipped', 55);
        }
    } catch (err) {
        console.error('Thumbnail generation error:', err);
        await updateJobStep(jobRecordId, 'thumbnails', 'failed', 55);
    }
    await job.updateProgress(55);

    // ── Step 5: OCR (75%) ──────────────────────────────────────────────────────
    let extractedText = '';
    try {
        if (isImage) {
            const buffer = fs.readFileSync(filePath);
            const ocrResult = await extractTextFromImage(buffer);

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
            extractedText = ocrResult.text;
            await updateJobStep(jobRecordId, 'ocr', 'completed', 75);
        } else if (isPdf) {
            // For PDFs, OCR any pages without embedded text (handled in PDF step)
            await updateJobStep(jobRecordId, 'ocr', 'skipped', 75);
        } else {
            await updateJobStep(jobRecordId, 'ocr', 'skipped', 75);
        }
    } catch (err) {
        console.error('OCR error:', err);
        await updateJobStep(jobRecordId, 'ocr', 'failed', 75);
    }
    await job.updateProgress(75);

    // ── Step 6: PDF Parsing (90%) ──────────────────────────────────────────────
    try {
        if (isPdf) {
            const buffer = fs.readFileSync(filePath);
            const pdfResult = await extractFromPDF(buffer);

            // If PDF has no embedded text, run OCR on the first page image
            let finalText = pdfResult.text;
            let ocrProvider: string | undefined;
            let ocrConfidence: number | undefined;
            let ocrBlocks: any[] | undefined;

            if (!pdfResult.text.trim() && pdfResult.pageCount > 0) {
                // PDF is image-based, we would need to convert PDF to images before OCR.
                // Since pdf2pic or similar is not setup in this environment, skip OCR safely.
                console.warn(`⚠️ PDF ${documentId} is image-based. PDF-to-Image OCR is unsupported without additional tools.`);
            }

            await DocumentModel.findByIdAndUpdate(documentId, {
                $set: {
                    extractedText: finalText,
                    pageCount: pdfResult.pageCount,
                    headings: pdfResult.headings.map(h => h.text),
                    tables: pdfResult.tables,
                    bookmarks: pdfResult.bookmarks,
                    imageCount: pdfResult.imageCount,
                    pdfMetadata: pdfResult.metadata,
                    ...(ocrProvider && { ocrProvider }),
                    ...(ocrConfidence !== undefined && { ocrConfidence }),
                    ...(ocrBlocks && { ocrBlocks }),
                },
            });
            extractedText = finalText;
            await updateJobStep(jobRecordId, 'pdfParsing', 'completed', 90);
        } else {
            await updateJobStep(jobRecordId, 'pdfParsing', 'skipped', 90);
        }
    } catch (err) {
        console.error('PDF parsing error:', err);
        await updateJobStep(jobRecordId, 'pdfParsing', 'failed', 90);
    }
    await job.updateProgress(90);

    // ── Finalize (100%) ────────────────────────────────────────────────────────
    const finalStatus = extractedText ? 'completed' : 'failed';
    await DocumentModel.findByIdAndUpdate(documentId, {
        $set: { extractionStatus: finalStatus },
    });
    await JobModel.findByIdAndUpdate(jobRecordId, {
        $set: {
            status: 'completed',
            progress: 100,
            result: { extractedTextLength: extractedText.length },
        },
    });

    // Clean up compressed file if different from original
    if (compressedPath !== filePath) {
        try { fs.unlinkSync(compressedPath); } catch { }
    }

    await job.updateProgress(100);
    console.log(`✅ Document ${documentId} processing complete`);
}

// ── Start Worker ───────────────────────────────────────────────────────────────

let worker: Worker | null = null;

export function startDocumentWorker(): Worker | null {
    const connection = getRedisConnection();
    if (!connection) {
        console.warn('⚠️  Cannot start worker – Redis not available');
        return null;
    }

    worker = new Worker<DocumentJobData>(
        'document-processing',
        async (job) => {
            await processDocument(job);
        },
        {
            connection,
            concurrency: 2,
            limiter: {
                max: 5,
                duration: 60000, // max 5 jobs per minute
            },
        }
    );

    worker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });

    worker.on('failed', async (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
        if (job) {
            try {
                await JobModel.findOneAndUpdate(
                    { bullJobId: job.id },
                    {
                        $set: {
                            status: 'failed',
                            error: err.message,
                        },
                        $inc: { attempts: 0 },
                    }
                );
                // Update document extraction status
                await DocumentModel.findByIdAndUpdate(job.data.documentId, {
                    $set: { extractionStatus: 'failed' },
                });
            } catch (updateErr) {
                console.error('Failed to update job/document on failure:', updateErr);
            }
        }
    });

    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });

    console.log('✅ Document processing worker started');
    return worker;
}

export async function stopDocumentWorker(): Promise<void> {
    if (worker) {
        await worker.close();
        console.log('🛑 Document worker stopped');
    }
}
