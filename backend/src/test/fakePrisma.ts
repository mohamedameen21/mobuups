import { vi } from 'vitest';

interface FakeUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FakeRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export function createFakePrisma() {
  const users = new Map<string, FakeUser>();
  const refreshTokens = new Map<string, FakeRefreshToken>();
  let idCounter = 0;
  const nextId = () => `id-${++idCounter}`;

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return [...users.values()].find((u) => u.email === where.email) ?? null;
        }
        if (where.id) {
          return users.get(where.id) ?? null;
        }
        return null;
      }),
      create: vi.fn(
        async ({ data }: { data: { email: string; passwordHash: string; name: string } }) => {
          const user: FakeUser = {
            id: nextId(),
            email: data.email,
            passwordHash: data.passwordHash,
            name: data.name,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(user.id, user);
          return user;
        }
      ),
    },
    refreshToken: {
      create: vi.fn(
        async ({ data }: { data: { tokenHash: string; userId: string; expiresAt: Date } }) => {
          const row: FakeRefreshToken = {
            id: nextId(),
            tokenHash: data.tokenHash,
            userId: data.userId,
            expiresAt: data.expiresAt,
            createdAt: new Date(),
          };
          refreshTokens.set(row.id, row);
          return row;
        }
      ),
      findUnique: vi.fn(
        async ({
          where,
          include,
        }: {
          where: { tokenHash: string };
          include?: { user?: boolean };
        }) => {
          const row = [...refreshTokens.values()].find((t) => t.tokenHash === where.tokenHash);
          if (!row) return null;
          if (include?.user) {
            return { ...row, user: users.get(row.userId) ?? null };
          }
          return row;
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        refreshTokens.delete(where.id);
      }),
      deleteMany: vi.fn(async ({ where }: { where: { tokenHash: string } }) => {
        for (const [id, row] of refreshTokens) {
          if (row.tokenHash === where.tokenHash) refreshTokens.delete(id);
        }
      }),
    },
  };

  return {
    prisma,
    reset() {
      users.clear();
      refreshTokens.clear();
      idCounter = 0;
      vi.clearAllMocks();
    },
    setTokenExpiry(tokenId: string, expiresAt: Date) {
      const row = refreshTokens.get(tokenId);
      if (row) row.expiresAt = expiresAt;
    },
    getRefreshTokenRows() {
      return [...refreshTokens.values()];
    },
  };
}
