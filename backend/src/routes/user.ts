import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { User, GENERAL_SUBJECT } from '../models/User';
import { StudyDocument } from '../models/Document';
import { StudyGoal } from '../models/StudyGoal';
import { uploadAvatar } from '../config/multer';
import { documentDir } from '../config/documentUpload';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const MAX_SUBJECTS = 30;

// GET /api/user/subjects
router.get('/subjects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.userId).select('subjects');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ subjects: user.subjects, general: GENERAL_SUBJECT });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/user/subjects  { name }
router.post('/subjects', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const name = String(req.body.name || '').replace(/\s+/g, ' ').trim();
    if (!name || name.length > 30) {
      return res.status(400).json({ message: 'Subject name must be 1-30 characters' });
    }
    const user = await User.findById(req.userId).select('subjects');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const taken = [...user.subjects, GENERAL_SUBJECT].some((s) => s.toLowerCase() === name.toLowerCase());
    if (taken) return res.status(409).json({ message: `"${name}" already exists` });
    if (user.subjects.length >= MAX_SUBJECTS) {
      return res.status(400).json({ message: `You can have up to ${MAX_SUBJECTS} subjects` });
    }

    user.subjects.push(name);
    await user.save();
    return res.status(201).json({ subjects: user.subjects, general: GENERAL_SUBJECT });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/user/subjects/:name  (documents inside move to General, nothing is deleted)
router.delete('/subjects/:name', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const name = String(req.params.name);
    if (name === GENERAL_SUBJECT) {
      return res.status(400).json({ message: `"${GENERAL_SUBJECT}" cannot be removed` });
    }
    const user = await User.findById(req.userId).select('subjects');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.subjects.includes(name)) return res.status(404).json({ message: 'Subject not found' });

    user.subjects = user.subjects.filter((s) => s !== name) as any;
    await user.save();
    const moved = await StudyDocument.updateMany({ user: req.userId, subject: name }, { subject: GENERAL_SUBJECT });

    return res.json({ subjects: user.subjects, general: GENERAL_SUBJECT, movedDocuments: moved.modifiedCount });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

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

    // Remove the user's documents and their files too
    const docs = await StudyDocument.find({ user: req.userId }).select('fileName');
    for (const doc of docs) {
      const filePath = path.join(documentDir, doc.fileName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await StudyDocument.deleteMany({ user: req.userId });
    await StudyGoal.deleteMany({ user: req.userId });

    await User.findByIdAndDelete(req.userId);
    return res.json({ message: 'Account deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
