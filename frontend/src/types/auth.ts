// Shared types for the auth module - mirrors what the backend's
// auth.schema.ts / auth.controller.ts actually send and expect.

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// Matches the { success, data, error } envelope every backend response uses
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta: Record<string, unknown> | null;
  error: { code: string; message: string; details?: unknown } | null;
}
