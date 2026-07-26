// src/utils/logger.ts
import winston from 'winston';

const { combine, timestamp, printf, json, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: [
        new winston.transports.Console({
            format: combine(timestamp(), logFormat),
        }),
        // Add file transport if needed
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    ],
});

// Stream for morgan
logger.stream = {
    write: (message: string) => {
        // Morgan adds a newline at the end of each line
        logger.info(message.trim());
    },
} as any;

export default logger;
