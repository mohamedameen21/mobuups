import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  mockUseAuth.mockReset();
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>Protected Content</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  it('renders nothing while auth is still initializing', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/protected');

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders the unauthorized page when signed out', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/protected');

    expect(
      screen.getByText('You are unauthorized. Please log in to access this page.')
    ).toBeInTheDocument();
  });

  it('renders the protected content when signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Ameen', email: 'a@b.com' },
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/protected');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
