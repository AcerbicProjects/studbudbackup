// backend/controllers/user.controller.ts
import type { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/storage/cloudinary.service';
import { issueToken } from '../middleware/auth'; // for re-issuing token after password change if needed

// GET /api/user/profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const userObj = user.toObject() as any;
        if (userObj.avatar) {
            userObj.profilePhoto = userObj.avatar;
        }
        res.json(userObj);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/user/profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const updates = req.body;
        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        const userObj = user.toObject() as any;
        if (userObj.avatar) {
            userObj.profilePhoto = userObj.avatar;
        }
        res.json({ message: 'Profile updated successfully', user: userObj });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/user/avatar
export const updateAvatar = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        // Upload to Cloudinary (file is stored in memory by multer)
        const uploadResult = await uploadToCloudinary(req.file.path, { folder: 'studybuddy/avatars', resourceType: 'image' });
        // Update user avatar URL
        const user = await User.findByIdAndUpdate(userId, { avatar: uploadResult.secureUrl }, { new: true }).select('-password');
        res.json({ message: 'Avatar updated successfully', profilePhoto: uploadResult.secureUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH /api/user/password
export const updatePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        user.password = hashed;
        await user.save();
        // Optionally reâ€‘issue token
        const token = await issueToken(userId);
        res.json({ message: 'Password updated', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/user/account
export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        // Delete avatar from Cloudinary if present
        if (user.avatar) {
            // Extract publicId from URL
            const parts = user.avatar.split('/');
            const publicIdWithExt = parts[parts.length - 1];
            const publicId = publicIdWithExt.split('.')[0];
            await deleteFromCloudinary(publicId);
        }
        await user.deleteOne();
        res.json({ message: 'Account deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
