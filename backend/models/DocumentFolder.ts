// backend/models/DocumentFolder.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentFolder extends Document {
    documentId: mongoose.Types.ObjectId;
    folderId: mongoose.Types.ObjectId;
}

const DocumentFolderSchema: Schema = new Schema(
    {
        documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
        folderId: { type: Schema.Types.ObjectId, ref: 'Folder', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IDocumentFolder>('DocumentFolder', DocumentFolderSchema);
