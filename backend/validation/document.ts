// backend/validation/document.ts
import { z } from 'zod';

export const uploadDocumentSchema = z.object({
    title: z.string().min(1),
    subject: z.string().min(1),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // file will be handled by multer, not validated here
});

export const updateDocumentSchema = z.object({
    title: z.string().optional(),
    subject: z.string().optional(),
    description: z.string().optional(),
    favorite: z.boolean().optional(),
    archived: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
});
