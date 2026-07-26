// backend/routes/stats/stats.routes.ts
import { Router } from 'express';
import { cache } from '../../middleware/cache';
import { getUserStatistics } from '../../services/stats/stats.service';
import { protect } from '../../middleware/auth';

const router = Router();

// GET /api/stats - returns aggregated user statistics, cached for 5 minutes
router.get('/', protect, cache, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const stats = await getUserStatistics(userId);
        res.json(stats);
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ message: 'Failed to retrieve statistics' });
    }
});

export default router;
