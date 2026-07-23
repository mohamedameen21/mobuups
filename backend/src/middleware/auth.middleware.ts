import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required shape for Express type augmentation
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      refreshToken?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'You are unauthorized. Please log in.');
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      email: string;
    };
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'You are unauthorized. Please log in.');
  }
}

export async function requireRefreshToken(req: Request, res: Response, next: NextFunction) {
  const refreshToken =
    (req.cookies.refreshToken as string | undefined) ||
    (req.headers['x-refresh-token'] as string | undefined) ||
    (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined);

  if (!refreshToken) {
    res.clearCookie('refreshToken', { path: '/' });
    throw new AppError(401, 'UNAUTHORIZED', 'You are unauthorized. Please log in.');
  }

  const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } }).catch(() => {});
    }
    res.clearCookie('refreshToken', { path: '/' });
    throw new AppError(401, 'UNAUTHORIZED', 'You are unauthorized. Please log in.');
  }

  req.refreshToken = refreshToken;
  next();
}
