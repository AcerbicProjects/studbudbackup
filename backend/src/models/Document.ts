import { Schema, model, Types } from 'mongoose';

const documentSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: 'General',
      trim: true,
    },
    source: {
      type: String,
      enum: ['upload', 'scan'],
      default: 'upload',
    },
    originalName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    pages: {
      type: Number,
      default: 1,
    },
    fileName: {
      type: String,
      required: true,
    },
    // Plain text pulled out of the PDF / image, used as context for every AI tool
    text: {
      type: String,
      default: '',
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    studySeconds: {
      type: Number,
      default: 0,
    },
    lastOpened: {
      type: Date,
      default: Date.now,
    },
    // Every finished quiz, used for the Track tab (quiz count, weak topics)
    quizAttempts: [
      {
        correct: { type: Number, required: true },
        total: { type: Number, required: true },
        takenAt: { type: Date, default: Date.now },
      },
    ],
    // Generated AI content, cached so reopening a tool is instant
    ai: {
      summary: { type: Schema.Types.Mixed, default: null },
      flashcards: { type: Schema.Types.Mixed, default: null },
      quiz: { type: Schema.Types.Mixed, default: null },
      viva: { type: Schema.Types.Mixed, default: null },
    },
  },
  {
    timestamps: true,
  }
);

export const StudyDocument = model('Document', documentSchema);
export default StudyDocument;
