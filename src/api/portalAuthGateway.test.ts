import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortalAuthGateway } from './portalAuthGateway';

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const sessionValues = new Map<string, string>();
const sessionStorageMock: Storage = {
  getItem: (key) => sessionValues.get(key) ?? null,
  setItem: (key, value) => { sessionValues.set(key, value); },
  removeItem: (key) => { sessionValues.delete(key); },
  clear: () => { sessionValues.clear(); },
  key: (index) => Array.from(sessionValues.keys())[index] ?? null,
  get length() { return sessionValues.size; },
};

describe('Portal Auth API Gateway', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const originalFetch = globalThis.fetch;
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    sessionValues.clear();
    globalThis.fetch = fetchMock;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { sessionStorage: sessionStorageMock },
    });
    fetchMock.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete (globalThis as { window?: unknown }).window;
    else Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
  });

  it('logs in, stores tokens, and loads the authenticated profile', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, {
        success: true,
        data: { accessToken: 'access-token', refreshToken: 'refresh-token', tokenType: 'Bearer', expiresInSeconds: 600 },
      }))
      .mockResolvedValueOnce(jsonResponse(200, {
        success: true,
        data: {
          portalUserId: 'portal-1', username: 'customer', email: 'customer@example.test',
          fullName: 'Customer', phone: '700000000', role: 'customer',
          approvalStatus: 'approved', onboardingCompleted: true,
        },
      }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.login('customer', 'strong-password')).resolves.toMatchObject({ portalUserId: 'portal-1' });
    expect(sessionValues.get('alx_portal_api_access_token')).toBe('access-token');
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      headers: expect.any(Headers),
    }));
  });

  it('refreshes an expired access token before loading the profile', async () => {
    sessionValues.set('alx_portal_api_refresh_token', 'refresh-token');
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false }))
      .mockResolvedValueOnce(jsonResponse(200, {
        success: true,
        data: { accessToken: 'new-access', refreshToken: 'new-refresh', tokenType: 'Bearer', expiresInSeconds: 600 },
      }))
      .mockResolvedValueOnce(jsonResponse(200, {
        success: true,
        data: {
          portalUserId: 'portal-1', username: 'customer', email: 'customer@example.test',
          fullName: 'Customer', phone: '700000000', role: 'customer',
          approvalStatus: 'approved', onboardingCompleted: true,
        },
      }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.getProfile()).resolves.toMatchObject({ portalUserId: 'portal-1' });
    expect(sessionValues.get('alx_portal_api_access_token')).toBe('new-access');
    expect(sessionValues.get('alx_portal_api_refresh_token')).toBe('new-refresh');
  });
});
