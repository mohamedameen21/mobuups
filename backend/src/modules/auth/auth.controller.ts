import type { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser, refreshSession, revokeRefreshToken } from './auth.service.js';
import { sendSuccess } from '../../lib/response.js';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // keep in sync with REFRESH_TOKEN_TTL_MS in auth.service.ts

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await registerUser(input);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 201, { user, accessToken, refreshToken });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await loginUser(input);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { user, accessToken, refreshToken });
}

export async function refresh(req: Request, res: Response) {
  const incomingToken = req.refreshToken;
  const { user, accessToken, refreshToken } = await refreshSession(incomingToken);
  setRefreshCookie(res, refreshToken);
  sendSuccess(res, 200, { user, accessToken, refreshToken });
}

export async function logout(req: Request, res: Response) {
  const incomingToken =
    (req.cookies[REFRESH_COOKIE_NAME] as string | undefined) ||
    (req.headers['x-refresh-token'] as string | undefined) ||
    (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined);

  await revokeRefreshToken(incomingToken);
  clearRefreshCookie(res);
  sendSuccess(res, 200, null);
}
