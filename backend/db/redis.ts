// backend/db/redis.ts
import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisClient) {
        const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        redisClient = new Redis(url);
        redisClient.on('error', (err) => console.error('Redis error:', err));
        redisClient.on('connect', () => console.log('✅ Redis connected'));
    }
    return redisClient;
}

export default getRedisClient;
