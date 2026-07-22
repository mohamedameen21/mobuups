import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

beforeEach(() => {
  mockUseAuth.mockReset();
});

describe('RegisterForm', () => {
  it('renders name, email, and password fields', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<RegisterForm />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();
  });

  it('shows a validation error for a name shorter than 2 characters', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
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

    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Ameen');
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid/i);
  });

  it('shows a validation error for a password shorter than 8 characters', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Ameen');
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short1');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('calls register with the entered values on valid submit', async () => {
    const registerFn = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: registerFn,
      logout: vi.fn(),
    });

    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Ameen');
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(registerFn).toHaveBeenCalledWith({
      name: 'Ameen',
      email: 'ameen@example.com',
      password: 'password123',
    });
  });

  it('shows the server error message when register rejects (e.g. duplicate email)', async () => {
    const registerFn = vi.fn().mockRejectedValue({
      response: { data: { error: { message: 'An account with this email already exists.' } } },
    });
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: registerFn,
      logout: vi.fn(),
    });

    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Ameen');
    await userEvent.type(screen.getByLabelText('Email'), 'taken@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(
      await screen.findByText('An account with this email already exists.')
    ).toBeInTheDocument();
  });

  it('shows a generic error message when the rejection has no error message', async () => {
    const registerFn = vi.fn().mockRejectedValue(new Error('network down'));
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticating: false,
      isInitializing: false,
      login: vi.fn(),
      register: registerFn,
      logout: vi.fn(),
    });

    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText('Name'), 'Ameen');
    await userEvent.type(screen.getByLabelText('Email'), 'ameen@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));

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

    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
  });
});
