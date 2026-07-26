// backend/middleware/multerConfig.ts
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';


// Store files on disk in a temporary uploads folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.resolve('uploads'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${randomUUID()}${ext}`;

        cb(null, filename);
    },
});

// File filter to allow only images (jpeg, png, gif) and optionally PDFs for avatars
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = /\.(jpg|jpeg|png|gif)$/i;
    if (allowed.test(file.originalname)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpg, jpeg, png, gif)'));
    }
};

export const multerConfig = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});
