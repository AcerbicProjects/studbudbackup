// backend/services/theme.service.ts
import Settings from '../models/Settings';
import type { ISettings } from '../models/Settings';

/**
 * Retrieve the theme settings for a given user.
 */
export const getUserTheme = async (userId: string): Promise<ISettings['darkMode']> => {
    const settings = await Settings.findOne({ user: userId });
    return settings?.darkMode ?? false;
};

/**
 * Update the dark mode setting for a user.
 */
export const setUserTheme = async (userId: string, darkMode: boolean): Promise<ISettings> => {
    const updated = await Settings.findOneAndUpdate({ user: userId }, { darkMode }, { new: true, upsert: true });
    return updated;
};

/**
 * Toggle the lamp mode (example custom field, can be stored in privacy or separate field).
 * Here we store it in the privacy.shareData for demonstration.
 */
export const toggleLampMode = async (userId: string): Promise<ISettings> => {
    const settings = await Settings.findOne({ user: userId });
    const newValue = !(settings?.privacy?.shareData ?? false);
    const updated = await Settings.findOneAndUpdate(
        { user: userId },
        { 'privacy.shareData': newValue },
        { new: true, upsert: true }
    );
    return updated;
};
