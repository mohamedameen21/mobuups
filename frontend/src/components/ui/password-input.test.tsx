import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from './password-input';

describe('PasswordInput', () => {
  it('renders as a password field by default', () => {
    render(<PasswordInput aria-label="password-field" />);

    expect(screen.getByLabelText('password-field')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
  });

  it('reveals the value as plain text when the toggle is clicked', async () => {
    render(<PasswordInput aria-label="password-field" />);

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));

    expect(screen.getByLabelText('password-field')).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
  });

  it('toggles back to hidden on a second click', async () => {
    render(<PasswordInput aria-label="password-field" />);

    const toggle = () => screen.getByRole('button', { name: /password/ });
    await userEvent.click(toggle());
    await userEvent.click(toggle());

    expect(screen.getByLabelText('password-field')).toHaveAttribute('type', 'password');
  });
});
