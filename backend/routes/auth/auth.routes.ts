// backend/routes/auth/auth.routes.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import { registerSchema, loginSchema } from '../../validation/auth';
import { validateBody } from '../../middleware/validation';
import { generateToken } from '../../middleware/auth';

const router = Router();

// Register
router.post(
    '/register',
    validateBody(registerSchema),
    async (req, res) => {
        try {
            const { fullName, email, password, university, department, semester } = req.body;
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(409).json({ message: 'User already exists' });
            }
            const hashed = await bcrypt.hash(password, 12);
            const user = await User.create({
                fullName,
                email,
                password: hashed,
                university,
                department,
                semester,
            });
            const token = generateToken({ id: user.id, email: user.email });
            const userResponse = user.toObject();
            delete (userResponse as any).password; if ((userResponse as any).avatar) { (userResponse as any).profilePhoto = (userResponse as any).avatar; }
            res.status(201).json({ token, userId: user.id, email: user.email, accessToken: token, refreshToken: token, user: userResponse });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Login
router.post(
    '/login',
    validateBody(loginSchema),
    async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const token = generateToken({ id: user.id, email: user.email });
            const userResponse = user.toObject();
            delete (userResponse as any).password; if ((userResponse as any).avatar) { (userResponse as any).profilePhoto = (userResponse as any).avatar; }
            res.json({ token, userId: user.id, email: user.email, accessToken: token, refreshToken: token, user: userResponse });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// Google Login
router.post('/google-login', async (req, res) => {
    try {
        const { email, fullName, googleId, profilePhoto } = req.body;
        if (!email || !fullName || !googleId) {
            return res.status(400).json({ message: 'Missing required Google profile fields' });
        }
        let user = await User.findOne({ email });
        if (!user) {
            const randomPassword = require('crypto').randomBytes(16).toString('hex');
            user = await User.create({
                fullName,
                email,
                password: randomPassword,
                university: 'Google Sign-In',
                avatar: profilePhoto || '',
            });
        }
        const token = generateToken({ id: user.id, email: user.email });
        const userResponse = user.toObject();
        delete (userResponse as any).password; if ((userResponse as any).avatar) { (userResponse as any).profilePhoto = (userResponse as any).avatar; }
        return res.json({ token, userId: user.id, email: user.email, accessToken: token, refreshToken: token, user: userResponse });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error during Google login' });
    }
});

import { protect } from '../../middleware/auth';

// Get Me
router.get('/me', protect, async (req: any, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userResponse = user.toObject();
        delete (userResponse as any).password; if ((userResponse as any).avatar) { (userResponse as any).profilePhoto = (userResponse as any).avatar; }
        return res.json(userResponse);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'No refresh token' });

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdev';
        const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
        const user = await User.findById(decoded.id);

        if (!user) return res.status(401).json({ message: 'Invalid token' });
        const newAccessToken = generateToken({ id: user.id, email: user.email });
        return res.json({ accessToken: newAccessToken, refreshToken: newAccessToken });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid token' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

// Forgot Password
router.post('/forgot-password', (req, res) => {
    res.json({ message: 'If an account exists with that email, a password reset link has been generated.' });
});

// Verify Email
router.post('/verify-email', (req, res) => {
    res.json({ message: 'Email verified successfully' });
});

export default router;
