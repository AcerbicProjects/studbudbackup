// backend/models/Folder.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
    ownerId: mongoose.Types.ObjectId;
    folderName: string;
    color?: string;
    icon?: string;
    parentId?: mongoose.Types.ObjectId; // for nested folders
    statistics?: {
        documentCount: number;
        totalSize: number; // bytes
        totalPages: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const FolderSchema: Schema = new Schema(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        folderName: { type: String, required: true },
        color: { type: String },
        icon: { type: String },
        parentId: { type: Schema.Types.ObjectId, ref: 'Folder' },
        statistics: {
            documentCount: { type: Number, default: 0 },
            totalSize: { type: Number, default: 0 },
            totalPages: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Indexes for hierarchy and quick lookup
FolderSchema.index({ ownerId: 1, parentId: 1 }, { name: 'OwnerParentIdx' });
FolderSchema.index({ ownerId: 1, folderName: 1 }, { name: 'OwnerFolderNameIdx' });

export default mongoose.model<IFolder>('Folder', FolderSchema);
