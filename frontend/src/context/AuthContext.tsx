import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, setAccessToken } from '../lib/api';
import type { AuthResponse, LoginInput, RegisterInput, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticating: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
    await api.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticating, login, register, logout }}>
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
