// backend/services/history/chat.history.ts
// Per-user, per-document in-memory chat history manager

const logger = require('../../src/utils/logger').default;

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export interface ChatSession {
    userId: string;
    documentId: string;
    messages: ChatMessage[];
    createdAt: number;
    lastActiveAt: number;
}

const MAX_HISTORY_MESSAGES = 20;      // cap to control context window
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour of inactivity

class ChatHistoryManager {
    // key: `${userId}:${documentId}`
    private sessions = new Map<string, ChatSession>();
    private pruneInterval: ReturnType<typeof setInterval>;

    constructor() {
        this.pruneInterval = setInterval(() => this.prune(), 10 * 60 * 1000);
        if (this.pruneInterval.unref) this.pruneInterval.unref();
    }

    private sessionKey(userId: string, documentId: string): string {
        return `${userId}:${documentId}`;
    }

    /** Get or create a session */
    getSession(userId: string, documentId: string): ChatSession {
        const key = this.sessionKey(userId, documentId);
        let session = this.sessions.get(key);
        if (!session) {
            session = {
                userId,
                documentId,
                messages: [],
                createdAt: Date.now(),
                lastActiveAt: Date.now(),
            };
            this.sessions.set(key, session);
        }
        return session;
    }

    /** Append a message to a session */
    addMessage(userId: string, documentId: string, role: 'user' | 'model', text: string): void {
        const session = this.getSession(userId, documentId);
        session.messages.push({ role, text, timestamp: Date.now() });
        session.lastActiveAt = Date.now();

        // Trim to keep history within limits (preserve the last N messages)
        if (session.messages.length > MAX_HISTORY_MESSAGES) {
            session.messages = session.messages.slice(-MAX_HISTORY_MESSAGES);
        }
    }

    /** Get messages formatted for Gemini's multi-turn chat format */
    getFormattedHistory(
        userId: string,
        documentId: string
    ): Array<{ role: 'user' | 'model'; text: string }> {
        const session = this.sessions.get(this.sessionKey(userId, documentId));
        if (!session) return [];
        return session.messages.map(m => ({ role: m.role, text: m.text }));
    }

    /** Clear chat session */
    clearSession(userId: string, documentId: string): void {
        const key = this.sessionKey(userId, documentId);
        this.sessions.delete(key);
        logger.info(`[ChatHistory] Cleared session for user=${userId} doc=${documentId}`);
    }

    /** Get raw message count */
    getMessageCount(userId: string, documentId: string): number {
        return this.sessions.get(this.sessionKey(userId, documentId))?.messages.length ?? 0;
    }

    private prune(): void {
        const now = Date.now();
        let pruned = 0;
        for (const [key, session] of this.sessions.entries()) {
            if (now - session.lastActiveAt > SESSION_TTL_MS) {
                this.sessions.delete(key);
                pruned++;
            }
        }
        if (pruned > 0) logger.debug(`[ChatHistory] Pruned ${pruned} inactive sessions`);
    }
}

export const chatHistoryManager = new ChatHistoryManager();
