import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './lib/errors.js';
import { sendError } from './lib/response.js';
import { authRouter } from './modules/auth/auth.routes.js';

export const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Product Store API (TypeScript)' });
});

app.use('/api/auth', authRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }
  if (err instanceof ZodError) {
    sendError(res, 400, 'VALIDATION_ERROR', err.issues[0]?.message ?? 'Invalid input.');
    return;
  }
  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
});
