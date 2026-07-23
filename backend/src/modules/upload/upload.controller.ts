import path from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '../../lib/errors.js';
import { sendSuccess } from '../../lib/response.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only image files (JPG, PNG, WEBP, GIF, SVG) are allowed.'));
    }
  },
}).single('image');

export async function uploadImage(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, 'NO_FILE_UPLOADED', 'No image file provided in request field "image".');
  }

  const url = `/uploads/${req.file.filename}`;
  sendSuccess(res, 201, { url, filename: req.file.filename, size: req.file.size });
}
