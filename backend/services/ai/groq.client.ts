// backend/services/ai/groq.client.ts
// Free-tier Groq fallback client (llama-3.3-70b-versatile, llama-3.1-8b-instant)
// Free limits: 14,400 req/day, 30 req/min — much more generous than Gemini free tier

import Groq from 'groq-sdk';

const logger = require('../../src/utils/logger').default;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_PRO_MODEL = process.env.GROQ_PRO_MODEL || 'llama-3.3-70b-versatile';

class GroqClient {
    private client: Groq | null = null;

    constructor() {
        if (GROQ_API_KEY) {
            this.client = new Groq({ apiKey: GROQ_API_KEY });
            logger.info('[GroqClient] Groq fallback client initialized');
        } else {
            logger.warn('[GroqClient] GROQ_API_KEY not set — Groq fallback disabled');
        }
    }

    get isAvailable(): boolean {
        return !!this.client && !!GROQ_API_KEY;
    }

    async generateText(prompt: string, options: { usePro?: boolean; label?: string } = {}): Promise<string> {
        if (!this.client) throw new Error('Groq client not initialized — GROQ_API_KEY missing');

        const model = options.usePro ? GROQ_PRO_MODEL : GROQ_DEFAULT_MODEL;
        const label = options.label ?? 'GroqTask';

        logger.info(`[GroqClient] ${label} using model ${model}`);
        const start = performance.now();

        try {
            const completion = await this.client.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024, // Lowered from 4096 to prevent instant TPM exhaustion (Groq counts max_tokens towards your requested limit on the free tier)
                temperature: 0.7,
                response_format: { type: 'json_object' },
            });

            const text = completion.choices[0]?.message?.content || '';
            const latency = (performance.now() - start).toFixed(0);
            logger.info(`[GroqClient] ${label} completed in ${latency}ms`);

            if (!text) throw new Error('Groq returned an empty response');
            return text;
        } catch (e: any) {
            logger.error(`[GroqClient] Error in generateText: ${e.message}`);
            throw e;
        }
    }

    async generateChat(
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
        options: { usePro?: boolean; label?: string } = {}
    ): Promise<string> {
        if (!this.client) throw new Error('Groq client not initialized — GROQ_API_KEY missing');

        const model = options.usePro ? GROQ_PRO_MODEL : GROQ_DEFAULT_MODEL;
        const label = options.label ?? 'GroqChat';

        logger.info(`[GroqClient] ${label} using model ${model}`);

        const completion = await this.client.chat.completions.create({
            model,
            messages,
            max_tokens: 1024,
            temperature: 0.7,
        });

        const text = completion.choices[0]?.message?.content || '';
        if (!text) throw new Error('Groq returned an empty chat response');
        return text;
    }
}

export const groqClient = new GroqClient();
