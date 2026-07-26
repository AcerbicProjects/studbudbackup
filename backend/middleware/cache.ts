// backend/middleware/cache.ts
import { Request, Response, NextFunction } from 'express';
import getRedisClient from '../db/redis';

/**
 * Simple Redis cache middleware.
 * Use `res.locals.cacheKey` to set a custom cache key, otherwise the request URL is used.
 * TTL is 300 seconds (5 minutes).
 */
export async function cache(req: Request, res: Response, next: NextFunction) {
    const client = getRedisClient();
    // Combine UserID with originalUrl for private caching isolation
    const isolateId = (req as any).user?.id || 'public';
    const key = (res.locals as any).cacheKey || `cache:${isolateId}:${req.originalUrl}`;

    try {
        const cached = await client.get(key);
        if (cached) {
            res.setHeader('X-Cache', 'HIT');
            return res.json(JSON.parse(cached));
        }
        // Override res.json to store result in cache before sending
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            client.set(key, JSON.stringify(body), 'EX', 300).catch(() => { });
            res.setHeader('X-Cache', 'MISS');
            return originalJson(body);
        };
        next();
    } catch (err) {
        console.error('Cache middleware error:', err);
        next();
    }
}
