// backend/routes/settings.routes.ts
import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { settingsSchema } from '../validation/settings';

const router = Router();

router.get('/', protect, getSettings);
router.patch('/', protect, validate(settingsSchema), updateSettings);

export default router;
