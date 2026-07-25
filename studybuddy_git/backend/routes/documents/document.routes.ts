import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { extractTextFromPDF } from '../../services/pdf/pdf.service.js';
import { extractTextFromImage } from '../../services/ocr/ocr.service.js';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload', upload.single('document'), async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const { mimetype, buffer, originalname } = req.file;
        let extractedText = '';

        if (mimetype === 'application/pdf') {
            extractedText = await extractTextFromPDF(buffer);
        } else if (mimetype.startsWith('image/')) {
            extractedText = await extractTextFromImage(buffer);
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or an Image.' });
        }

        // TODO: Pass the extractedText to Gemini API for summarization and flashcard generation based on user preferences.

        return res.status(200).json({
            message: 'Document processed successfully',
            filename: originalname,
            textSummary: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''), // Return a preview
            fullTextLength: extractedText.length
        });
    } catch (error: any) {
        console.error('Upload Error:', error);
        return res.status(500).json({ error: error.message || 'Server error during document processing' });
    }
});

router.get('/', (req: Request, res: Response) => {
    // Dummy returning empty for now
    res.json({ documents: [] });
});

export default router;
