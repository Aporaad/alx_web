import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitJobApplication } from './jobApplicationGateway';

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('job application HTTP gateway', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv('VITE_PORTAL_API_BASE_URL', 'https://api.example.test');
    globalThis.fetch = fetchMock;
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('posts the validated form through alx_api and returns the server reference', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, {
      success: true,
      data: { refCode: 'JOB-2026-1234ABCD' },
      requestId: 'req-1',
    }));

    const result = await submitJobApplication({
      fullName: 'Test Candidate',
      phone: '+967700000000',
      city: 'Sanaa',
      jobPosition: 'other',
      qualification: 'Other',
      experienceYears: 0,
    });

    expect(result).toEqual({ refCode: 'JOB-2026-1234ABCD' });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/portal/job-applications',
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      }),
    );
  });

  it('surfaces safe API errors without attempting a legacy fallback', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, {
      success: false,
      error: { code: 'INVALID_JOB_APPLICATION', message: 'بيانات طلب التوظيف غير صالحة.' },
    }));

    await expect(submitJobApplication({
      fullName: 'Test Candidate',
      phone: '+967700000000',
      city: 'Sanaa',
      jobPosition: 'other',
      qualification: 'Other',
      experienceYears: 0,
    })).rejects.toThrow('بيانات طلب التوظيف غير صالحة.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
