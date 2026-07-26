// backend/services/ai/gemini.client.ts
// Production-ready Google Gemini API client with retry, timeout, rate limiting
import {
    GoogleGenerativeAI,
    GenerativeModel,
    GenerateContentRequest,
    GenerateContentResult,
    GenerateContentStreamResult,
    HarmCategory,
    HarmBlockThreshold,
} from '@google/generative-ai';

const logger = require('../../src/utils/logger').default;

// ── Configuration ──────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PRO_MODEL = process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 120_000; // 120s to allow retry waits

// ── Safety Settings ───────────────────────────────────────────────────────────
const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

// ── Rate Limiter (simple in-memory token bucket) ──────────────────────────────
class TokenBucket {
    private tokens: number;
    private lastRefill: number;
    private readonly capacity: number;
    private readonly refillRate: number; // tokens per ms

    constructor(capacity: number, refillPerSecond: number) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillPerSecond / 1000;
        this.lastRefill = Date.now();
    }

    consume(count = 1): boolean {
        this.refill();
        if (this.tokens < count) return false;
        this.tokens -= count;
        return true;
    }

    private refill(): void {
        const now = Date.now();
        const elapsed = now - this.lastRefill;
        this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }
}

// High local burst limit to avoid bottlenecking the dev environment
// capacity=500 means 500 consecutive requests before throttling kicks in
// refill=10 means 10 new tokens replenished every second
const rateLimiter = new TokenBucket(500, 10);

// ── Gemini Client ─────────────────────────────────────────────────────────────
class GeminiClient {
    private genAI: GoogleGenerativeAI;
    private defaultModel: GenerativeModel;
    private proModel: GenerativeModel;
    private embeddingModel: GenerativeModel;

    constructor() {
        if (!GEMINI_API_KEY) {
            logger.warn('GEMINI_API_KEY is not set. AI features will fail at runtime.');
        }
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.defaultModel = this.genAI.getGenerativeModel({
            model: DEFAULT_MODEL,
            safetySettings: SAFETY_SETTINGS,
        });
        this.proModel = this.genAI.getGenerativeModel({
            model: PRO_MODEL,
            safetySettings: SAFETY_SETTINGS,
        });
        this.embeddingModel = this.genAI.getGenerativeModel({
            model: 'text-embedding-004',
        });
    }

    /** Run a generation request with retry and timeout  */
    async generate(
        request: GenerateContentRequest,
        options: { usePro?: boolean; timeoutMs?: number; label?: string } = {}
    ): Promise<GenerateContentResult> {
        const model = options.usePro ? this.proModel : this.defaultModel;
        const timeout = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
        const label = options.label ?? 'GenerativeTask';

        return this.withRetry(async () => {
            this.checkRateLimit();
            const start = performance.now();
            const result = await this.withTimeout(model.generateContent(request), timeout);
            const latency = (performance.now() - start).toFixed(2);

            // UsageMetadata is available on result.response in newer SDKs
            const metadata = result.response.usageMetadata;
            const tokenLog = metadata ? ` | Tokens: In=${metadata.promptTokenCount}, Out=${metadata.candidatesTokenCount}, Total=${metadata.totalTokenCount}` : '';
            logger.info(`[GeminiClient] ${label} completed in ${latency}ms${tokenLog}`);

            return result;
        });
    }

    /** Stream a generation request */
    async generateStream(
        request: GenerateContentRequest,
        options: { usePro?: boolean } = {}
    ): Promise<GenerateContentStreamResult> {
        const model = options.usePro ? this.proModel : this.defaultModel;
        this.checkRateLimit();
        return model.generateContentStream(request);
    }

    /** Convenience: generate from a single text prompt */
    async generateText(
        prompt: string,
        options: { usePro?: boolean; timeoutMs?: number; label?: string } = {}
    ): Promise<string> {
        const result = await this.generate(
            { contents: [{ role: 'user', parts: [{ text: prompt }] }] },
            options
        );
        const text = result.response.text();
        if (!text) throw new Error('Gemini returned an empty response');
        return text;
    }

    /** Generate Embeddings for Semantic Search */
    async generateEmbeddings(text: string): Promise<number[]> {
        return this.withRetry(async () => {
            this.checkRateLimit();
            const result = await this.embeddingModel.embedContent(text);
            return result.embedding.values;
        });
    }

    // ── Private helpers ─────────────────────────────────────────────────────
    private checkRateLimit(): void {
        if (!rateLimiter.consume()) {
            const err: any = new Error('Rate limit exceeded – too many AI requests');
            err.status = 429;
            throw err;
        }
    }

    private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Gemini request timed out after ${ms}ms`));
            }, ms);
            promise.then(
                (val) => { clearTimeout(timer); resolve(val); },
                (err) => { clearTimeout(timer); reject(err); }
            );
        });
    }

    private async withRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
        try {
            return await fn();
        } catch (err: any) {
            const is503 = err.status === 503;
            const isTimeout = err.message?.includes('timeout');
            // We no longer retry 429s here. We throw immediately so ai.service can fallback to Groq.
            const isRetryable = attempt < MAX_RETRIES && (is503 || isTimeout);

            if (!isRetryable) throw err;

            let delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);

            logger.warn(`Gemini retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms – ${err.message?.slice(0, 80)}`);
            await new Promise(r => setTimeout(r, delay));
            return this.withRetry(fn, attempt + 1);
        }
    }
}

// Singleton
export const geminiClient = new GeminiClient();
