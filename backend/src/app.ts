import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { AppError } from './lib/errors.js';
import { logError } from './lib/logger.js';
import { sendError } from './lib/response.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import fs from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import { uploadRouter } from './modules/upload/upload.routes.js';

const swaggerSpec = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/swagger.json'), 'utf8')
);

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Product Store API (TypeScript)' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/swagger.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/upload', uploadRouter);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    logError({
      method: req.method,
      path: req.originalUrl,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }
  if (err instanceof ZodError) {
    const message = err.issues[0]?.message ?? 'Invalid input.';
    logError({
      method: req.method,
      path: req.originalUrl,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message,
    });
    sendError(res, 400, 'VALIDATION_ERROR', message);
    return;
  }
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    logError({
      method: req.method,
      path: req.originalUrl,
      statusCode: 400,
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON.',
    });
    sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON.');
    return;
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  const stack = err instanceof Error ? err.stack : undefined;
  logError({
    method: req.method,
    path: req.originalUrl,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    message,
    stack,
  });
  console.error(err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
});
