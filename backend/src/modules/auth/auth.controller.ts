import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser, refreshSession } from './auth.service.js';
import { sendSuccess } from '../../lib/response.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // keep in sync with JWT_REFRESH_EXPIRES

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await registerUser(input);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 201, { user, accessToken });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await loginUser(input);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const incomingToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
  const { user, accessToken, refreshToken } = await refreshSession(incomingToken);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { user, accessToken });
}

export function logout(_req: Request, res: Response) {
  clearRefreshCookie(res);
  sendSuccess(res, 200, null);
}
