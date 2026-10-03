import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortalGateway } from './portalGateway';

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('HttpPortalGateway', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = fetchMock;
    fetchMock.mockReset();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('reads announcements from the standard API envelope', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {
      success: true,
      data: [{ id: 'notice-1', title: 'Notice', content: 'Public', priority: 'normal', createdAt: 1 }],
      requestId: 'req-1',
    }));
    const gateway = createPortalGateway({ apiBaseUrl: 'https://api.example.test', useApi: true });

    await expect(gateway.getAnnouncements()).resolves.toEqual([
      { id: 'notice-1', title: 'Notice', content: 'Public', priority: 'normal', createdAt: 1 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/v1/portal/announcements', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('returns null for a public tracking 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, { success: false, error: { code: 'PUBLIC_TRACKING_NOT_FOUND' } }));
    const gateway = createPortalGateway({ apiBaseUrl: 'https://api.example.test', useApi: true });

    await expect(gateway.getPublicTracking({ trackingToken: 'TRACK/123' })).resolves.toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.example.test/api/v1/portal/tracking/TRACK%2F123');
  });

  it('rejects malformed API envelopes instead of trusting them as DTOs', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { data: [] }));
    const gateway = createPortalGateway({ apiBaseUrl: 'https://api.example.test', useApi: true });

    await expect(gateway.getAnnouncements()).rejects.toThrow('PORTAL_API_INVALID_RESPONSE');
  });

  it('rejects a tracking payload containing fields with invalid runtime types', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {
      success: true,
      data: { trackingToken: 'TRACK-1', status: 'in_transit', updatedAt: 'yesterday', events: [] },
    }));
    const gateway = createPortalGateway({ apiBaseUrl: 'https://api.example.test', useApi: true });

    await expect(gateway.getPublicTracking({ trackingToken: 'TRACK-1' })).rejects.toThrow('PORTAL_API_INVALID_RESPONSE');
  });

  it('keeps legacy data access disabled when the HTTP feature flag is off', async () => {
    const gateway = createPortalGateway({ apiBaseUrl: 'https://api.example.test', useApi: false });
    await expect(gateway.getCurrentSession()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
