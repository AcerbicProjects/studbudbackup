import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Root landing page
app.get('/', (req, res) => {
  res.send('StudyBuddy backend API server is online');
});

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] StudyBuddy backend server running on http://localhost:${PORT}`);
});
