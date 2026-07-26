// backend/controllers/settings.controller.ts
import type { Request, Response } from 'express';
import Settings from '../models/Settings';
import User from '../models/User';

// GET /api/settings - retrieve settings for current user (create default if not exist)
export const getSettings = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - user added by protect middleware
        const userId = (req as any).user?.id;
        let settings = await Settings.findOne({ user: userId });
        if (!settings) {
            // create default settings
            settings = await Settings.create({ user: userId });
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/settings - update settings for current user
export const updateSettings = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - user added by protect middleware
        const userId = (req as any).user?.id;
        const updates = req.body;
        const settings = await Settings.findOneAndUpdate({ user: userId }, updates, { new: true, upsert: true });
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
