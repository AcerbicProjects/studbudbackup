// backend/validation/ai.validation.ts
// Zod request body validation schemas for AI endpoints
import { z } from 'zod';

// Shared optional fields
const baseAISchema = z.object({
    documentId: z.string().min(1, 'documentId is required'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    language: z.string().optional().default('English'),
    subject: z.string().optional(),
});

export const summaryRequestSchema = baseAISchema.extend({
    focusAreas: z.array(z.string()).optional(),
    summaryLength: z.enum(['short', 'medium', 'detailed']).optional().default('medium'),
});

export const flashcardsRequestSchema = baseAISchema.extend({
    count: z.number().int().min(5).max(50).optional().default(15),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
});

export const quizRequestSchema = baseAISchema.extend({
    count: z.number().int().min(3).max(30).optional().default(10),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
    examType: z.string().optional().default('MCQ'),
});

export const vivaRequestSchema = baseAISchema.extend({
    count: z.number().int().min(5).max(20).optional().default(10),
    vivaDepth: z.enum(['surface', 'conceptual', 'deep']).optional().default('conceptual'),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
});

export const chatRequestSchema = z.object({
    documentId: z.string().min(1, 'documentId is required'),
    message: z.string().min(1, 'message is required').max(2000),
    language: z.string().optional().default('English'),
});

export const plannerRequestSchema = baseAISchema.extend({
    studyGoal: z.string().optional(),
    availableHours: z.number().positive().max(500).optional().default(10),
    examDate: z.string().optional(),
    weakTopics: z.array(z.string()).optional(),
    preferredStudyTime: z.string().optional(),
});

export const quizScoreRequestSchema = baseAISchema.extend({
    quizContext: z.string().min(1),
    userAnswers: z.string().min(1),
});

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;
export type FlashcardsRequest = z.infer<typeof flashcardsRequestSchema>;
export type QuizRequest = z.infer<typeof quizRequestSchema>;
export type VivaRequest = z.infer<typeof vivaRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type PlannerRequest = z.infer<typeof plannerRequestSchema>;
