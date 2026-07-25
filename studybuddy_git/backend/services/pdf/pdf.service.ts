import * as pdf from 'pdf-parse';

export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
        const parsePdf = (pdf as any).default || pdf;
        const data = await parsePdf(pdfBuffer);
        return data.text || '';
    } catch (error) {
        console.error('PDF Parse Error:', error);
        throw new Error('Failed to parse PDF document.');
    }
}
