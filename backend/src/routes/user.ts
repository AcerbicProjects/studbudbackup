import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { uploadAvatar } from '../config/multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/user/profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userResponse = user.toObject();
    delete (userResponse as any).password;
    
    return res.json(userResponse);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// PATCH /api/user/profile
router.patch('/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { fullName, email, university, semester, department } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName) user.fullName = fullName;
    if (email) user.email = email.toLowerCase();
    if (university) user.university = university;
    if (semester !== undefined) user.semester = semester;
    if (department !== undefined) user.department = department;

    await user.save();
    
    const userResponse = user.toObject();
    delete (userResponse as any).password;
    
    return res.json({ message: 'Profile updated successfully', user: userResponse });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    return res.status(500).json({ message: err.message });
  }
});

// PATCH /api/user/avatar
router.patch('/avatar', authenticateToken, uploadAvatar.single('avatar'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Build public URL for the uploaded file
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    // Optionally delete old avatar file if it's stored locally
    if (user.profilePhoto && user.profilePhoto.includes('/uploads/avatars/')) {
      const oldFilename = user.profilePhoto.split('/').pop();
      if (oldFilename) {
        const oldFilePath = path.join(__dirname, '../../uploads/avatars', oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    user.profilePhoto = fileUrl;
    await user.save();

    return res.json({ message: 'Avatar updated successfully', profilePhoto: fileUrl });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// PATCH /api/user/password
router.patch('/password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await (user as any).comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/user/account
router.delete('/account', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optional: Delete user's avatar
    if (user.profilePhoto && user.profilePhoto.includes('/uploads/avatars/')) {
      const oldFilename = user.profilePhoto.split('/').pop();
      if (oldFilename) {
        const oldFilePath = path.join(__dirname, '../../uploads/avatars', oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    await User.findByIdAndDelete(req.userId);
    return res.json({ message: 'Account deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
