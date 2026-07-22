import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface AccessTokenPayload {
  sub: string;
  email: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

function toPublicUser(user: UserRecord) {
  return { id: user.id, name: user.name, email: user.email };
}

function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
  });
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user: UserRecord) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const refreshToken = randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  return { user: toPublicUser(user), ...(await issueTokens(user)) };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  return { user: toPublicUser(user), ...(await issueTokens(user)) };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    throw new AppError(401, 'NO_REFRESH_TOKEN', 'No refresh token provided.');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.');
  }

  // Single-use: this token is spent whether it turns out expired or valid.
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  if (stored.expiresAt < new Date()) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.');
  }

  return { user: toPublicUser(stored.user), ...(await issueTokens(stored.user)) };
}

export async function revokeRefreshToken(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
}
