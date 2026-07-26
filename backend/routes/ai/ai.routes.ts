// backend/routes/ai/ai.routes.ts
// POST /api/ai/summary
// POST /api/ai/flashcards
// POST /api/ai/quiz
// POST /api/ai/viva
// POST /api/ai/chat
// DELETE /api/ai/chat/:documentId   (clear history)
// POST /api/ai/planner              (bonus)

import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../middleware/auth';
import { aiService } from '../../services/ai/ai.service';
import {
    summaryRequestSchema,
    flashcardsRequestSchema,
    quizRequestSchema,
    quizScoreRequestSchema,
    vivaRequestSchema,
    chatRequestSchema,
    plannerRequestSchema,
} from '../../validation/ai.validation';

const logger = require('../../src/utils/logger').default;

const router = Router();

// All AI routes require auth
router.use(protect);

// ── Inline Zod validation helper ──────────────────────────────────────────────
function validateAI<T>(schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: { issues: any[] } } }) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error!.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`);
            return res.status(400).json({ message: 'Validation error', errors: issues });
        }
        req.body = result.data;
        next();
    };
}

// ── Shared error handler ──────────────────────────────────────────────────────
function handleAIError(err: any, res: Response, module: string): void {
    logger.error(`[AI/${module}] ${err.message}`);

    if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Quota') || err.message?.includes('quota')) {
        res.status(429).json({ message: 'Too many AI requests. Please wait a moment and retry.', module });
        return;
    }
    if (err.message?.includes('not found') || err.message?.includes('access denied')) {
        res.status(404).json({ message: err.message, module });
        return;
    }
    if (err.message?.includes('still being processed') || err.message?.includes('extraction failed')) {
        res.status(422).json({ message: err.message, module });
        return;
    }
    if (err.message?.includes('Insufficient text')) {
        res.status(422).json({ message: err.message, module });
        return;
    }
    if (err.message?.includes('GEMINI_API_KEY') || err.message?.includes('API key')) {
        res.status(503).json({ message: 'AI service is not configured. Contact support.', module });
        return;
    }

    res.status(500).json({ message: 'AI generation failed', error: err.message || err.toString(), module });
}

// ── POST /api/ai/summary ──────────────────────────────────────────────────────
router.post('/summary', validateAI(summaryRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, difficulty, language, subject, focusAreas } = req.body;
        const userId = (req as any).user.id;

        const result = await aiService.generateSummary(documentId, userId, {
            difficulty,
            language,
            subject,
            focusAreas,
        });

        logger.info(`[AI/summary] Generated for doc=${documentId} user=${userId} cached=${result.cached}`);
        res.json({
            success: true,
            module: 'summary',
            documentId,
            cached: result.cached,
            data: result.data,
        });
    } catch (err: any) {
        handleAIError(err, res, 'summary');
    }
});

// ── POST /api/ai/flashcards ───────────────────────────────────────────────────
router.post('/flashcards', validateAI(flashcardsRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, difficulty, language, subject, count } = req.body;
        const userId = (req as any).user.id;

        const result = await aiService.generateFlashcards(documentId, userId, {
            difficulty,
            language,
            subject,
            count,
        });

        logger.info(`[AI/flashcards] Generated for doc=${documentId} count=${(result.data as any).totalCards} cached=${result.cached}`);
        res.json({
            success: true,
            module: 'flashcards',
            documentId,
            cached: result.cached,
            data: result.data,
        });
    } catch (err: any) {
        handleAIError(err, res, 'flashcards');
    }
});

// ── POST /api/ai/quiz ─────────────────────────────────────────────────────────
router.post('/quiz', validateAI(quizRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, difficulty, language, subject, count, examType } = req.body;
        const userId = (req as any).user.id;

        const result = await aiService.generateQuiz(documentId, userId, {
            difficulty,
            language,
            subject,
            count,
            examType,
        });

        logger.info(`[AI/quiz] Generated for doc=${documentId} questions=${(result.data as any).totalQuestions} cached=${result.cached}`);
        res.json({
            success: true,
            module: 'quiz',
            documentId,
            cached: result.cached,
            data: result.data,
        });
    } catch (err: any) {
        handleAIError(err, res, 'quiz');
    }
});

// ── POST /api/ai/quiz/score ───────────────────────────────────────────────────
router.post('/quiz/score', validateAI(quizScoreRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, quizContext, userAnswers } = req.body;
        const userId = (req as any).user.id;

        const result = await aiService.scoreQuiz(documentId, userId, quizContext, userAnswers);

        logger.info(`[AI/quiz] Scored for doc=${documentId}`);
        res.json({
            success: true,
            module: 'quiz-score',
            documentId,
            data: result.data,
        });
    } catch (err: any) {
        handleAIError(err, res, 'quiz');
    }
});

// ── POST /api/ai/viva ─────────────────────────────────────────────────────────
router.post('/viva', validateAI(vivaRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, difficulty, language, subject, count, vivaDepth } = req.body;
        const userId = (req as any).user.id;

        const result = await aiService.generateViva(documentId, userId, {
            difficulty,
            language,
            subject,
            count,
            vivaDepth,
        });

        logger.info(`[AI/viva] Generated for doc=${documentId} questions=${(result.data as any).totalQuestions} cached=${result.cached}`);
        res.json({
            success: true,
            module: 'viva',
            documentId,
            cached: result.cached,
            data: result.data,
        });
    } catch (err: any) {
        handleAIError(err, res, 'viva');
    }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', validateAI(chatRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, message, language } = req.body;
        const userId = (req as any).user.id;

        // Support streaming via Accept header
        const wantsStream = req.headers.accept === 'text/event-stream';

        if (wantsStream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const { stream, onComplete } = await aiService.chatStream(documentId, userId, message, { language });
            let fullText = '';

            for await (const chunk of stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    fullText += chunkText;
                    res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
                }
            }

            onComplete(fullText);
            res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
            res.end();
        } else {
            const result = await aiService.chat(documentId, userId, message, { language });

            logger.info(`[AI/chat] Reply for doc=${documentId} user=${userId} msgCount=${result.messageCount}`);
            res.json({
                success: true,
                module: 'chat',
                documentId,
                reply: result.reply,
                messageCount: result.messageCount,
            });
        }
    } catch (err: any) {
        handleAIError(err, res, 'chat');
    }
});

// ── DELETE /api/ai/chat/:documentId ──────────────────────────────────────────
router.delete('/chat/:documentId', async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const documentId = req.params['documentId'] as string;
    aiService.clearChatHistory(userId, documentId);
    res.json({ success: true, message: 'Chat history cleared' });
});

// ── POST /api/ai/planner & /api/ai/study-planner ──────────────────────────────
router.post(['/planner', '/study-planner'], validateAI(plannerRequestSchema), async (req: Request, res: Response) => {
    try {
        const { documentId, difficulty, language, subject, studyGoal, availableHours, examDate, weakTopics, preferredStudyTime } = req.body;
        const userId = (req as any).user.id;

        const result = await aiService.generatePlanner(documentId, userId, {
            difficulty,
            language,
            subject,
            studyGoal,
            availableHours,
            examDate,
            weakTopics,
            preferredStudyTime,
        });

        logger.info(`[AI/planner] Generated for doc=${documentId} cached=${result.cached}`);
        res.json({
            success: true,
            module: 'planner',
            documentId,
            cached: result.cached,
            data: result.data,
        });
    } catch (err: any) {
        handleAIError(err, res, 'planner');
    }
});

// ── GET /api/ai/cache/stats ───────────────────────────────────────────────────
router.get('/cache/stats', async (req: Request, res: Response) => {
    const { aiCache } = require('../../services/cache/ai.cache');
    res.json({ success: true, cache: aiCache.stats() });
});

// ── DELETE /api/ai/cache/:documentId ─────────────────────────────────────────
router.delete('/cache/:documentId', async (req: Request, res: Response) => {
    const documentId = req.params['documentId'] as string;
    aiService.invalidateDocumentCache(documentId);
    res.json({ success: true, message: `Cache cleared for document ${documentId}` });
});

export default router;
