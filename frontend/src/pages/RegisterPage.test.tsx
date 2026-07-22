import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
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
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RegisterPage', () => {
  it('renders the register form when signed out', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    renderAt('/register');

    expect(screen.getByText('Create an account')).toBeInTheDocument();
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

    renderAt('/register');

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(
      screen.queryByText('Sign up to start managing the product catalog.')
    ).not.toBeInTheDocument();
  });
});
