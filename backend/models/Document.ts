// backend/models/Document.ts
import mongoose, { Schema, Document } from 'mongoose';

// ── Sub-document Interfaces ────────────────────────────────────────────────────
export interface IThumbnails {
    small?: string;   // 150px
    medium?: string;  // 400px
    large?: string;   // 800px
}

export interface IOcrBlock {
    type: 'paragraph' | 'table' | 'equation' | 'header' | 'footer' | 'handwriting';
    text: string;
    confidence: number;
}

export interface IPdfMetadata {
    author?: string;
    creator?: string;
    producer?: string;
    title?: string;
    subject?: string;
    creationDate?: string;
    modDate?: string;
    keywords?: string;
}

export interface IPdfBookmark {
    title: string;
    page?: number;
    children?: IPdfBookmark[];
}

// ── Main Interface ─────────────────────────────────────────────────────────────
export interface IDocument extends Document {
    ownerId: mongoose.Types.ObjectId;
    title: string;
    subject: string;
    description?: string;
    originalFilename: string;
    storedFilename: string;
    mimeType: string;
    fileSize: number;
    pageCount?: number;
    uploadSource: 'camera' | 'upload';
    uploadDate: Date;

    // Cloud storage
    cloudPublicId?: string;
    cloudUrl?: string;
    compressedUrl?: string;
    thumbnails?: IThumbnails;
    thumbnail?: string;          // legacy compat
    cloudStoragePath?: string;   // legacy compat

    // OCR
    extractedText?: string;
    extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
    ocrProvider?: 'google-vision' | 'tesseract';
    ocrConfidence?: number;
    ocrBlocks?: IOcrBlock[];

    // PDF extraction
    pdfMetadata?: IPdfMetadata;
    headings?: string[];
    tables?: any[];
    bookmarks?: IPdfBookmark[];
    imageCount?: number;

    // Job tracking
    jobId?: string;
    virusScanStatus: 'pending' | 'clean' | 'infected' | 'error' | 'skipped';

    // Flags
    favorite: boolean;
    archived: boolean;
    deleted: boolean;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;

    // New fields
    folderId?: mongoose.Types.ObjectId; // reference to Folder
    lastOpenedAt?: Date; // for recently opened sorting
    studyTime?: number; // seconds spent studying
    bookmarkPage?: number; // last bookmarked page
    shareMetadata?: {
        sharedWith: mongoose.Types.ObjectId[];
        expiresAt?: Date;
    };
}

// ── Schema ─────────────────────────────────────────────────────────────────────
const ThumbnailsSchema = new Schema(
    {
        small: { type: String },
        medium: { type: String },
        large: { type: String },
    },
    { _id: false }
);

const OcrBlockSchema = new Schema(
    {
        type: { type: String, enum: ['paragraph', 'table', 'equation', 'header', 'footer', 'handwriting'] },
        text: { type: String },
        confidence: { type: Number },
    },
    { _id: false }
);

const PdfMetadataSchema = new Schema(
    {
        author: { type: String },
        creator: { type: String },
        producer: { type: String },
        title: { type: String },
        subject: { type: String },
        creationDate: { type: String },
        modDate: { type: String },
        keywords: { type: String },
    },
    { _id: false }
);

const BookmarkSchema: Schema = new Schema(
    {
        title: { type: String },
        page: { type: Number },
        children: [{ type: Schema.Types.Mixed }],
    },
    { _id: false }
);

const DocumentSchema: Schema = new Schema(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        subject: { type: String, required: true },
        description: { type: String },
        originalFilename: { type: String, required: true },
        storedFilename: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        pageCount: { type: Number },
        uploadSource: { type: String, enum: ['camera', 'upload'], required: true },
        uploadDate: { type: Date, default: Date.now },

        // Cloud storage
        cloudPublicId: { type: String },
        cloudUrl: { type: String },
        compressedUrl: { type: String },
        thumbnails: { type: ThumbnailsSchema },
        thumbnail: { type: String },
        cloudStoragePath: { type: String },

        // OCR
        extractedText: { type: String },
        extractionStatus: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        ocrProvider: { type: String, enum: ['google-vision', 'tesseract'] },
        ocrConfidence: { type: Number },
        ocrBlocks: [OcrBlockSchema],

        // PDF extraction
        pdfMetadata: { type: PdfMetadataSchema },
        headings: [{ type: String }],
        tables: [{ type: Schema.Types.Mixed }],
        bookmarks: [BookmarkSchema],
        imageCount: { type: Number },

        // Job tracking
        jobId: { type: String },
        virusScanStatus: {
            type: String,
            enum: ['pending', 'clean', 'infected', 'error', 'skipped'],
            default: 'pending',
        },

        // Flags
        favorite: { type: Boolean, default: false },
        archived: { type: Boolean, default: false },
        deleted: { type: Boolean, default: false },
        tags: [{ type: String }],

        // New fields
        folderId: { type: Schema.Types.ObjectId, ref: 'Folder' },
        lastOpenedAt: { type: Date },
        studyTime: { type: Number, default: 0 },
        bookmarkPage: { type: Number },
        shareMetadata: {
            sharedWith: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            expiresAt: { type: Date },
        },
    },
    { timestamps: true }
);

// Indexes for search and performance
DocumentSchema.index({ title: 'text', extractedText: 'text', subject: 'text', tags: 'text' }, { name: 'DocumentTextIndex' });
DocumentSchema.index({ ownerId: 1, uploadDate: -1 }, { name: 'OwnerUploadDateIdx' });
DocumentSchema.index({ ownerId: 1, fileSize: -1 }, { name: 'OwnerFileSizeIdx' });
DocumentSchema.index({ ownerId: 1, favorite: 1 }, { name: 'OwnerFavoriteIdx' });
DocumentSchema.index({ ownerId: 1, archived: 1 }, { name: 'OwnerArchivedIdx' });
DocumentSchema.index({ ownerId: 1, folderId: 1 }, { name: 'OwnerFolderIdx' });
DocumentSchema.index({ ownerId: 1, lastOpenedAt: -1 }, { name: 'OwnerLastOpenedIdx' });
DocumentSchema.index({ ownerId: 1, studyTime: -1 }, { name: 'OwnerStudyTimeIdx' });

export default mongoose.model<IDocument>('Document', DocumentSchema);
