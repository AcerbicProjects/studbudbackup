import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { isValidObjectId } from 'mongoose';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { StudyDocument } from '../models/Document';
import { User, GENERAL_SUBJECT } from '../models/User';
import { uploadDocument, documentDir } from '../config/documentUpload';
import { extractText } from '../services/extract';
import { generateJSON, isAIConfigured } from '../services/ai';

const router = express.Router();

// Malformed ids would otherwise surface as Mongoose cast errors (500)
router.param('id', (req, res, next, id) => {
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Document not found' });
  }
  next();
});

// The user's own subject folders plus the catch-all
const getUserSubjects = async (userId?: string): Promise<string[]> => {
  const user = await User.findById(userId).select('subjects');
  return [...(user?.subjects || []), GENERAL_SUBJECT];
};

const percent = (a: { correct: number; total: number }) => (a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0);

// Shape sent to the app: never ship the full text or cached AI output in lists
const toClient = (doc: any, req: AuthenticatedRequest) => {
  const attempts: { correct: number; total: number; takenAt: Date }[] = doc.quizAttempts || [];
  const last = attempts[attempts.length - 1];
  return {
    _id: doc._id,
    title: doc.title,
    subject: doc.subject,
    source: doc.source,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    pages: doc.pages,
    favorite: doc.favorite,
    progress: doc.progress,
    studySeconds: doc.studySeconds,
    lastOpened: doc.lastOpened,
    createdAt: doc.createdAt,
    textLength: (doc.text || '').length,
    quizCount: attempts.length,
    lastQuizScore: last ? percent(last) : null,
    bestQuizScore: attempts.length ? Math.max(...attempts.map(percent)) : null,
    lastQuizAt: last ? last.takenAt : null,
    fileUrl: `${req.protocol}://${req.get('host')}/uploads/documents/${doc.fileName}`,
  };
};

const removeFile = (fileName: string) => {
  const filePath = path.join(documentDir, fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Best-effort: let the AI pick a subject (and a title for scans) from the extracted text
const classify = async (text: string, subjects: string[], needsSubject: boolean, needsTitle: boolean) => {
  if (!isAIConfigured() || text.length < 20 || (!needsSubject && !needsTitle)) return null;
  const fields = [needsSubject && '"subject": "..."', needsTitle && '"title": "..."'].filter(Boolean).join(', ');
  try {
    return await generateJSON<{ title?: string; subject?: string }>(
      'You label student study documents. Reply with JSON only.',
      (needsSubject ? `Pick the best subject for these notes from: ${subjects.join(', ')}. ` : '') +
        (needsTitle ? 'Write a short descriptive title (max 6 words). ' : '') +
        `Return {${fields}}.\n\nNOTES:\n${text.slice(0, 4000)}`,
      // Labelling is a nice-to-have: never hold up an upload for long
      15000
    );
  } catch (err: any) {
    console.error('[DOCS] Classification failed:', err.message);
    return null;
  }
};

// GET /api/documents
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const filter: any = { user: req.userId };
    if (req.query.source === 'scan' || req.query.source === 'upload') {
      filter.source = req.query.source;
    }
    const docs = await StudyDocument.find(filter).select('-text -ai').sort({ lastOpened: -1 });
    return res.json(docs.map((d) => toClient(d, req)));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await StudyDocument.findOne({ _id: req.params.id, user: req.userId }).select('-ai');
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.lastOpened = new Date();
    await doc.save();

    return res.json({ ...toClient(doc, req), textPreview: (doc.text || '').slice(0, 1500) });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/documents
// multipart: file (PDF, image or text), optional pages[] (page photos of a scanned PDF, used
// for OCR only), title, subject, source
router.post(
  '/',
  authenticateToken,
  uploadDocument.fields([{ name: 'file', maxCount: 1 }, { name: 'pages', maxCount: 30 }]),
  async (req: AuthenticatedRequest, res: Response) => {
    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const file = files.file?.[0];
    const pageImages = files.pages || [];
    // Page photos are only needed to read the text; the PDF is what gets kept
    const cleanupPages = () => pageImages.forEach((p) => removeFile(p.filename));

    if (!file) {
      cleanupPages();
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const source = req.body.source === 'scan' ? 'scan' : 'upload';
      const { text, pages } = await extractText(file.path, file.mimetype, pageImages);
      cleanupPages();

      if (!text) {
        removeFile(file.filename);
        return res.status(422).json({
          message: source === 'scan'
            ? 'No readable text found. Try again with better lighting and the page filling the frame.'
            : 'No readable text found in this file.',
        });
      }

      // Android pickers can hand over URL-encoded names ("Lecture%207.pdf")
      let originalName = file.originalname;
      try {
        originalName = decodeURIComponent(originalName);
      } catch {
        // not encoded
      }
      const baseName = originalName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

      const subjects = await getUserSubjects(req.userId);
      const requestedTitle = (req.body.title || '').trim();
      const requestedSubject = subjects.includes(req.body.subject) ? req.body.subject : '';

      const label = await classify(text, subjects, !requestedSubject, source === 'scan' && !requestedTitle);
      const subject = requestedSubject || (label?.subject && subjects.includes(label.subject) ? label.subject : GENERAL_SUBJECT);
      const title = requestedTitle
        || (source === 'scan' ? label?.title || `Scan ${new Date().toLocaleDateString('en-GB')}` : baseName || 'Untitled');

      const doc = await StudyDocument.create({
        user: req.userId,
        title,
        subject,
        source,
        originalName,
        mimeType: file.mimetype,
        size: file.size,
        pages,
        fileName: file.filename,
        text,
      });

      return res.status(201).json(toClient(doc, req));
    } catch (err: any) {
      removeFile(file.filename);
      cleanupPages();
      console.error('[DOCS] Upload failed:', err);
      return res.status(500).json({ message: err.message || 'Failed to process document' });
    }
  }
);

// PATCH /api/documents/:id
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await StudyDocument.findOne({ _id: req.params.id, user: req.userId }).select('-text -ai');
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const { title, subject, favorite, progress, addStudySeconds } = req.body;
    if (typeof title === 'string' && title.trim()) doc.title = title.trim();
    if (typeof subject === 'string' && (await getUserSubjects(req.userId)).includes(subject)) doc.subject = subject;
    if (typeof favorite === 'boolean') doc.favorite = favorite;
    if (typeof progress === 'number') doc.progress = Math.max(0, Math.min(100, Math.round(progress)));
    if (typeof addStudySeconds === 'number' && addStudySeconds > 0) doc.studySeconds += Math.round(addStudySeconds);

    await doc.save();
    return res.json(toClient(doc, req));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/documents/:id/quiz-attempt  { correct, total }
router.post('/:id/quiz-attempt', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const correct = Number(req.body.correct);
    const total = Number(req.body.total);
    if (!Number.isInteger(total) || total < 1 || !Number.isInteger(correct) || correct < 0 || correct > total) {
      return res.status(400).json({ message: 'Invalid quiz result' });
    }

    const doc: any = await StudyDocument.findOne({ _id: req.params.id, user: req.userId }).select('-text -ai');
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    doc.quizAttempts.push({ correct, total, takenAt: new Date() });
    // Coverage reflects the best quiz result so far
    doc.progress = Math.max(doc.progress || 0, percent({ correct, total }));
    await doc.save();

    return res.status(201).json(toClient(doc, req));
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await StudyDocument.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    removeFile(doc.fileName);
    return res.json({ message: 'Document deleted' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
