// backend/validation/settings.ts
import { z } from 'zod';

export const settingsSchema = z.object({
    darkMode: z.boolean().optional(),
    language: z.string().min(2).max(5).optional(), // e.g., 'en', 'es'
    notificationPrefs: z.object({
        studyReminder: z.boolean().optional(),
        revisionReminder: z.boolean().optional(),
        quizReminder: z.boolean().optional(),
        streakReminder: z.boolean().optional(),
        uploadCompleted: z.boolean().optional(),
    }).optional(),
    reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM
    emailNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    privacy: z.object({
        shareData: z.boolean().optional(),
    }).optional(),
});
