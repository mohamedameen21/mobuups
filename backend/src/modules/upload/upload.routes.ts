import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { uploadMiddleware, uploadImage } from './upload.controller.js';

export const uploadRouter = Router();

uploadRouter.post(
  '/',
  requireAuth,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  },
  asyncHandler(uploadImage)
);
