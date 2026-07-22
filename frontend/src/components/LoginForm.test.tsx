import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  mockUseAuth.mockReset();
});

describe('LoginForm', () => {
  it('renders the email and password fields', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid/i);
  });

  it('shows a validation error when the password is empty', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('calls login with the entered values on valid submit', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(login).toHaveBeenCalledWith({ email: 'ameen@example.com', password: 'password123' });
  });

  it('shows the server error message when login rejects', async () => {
    const login = vi.fn().mockRejectedValue({
      response: { data: { error: { message: 'Incorrect email or password.' } } },
    });
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
  });

  it('shows a generic error message when the rejection has no error message', async () => {
    const login = vi.fn().mockRejectedValue(new Error('network down'));
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('disables the submit button and shows a loading label while authenticating', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: true,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<LoginForm />);

    const button = screen.getByRole('button', { name: 'Logging in...' });
    expect(button).toBeDisabled();
  });
});
