// src/middlewares/requestId.ts
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export const requestId = (req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers['x-request-id'] as string) || uuidv4();
    // Attach to request object
    (req as any).id = id;
    // Set response header for downstream services
    res.setHeader('X-Request-Id', id);
    next();
};

export default requestId;
