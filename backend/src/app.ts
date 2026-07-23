import path from 'node:path';
import { createHash } from 'node:crypto';
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
// Swagger UI's generated init file embeds the API specification. Give that
// file a content-based URL so a proxy/CDN cannot keep serving an older spec
// after a deployment.
const swaggerSpecVersion = createHash('sha256').update(JSON.stringify(swaggerSpec)).digest('hex').slice(0, 12);
const swaggerHtml = swaggerUi
  .generateHTML(swaggerSpec)
  .replace('./swagger-ui-init.js', `./swagger-ui-init.js?v=${swaggerSpecVersion}`);

export const app = express();

// Coolify/Nginx terminates the public connection before forwarding to Express.
// Trust that single proxy hop so express-rate-limit uses the real client IP.
app.set('trust proxy', 1);

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

const serveSwaggerHtml = (_req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.type('html').send(swaggerHtml);
};

app.get(['/docs', '/docs/'], serveSwaggerHtml);
app.get(['/api/docs', '/api/docs/'], serveSwaggerHtml);
app.use('/docs', swaggerUi.serveFiles(swaggerSpec));
app.use('/api/docs', swaggerUi.serveFiles(swaggerSpec));
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
