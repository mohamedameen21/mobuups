import { describe, it, expect, beforeEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { api, setAccessToken, setOnUserRefreshed } from './api';

const mock = new MockAdapter(api);

beforeEach(() => {
  mock.reset();
  setAccessToken(null);
  setOnUserRefreshed(null);
});

describe('request interceptor', () => {
  it('attaches an Authorization header when an access token is set', async () => {
    setAccessToken('token-abc');
    mock.onGet('/whoami').reply((config) => [200, { authHeader: config.headers?.Authorization }]);

    const res = await api.get('/whoami');

    expect(res.data.authHeader).toBe('Bearer token-abc');
  });

  it('sends no Authorization header when there is no access token', async () => {
    mock.onGet('/whoami').reply((config) => [200, { authHeader: config.headers?.Authorization }]);

    const res = await api.get('/whoami');

    expect(res.data.authHeader).toBeUndefined();
  });
});

describe('401 retry behavior', () => {
  it('refreshes and retries a request that had no access token at all', async () => {
    let refreshCalls = 0;

    mock.onGet('/protected-anon').reply((config) => {
      if (config.headers?.Authorization) {
        return [200, { ok: true }];
      }
      return [401, {}];
    });
    mock.onPost('/auth/refresh').reply(() => {
      refreshCalls += 1;
      return [
        200,
        {
          data: { accessToken: 'fresh-token', user: { id: '1', name: 'Ameen', email: 'a@b.com' } },
        },
      ];
    });

    const res = await api.get('/protected-anon');

    expect(res.data.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });

  it('refreshes the token and retries the original request once', async () => {
    setAccessToken('stale-token');
    let whoamiCalls = 0;

    mock.onGet('/protected').reply((config) => {
      whoamiCalls += 1;
      if (config.headers?.Authorization === 'Bearer stale-token') {
        return [401, { error: { code: 'UNAUTHORIZED' } }];
      }
      return [200, { ok: true }];
    });
    mock.onPost('/auth/refresh').reply(200, {
      data: { accessToken: 'fresh-token', user: { id: '1', name: 'Ameen', email: 'a@b.com' } },
    });

    const res = await api.get('/protected');

    expect(res.status).toBe(200);
    expect(res.data.ok).toBe(true);
    expect(whoamiCalls).toBe(2);
  });

  it('updates the shared user via onUserRefreshed after a background refresh', async () => {
    setAccessToken('stale-token');
    const onUserRefreshed = vi.fn();
    setOnUserRefreshed(onUserRefreshed);

    mock.onGet('/protected').reply((config) => {
      if (config.headers?.Authorization === 'Bearer stale-token') {
        return [401, {}];
      }
      return [200, { ok: true }];
    });
    const user = { id: '1', name: 'Ameen', email: 'a@b.com' };
    mock.onPost('/auth/refresh').reply(200, { data: { accessToken: 'fresh-token', user } });

    await api.get('/protected');

    expect(onUserRefreshed).toHaveBeenCalledWith(user);
  });

  it('does not retry a second time if the retried request also 401s', async () => {
    setAccessToken('stale-token');
    let calls = 0;
    mock.onGet('/protected').reply(() => {
      calls += 1;
      return [401, {}];
    });
    mock.onPost('/auth/refresh').reply(200, {
      data: { accessToken: 'fresh-token', user: { id: '1', name: 'Ameen', email: 'a@b.com' } },
    });

    await expect(api.get('/protected')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(calls).toBe(2);
  });

  it('does not attempt to refresh again if the /auth/refresh call itself 401s', async () => {
    let refreshCalls = 0;
    mock.onPost('/auth/refresh').reply(() => {
      refreshCalls += 1;
      return [401, { error: { code: 'NO_REFRESH_TOKEN' } }];
    });

    await expect(api.post('/auth/refresh')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshCalls).toBe(1);
  });

  it('shares a single refresh call across concurrent 401s (single-flight)', async () => {
    setAccessToken('stale-token');
    let refreshCalls = 0;

    mock.onGet(/\/protected-.*/).reply((config) => {
      if (config.headers?.Authorization === 'Bearer stale-token') {
        return [401, {}];
      }
      return [200, { ok: true }];
    });
    mock.onPost('/auth/refresh').reply(() => {
      refreshCalls += 1;
      return [
        200,
        {
          data: { accessToken: 'fresh-token', user: { id: '1', name: 'Ameen', email: 'a@b.com' } },
        },
      ];
    });

    const [res1, res2] = await Promise.all([api.get('/protected-a'), api.get('/protected-b')]);

    expect(res1.data.ok).toBe(true);
    expect(res2.data.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });

  it('reuses a token that was already refreshed by another request instead of refreshing again', async () => {
    setAccessToken('stale-token');
    let refreshCalls = 0;
    let slowCalls = 0;

    mock.onGet('/protected-fast').reply((config) => {
      if (config.headers?.Authorization === 'Bearer stale-token') {
        return [401, {}];
      }
      return [200, { ok: true }];
    });
    mock.onGet('/protected-slow').reply(() => {
      slowCalls += 1;
      if (slowCalls === 1) {
        // Arrives after the fast request's refresh has already completed and rotated the token.
        return new Promise((resolve) => {
          setTimeout(() => resolve([401, {}]), 50);
        });
      }
      return [200, { ok: true }];
    });
    mock.onPost('/auth/refresh').reply(() => {
      refreshCalls += 1;
      return [
        200,
        {
          data: { accessToken: 'fresh-token', user: { id: '1', name: 'Ameen', email: 'a@b.com' } },
        },
      ];
    });

    const fast = api.get('/protected-fast');
    const slow = api.get('/protected-slow');

    const [fastRes, slowRes] = await Promise.all([fast, slow]);

    expect(fastRes.data.ok).toBe(true);
    expect(slowRes.data.ok).toBe(true);
    expect(refreshCalls).toBe(1);
  });
});
