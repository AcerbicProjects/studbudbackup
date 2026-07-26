// backend/validation/auth.ts
import { z } from 'zod';

export const registerSchema = z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    university: z.string().optional(),
    department: z.string().optional(),
    semester: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
