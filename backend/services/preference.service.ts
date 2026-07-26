// backend/services/preference.service.ts
import Settings from '../models/Settings';
import type { ISettings } from '../models/Settings';

/**
 * Retrieve language and notification preferences for a user.
 */
export const getUserPreferences = async (userId: string): Promise<Partial<ISettings>> => {
    const settings = await Settings.findOne({ user: userId });
    if (!settings) return {};
    const { language, notificationPrefs, reminderTime, emailNotifications, pushNotifications, privacy } = settings;
    return { language, notificationPrefs, reminderTime, emailNotifications, pushNotifications, privacy } as any;
};

/**
 * Update language or notification preferences for a user.
 * `updates` can contain any subset of the preference fields.
 */
export const updateUserPreferences = async (
    userId: string,
    updates: Partial<Pick<ISettings, 'language' | 'notificationPrefs' | 'reminderTime' | 'emailNotifications' | 'pushNotifications' | 'privacy'>>
): Promise<ISettings> => {
    const updated = await Settings.findOneAndUpdate({ user: userId }, updates, { new: true, upsert: true });
    return updated;
};
