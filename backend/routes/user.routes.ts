// backend/routes/user.routes.ts
import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    updateAvatar,
    updatePassword,
    deleteAccount,
} from '../controllers/user.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { profileUpdateSchema, passwordUpdateSchema, avatarUploadSchema } from '../validation/user';
import { multerConfig } from '../middleware/multerConfig';


const router = Router();

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, validate(profileUpdateSchema), updateProfile);
router.patch('/avatar', protect, multerConfig.single('avatar'), validate(avatarUploadSchema), updateAvatar);
router.patch('/password', protect, validate(passwordUpdateSchema), updatePassword);
router.delete('/account', protect, deleteAccount);

export default router;
