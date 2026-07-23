import { Router } from 'express';
import { register, login, refresh, logout } from './auth.controller.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireRefreshToken } from '../../middleware/auth.middleware.js';

export const authRouter = Router();

authRouter.post('/register', asyncHandler(register));
authRouter.post('/login', asyncHandler(login));
authRouter.post('/refresh', asyncHandler(requireRefreshToken), asyncHandler(refresh));
authRouter.post('/logout', asyncHandler(logout));
