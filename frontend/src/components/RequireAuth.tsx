import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isInitializing } = useAuth();

  if (isInitializing) return null;

  if (!user) {
    return <UnauthorizedPage />;
  }

  return children;
}
