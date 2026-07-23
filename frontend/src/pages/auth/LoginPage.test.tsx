import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
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
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  it('renders the login form when signed out', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/login');

    expect(screen.getByText('Welcome back - enter your details to continue.')).toBeInTheDocument();
  });

  it('shows the demo user hint', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/login');

    expect(screen.getByText('demouser@gmail.com')).toBeInTheDocument();
  });

  it('redirects to home when already signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', name: 'Ameen', email: 'a@b.com' },
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/login');

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Welcome back - enter your details to continue.')
    ).not.toBeInTheDocument();
  });
});
