// backend/services/ai/ai.service.ts
// Orchestrates: Context → Prompt → Gemini → Parse → Cache → Return

import { geminiClient } from './gemini.client';
import { groqClient } from './groq.client';
import { promptBuilder, PromptOptions } from '../prompts/prompt.builder';
import { aiParser } from '../parsers/ai.parser';
import { contextManager } from '../context/context.manager';
import { embedService } from './embed.service';
import { aiCache } from '../cache/ai.cache';
import { chatHistoryManager } from '../history/chat.history';

const logger = require('../../src/utils/logger').default;

// ── Helpers ───────────────────────────────────────────────────────────────────
function toSerializableOptions(opts: PromptOptions): Record<string, unknown> {
    return {
        difficulty: opts.difficulty,
        count: opts.count,
        language: opts.language,
        focusAreas: opts.focusAreas?.join(','),
        examType: opts.examType,
        vivaDepth: opts.vivaDepth,
        studyGoal: opts.studyGoal,
        availableHours: opts.availableHours,
        examDate: opts.examDate,
    };
}

// ── AI Service ────────────────────────────────────────────────────────────────
class AIService {

    // ── Summary ────────────────────────────────────────────────────────────────
    async generateSummary(documentId: string, userId: string, options: PromptOptions = {}) {
        const cacheKey = aiCache.buildKey('summary', documentId, toSerializableOptions(options));
        const cached = aiCache.get(cacheKey);
        if (cached) {
            logger.info(`[AIService] Summary cache hit`, { tool: 'summary', documentId });
            return { data: cached, cached: true };
        }

        logger.info(`[AIService] Generating summary for document ${documentId}`);
        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        const prompt = promptBuilder.buildSummaryPrompt(ctx.text, mergedOptions);
        let rawText: string;
        try {
            rawText = await geminiClient.generateText(prompt, { usePro: false, label: `SummaryGen [${documentId}]` });
        } catch (e: any) {
            if (e.status === 429 && groqClient.isAvailable) {
                logger.warn(`Gemini 429. Falling back to Groq for SummaryGen [${documentId}]`);
                rawText = await groqClient.generateText(prompt);
            } else {
                throw e;
            }
        }
        const parsed = aiParser.parseSummary(rawText);

        aiCache.set(cacheKey, parsed, 3600); // 1 hour TTL
        logger.info(`[AIService] Summary generated for document ${documentId}`);
        return { data: parsed, cached: false };
    }

    // ── Flashcards ─────────────────────────────────────────────────────────────
    async generateFlashcards(documentId: string, userId: string, options: PromptOptions = {}) {
        const cacheKey = aiCache.buildKey('flashcards', documentId, toSerializableOptions(options));
        const cached = aiCache.get(cacheKey);
        if (cached) {
            logger.info(`[AIService] Flashcards cache hit`, { tool: 'flashcards', documentId });
            return { data: cached, cached: true };
        }

        logger.info(`[AIService] Generating flashcards for document ${documentId}`);
        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            count: 15,
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        const prompt = promptBuilder.buildFlashcardsPrompt(ctx.text, mergedOptions);
        let rawText: string;
        try {
            rawText = await geminiClient.generateText(prompt, { usePro: false, label: `FlashcardGen [${documentId}]` });
        } catch (e: any) {
            if (e.status === 429 && groqClient.isAvailable) {
                logger.warn(`Gemini 429. Falling back to Groq for FlashcardGen [${documentId}]`);
                rawText = await groqClient.generateText(prompt);
            } else {
                throw e;
            }
        }
        const parsed = aiParser.parseFlashcards(rawText);

        aiCache.set(cacheKey, parsed, 3600);
        logger.info(`[AIService] Flashcards generated: ${parsed.totalCards} cards for document ${documentId}`);
        return { data: parsed, cached: false };
    }

    // ── Quiz ───────────────────────────────────────────────────────────────────
    async generateQuiz(documentId: string, userId: string, options: PromptOptions = {}) {
        const cacheKey = aiCache.buildKey('quiz', documentId, toSerializableOptions(options));
        const cached = aiCache.get(cacheKey);
        if (cached) {
            logger.info(`[AIService] Quiz cache hit`, { tool: 'quiz', documentId });
            return { data: cached, cached: true };
        }

        logger.info(`[AIService] Generating quiz for document ${documentId}`);
        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            count: 10,
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        const prompt = promptBuilder.buildQuizPrompt(ctx.text, mergedOptions);
        let rawText: string;
        try {
            rawText = await geminiClient.generateText(prompt, { usePro: false, label: `QuizGen [${documentId}]` });
        } catch (e: any) {
            if (e.status === 429 && groqClient.isAvailable) {
                logger.warn(`Gemini 429. Falling back to Groq for QuizGen [${documentId}]`);
                rawText = await groqClient.generateText(prompt);
            } else {
                throw e;
            }
        }
        const parsed = aiParser.parseQuiz(rawText);

        aiCache.set(cacheKey, parsed, 3600);
        logger.info(`[AIService] Quiz generated: ${parsed.totalQuestions} questions for document ${documentId}`);
        return { data: parsed, cached: false };
    }

    // ── Score Quiz ─────────────────────────────────────────────────────────────
    async scoreQuiz(documentId: string, userId: string, quizContext: string, userAnswers: string): Promise<any> {
        logger.info(`[AIService] Scoring quiz for document ${documentId}`);
        const ctx = await contextManager.getDocumentContext(documentId, userId);

        // Completely omit document text for scoring to ensure we never hit Groq's strict 6k TPM limits.
        // The quizContext already has the explanations and correct answers!
        const prompt = promptBuilder.buildQuizScoringPrompt('Document text omitted for quiz scoring. Use the Quiz Context.', quizContext, userAnswers);
        let rawText: string;
        try {
            rawText = await geminiClient.generateText(prompt, { usePro: false, label: `QuizScore [${documentId}]` });
        } catch (e: any) {
            if (e.status === 429 && groqClient.isAvailable) {
                logger.warn(`Gemini 429. Falling back to Groq for QuizScore [${documentId}]`);
                rawText = await groqClient.generateText(prompt);
            } else {
                throw e;
            }
        }
        const parsed = aiParser.parseQuizScore(rawText);

        let feedbackStr = parsed.suggestedRevision.join('\n');
        if (!feedbackStr) {
            feedbackStr = `Accuracy: ${parsed.accuracy}%. Focus on refining your understanding of: ${parsed.weakTopics.join(', ')}`;
        }

        return {
            data: {
                ...parsed,
                feedback: feedbackStr
            },
            cached: false
        };
    }

    // ── Viva ───────────────────────────────────────────────────────────────────
    async generateViva(documentId: string, userId: string, options: PromptOptions = {}) {
        const cacheKey = aiCache.buildKey('viva', documentId, toSerializableOptions(options));
        const cached = aiCache.get(cacheKey);
        if (cached) {
            logger.info(`[AIService] Viva cache hit`, { tool: 'viva', documentId });
            return { data: cached, cached: true };
        }

        logger.info(`[AIService] Generating viva for document ${documentId}`);
        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            count: 10,
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        const prompt = promptBuilder.buildVivaPrompt(ctx.text, mergedOptions);
        // Use Pro model for viva – requires deeper reasoning
        const rawText = await geminiClient.generateText(prompt, { usePro: true, label: `VivaGen [${documentId}]` });
        const parsed = aiParser.parseViva(rawText);

        aiCache.set(cacheKey, parsed, 3600);
        logger.info(`[AIService] Viva generated: ${parsed.totalQuestions} questions for document ${documentId}`);
        return { data: parsed, cached: false };
    }

    // ── Chat (streaming-ready) ─────────────────────────────────────────────────
    async chat(
        documentId: string,
        userId: string,
        userMessage: string,
        options: PromptOptions = {}
    ): Promise<{ reply: string; messageCount: number }> {
        logger.info(`[AIService] Chat message for document ${documentId} from user ${userId}`);

        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        let activeText = ctx.text;
        // Optimization: Context Compression via Vector Search if doc is huge
        if (ctx.chunksAvailable > 1) {
            logger.info(`[AIService] Compressing ${ctx.chunksAvailable} chunks for fast chat via embeddings`);
            const chunks = contextManager.chunk(ctx.text);
            activeText = await embedService.retrieveRelevantContext(documentId, chunks, userMessage, 3);
        }

        const history = chatHistoryManager.getFormattedHistory(userId, documentId);
        const systemPrompt = promptBuilder.buildChatSystemPrompt(activeText, mergedOptions);
        const contents = promptBuilder.buildChatUserContent(userMessage, history);

        // Gemini multi-turn: system prompt as first user message if no history
        const fullContents = history.length === 0
            ? [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Understood. I am ready to help you study this document. What would you like to know?' }] },
                ...contents,
            ]
            : contents;

        let reply = '';
        try {
            const rawResult = await geminiClient.generate(
                { contents: fullContents as any },
                { usePro: false, timeoutMs: 30_000, label: `ChatGen [${documentId}]` }
            );
            reply = rawResult.response.text();
        } catch (e: any) {
            if (e.status === 429 && groqClient.isAvailable) {
                logger.warn(`Gemini 429. Falling back to Groq for ChatGen [${documentId}]`);

                // Convert Gemini history to Groq format safely
                const groqMessages = [
                    { role: 'system', content: systemPrompt },
                    ...history.map(msg => {
                        return {
                            role: msg.role === 'model' ? 'assistant' : 'user',
                            content: (msg as any).text || ''
                        };
                    }),
                    { role: 'user', content: userMessage }
                ] as any;

                reply = await groqClient.generateChat(groqMessages);
            } else {
                throw e;
            }
        }

        if (!reply) throw new Error('AI returned an empty chat response');

        // Store both turns in history
        chatHistoryManager.addMessage(userId, documentId, 'user', userMessage);
        chatHistoryManager.addMessage(userId, documentId, 'model', reply);

        return {
            reply,
            messageCount: chatHistoryManager.getMessageCount(userId, documentId),
        };
    }

    /** Stream chat response for real-time delivery */
    async chatStream(
        documentId: string,
        userId: string,
        userMessage: string,
        options: PromptOptions = {}
    ) {
        logger.info(`[AIService] Streaming chat for document ${documentId}`);

        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        let activeText = ctx.text;
        if (ctx.chunksAvailable > 1) {
            const chunks = contextManager.chunk(ctx.text);
            activeText = await embedService.retrieveRelevantContext(documentId, chunks, userMessage, 3);
        }

        const history = chatHistoryManager.getFormattedHistory(userId, documentId);
        const systemPrompt = promptBuilder.buildChatSystemPrompt(activeText, mergedOptions);
        const contents = promptBuilder.buildChatUserContent(userMessage, history);

        const fullContents = history.length === 0
            ? [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'Understood. I am ready to help you study this document.' }] },
                ...contents,
            ]
            : contents;

        chatHistoryManager.addMessage(userId, documentId, 'user', userMessage);

        const streamResult = await geminiClient.generateStream(
            { contents: fullContents as any },
            { usePro: false }
        );

        return {
            stream: streamResult.stream,
            onComplete: (fullText: string) => {
                chatHistoryManager.addMessage(userId, documentId, 'model', fullText);
            },
        };
    }

    // ── Study Planner ──────────────────────────────────────────────────────────
    async generatePlanner(documentId: string, userId: string, options: PromptOptions = {}) {
        const cacheKey = aiCache.buildKey('planner', documentId, toSerializableOptions(options));
        const cached = aiCache.get(cacheKey);
        if (cached) return { data: cached, cached: true };

        logger.info(`[AIService] Generating study planner for document ${documentId}`);
        const ctx = await contextManager.getDocumentContext(documentId, userId);
        const mergedOptions: PromptOptions = {
            ...options,
            subject: options.subject || ctx.subject,
            documentTitle: options.documentTitle || ctx.title,
        };

        const prompt = promptBuilder.buildPlannerPrompt(ctx.text, mergedOptions);
        const rawText = await geminiClient.generateText(prompt, { usePro: false, label: `PlannerGen [${documentId}]` });
        const parsed = aiParser.parsePlanner(rawText);

        aiCache.set(cacheKey, parsed, 7200); // 2 hour TTL for planners
        logger.info(`[AIService] Study planner generated for document ${documentId}`);
        return { data: parsed, cached: false };
    }



    // ── Cache Management ───────────────────────────────────────────────────────
    invalidateDocumentCache(documentId: string): void {
        aiCache.invalidateByDocument(documentId);
    }

    clearChatHistory(userId: string, documentId: string): void {
        chatHistoryManager.clearSession(userId, documentId);
    }
}

export const aiService = new AIService();
