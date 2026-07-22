import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from '../types/auth';
import { AuthProvider, useAuth } from './AuthContext';

const mockPost = vi.fn();
const mockSetAccessToken = vi.fn();
let capturedOnUserRefreshed: ((user: User) => void) | null = null;

vi.mock('../lib/api', () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
  setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
  setOnUserRefreshed: (callback: ((user: User) => void) | null) => {
    capturedOnUserRefreshed = callback;
  },
}));

function Harness() {
  const { user, isAuthenticating, isInitializing, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'none'}</div>
      <div data-testid="initializing">{String(isInitializing)}</div>
      <div data-testid="authenticating">{String(isAuthenticating)}</div>
      <button onClick={() => login({ email: 'a@b.com', password: 'pw' }).catch(() => {})}>
        login
      </button>
      <button
        onClick={() => register({ name: 'A', email: 'a@b.com', password: 'pw' }).catch(() => {})}
      >
        register
      </button>
      <button onClick={() => logout().catch(() => {})}>logout</button>
    </div>
  );
}

function renderHarness() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>
  );
}

const demoUser: User = { id: '1', name: 'Ameen', email: 'ameen@example.com' };

beforeEach(() => {
  mockPost.mockReset();
  mockSetAccessToken.mockReset();
  capturedOnUserRefreshed = null;
});

describe('mount behavior', () => {
  it('restores the session when the silent refresh succeeds', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { accessToken: 'tok', user: demoUser } } });

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('Ameen');
    expect(mockSetAccessToken).toHaveBeenCalledWith('tok');
  });

  it('stays signed out when the silent refresh fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('no cookie'));

    renderHarness();

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('ignores the refresh result if the component unmounts before it resolves', async () => {
    let resolveRefresh!: (value: { data: { data: { accessToken: string; user: User } } }) => void;
    mockPost.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      })
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHarness();
    unmount();

    await act(async () => {
      resolveRefresh({ data: { data: { accessToken: 'tok', user: demoUser } } });
    });

    // No "state update on an unmounted component" (or similar) React warnings.
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});

describe('login', () => {
  it('sets the user and access token on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { accessToken: 'boot', user: null } } });
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    mockPost.mockResolvedValueOnce({ data: { data: { accessToken: 'tok', user: demoUser } } });
    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ameen'));
    expect(mockSetAccessToken).toHaveBeenCalledWith('tok');
  });

  it('resets isAuthenticating even when login fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('boot fail'));
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    mockPost.mockRejectedValueOnce({
      response: { data: { error: { message: 'Incorrect email or password.' } } },
    });
    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('authenticating')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });
});

describe('register', () => {
  it('sets the user and access token on success', async () => {
    mockPost.mockRejectedValueOnce(new Error('boot fail'));
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    mockPost.mockResolvedValueOnce({ data: { data: { accessToken: 'tok', user: demoUser } } });
    await userEvent.click(screen.getByText('register'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ameen'));
  });
});

describe('logout', () => {
  it('clears user and access token on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { accessToken: 'tok', user: demoUser } } });
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ameen'));

    mockPost.mockResolvedValueOnce({ data: null });
    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(mockSetAccessToken).toHaveBeenCalledWith(null);
  });

  it('still clears local state even when the logout request fails', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: { accessToken: 'tok', user: demoUser } } });
    renderHarness();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ameen'));

    mockPost.mockRejectedValueOnce(new Error('network error'));
    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(mockSetAccessToken).toHaveBeenCalledWith(null);
  });
});

describe('background refresh sync', () => {
  it('registers setUser as the onUserRefreshed callback so a silent interceptor refresh updates the UI', async () => {
    mockPost.mockRejectedValueOnce(new Error('boot fail'));
    renderHarness();
    await waitFor(() => expect(capturedOnUserRefreshed).not.toBeNull());

    act(() => {
      capturedOnUserRefreshed?.(demoUser);
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Ameen');
  });
});

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function Bare() {
      useAuth();
      return null;
    }

    expect(() => render(<Bare />)).toThrow('useAuth must be used inside <AuthProvider>');

    consoleSpy.mockRestore();
  });
});
