// src/types/ai.ts
// Route params for the AI Learning Module stack (Person 3).

export type AIStackParamList = {
    AIHome: undefined;
    Chat: { documentId: string };
    Summary: { documentId: string };
    Flashcards: { documentId: string };
    Quiz: { documentId: string };
    QuizResult: {
        documentId: string;
        questions: any[];
        correct: number;
        total: number;
        timeSeconds: number;
        answers: Record<string, string | null>;
    };
    Viva: { documentId: string };
};
