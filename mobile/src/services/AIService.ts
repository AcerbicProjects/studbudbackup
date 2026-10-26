import apiClient from './apiClient';
import {
  ChatMessage,
  FlashcardData,
  FormulaData,
  QuizQuestion,
  SummarySection,
  VivaQuestion,
} from '../types/ai';

// Generating study material from a long document can take a while
const AI_TIMEOUT = 120000;

export interface SummaryResult {
  overview: string;
  readTime: string;
  sections: SummarySection[];
  formulas: FormulaData[];
}

export interface QuizResult {
  totalTimeSeconds: number;
  questions: QuizQuestion[];
}

export interface QuizAnswerResult {
  question: string;
  yourAnswer: string | null;
  correctAnswer: string;
  correct: boolean;
}

const getTool = async <T>(documentId: string, tool: string, refresh: boolean): Promise<T> => {
  const response = await apiClient.get<T>(`/ai/${documentId}/${tool}`, {
    params: refresh ? { refresh: 1 } : undefined,
    timeout: AI_TIMEOUT,
  });
  return response.data;
};

export const AIService = {
  getSummary: (documentId: string, refresh = false) => getTool<SummaryResult>(documentId, 'summary', refresh),
  getFlashcards: (documentId: string, refresh = false) => getTool<FlashcardData[]>(documentId, 'flashcards', refresh),
  getQuiz: (documentId: string, refresh = false) => getTool<QuizResult>(documentId, 'quiz', refresh),
  getViva: (documentId: string, refresh = false) => getTool<VivaQuestion[]>(documentId, 'viva', refresh),

  async chat(documentId: string, message: string, history: ChatMessage[]): Promise<string> {
    const response = await apiClient.post<{ reply: string }>(
      `/ai/${documentId}/chat`,
      { message, history: history.map(({ role, text }) => ({ role, text })) },
      { timeout: AI_TIMEOUT }
    );
    return response.data.reply;
  },

  async quizFeedback(documentId: string, results: QuizAnswerResult[]): Promise<string> {
    const response = await apiClient.post<{ feedback: string }>(
      `/ai/${documentId}/quiz-feedback`,
      { results },
      { timeout: AI_TIMEOUT }
    );
    return response.data.feedback;
  },
};

export default AIService;
