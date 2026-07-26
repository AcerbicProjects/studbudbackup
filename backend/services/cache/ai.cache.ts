// backend/services/cache/ai.cache.ts
// In-memory TTL cache for AI responses to prevent duplicate Gemini calls

const logger = require('../../src/utils/logger').default;

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
    createdAt: number;
    hitCount: number;
}

class AICache {
    private store = new Map<string, CacheEntry<unknown>>();
    private readonly defaultTTLMs: number;
    private pruneInterval: ReturnType<typeof setInterval>;

    constructor(defaultTTLSeconds = 3600) {
        this.defaultTTLMs = defaultTTLSeconds * 1000;
        // Prune expired entries every 5 minutes
        this.pruneInterval = setInterval(() => this.prune(), 5 * 60 * 1000);
        if (this.pruneInterval.unref) this.pruneInterval.unref();
    }

    /**
     * Build a deterministic cache key.
     */
    buildKey(
        module: string,
        documentId: string,
        options: Record<string, unknown> = {}
    ): string {
        const optStr = Object.keys(options)
            .sort()
            .map(k => `${k}:${options[k]}`)
            .join('|');
        return `${module}:${documentId}:${optStr}`;
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key) as CacheEntry<T> | undefined;
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        entry.hitCount++;
        logger.debug(`[AICache] HIT  key="${key}" hits=${entry.hitCount}`);
        return entry.data;
    }

    set<T>(key: string, data: T, ttlSeconds?: number): void {
        const ttlMs = (ttlSeconds ?? undefined) !== undefined
            ? (ttlSeconds as number) * 1000
            : this.defaultTTLMs;

        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
            createdAt: Date.now(),
            hitCount: 0,
        });
        logger.debug(`[AICache] SET  key="${key}" ttl=${ttlMs / 1000}s`);
    }

    invalidate(key: string): void {
        this.store.delete(key);
    }

    invalidateByDocument(documentId: string): void {
        let count = 0;
        for (const key of this.store.keys()) {
            if (key.includes(documentId)) {
                this.store.delete(key);
                count++;
            }
        }
        if (count > 0) logger.info(`[AICache] Invalidated ${count} entries for document ${documentId}`);
    }

    stats(): { size: number; keys: string[] } {
        return { size: this.store.size, keys: Array.from(this.store.keys()) };
    }

    private prune(): void {
        const now = Date.now();
        let pruned = 0;
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                pruned++;
            }
        }
        if (pruned > 0) logger.debug(`[AICache] Pruned ${pruned} expired entries`);
    }
}

// Singleton – summary/flashcards/quiz/viva cache for 60 minutes
export const aiCache = new AICache(3600);
