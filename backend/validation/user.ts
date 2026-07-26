// backend/validation/user.ts
import { z } from 'zod';

export const profileUpdateSchema = z.object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    university: z.string().optional(),
    department: z.string().optional(),
    semester: z.string().optional(),
});

export const passwordUpdateSchema = z.object({
    currentPassword: z.string().min(6),
    newPassword: z
        .string()
        .min(8)
        .regex(/[A-Z]/, 'Must contain uppercase')
        .regex(/[a-z]/, 'Must contain lowercase')
        .regex(/[0-9]/, 'Must contain number')
        .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});

export const avatarUploadSchema = z.object({
    // No body fields; validation handled by multer file filter
});
