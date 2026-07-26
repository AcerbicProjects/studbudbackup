// backend/models/User.ts
export { };

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    fullName: string;
    email: string;
    password: string;
    university?: string;
    department?: string;
    semester?: string;
    avatar?: string;
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        university: { type: String },
        department: { type: String },
        semester: { type: String },
        avatar: { type: String },
        settings: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
