// backend/middleware/ownership.ts
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from './auth';

// Generic ownership check for a resource with an `ownerId` field
export const verifyOwnership = (model: mongoose.Model<any>, paramIdName: string = 'id') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const resourceId = req.params[paramIdName];
        if (!resourceId) {
            return res.status(400).json({ message: 'Resource ID missing' });
        }
        try {
            const doc = await model.findById(resourceId).select('ownerId');
            if (!doc) {
                return res.status(404).json({ message: 'Resource not found' });
            }
            if (doc.ownerId?.toString() !== req.user?.id) {
                return res.status(403).json({ message: 'Forbidden: not the owner' });
            }
            // attach the document for later use if needed
            (req as any).resource = doc;
            next();
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    };
};
