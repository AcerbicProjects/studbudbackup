// backend/services/ai/embed.service.ts
import { geminiClient } from './gemini.client';
import { aiCache } from '../cache/ai.cache';

const logger = require('../../src/utils/logger').default;

/** 
 * Semantic Search & Embeddings Service
 * Enables document context compression by finding relevant chunks matching the user's query/focus.
 */
class EmbedService {
    /** Cosine Similarity */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /** 
     * Retrives or generates embeddings for specific document chunks.
     * Uses the AIMemory buffer cache to prevent duplicate LLM payload vectors.
     */
    async getChunkEmbeddings(documentId: string, chunks: string[]): Promise<number[][]> {
        const cacheKey = `doc_vectors_${documentId}`;
        const cached = aiCache.get(cacheKey) as number[][];
        if (cached && cached.length === chunks.length) {
            return cached;
        }

        logger.info(`[EmbedService] Generating layout embeddings for ${chunks.length} chunks of document ${documentId}`);

        const vectors: number[][] = [];
        // Sequential to avoid rate limits 
        for (const c of chunks) {
            const vec = await geminiClient.generateEmbeddings(c);
            vectors.push(vec);
        }

        // Cache indefinitely bounded by LRU
        aiCache.set(cacheKey, vectors, 86400);
        return vectors;
    }

    /** Find relevant text blocks for a specific focus area or chat message */
    async retrieveRelevantContext(documentId: string, chunks: string[], query: string, topK: number = 3): Promise<string> {
        if (chunks.length <= topK) {
            return chunks.join('\n\n...\n\n');
        }

        // 1. Embed query
        const queryVector = await geminiClient.generateEmbeddings(query);

        // 2. Embed chunks 
        const chunkVectors = await this.getChunkEmbeddings(documentId, chunks);

        // 3. Rank
        const scores = chunks.map((chunk, index) => ({
            chunk,
            score: this.cosineSimilarity(queryVector, chunkVectors[index]),
        }));

        scores.sort((a, b) => b.score - a.score);

        // Return top-ranked chunks joined together
        const topChunks = scores.slice(0, topK).map(s => s.chunk);
        return topChunks.join('\n\n...[SEPARATED_CHUNK]...\n\n');
    }
}

export const embedService = new EmbedService();
