// backend/services/ocr/ocr.service.ts
import vision from '@google-cloud/vision';
import Tesseract from 'tesseract.js';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface OcrBlock {
    type: 'paragraph' | 'table' | 'equation' | 'header' | 'footer' | 'handwriting';
    text: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface OcrResult {
    text: string;
    blocks: OcrBlock[];
    confidence: number;
    provider: 'google-vision' | 'tesseract';
}

// ── Google Cloud Vision Client ─────────────────────────────────────────────────
let visionClient: InstanceType<typeof vision.ImageAnnotatorClient> | null = null;
try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        visionClient = new vision.ImageAnnotatorClient();
        console.log('✅ Google Cloud Vision client initialized');
    }
} catch (e) {
    console.warn('⚠️  Failed to initialize Google Vision Client:', (e as Error).message);
}

// ── Google Vision OCR ──────────────────────────────────────────────────────────
async function ocrWithGoogleVision(imageBuffer: Buffer): Promise<OcrResult> {
    if (!visionClient) {
        throw new Error('Google Vision client not available');
    }

    // Use documentTextDetection for superior structured document recognition
    const [result] = await visionClient.documentTextDetection({
        image: { content: imageBuffer },
        imageContext: {
            languageHints: ['en'],
        },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
        return { text: '', blocks: [], confidence: 0, provider: 'google-vision' };
    }

    const blocks: OcrBlock[] = [];
    let totalConfidence = 0;
    let wordCount = 0;

    // Process pages → blocks → paragraphs → words
    for (const page of fullTextAnnotation.pages || []) {
        for (const block of page.blocks || []) {
            const blockType = detectBlockType(block);

            for (const paragraph of block.paragraphs || []) {
                let paragraphText = '';
                let paragraphConfidence = 0;
                let pWordCount = 0;

                for (const word of paragraph.words || []) {
                    const wordText = (word.symbols || [])
                        .map(s => s.text || '')
                        .join('');

                    // Check for break characters
                    const lastSymbol = word.symbols?.[word.symbols.length - 1];
                    const breakType = lastSymbol?.property?.detectedBreak?.type;
                    const separator =
                        breakType === 'LINE_BREAK' || breakType === 'EOL_SURE_SPACE'
                            ? '\n'
                            : breakType === 'SPACE' || breakType === 'SURE_SPACE'
                                ? ' '
                                : ' ';

                    paragraphText += wordText + separator;

                    if (word.confidence !== undefined && word.confidence !== null) {
                        paragraphConfidence += word.confidence;
                        pWordCount++;
                    }
                }

                const avgConfidence = pWordCount > 0 ? paragraphConfidence / pWordCount : 0;
                totalConfidence += paragraphConfidence;
                wordCount += pWordCount;

                // Detect handwriting
                const isHandwritten = block.property?.detectedLanguages?.some(
                    (l: any) => l.languageCode === 'und'
                ) || false;

                // Bounding box
                const vertices = paragraph.boundingBox?.vertices || [];
                const bbox = vertices.length >= 4
                    ? {
                        x: vertices[0]?.x || 0,
                        y: vertices[0]?.y || 0,
                        width: (vertices[1]?.x || 0) - (vertices[0]?.x || 0),
                        height: (vertices[2]?.y || 0) - (vertices[0]?.y || 0),
                    }
                    : undefined;

                blocks.push({
                    type: isHandwritten ? 'handwriting' : blockType,
                    text: paragraphText.trim(),
                    confidence: avgConfidence,
                    boundingBox: bbox,
                });
            }
        }
    }

    const overallConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

    return {
        text: fullTextAnnotation.text,
        blocks,
        confidence: overallConfidence,
        provider: 'google-vision',
    };
}

/** Heuristic to detect block type from Google Vision block data */
function detectBlockType(block: any): OcrBlock['type'] {
    const blockType = block.blockType;
    if (blockType === 'TABLE') return 'table';

    // Check for math-like content (heuristic: high density of math symbols)
    const text = extractBlockText(block);
    const mathSymbols = /[∫∑∏√∂∇≈≠≤≥±×÷∈∉⊂⊃∪∩∀∃∞αβγδεζηθλμπσφψω]/g;
    const equationPattern = /[=+\-*/^_{}()[\]\\].*[=+\-*/^_{}()[\]\\]/;
    if (mathSymbols.test(text) || (equationPattern.test(text) && text.length < 200)) {
        return 'equation';
    }

    // Check for headers (typically short, might be at top of page)
    if (text.length < 100 && /^[A-Z\s\d.:]+$/.test(text.trim())) {
        return 'header';
    }

    return 'paragraph';
}

function extractBlockText(block: any): string {
    let text = '';
    for (const para of block.paragraphs || []) {
        for (const word of para.words || []) {
            text += (word.symbols || []).map((s: any) => s.text || '').join('') + ' ';
        }
    }
    return text.trim();
}

// ── Tesseract.js Fallback ──────────────────────────────────────────────────────
async function ocrWithTesseract(imageBuffer: Buffer): Promise<OcrResult> {
    console.log('📝 Running Tesseract OCR fallback...');

    const worker = await Tesseract.createWorker('eng');
    // Set page segmentation mode for mixed content (3 = PSM.AUTO)
    await worker.setParameters({
        tessedit_pageseg_mode: '3' as any,
    });

    const { data } = await worker.recognize(imageBuffer);
    await worker.terminate();

    const blocks: OcrBlock[] = [];

    // Process Tesseract result – cast to any for paragraph-level access
    const ocrData = data as any;
    const paragraphs: any[] = ocrData.paragraphs || [];

    for (const para of paragraphs) {
        const text = (para.text || '').trim();
        if (!text) continue;

        // Heuristic classification
        const type = classifyTextBlock(text);
        const confidence = typeof para.confidence === 'number' ? para.confidence / 100 : 0;

        const bbox = para.bbox
            ? {
                x: para.bbox.x0 || 0,
                y: para.bbox.y0 || 0,
                width: (para.bbox.x1 || 0) - (para.bbox.x0 || 0),
                height: (para.bbox.y1 || 0) - (para.bbox.y0 || 0),
            }
            : undefined;

        blocks.push({ type, text, confidence, boundingBox: bbox });
    }

    const overallConfidence = typeof ocrData.confidence === 'number' ? ocrData.confidence / 100 : 0;

    return {
        text: data.text,
        blocks,
        confidence: overallConfidence,
        provider: 'tesseract',
    };
}

/** Classify a text block by content heuristics */
function classifyTextBlock(text: string): OcrBlock['type'] {
    // Math / equation detection
    const mathPattern = /[=∫∑√∂∇≈≠≤≥±×÷]|x\^|f\(x\)|\\frac|\\sqrt/;
    if (mathPattern.test(text) && text.length < 300) return 'equation';

    // Table detection: lines with multiple | or tab separations
    const lines = text.split('\n');
    const tabulatedLines = lines.filter(
        l => (l.match(/\|/g) || []).length >= 2 || (l.match(/\t/g) || []).length >= 2
    );
    if (tabulatedLines.length >= 2) return 'table';

    // Header detection
    if (text.length < 80 && /^[A-Z]/.test(text) && !text.includes('.')) return 'header';

    return 'paragraph';
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Extract text from an image buffer using Google Vision (primary) or Tesseract.js (fallback).
 * Supports printed text, handwritten notes, math equations, tables, headers/footers.
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<OcrResult> {
    // Try Google Vision first
    if (visionClient) {
        try {
            const result = await ocrWithGoogleVision(imageBuffer);
            console.log(`✅ Google Vision OCR completed (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
            return result;
        } catch (err) {
            console.error('Google Vision OCR failed, falling back to Tesseract:', err);
        }
    }

    // Fallback to Tesseract
    try {
        const result = await ocrWithTesseract(imageBuffer);
        console.log(`✅ Tesseract OCR completed (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        return result;
    } catch (err) {
        console.error('Tesseract OCR also failed:', err);
        return {
            text: '',
            blocks: [],
            confidence: 0,
            provider: 'tesseract',
        };
    }
}
