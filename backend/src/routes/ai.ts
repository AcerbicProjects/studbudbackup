import express, { Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { StudyDocument } from '../models/Document';
import { generate, generateJSON, AIConfigError, ChatTurn } from '../services/ai';

const router = express.Router();

router.param('id', (req, res, next, id) => {
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: 'Document not found' });
  }
  next();
});

// Keep prompts well inside the model context window
const MAX_CONTEXT_CHARS = 60000;

type Tool = 'summary' | 'flashcards' | 'quiz' | 'viva';
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SECTION_ICONS: Record<string, string> = {
  'Key Concepts': 'lightbulb-on-outline',
  Definitions: 'book-open-variant',
  'Important Points': 'alert-circle-outline',
  Examples: 'flask-outline',
  Takeaways: 'star-outline',
};

const notesBlock = (doc: any) =>
  `DOCUMENT TITLE: ${doc.title}\nSUBJECT: ${doc.subject}\n\nDOCUMENT TEXT:\n"""\n${(doc.text || '').slice(0, MAX_CONTEXT_CHARS)}\n"""`;

const SYSTEM =
  'You are StudyBuddy, an expert university tutor. Base everything strictly on the student\'s document. ' +
  'Be accurate, clear and exam-focused. Reply with valid JSON only, matching the requested schema exactly.';

const difficulty = (d: any) => (DIFFICULTIES.includes(d) ? d : 'medium');

// Each builder asks for JSON and then normalises it into the exact shape the app renders
const builders: Record<Tool, (doc: any) => Promise<any>> = {
  summary: async (doc) => {
    const raw = await generateJSON<any>(
      SYSTEM,
      `${notesBlock(doc)}\n\nCreate a revision summary. Return:
{"overview": "3-4 sentence overview",
 "sections": [{"title": "Key Concepts" | "Definitions" | "Important Points" | "Examples" | "Takeaways", "points": ["..."]}],
 "formulas": [{"title": "...", "formula": "...", "note": "short note"}]}
Include all five sections in that order with 3-6 concise points each. Formulas: only ones that appear in or follow directly from the document (empty array if none).`
    );
    const sections = (raw.sections || []).map((s: any, i: number) => ({
      id: `s${i + 1}`,
      title: String(s.title || 'Notes'),
      icon: SECTION_ICONS[s.title] || 'note-text-outline',
      points: (s.points || []).map(String).filter(Boolean),
    }));
    const formulas = (raw.formulas || []).map((f: any, i: number) => ({
      id: `f${i + 1}`,
      title: String(f.title || 'Formula'),
      formula: String(f.formula || ''),
      note: String(f.note || ''),
    })).filter((f: any) => f.formula);
    const words = (doc.text || '').split(/\s+/).length;
    return {
      overview: String(raw.overview || ''),
      readTime: `${Math.max(1, Math.round(words / 220))} min read`,
      sections,
      formulas,
    };
  },

  flashcards: async (doc) => {
    const raw = await generateJSON<any>(
      SYSTEM,
      `${notesBlock(doc)}\n\nCreate 12 active-recall flashcards covering the most important material. Return:
{"flashcards": [{"front": "question or term", "back": "concise answer (1-3 sentences)", "difficulty": "easy" | "medium" | "hard"}]}`
    );
    return (raw.flashcards || []).map((c: any, i: number) => ({
      id: `c${i + 1}`,
      front: String(c.front || ''),
      back: String(c.back || ''),
      difficulty: difficulty(c.difficulty),
      bookmarked: false,
    })).filter((c: any) => c.front && c.back);
  },

  quiz: async (doc) => {
    const raw = await generateJSON<any>(
      SYSTEM,
      `${notesBlock(doc)}\n\nCreate a 10-question exam-style quiz: 6 "mcq", 2 "truefalse", 2 "short". Mix difficulties. Return:
{"questions": [{"type": "mcq" | "truefalse" | "short", "difficulty": "easy" | "medium" | "hard", "question": "...",
  "options": ["A", "B", "C", "D"], "correctAnswer": "...", "explanation": "1-2 sentences"}]}
Rules: mcq has exactly 4 options without letter prefixes, and correctAnswer is copied exactly from options. truefalse options are ["True", "False"].
short has no options and correctAnswer is a single word or number.`
    );
    // The app draws its own A-D labels, so drop any "A) " / "B." the model adds
    const stripLabel = (s: any) => String(s ?? '').replace(/^\s*[A-Da-d][).:]\s+/, '').trim();
    const questions = (raw.questions || []).map((q: any, i: number) => {
      const type = ['mcq', 'truefalse', 'short'].includes(q.type) ? q.type : 'mcq';
      const options = type === 'truefalse' ? ['True', 'False'] : type === 'mcq' ? (q.options || []).map(stripLabel) : undefined;
      let correctAnswer = stripLabel(q.correctAnswer);
      // Some answers come back as just the letter
      if (options && /^[A-D]$/i.test(correctAnswer)) {
        correctAnswer = options['ABCD'.indexOf(correctAnswer.toUpperCase())] ?? correctAnswer;
      }
      return {
        id: `q${i + 1}`,
        type,
        difficulty: difficulty(q.difficulty),
        question: String(q.question || ''),
        ...(options ? { options } : {}),
        correctAnswer,
        explanation: String(q.explanation || ''),
      };
    }).filter((q: any) =>
      q.question && q.correctAnswer && (q.type === 'short' || q.options.includes(q.correctAnswer))
    );
    return { totalTimeSeconds: questions.length * 60, questions };
  },

  viva: async (doc) => {
    const raw = await generateJSON<any>(
      SYSTEM,
      `${notesBlock(doc)}\n\nCreate 8 viva (oral exam) questions an examiner would ask about this document, from basic to probing. Return:
{"questions": [{"question": "...", "answer": "model answer, 2-4 sentences", "difficulty": "easy" | "medium" | "hard"}]}`
    );
    return (raw.questions || []).map((q: any, i: number) => ({
      id: `v${i + 1}`,
      question: String(q.question || ''),
      answer: String(q.answer || ''),
      difficulty: difficulty(q.difficulty),
      bookmarked: false,
    })).filter((q: any) => q.question && q.answer);
  },
};

const findDoc = (req: AuthenticatedRequest) =>
  StudyDocument.findOne({ _id: req.params.id, user: req.userId });

const sendError = (res: Response, err: any) => {
  console.error('[AI]', err.message);
  if (err instanceof AIConfigError) {
    return res.status(503).json({ message: err.message });
  }
  return res.status(502).json({ message: 'The AI could not answer right now. Please try again.' });
};

// GET /api/ai/:id/:tool   (?refresh=1 regenerates)
router.get('/:id/:tool', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const tool = req.params.tool as Tool;
  if (!(tool in builders)) {
    return res.status(404).json({ message: 'Unknown AI tool' });
  }
  try {
    const doc: any = await findDoc(req);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const cached = doc.ai?.[tool];
    if (cached && req.query.refresh !== '1') {
      return res.json(cached);
    }

    const result = await builders[tool](doc);
    doc.set(`ai.${tool}`, result);
    await doc.save();
    return res.json(result);
  } catch (err: any) {
    return sendError(res, err);
  }
});

// POST /api/ai/:id/chat   { message, history: [{role, text}] }
router.post('/:id/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const doc: any = await findDoc(req);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const history: ChatTurn[] = (Array.isArray(req.body.history) ? req.body.history : [])
      .filter((t: any) => (t.role === 'user' || t.role === 'ai') && typeof t.text === 'string')
      .slice(-12);

    // Gemini requires the conversation to start with a user turn
    while (history.length && history[0].role !== 'user') history.shift();

    const reply = await generate({
      system:
        'You are StudyBuddy, a friendly and precise university tutor. Answer the student\'s questions using their document below. ' +
        'Quote or point to the relevant part of the notes when helpful. If the answer is not in the document, say so briefly and then ' +
        'answer from general knowledge, clearly marked. Use short paragraphs, bullet lists and **bold** key terms (Markdown). ' +
        'Write formulas inline with backticks.\n\n' + notesBlock(doc),
      turns: [...history, { role: 'user', text: message }],
    });

    return res.json({ reply: reply.trim() });
  } catch (err: any) {
    return sendError(res, err);
  }
});

// POST /api/ai/:id/quiz-feedback   { results: [{question, yourAnswer, correctAnswer, correct}] }
router.post('/:id/quiz-feedback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc: any = await findDoc(req);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const results = (Array.isArray(req.body.results) ? req.body.results : []).slice(0, 30);
    const lines = results.map((r: any, i: number) =>
      `${i + 1}. ${r.question}\n   Student: ${r.yourAnswer ?? '(no answer)'} | Correct: ${r.correctAnswer} | ${r.correct ? 'RIGHT' : 'WRONG'}`
    ).join('\n');

    const feedback = await generate({
      system: 'You are an encouraging but honest tutor. Write plain text, no Markdown, 3-4 sentences.',
      turns: [{
        role: 'user',
        text: `The student just took a quiz on "${doc.title}". Results:\n${lines}\n\nGive feedback: what they did well, which topics to revise (name them), and one concrete next step.`,
      }],
    });

    // The score itself is recorded by POST /documents/:id/quiz-attempt, so it is kept even when the AI is down
    return res.json({ feedback: feedback.trim() });
  } catch (err: any) {
    return sendError(res, err);
  }
});

export default router;
