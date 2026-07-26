// backend/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// 100 requests per minute per IP
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
