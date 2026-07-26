// backend/services/pdf/pdf.service.ts
const parsePdf = require('pdf-parse');

// ── Types ──────────────────────────────────────────────────────────────────────
export interface PdfHeading {
    level: number;      // 1 = main heading, 2 = subheading, etc.
    text: string;
    pageIndex?: number;
}

export interface PdfTable {
    rows: string[][];
    pageIndex?: number;
}

export interface PdfBookmark {
    title: string;
    page?: number;
    children?: PdfBookmark[];
}

export interface PdfMetadata {
    author?: string;
    creator?: string;
    producer?: string;
    title?: string;
    subject?: string;
    creationDate?: string;
    modDate?: string;
    keywords?: string;
}

export interface PdfExtractionResult {
    text: string;
    pageCount: number;
    headings: PdfHeading[];
    tables: PdfTable[];
    imageCount: number;
    bookmarks: PdfBookmark[];
    metadata: PdfMetadata;
}

// ── Heading Extraction ─────────────────────────────────────────────────────────

/** Extract headings using heuristics on text lines */
function extractHeadings(text: string): PdfHeading[] {
    const headings: PdfHeading[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        // Skip very long lines (not headings)
        if (line.length > 150) continue;
        // Skip lines that look like sentences (end with period)
        if (line.endsWith('.') && line.length > 30) continue;

        // Level 1: ALL CAPS, short
        if (/^[A-Z\s\d:.\-()]{4,80}$/.test(line) && line.length >= 4) {
            headings.push({ level: 1, text: line });
            continue;
        }

        // Level 2: Numbered headings like "1. Introduction" or "Chapter 1"
        if (/^(\d+\.?\s+|Chapter\s+\d+)/i.test(line) && line.length < 100) {
            headings.push({ level: 2, text: line });
            continue;
        }

        // Level 3: Lines starting with uppercase, short, no period ending
        if (
            /^[A-Z][A-Za-z\s\d:.\-]{3,60}$/.test(line) &&
            !line.endsWith('.') &&
            line.length < 80 &&
            line.split(' ').length <= 8
        ) {
            headings.push({ level: 3, text: line });
            continue;
        }
    }

    return headings;
}

// ── Table Extraction ───────────────────────────────────────────────────────────

/** Detect and extract tables from text using delimiter heuristics */
function extractTables(text: string): PdfTable[] {
    const tables: PdfTable[] = [];
    const lines = text.split('\n');

    let currentTable: string[][] = [];
    let inTable = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        // Detect table rows: contain multiple | or tab separators, or consistent spacing
        const pipeCount = (line.match(/\|/g) || []).length;
        const tabCount = (line.match(/\t/g) || []).length;
        const multiSpaceCount = (line.match(/\s{3,}/g) || []).length;

        const isTableRow = pipeCount >= 2 || tabCount >= 1 || multiSpaceCount >= 2;

        // Skip separator lines (like |---|---|)
        const isSeparator = /^[\s|+\-=]+$/.test(line);

        if (isTableRow && !isSeparator && line.length > 3) {
            let cells: string[];
            if (pipeCount >= 2) {
                cells = line.split('|').map(c => c.trim()).filter(Boolean);
            } else if (tabCount >= 1) {
                cells = line.split('\t').map(c => c.trim()).filter(Boolean);
            } else {
                cells = line.split(/\s{3,}/).map(c => c.trim()).filter(Boolean);
            }

            if (cells.length >= 2) {
                currentTable.push(cells);
                inTable = true;
                continue;
            }
        }

        if (isSeparator && inTable) continue;

        // End of table
        if (inTable && currentTable.length >= 2) {
            tables.push({ rows: [...currentTable] });
        }
        currentTable = [];
        inTable = false;
    }

    // Handle table at end of document
    if (inTable && currentTable.length >= 2) {
        tables.push({ rows: currentTable });
    }

    return tables;
}

// ── Image Count Estimation ─────────────────────────────────────────────────────

/** Estimate image count from raw PDF content stream markers */
function estimateImageCount(pdfBuffer: Buffer): number {
    const content = pdfBuffer.toString('binary');
    // Count image XObject references in PDF content streams
    const imageRefs = content.match(/\/Subtype\s*\/Image/g);
    return imageRefs ? imageRefs.length : 0;
}

// ── Bookmark Extraction ────────────────────────────────────────────────────────

function extractBookmarks(pdfData: any): PdfBookmark[] {
    // pdf-parse exposes outline when available
    const outline = pdfData.outline || pdfData.metadata?.outline;
    if (!outline || !Array.isArray(outline)) return [];

    return outline.map((item: any) => ({
        title: item.title || 'Untitled',
        page: item.page,
        children: item.items ? extractBookmarks({ outline: item.items }) : [],
    }));
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Extract rich content from a PDF buffer.
 * Returns text, page count, headings, tables, image count, bookmarks, and metadata.
 */
export async function extractFromPDF(pdfBuffer: Buffer): Promise<PdfExtractionResult> {
    try {
        const data = await parsePdf(pdfBuffer, {
            max: 0, // no page limit
        });

        const text: string = data.text || '';
        const pageCount: number = data.numpages || 0;

        // Extract structured content
        const headings = extractHeadings(text);
        const tables = extractTables(text);
        const imageCount = estimateImageCount(pdfBuffer);
        const bookmarks = extractBookmarks(data);

        // Parse metadata
        const info = data.info || {};
        const metadata: PdfMetadata = {
            author: info.Author || undefined,
            creator: info.Creator || undefined,
            producer: info.Producer || undefined,
            title: info.Title || undefined,
            subject: info.Subject || undefined,
            creationDate: info.CreationDate || undefined,
            modDate: info.ModDate || undefined,
            keywords: info.Keywords || undefined,
        };

        return {
            text,
            pageCount,
            headings,
            tables,
            imageCount,
            bookmarks,
            metadata,
        };
    } catch (error) {
        console.error('PDF Parse Error:', error);
        throw new Error('Failed to parse PDF document.');
    }
}

/**
 * Legacy wrapper — returns just the text string for backward compatibility.
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
    const result = await extractFromPDF(pdfBuffer);
    return result.text;
}
