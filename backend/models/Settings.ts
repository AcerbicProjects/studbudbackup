// backend/models/Settings.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    user: mongoose.Types.ObjectId; // reference to User
    darkMode: boolean;
    language: string;
    notificationPrefs: {
        studyReminder: boolean;
        revisionReminder: boolean;
        quizReminder: boolean;
        streakReminder: boolean;
        uploadCompleted: boolean;
    };
    reminderTime: string; // ISO time string e.g., "08:00"
    emailNotifications: boolean;
    pushNotifications: boolean;
    pushTokens: string[]; // device tokens for FCM
    privacy: {
        shareData: boolean;
        // add other privacy fields as needed
    };
}

const SettingsSchema: Schema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        darkMode: { type: Boolean, default: false },
        language: { type: String, default: 'en' },
        notificationPrefs: {
            studyReminder: { type: Boolean, default: true },
            revisionReminder: { type: Boolean, default: true },
            quizReminder: { type: Boolean, default: true },
            streakReminder: { type: Boolean, default: true },
            uploadCompleted: { type: Boolean, default: true },
        },
        reminderTime: { type: String, default: '08:00' },
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        pushTokens: [{ type: String }],
        privacy: {
        },
    },
    { timestamps: true }
);

export default mongoose.model<ISettings>('Settings', SettingsSchema);
