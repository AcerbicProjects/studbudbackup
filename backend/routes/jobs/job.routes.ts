// backend/routes/jobs/job.routes.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import Job from '../../models/Job';
import { protect } from '../../middleware/auth';

const router = Router();

// ── GET /api/jobs/:id – get job processing status ──────────────────────────────
router.get('/:id', protect, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Verify ownership
        if (job.ownerId.toString() !== userId) {
            return res.status(403).json({ message: 'Forbidden: not the owner' });
        }

        res.json({
            id: job._id,
            bullJobId: job.bullJobId,
            type: job.type,
            status: job.status,
            progress: job.progress,
            steps: job.steps,
            documentId: job.documentId,
            result: job.result,
            error: job.error,
            attempts: job.attempts,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        });
    } catch (err) {
        console.error('Job status error:', err);
        res.status(500).json({ message: 'Failed to retrieve job status' });
    }
});

// ── GET /api/jobs – list jobs for current user ─────────────────────────────────
router.get('/', protect, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { status, limit = '20', page = '1' } = req.query as any;

        const filter: any = { ownerId: userId };
        if (status) filter.status = status;

        const skip = (Number(page) - 1) * Number(limit);
        const [total, jobs] = await Promise.all([
            Job.countDocuments(filter),
            Job.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .select('-__v'),
        ]);

        res.json({ total, page: Number(page), limit: Number(limit), jobs });
    } catch (err) {
        console.error('Job list error:', err);
        res.status(500).json({ message: 'Failed to list jobs' });
    }
});

export default router;
