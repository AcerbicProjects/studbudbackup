// backend/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdev';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload: { id: string; email: string }) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
};

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        // Attach user info to request
        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const issueToken = async (userId: string) => {
    const user = await User.findById(userId).select('email');
    if (!user) throw new Error('User not found');
    return generateToken({ id: userId, email: user.email });
};
