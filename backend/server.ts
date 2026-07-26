import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import type { Request, Response, NextFunction } from 'express';
const documentRouter = require('./routes/documents/document.routes').default;
const folderRouter = require('./routes/folders/folder.routes').default;
const authRouter = require('./routes/auth/auth.routes').default;
import { connectDB } from './db';
import { apiLimiter } from './middleware/rateLimiter';
import { protect } from './middleware/auth';
import mongoose from 'mongoose';
const userRouter = require('./routes/user.routes').default;
import { initializeQueue, shutdownQueue, isQueueAvailable } from './services/queue/queue.service';
const statsRouter = require('./routes/stats/stats.routes').default;
import { startDocumentWorker, stopDocumentWorker } from './services/queue/document.worker';
// const settingsRouter = require('./routes/settings.routes').default;
const logger = require('./src/utils/logger').default;
import requestId from './src/middlewares/requestId';

const jobRouter = require('./routes/jobs/job.routes').default;
const aiRouter = require('./routes/ai/ai.routes').default;
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize BullMQ queue and worker
(async () => {
    await initializeQueue();
    startDocumentWorker();
})();

// Global middlewares
app.use(requestId);
// app.use(helmet({ crossOriginResourcePolicy: false, frameguard: false }));
app.use(compression());
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } } as any));
app.use(cors());
app.use(express.static('public'));

// Serve uploaded documents for mobile preview
app.use('/uploads', express.static('uploads'));

// Ensure JSON bodies are parsed properly
app.use(express.json());
app.use(apiLimiter);

// Health check
app.get('/health', async (req, res) => {
    // Database connection check
    const dbConnected = mongoose.connection.readyState === 1;

    // Storage (uploads folder) existence check
    const storageExists = await new Promise(resolve => {
        const fs = require('fs');
        fs.access('uploads', fs.constants.F_OK, (err: any) => resolve(!err));
    });

    // OCR availability (Google Vision credentials)
    const ocrAvailable = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Queue availability
    const queueAvailable = isQueueAvailable();

    const allGood = dbConnected && storageExists && ocrAvailable && queueAvailable;
    res.status(allGood ? 200 : 503).json({
        status: allGood ? 'ok' : 'degraded',
        checks: {
            database: dbConnected,
            storage: storageExists,
            ocr: ocrAvailable,
            queue: queueAvailable,
        },
    });
});

// Auth routes (no protection needed)
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/documents', protect, documentRouter);
app.use('/api/stats', statsRouter);
app.use('/api/folders', protect, folderRouter);
app.use('/api/jobs', protect, jobRouter);
app.use('/api/user', userRouter);
app.use('/api/ai', protect, aiRouter);


// // app.use('/api/settings', settingsRouter); // disabled for debugging // disabled temporarily

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal Server Error' });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────────────
async function gracefulShutdown(signal: string) {
    console.log(`\n${signal} received – shutting down gracefully...`);
    await stopDocumentWorker();
    await shutdownQueue();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
