import { describe, expect, it } from 'vitest';
import { portalAuthCompatibility } from './portalAuthCompatibility';

describe('portalAuthCompatibility adapter', () => {
  it('reads a session user', async () => {
    await expect(portalAuthCompatibility.getSessionUser()).resolves.toBeNull();
  });

  it('subscribes to auth events and returns a cleanup function', () => {
    const callback = () => {};
    const unsubscribe = portalAuthCompatibility.subscribe(callback);
    expect(typeof unsubscribe).toBe('function');
  });

  it('wraps credential calls', async () => {
    await expect(portalAuthCompatibility.signUp({
      email: 'user@example.test', password: 'example-password', metadata: { fullName: 'User' },
    })).resolves.toMatchObject({ user: null, hasSession: false, error: null });
    await expect(portalAuthCompatibility.signInWithPassword('user@example.test', 'example-password'))
      .resolves.toMatchObject({ user: null, hasSession: false, error: null });
  });
});


