import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/ai';
import goalRoutes from './routes/goals';
import { isAIConfigured } from './services/ai';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/goals', goalRoutes);
// Upload configs write to backend/uploads (relative to src/config), so serve that folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', aiConfigured: isAIConfigured(), timestamp: new Date() });
});

// Root landing page
app.get('/', (req, res) => {
  res.send('StudyBuddy backend API server is online');
});

// Return JSON for upload errors (wrong file type, too large) instead of an HTML page
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 20MB).' : err.message;
    return res.status(400).json({ message });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'Request failed' });
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] StudyBuddy backend server running on http://localhost:${PORT}`);
  if (!isAIConfigured()) {
    console.warn('[AI] No GEMINI_API_KEY or GROQ_API_KEY in .env: AI tools will return a setup message.');
  }
});
