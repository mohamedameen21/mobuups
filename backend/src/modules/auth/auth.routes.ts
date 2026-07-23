import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout } from './auth.controller.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireRefreshToken } from '../../middleware/auth.middleware.js';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'test' ? 1000 : 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    meta: null,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

authRouter.post('/register', authLimiter, asyncHandler(register));
authRouter.post('/login', authLimiter, asyncHandler(login));
authRouter.post('/refresh', asyncHandler(requireRefreshToken), asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
