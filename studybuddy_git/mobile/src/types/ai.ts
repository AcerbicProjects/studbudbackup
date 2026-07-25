// src/types/ai.ts
// Route params for the AI Learning Module stack (Person 3).

export type AIStackParamList = {
    AIHome: undefined;
    Chat: undefined;
    Summary: undefined;
    Flashcards: undefined;
    Quiz: undefined;
    QuizResult: {
        correct: number;
        total: number;
        timeSeconds: number;
        answers: Record<string, string | null>;
    };
    Viva: undefined;
};
