// backend/models/Job.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
    bullJobId: string;
    type: 'document-processing';
    status: 'queued' | 'processing' | 'completed' | 'failed';
    documentId: mongoose.Types.ObjectId;
    ownerId: mongoose.Types.ObjectId;
    progress: number;
    steps: {
        virusScan: 'pending' | 'completed' | 'failed' | 'skipped';
        compression: 'pending' | 'completed' | 'failed' | 'skipped';
        cloudUpload: 'pending' | 'completed' | 'failed' | 'skipped';
        thumbnails: 'pending' | 'completed' | 'failed' | 'skipped';
        ocr: 'pending' | 'completed' | 'failed' | 'skipped';
        pdfParsing: 'pending' | 'completed' | 'failed' | 'skipped';
    };
    result?: Record<string, any>;
    error?: string;
    attempts: number;
    createdAt: Date;
    updatedAt: Date;
}

const JobSchema: Schema = new Schema(
    {
        bullJobId: { type: String, required: true, unique: true },
        type: { type: String, enum: ['document-processing'], required: true },
        status: {
            type: String,
            enum: ['queued', 'processing', 'completed', 'failed'],
            default: 'queued',
        },
        documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        progress: { type: Number, default: 0 },
        steps: {
            virusScan: { type: String, enum: ['pending', 'completed', 'failed', 'skipped'], default: 'pending' },
            compression: { type: String, enum: ['pending', 'completed', 'failed', 'skipped'], default: 'pending' },
            cloudUpload: { type: String, enum: ['pending', 'completed', 'failed', 'skipped'], default: 'pending' },
            thumbnails: { type: String, enum: ['pending', 'completed', 'failed', 'skipped'], default: 'pending' },
            ocr: { type: String, enum: ['pending', 'completed', 'failed', 'skipped'], default: 'pending' },
            pdfParsing: { type: String, enum: ['pending', 'completed', 'failed', 'skipped'], default: 'pending' },
        },
        result: { type: Schema.Types.Mixed },
        error: { type: String },
        attempts: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model<IJob>('Job', JobSchema);
