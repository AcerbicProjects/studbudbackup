import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const documentDir = path.join(__dirname, '../../uploads/documents');

// Ensure upload directory exists
if (!fs.existsSync(documentDir)) {
  fs.mkdirSync(documentDir, { recursive: true });
}

const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file. Please upload a PDF, an image or a text file.'));
  }
};

export const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: fileFilter
});
