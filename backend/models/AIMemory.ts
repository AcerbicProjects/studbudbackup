// backend/models/AIMemory.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMemory extends Document {
    userId: mongoose.Types.ObjectId;
    documentId: mongoose.Types.ObjectId;

    // History arrays
    recentQuestions: string[];
    previousSummaries: mongoose.Types.ObjectId[];
    quizAttempts: Array<{
        quizScoreId?: mongoose.Types.ObjectId;
        score: number;
        accuracy: number;
        weakTopics: string[];
        date: Date;
    }>;
    flashcardProgress: Array<{
        flashcardId: mongoose.Types.ObjectId;
        easeFactor: number;
        interval: number;
        nextReviewDate: Date;
        repetitions: number;
    }>;

    // Dynamic Recommendations
    recommendations: {
        weakTopics: string[];
        nextChapters: string[];
        revisionSchedule: string;
        flashcardsToReview: mongoose.Types.ObjectId[];
        suggestedQuizzes: string[];
    };

    updatedAt: Date;
}

const AIMemorySchema = new Schema<IAIMemory>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },

    recentQuestions: [{ type: String }],
    previousSummaries: [{ type: Schema.Types.ObjectId }],

    quizAttempts: [{
        quizScoreId: { type: Schema.Types.ObjectId },
        score: { type: Number, required: true },
        accuracy: { type: Number, required: true },
        weakTopics: [{ type: String }],
        date: { type: Date, default: Date.now }
    }],

    flashcardProgress: [{
        flashcardId: { type: Schema.Types.ObjectId, required: true },
        easeFactor: { type: Number, default: 2.5 },
        interval: { type: Number, default: 1 },
        nextReviewDate: { type: Date },
        repetitions: { type: Number, default: 0 }
    }],

    recommendations: {
        weakTopics: [{ type: String }],
        nextChapters: [{ type: String }],
        revisionSchedule: { type: String },
        flashcardsToReview: [{ type: Schema.Types.ObjectId }],
        suggestedQuizzes: [{ type: String }]
    },

    updatedAt: { type: Date, default: Date.now }
});

// Composite index
AIMemorySchema.index({ userId: 1, documentId: 1 }, { unique: true });

export default mongoose.models.AIMemory || mongoose.model<IAIMemory>('AIMemory', AIMemorySchema);
