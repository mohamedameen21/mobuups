import type { Response } from 'express';

export function sendSuccess<T>(res: Response, status: number, data: T) {
  res.status(status).json({ success: true, data, meta: null, error: null });
}

export function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ success: false, data: null, meta: null, error: { code, message } });
}
