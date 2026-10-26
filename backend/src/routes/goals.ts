import express, { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { StudyGoal } from '../models/StudyGoal';

const router = express.Router();

const MAX_GOALS_PER_DAY = 20;
const MAX_RANGE_DAYS = 62;

// A real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30 etc.)
const isValidDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const daysBetween = (from: string, to: string) =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;

const cleanText = (value: unknown) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');

const toClient = (goal: any) => ({
  _id: goal._id,
  date: goal.date,
  text: goal.text,
  completed: goal.completed,
  createdAt: goal.createdAt,
  updatedAt: goal.updatedAt,
});

router.param('id', (req, res, next, id) => {
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Goal not found' });
  }
  next();
});

// GET /api/goals?from=YYYY-MM-DD&to=YYYY-MM-DD  (inclusive)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { from, to } = req.query;
    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      return res.status(400).json({ message: 'Provide a valid from/to date range (YYYY-MM-DD)' });
    }
    if (daysBetween(from, to) > MAX_RANGE_DAYS) {
      return res.status(400).json({ message: `Date range can be at most ${MAX_RANGE_DAYS} days` });
    }
    // String comparison is safe for zero-padded YYYY-MM-DD
    const goals = await StudyGoal.find({ user: req.userId, date: { $gte: from, $lte: to } }).sort({ date: 1, createdAt: 1 });
    return res.json(goals.map(toClient));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/goals  { date, text }
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date } = req.body;
    const text = cleanText(req.body.text);
    if (!isValidDate(date)) return res.status(400).json({ message: 'Invalid date' });
    if (!text || text.length > 200) return res.status(400).json({ message: 'Goal must be 1-200 characters' });

    const count = await StudyGoal.countDocuments({ user: req.userId, date });
    if (count >= MAX_GOALS_PER_DAY) {
      return res.status(400).json({ message: `You can plan up to ${MAX_GOALS_PER_DAY} goals per day` });
    }

    const goal = await StudyGoal.create({ user: req.userId, date, text });
    return res.status(201).json(toClient(goal));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// PATCH /api/goals/:id  { text?, completed? }
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const update: Record<string, unknown> = {};
    if (req.body.text !== undefined) {
      const text = cleanText(req.body.text);
      if (!text || text.length > 200) return res.status(400).json({ message: 'Goal must be 1-200 characters' });
      update.text = text;
    }
    if (req.body.completed !== undefined) {
      if (typeof req.body.completed !== 'boolean') return res.status(400).json({ message: 'completed must be true or false' });
      update.completed = req.body.completed;
    }
    if (!Object.keys(update).length) return res.status(400).json({ message: 'Nothing to update' });

    const goal = await StudyGoal.findOneAndUpdate({ _id: req.params.id, user: req.userId }, update, { new: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    return res.json(toClient(goal));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goal = await StudyGoal.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    return res.json({ message: 'Goal deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
