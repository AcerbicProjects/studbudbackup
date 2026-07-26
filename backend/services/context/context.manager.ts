// backend/services/context/context.manager.ts
// Retrieves extracted document text, chunks it, and manages token limits

import mongoose from 'mongoose';
import DocumentModel from '../../models/Document';

const logger = require('../../src/utils/logger').default;

// Gemini 1.5 Flash supports up to ~1M tokens; we cap conservatively at 120K chars
// (~30K tokens) to stay well within limits for structured JSON output
const MAX_CONTEXT_CHARS = 120_000;
const CHUNK_OVERLAP_CHARS = 500; // overlap between chunks to preserve context

export interface DocumentContext {
    documentId: string;
    title: string;
    subject: string;
    text: string;           // ready-to-use context text
    totalChars: number;
    wasTruncated: boolean;
    extractionStatus: string;
    chunksAvailable: number;
}

export interface ChunkedContext {
    chunks: string[];
    totalChars: number;
    chunkSize: number;
}

class ContextManager {
    /**
     * Retrieve document context from MongoDB.
     * Returns the extracted text, truncating if it exceeds the token limit.
     */
    async getDocumentContext(
        documentId: string,
        userId: string,
        maxChars = MAX_CONTEXT_CHARS
    ): Promise<DocumentContext> {
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
            throw new Error('Invalid document ID');
        }

        const doc = await DocumentModel.findOne({
            _id: documentId,
            ownerId: userId,
            deleted: { $ne: true },
        }).select('title subject extractedText extractionStatus ocrBlocks headings');

        if (!doc) {
            throw new Error('Document not found or access denied');
        }

        if (doc.extractionStatus === 'pending' || doc.extractionStatus === 'processing') {
            throw new Error('Document is still being processed. Please wait and try again.');
        }

        if (doc.extractionStatus === 'failed') {
            throw new Error('Document text extraction failed. Cannot generate AI content.');
        }

        let text = this.buildRichContext(doc);

        if (!text || text.trim().length < 50) {
            throw new Error(
                'Insufficient text extracted from this document. ' +
                'The document may be empty, image-only without OCR, or corrupted.'
            );
        }

        const wasTruncated = text.length > maxChars;
        if (wasTruncated) {
            text = this.intelligentTruncate(text, maxChars);
            logger.warn(`[ContextManager] Document ${documentId} truncated from ${doc.extractedText?.length ?? 0} to ${maxChars} chars`);
        }

        const chunks = this.chunk(text, maxChars);

        return {
            documentId,
            title: doc.title,
            subject: doc.subject,
            text,
            totalChars: text.length,
            wasTruncated,
            extractionStatus: doc.extractionStatus,
            chunksAvailable: chunks.length,
        };
    }

    /**
     * Build a rich context string that includes headings + OCR blocks + plain text.
     * Headings are prioritised for better AI comprehension.
     */
    private buildRichContext(doc: any): string {
        const parts: string[] = [];

        // Document metadata header
        parts.push(`=== DOCUMENT: ${doc.title} ===`);
        parts.push(`Subject: ${doc.subject}`);
        parts.push('');

        // Include headings/table of contents if available
        if (doc.headings && doc.headings.length > 0) {
            parts.push('--- TABLE OF CONTENTS ---');
            doc.headings.forEach((h: string, i: number) => parts.push(`${i + 1}. ${h}`));
            parts.push('');
        }

        // Prefer structured OCR blocks over raw text
        if (doc.ocrBlocks && doc.ocrBlocks.length > 0) {
            parts.push('--- DOCUMENT CONTENT ---');
            for (const block of doc.ocrBlocks) {
                if (block.type === 'header') {
                    parts.push(`\n## ${block.text}`);
                } else if (block.type === 'table') {
                    parts.push(`\n[TABLE]\n${block.text}`);
                } else if (block.type === 'equation') {
                    parts.push(`\n[EQUATION] ${block.text}`);
                } else {
                    parts.push(block.text);
                }
            }
        } else if (doc.extractedText) {
            // Fallback to raw extracted text
            parts.push('--- DOCUMENT CONTENT ---');
            parts.push(doc.extractedText);
        }

        return parts.join('\n');
    }

    /**
     * Chunk a large text into overlapping segments for multi-pass processing.
     */
    chunk(text: string, chunkSize = MAX_CONTEXT_CHARS): string[] {
        if (text.length <= chunkSize) return [text];

        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            let end = Math.min(start + chunkSize, text.length);

            // Try to break at a paragraph boundary
            if (end < text.length) {
                const lastNewline = text.lastIndexOf('\n\n', end);
                if (lastNewline > start + chunkSize * 0.7) {
                    end = lastNewline;
                }
            }

            chunks.push(text.slice(start, end));
            start = end - CHUNK_OVERLAP_CHARS; // overlap
        }

        return chunks;
    }

    /**
     * Intelligently truncate text, preserving the beginning and important ending.
     * The start of a document typically contains the most important information.
     */
    private intelligentTruncate(text: string, maxChars: number): string {
        if (text.length <= maxChars) return text;

        // Keep 85% from the front, 15% from the back (conclusions/summaries matter)
        const frontChars = Math.floor(maxChars * 0.85);
        const backChars = maxChars - frontChars;

        const front = text.slice(0, frontChars);
        const back = text.slice(text.length - backChars);

        return `${front}\n\n[... content truncated for AI context window ...]\n\n${back}`;
    }
}

export const contextManager = new ContextManager();
