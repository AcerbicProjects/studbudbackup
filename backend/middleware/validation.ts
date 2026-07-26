// backend/middleware/validation.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export const validateBody = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ message: 'Invalid request data', errors: result.error.format() });
        }
        // Replace body with parsed data (e.g., coerced types)
        req.body = result.data;
        next();
    };
};
export const validate = validateBody;
