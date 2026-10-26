import fs from 'fs';
// Import the library entry directly: the package index runs a self-test that reads a missing file
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { createWorker } from 'tesseract.js';
import { generate } from './ai';

export interface ExtractResult {
  text: string;
  pages: number;
}

const OCR_PROMPT =
  'Transcribe all of the text in this document exactly as written, keeping line breaks and the reading order. ' +
  'Write math and formulas in plain text (for example x^2, sqrt(x), integral of f(x) dx). ' +
  'If there is a diagram, describe it in one short line in square brackets. Output only the transcription.';

// Gemini reads handwriting and math far better than Tesseract, so prefer it when a key exists
const ocrWithGemini = async (filePath: string, mimeType: string): Promise<string> => {
  const base64 = fs.readFileSync(filePath).toString('base64');
  return generate({
    system: 'You are a precise OCR engine for student notes.',
    turns: [{ role: 'user', text: OCR_PROMPT }],
    image: { mimeType, base64 },
  });
};

const ocrWithTesseract = async (filePath: string): Promise<string> => {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(filePath);
    return data.text || '';
  } finally {
    await worker.terminate();
  }
};

const ocrImage = async (filePath: string, mimeType: string): Promise<string> => {
  if (process.env.GEMINI_API_KEY) {
    try {
      return await ocrWithGemini(filePath, mimeType);
    } catch (err: any) {
      console.error('[OCR] Gemini OCR failed, falling back to Tesseract:', err.message);
    }
  }
  return ocrWithTesseract(filePath);
};

// pageImages: optional photos of each page (sent with PDFs built from scans) so OCR
// still works offline from Gemini via Tesseract
export const extractText = async (
  filePath: string,
  mimeType: string,
  pageImages: { path: string; mimetype: string }[] = []
): Promise<ExtractResult> => {
  if (mimeType === 'application/pdf') {
    // pdf-parse bundles an old pdf.js that can't read some valid PDFs; treat that as "no text layer" and OCR instead
    let data: { text?: string; numpages?: number } = {};
    try {
      data = await pdfParse(fs.readFileSync(filePath));
    } catch (err: any) {
      console.warn('[PDF] Could not parse text layer, falling back to OCR:', err.message);
    }
    let text = (data.text || '').trim();
    // Scanned PDFs have no text layer; one Gemini request reads every page of the PDF
    if (text.length < 20 && process.env.GEMINI_API_KEY) {
      try {
        text = (await ocrWithGemini(filePath, mimeType)).trim();
      } catch (err: any) {
        console.error('[OCR] Gemini PDF OCR failed:', err.message);
      }
    }
    if (text.length < 20 && pageImages.length) {
      const pagesText: string[] = [];
      for (const page of pageImages) {
        pagesText.push((await ocrWithTesseract(page.path)).trim());
      }
      text = pagesText.filter(Boolean).join('\n\n').trim();
    }
    return { text, pages: data.numpages || pageImages.length || 1 };
  }

  if (mimeType.startsWith('image/')) {
    return { text: (await ocrImage(filePath, mimeType)).trim(), pages: 1 };
  }

  if (mimeType.startsWith('text/')) {
    return { text: fs.readFileSync(filePath, 'utf8').trim(), pages: 1 };
  }

  throw new Error('Unsupported file type');
};
