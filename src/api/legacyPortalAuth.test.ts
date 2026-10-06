import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('./legacy-portal', () => ({ supabase: { auth: authMocks } }));

import { legacyPortalAuth } from './legacyPortalAuth';

describe('legacyPortalAuth compatibility adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: authMocks.unsubscribe } } });
  });

  it('reads a legacy session user and exposes only its identity to callers', async () => {
    authMocks.getSession.mockResolvedValue({
      data: { session: { user: { id: 'legacy-user', email: 'legacy@example.test', user_metadata: { fullName: 'Legacy User' } } } },
    });

    await expect(legacyPortalAuth.getSessionUser()).resolves.toMatchObject({
      id: 'legacy-user', email: 'legacy@example.test',
    });
    expect(authMocks.getSession).toHaveBeenCalledOnce();
  });

  it('subscribes to legacy auth events and returns a cleanup function', () => {
    const callback = vi.fn();
    const unsubscribe = legacyPortalAuth.subscribe(callback);

    expect(authMocks.onAuthStateChange).toHaveBeenCalledOnce();
    unsubscribe();
    expect(authMocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it('wraps legacy credential calls and reports whether a session was created', async () => {
    authMocks.signUp.mockResolvedValue({ data: { user: { id: 'legacy-user' }, session: null }, error: null });
    authMocks.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'legacy-user', email: 'legacy@example.test' }, session: { access_token: 'legacy-token' } },
      error: null,
    });

    await expect(legacyPortalAuth.signUp({
      email: 'legacy@example.test', password: 'example-password', metadata: { fullName: 'Legacy User' },
    })).resolves.toMatchObject({ user: { id: 'legacy-user' }, hasSession: false, error: null });
    await expect(legacyPortalAuth.signInWithPassword('legacy@example.test', 'example-password'))
      .resolves.toMatchObject({ user: { id: 'legacy-user' }, hasSession: true, error: null });
  });
});
