import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setAccessToken } from '../lib/api';
import type { AuthResponse, LoginInput, RegisterInput, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticating: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .post<{ data: AuthResponse }>('/auth/refresh')
      .then((res) => {
        if (cancelled) return;
        setAccessToken(res.data.data.accessToken);
        setUser(res.data.data.user);
      })
      .catch(() => {
        // No valid refresh cookie yet (first visit, expired session, etc.) - stay signed out
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(input: LoginInput) {
    setIsAuthenticating(true);
    try {
      const res = await api.post<{ data: AuthResponse }>('/auth/login', input);
      setAccessToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function register(input: RegisterInput) {
    setIsAuthenticating(true);
    try {
      const res = await api.post<{ data: AuthResponse }>('/auth/register', input);
      setAccessToken(res.data.data.accessToken);
      setUser(res.data.data.user);
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticating, isInitializing, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
