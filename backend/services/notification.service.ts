// backend/services/notification.service.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging, MulticastMessage, BatchResponse } from 'firebase-admin/messaging';
import * as fs from 'fs';
import Settings from '../models/Settings';
import type { ISettings } from '../models/Settings';

/** Initialize Firebase Admin SDK using service account JSON path from env. */
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountPath) {
    try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as any;
        initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
        console.error('Failed to load Firebase service account:', err);
    }
} else {
    // Initialize with default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS env var)
    initializeApp();
}

/**
 * Send a push notification to a user's device tokens.
 * Assumes device tokens are stored in the user's Settings under `pushTokens` (array of strings).
 */
export const sendNotification = async (
    userId: string,
    payload: any
): Promise<BatchResponse> => {
    const settings = (await Settings.findOne({ user: userId })) as any as ISettings & { pushTokens?: string[] };
    const tokens = settings?.pushTokens ?? [];
    if (!tokens.length) {
        console.warn(`No push tokens for user ${userId}`);
        return { responses: [], successCount: 0, failureCount: 0 } as any;
    }
    const message: MulticastMessage = { ...payload, tokens };
    return (getMessaging() as any).sendMulticast(message);
};

/**
 * Schedule a reminder notification using node-cron.
 * This is a placeholder – in production you would store the schedule in DB and manage cron jobs.
 */
export const scheduleReminder = (cronExpression: string, payload: any) => {
    const cron = require('node-cron');
    cron.schedule(cronExpression, async () => {
        const allSettings = await Settings.find({ pushTokens: { $exists: true, $ne: [] } });
        for (const s of allSettings as any as (ISettings & { pushTokens?: string[] })[]) {
            if (s.pushTokens?.length) {
                const msg: MulticastMessage = { ...payload, tokens: s.pushTokens };
                await (getMessaging() as any).sendMulticast(msg);
            }
        }
    });
};
