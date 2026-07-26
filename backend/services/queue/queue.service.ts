// backend/services/queue/queue.service.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ── Redis Connection ───────────────────────────────────────────────────────────
let connection: IORedis | null = null;
let documentQueue: Queue | null = null;
let redisAvailable = false;

export function getRedisConnection(): IORedis | null {
    return connection;
}

export function isQueueAvailable(): boolean {
    return redisAvailable;
}

export async function initializeQueue(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
        connection = new IORedis(redisUrl, {
            maxRetriesPerRequest: null, // required by BullMQ
            enableReadyCheck: false,
            lazyConnect: true,          // don't connect until we call .connect()
            retryStrategy: (times: number) => {
                if (times > 3) {
                    console.warn('⚠️  Redis connection failed after 3 attempts – queue disabled');
                    return null; // stop retrying
                }
                return Math.min(times * 500, 3000);
            },
        });

        // CRITICAL: attach error handler immediately to prevent unhandled error crashes
        connection.on('error', (err) => {
            // Silently swallow – we already handle via the ready/connect flow
        });

        // Attempt connection with timeout
        await Promise.race([
            connection.connect(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
            ),
        ]);

        documentQueue = new Queue('document-processing', {
            connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: { count: 100 },
                removeOnFail: { count: 500 }, // keep for DLQ analysis
            },
        });

        redisAvailable = true;
        console.log('✅ BullMQ queue initialized (Redis connected)');
    } catch (err) {
        console.warn('⚠️  Redis not available – background processing disabled.', (err as Error).message);
        redisAvailable = false;
        // Properly disconnect instead of leaving zombie connection
        if (connection) {
            try { connection.disconnect(); } catch { /* ignore */ }
        }
        connection = null;
        documentQueue = null;
    }
}

// ── Job Types ──────────────────────────────────────────────────────────────────
export interface DocumentJobData {
    documentId: string;
    ownerId: string;
    filePath: string;
    mimeType: string;
    jobRecordId: string; // MongoDB Job _id
}

// ── Add Job ────────────────────────────────────────────────────────────────────
export async function addDocumentJob(data: DocumentJobData): Promise<string | null> {
    if (!documentQueue || !redisAvailable) {
        console.warn('⚠️  Queue not available – cannot enqueue job');
        return null;
    }

    const job = await documentQueue.add('process-document', data, {
        jobId: `doc-${data.documentId}-${Date.now()}`,
    });

    console.log(`📋 Enqueued document processing job: ${job.id}`);
    return job.id || null;
}

// ── Shutdown ───────────────────────────────────────────────────────────────────
export async function shutdownQueue(): Promise<void> {
    if (documentQueue) {
        await documentQueue.close();
    }
    if (connection) {
        await connection.quit();
    }
    console.log('🛑 Queue and Redis connection closed');
}

export { documentQueue };
