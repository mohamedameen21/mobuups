import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- required shape for Express type augmentation
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header.');
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
    throw new AppError(401, 'UNAUTHORIZED', 'Access token is invalid or expired.');
  }
}
