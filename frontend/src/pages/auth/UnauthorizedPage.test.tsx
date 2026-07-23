import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '@/context/AuthContext';
import { UnauthorizedPage } from './UnauthorizedPage';

describe('UnauthorizedPage', () => {
  it('renders unauthorized messaging and navigation links', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <UnauthorizedPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(
      screen.getByText('You are unauthorized. Please log in to access this page.')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Log in/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Sign up/i })[0]).toBeInTheDocument();
  });
});
