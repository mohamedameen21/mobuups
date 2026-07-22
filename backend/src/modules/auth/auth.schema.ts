import { z } from 'zod';

// .toLowerCase() so "User@Example.com" and "user@example.com" are treated as
// the same account - the unique constraint on User.email is case-sensitive,
// so without this two registers with different casing would create duplicates.
const email = z.email().toLowerCase().max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
