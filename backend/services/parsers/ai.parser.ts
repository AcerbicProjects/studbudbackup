// backend/services/parsers/ai.parser.ts
// Converts raw Gemini text output into validated, structured JSON
import { z, ZodSchema } from 'zod';

const logger = require('../../src/utils/logger').default;

// ── Zod Schemas (runtime validation) ─────────────────────────────────────────

// Summary
export const SummarySchema = z.object({
    title: z.string(),
    overview: z.string(),
    keyConcepts: z.array(z.string()),
    definitions: z.array(z.object({
        term: z.string(),
        meaning: z.string(),
    })).optional().default([]),
    examples: z.array(z.object({
        concept: z.string(),
        example: z.string(),
    })).optional().default([]),
    importantPoints: z.array(z.string()).optional().default([]),
    pageSummaries: z.array(z.object({
        pageNumber: z.number().int().optional(),
        title: z.string(),
        points: z.array(z.string()),
    })).optional().default([]),
    formulaCards: z.array(z.object({
        name: z.string(),
        formula: z.string(),
        explanation: z.string(),
    })).optional().default([]),
    revisionNotes: z.array(z.string()).optional().default([]),
    examTips: z.array(z.string()).optional().default([]),
    estimatedReadTimeMinutes: z.number().positive().optional().default(5),
});
export type ParsedSummary = z.infer<typeof SummarySchema>;

// Flashcards
export const FlashcardsSchema = z.object({
    subject: z.string(),
    totalCards: z.number().int().positive(),
    flashcards: z.array(z.object({
        id: z.number().int().positive(),
        front: z.string(),
        back: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
        topic: z.string().optional().default('General'),
        tags: z.array(z.string()).optional().default([]),
        isBookmarked: z.boolean().optional().default(false),
        spacedRepetition: z.object({
            nextReviewDate: z.string().optional().default(new Date(Date.now() + 86400000).toISOString()),
            interval: z.number().optional().default(1),
            easeFactor: z.number().optional().default(2.5),
        }).optional(),
    })),
});
export type ParsedFlashcards = z.infer<typeof FlashcardsSchema>;

// Quiz
export const QuizSchema = z.object({
    subject: z.string(),
    totalQuestions: z.number().int().positive(),
    estimatedTimeMinutes: z.number().positive().optional().default(15),
    questions: z.array(z.object({
        id: z.number().int().positive(),
        type: z.string(),
        question: z.string(),
        options: z.array(z.string()).optional(),
        correctAnswer: z.string(),
        explanation: z.string(),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
        topic: z.string().optional().default('General'),
        estimatedTimeMinutes: z.number().positive().optional().default(1),
    })),
});
export type ParsedQuiz = z.infer<typeof QuizSchema>;

// Quiz Scoring
export const QuizScoreSchema = z.object({
    score: z.number(),
    total: z.number(),
    accuracy: z.number(), // percentage
    weakTopics: z.array(z.string()),
    suggestedRevision: z.array(z.string()),
    confidenceLevel: z.enum(['low', 'medium', 'high'] as const),
});
export type ParsedQuizScore = z.infer<typeof QuizScoreSchema>;

// Viva
export const VivaSchema = z.object({
    subject: z.string(),
    totalQuestions: z.number().int().positive(),
    vivaSession: z.array(z.object({
        id: z.number().int().positive(),
        question: z.string(),
        expectedAnswer: z.string(),
        hints: z.array(z.string()).optional().default([]),
        followUpQuestions: z.array(z.string()).optional().default([]),
        keyConceptsTested: z.array(z.string()).optional().default([]),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
        marks: z.number().positive().optional().default(2),
        commonMistakes: z.array(z.string()).optional().default([]),
        topic: z.string().optional().default('General'),
    })),
});
export type ParsedViva = z.infer<typeof VivaSchema>;

// Planner
export const PlannerSchema = z.object({
    planTitle: z.string(),
    subject: z.string(),
    totalHours: z.number().positive(),
    priorityTopics: z.array(z.string()).optional().default([]),
    breakRecommendations: z.array(z.string()).optional().default([]),
    dailyPlan: z.array(z.object({
        day: z.number().int().positive(),
        tasks: z.array(z.string()),
        durationMinutes: z.number().positive(),
    })).optional().default([]),
    weeklyPlan: z.array(z.object({
        week: z.number().int().positive(),
        focusAreas: z.array(z.string()),
        milestones: z.array(z.string()),
    })).optional().default([]),
    revisionSessions: z.array(z.object({
        sessionTitle: z.string(),
        topics: z.array(z.string()),
        durationMinutes: z.number().positive(),
    })).optional().default([]),
});
export type ParsedPlanner = z.infer<typeof PlannerSchema>;

// ── Core Parser ───────────────────────────────────────────────────────────────
class AIParser {
    /**
     * Strips markdown fences and extracts the first JSON object/array from text.
     * Throws if no valid JSON is found.
     */
    private extractJSON(rawText: string): unknown {
        // Strip markdown code fences
        let cleaned = rawText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

        // Find first { or [
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');

        let start = -1;
        if (firstBrace === -1 && firstBracket === -1) {
            throw new Error('No JSON object or array found in AI response');
        } else if (firstBrace === -1) {
            start = firstBracket;
        } else if (firstBracket === -1) {
            start = firstBrace;
        } else {
            start = Math.min(firstBrace, firstBracket);
        }

        cleaned = cleaned.slice(start);

        try {
            return JSON.parse(cleaned);
        } catch {
            // Attempt to salvage by finding the matching closing bracket
            let depth = 0;
            let end = -1;
            const opener = cleaned[0] === '{' ? '{' : '[';
            const closer = opener === '{' ? '}' : ']';

            for (let i = 0; i < cleaned.length; i++) {
                if (cleaned[i] === opener) depth++;
                if (cleaned[i] === closer) {
                    depth--;
                    if (depth === 0) { end = i; break; }
                }
            }
            if (end === -1) throw new Error('Malformed JSON in AI response – could not find closing bracket');
            try {
                return JSON.parse(cleaned.slice(0, end + 1));
            } catch {
                throw new Error('Malformed JSON in AI response – JSON.parse failed after salvage attempt');
            }
        }
    }

    /** Parse and validate AI output with a Zod schema */
    private parse<T>(rawText: string, schema: ZodSchema<T>, label: string): T {
        let raw: unknown;
        try {
            raw = this.extractJSON(rawText);
        } catch (err: any) {
            logger.error(`[AIParser] ${label} – JSON extraction failed: ${err.message}`);
            throw new Error(`AI response parsing failed: ${err.message}`);
        }

        const result = schema.safeParse(raw);
        if (!result.success) {
            const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
            logger.error(`[AIParser] ${label} – validation failed: ${issues}`);
            throw new Error(`AI response validation failed: ${issues}`);
        }

        logger.info(`[AIParser] ${label} parsed and validated successfully`);
        return result.data;
    }

    parseSummary(rawText: string): ParsedSummary {
        return this.parse(rawText, SummarySchema, 'Summary');
    }

    parseFlashcards(rawText: string): ParsedFlashcards {
        return this.parse(rawText, FlashcardsSchema, 'Flashcards');
    }

    parseQuiz(rawText: string): ParsedQuiz {
        return this.parse(rawText, QuizSchema, 'Quiz');
    }

    parseQuizScore(rawText: string): ParsedQuizScore {
        return this.parse(rawText, QuizScoreSchema, 'QuizScore');
    }

    parseViva(rawText: string): ParsedViva {
        return this.parse(rawText, VivaSchema, 'Viva');
    }

    parsePlanner(rawText: string): ParsedPlanner {
        return this.parse(rawText, PlannerSchema, 'Planner');
    }
}

export const aiParser = new AIParser();
