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

// الأحداث المُصدَرة على نافذة الاختبار: طبقة البيانات تُبلّغ انتهاء الجلسة القاطع عبرها.
// Events dispatched on the test window: the data layer broadcasts the decisive session end through them.
const dispatchedEvents: string[] = [];

describe('Portal Auth API Gateway', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const originalFetch = globalThis.fetch;
  const originalWindow = (globalThis as { window?: unknown }).window;

  beforeEach(() => {
    sessionValues.clear();
    dispatchedEvents.length = 0;
    globalThis.fetch = fetchMock;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        sessionStorage: sessionStorageMock,
        dispatchEvent: (event: Event) => { dispatchedEvents.push(event.type); return true; },
      },
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

  it('sends role-specific registration details to the Portal API', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, {
      success: true,
      data: {
        profile: {
          portalUserId: 'portal-supplier', username: 'supplier', email: 'supplier@example.test',
          fullName: 'Supplier Contact', phone: '700000003', role: 'supplier',
          approvalStatus: 'pending_approval', onboardingCompleted: true,
          linkedAccId: 'src_0001', linkedSourceId: 'src_0001',
          financialAccountId: '2141-0001', financialAccountCode: '2141-0001', financialCurrency: 'YER',
        },
        pendingApproval: true,
        tokens: null,
      },
    }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.register({
      fullName: 'Supplier Contact', phone: '700000003', email: 'supplier@example.test',
      password: 'a-strong-test-password', portalRole: 'supplier', username: 'supplier',
      address: 'Test address', companyName: 'Test company', commercialRegister: 'test-register',
    })).resolves.toMatchObject({
      pendingApproval: true,
      profile: { linkedSourceId: 'src_0001', financialAccountCode: '2141-0001' },
    });

    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/api/v1/portal/auth/register');
    expect(JSON.parse(String(request?.body))).toMatchObject({
      portalRole: 'supplier', companyName: 'Test company', commercialRegister: 'test-register', address: 'Test address',
    });
  });

  it('updates customer onboarding details through the authenticated API without accepting client ownership IDs', async () => {
    sessionValues.set('alx_portal_api_access_token', 'portal-access');
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      success: true,
      data: {
        id: 'detail-1', userUid: 'portal-1', customerId: 'customer-1',
        privacyPolicyAgreed: true, gender: 'female', age: 31,
        preferredCategories: ['clothing'], joinBy: 'friend', referrerId: 'ref-1',
        onboardingCompleted: true, createdAt: 1, updatedAt: 2,
      },
    }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.saveCustomerDetails({
      privacyPolicyAgreed: true,
      gender: 'female',
      age: 31,
      preferredCategories: ['clothing'],
      onboardingCompleted: true,
    })).resolves.toMatchObject({ userUid: 'portal-1', customerId: 'customer-1', onboardingCompleted: true });

    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/api/v1/portal/customer-details');
    expect(request?.method).toBe('PUT');
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer portal-access');
    expect(JSON.parse(String(request?.body))).not.toHaveProperty('userUid');
  });

  it('uses protected ticket/order endpoints and attaches an order idempotency key', async () => {
    sessionValues.set('alx_portal_api_access_token', 'portal-access');
    fetchMock
      .mockResolvedValueOnce(jsonResponse(201, {
        success: true,
        data: {
          id: 'ticket-1', userUid: 'portal-1', userName: 'Customer', userRole: 'customer',
          type: 'inquiry', subject: 'Help', message: 'Please help.', status: 'open', createdAt: 1,
        },
      }))
      .mockResolvedValueOnce(jsonResponse(201, {
        success: true,
        data: { id: 'order-1', orderNumber: 'ALX-2610-X', trackingNumber: 'ALX-2610-X', status: 'pending', orderStatus: 'معلق', createdAt: 1 },
      }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.createTicket({ type: 'inquiry', subject: 'Help', message: 'Please help.' }))
      .resolves.toMatchObject({ id: 'ticket-1', userUid: 'portal-1' });
    await expect(gateway?.createCustomerOrder({
      items: [{ productName: 'Test', quantity: 1, productPrice: 5 }],
      packagingType: 'normal', isUrgent: false, packageType: 'standard',
    }, 'portal-order-test-001')).resolves.toMatchObject({ id: 'order-1' });

    const [orderUrl, orderRequest] = fetchMock.mock.calls[1] ?? [];
    expect(orderUrl).toBe('https://api.example.test/api/v1/portal/orders');
    expect(new Headers(orderRequest?.headers).get('Idempotency-Key')).toBe('portal-order-test-001');
  });

  it('searches only through the authenticated customer orders API', async () => {
    sessionValues.set('alx_portal_api_access_token', 'portal-access');
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      success: true,
      data: [{
        id: 'order-1', orderNumber: 'ORD-1', trackingNumber: 'TRK-1',
        status: 'pending', orderStatus: 'pending', createdAt: 1,
      }],
    }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.listCustomerOrders(' TRK /% ')).resolves.toMatchObject([{ id: 'order-1' }]);

    const [url, request] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.test/api/v1/portal/orders?search=TRK%20%2F%25&limit=100');
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer portal-access');
  });

  it('submits and lists pending payment claims through the API without client-owned account identifiers', async () => {
    sessionValues.set('alx_portal_api_access_token', 'portal-access');
    const paymentRequest = {
      id: '8a51baec-c6ea-457a-a1ae-bfb754a14f01', amount: 250, currency: 'YER',
      paymentMethod: 'transfer', status: 'pending_verification', createdAt: 1,
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: [paymentRequest] }))
      .mockResolvedValueOnce(jsonResponse(201, { success: true, data: paymentRequest }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.listPaymentRequests()).resolves.toMatchObject([{ id: paymentRequest.id, status: 'pending_verification' }]);
    await expect(gateway?.createPaymentRequest({ amount: 250, currency: 'YER', paymentMethod: 'transfer' }, 'pay-request-test-001'))
      .resolves.toMatchObject({ id: paymentRequest.id, status: 'pending_verification' });

    const [url, request] = fetchMock.mock.calls[1] ?? [];
    expect(url).toBe('https://api.example.test/api/v1/portal/payment-requests');
    expect(request?.method).toBe('POST');
    expect(new Headers(request?.headers).get('Authorization')).toBe('Bearer portal-access');
    expect(new Headers(request?.headers).get('Idempotency-Key')).toBe('pay-request-test-001');
    expect(JSON.parse(String(request?.body))).not.toHaveProperty('financialAccountId');
  });

  /**
   * عاصفة التجديد هي سبب تسجيل خروج العميل النشط (أثبتها ملف HAR): ثلاثة طلبات متوازية رأت 401 فأدارت رمز التجديد
   * نفسه، والثاني والثالث أثارا كشف إعادة الاستخدام عند الخادم فأُلغيت عائلة الجلسات كلها. الآن تجديدٌ واحد بصوت مسموع.
   * The renewal storm is what signed an active customer out (the HAR proved it): three parallel 401s each rotated the same
   * refresh token, and the replays tripped the server's reuse detection, revoking the whole family. Now exactly one refresh runs.
   */
  it('collapses parallel 401s into one refresh call instead of replaying the refresh token', async () => {
    sessionValues.set('alx_portal_api_access_token', 'stale-access');
    sessionValues.set('alx_portal_api_refresh_token', 'refresh-1');
    sessionValues.set('alx_portal_api_access_token_expires_at', String(Date.now() + 300_000));
    const presentedBodies: string[] = [];
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/api/v1/portal/auth/refresh')) {
        presentedBodies.push(String((init as RequestInit | undefined)?.body ?? ''));
        // بطء الخادم الحقيقي يجعل النداءات تتداخل: بلا انتظار لما يقارب 10-22 ثانية لما يكن هناك سباق.
        // The real server slowness is what made calls overlap; without a delay there would be no race to lose.
        await new Promise((resolve) => { setTimeout(resolve, 10); });
        return jsonResponse(200, {
          success: true,
          data: {
            accessToken: 'fresh-access', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresInSeconds: 600,
            sessionExpiresAt: new Date(Date.now() + 2_592_000_000).toISOString(),
          },
        });
      }
      if (new Headers(init?.headers).get('Authorization') !== 'Bearer fresh-access') {
        return jsonResponse(401, { success: false, error: { code: 'PORTAL_AUTH_INVALID_TOKEN' } });
      }
      return jsonResponse(200, { success: true, data: { balance: 25, currency: { code: 'YER', symbol: 'ر.ي' } } });
    });

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    const balances = await Promise.all([
      gateway?.getCustomerBalance(),
      gateway?.getCustomerBalance(),
      gateway?.getCustomerBalance(),
    ]);

    expect(balances.every((balance) => balance?.balance === 25)).toBe(true);
    expect(presentedBodies).toHaveLength(1);
    expect(presentedBodies[0]).toContain('refresh-1');
    expect(sessionValues.get('alx_portal_api_refresh_token')).toBe('refresh-2');
    expect(dispatchedEvents).toEqual([]);
  });

  /** التجديد الاستباقي يبدّل الرمز قبل أول رفض، فلا تبدأ العاصفة أصلًا.
   *  Proactive renewal swaps the token before the first rejection, so the storm never starts. */
  it('renews the access token before the first 401 when its deadline is near', async () => {
    sessionValues.set('alx_portal_api_access_token', 'old-access');
    sessionValues.set('alx_portal_api_refresh_token', 'refresh-1');
    sessionValues.set('alx_portal_api_access_token_expires_at', String(Date.now() + 20_000));
    const seenAuth: Array<string | null> = [];
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/api/v1/portal/auth/refresh')) {
        return jsonResponse(200, {
          success: true,
          data: { accessToken: 'new-access', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresInSeconds: 600 },
        });
      }
      seenAuth.push(new Headers(init?.headers).get('Authorization'));
      return jsonResponse(200, { success: true, data: { balance: 5, currency: { code: 'YER', symbol: 'ر.ي' } } });
    });

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.getCustomerBalance()).resolves.toMatchObject({ balance: 5 });

    expect(seenAuth).toEqual(['Bearer new-access']);
    expect(sessionValues.get('alx_portal_api_access_token')).toBe('new-access');
  });

  /** الرفض القاطع وحده ينهي الجلسة — ويُبَلِّغ حتى تتوقف الصفحات عن الجلب بلا توثيق.
   *  Only a decisive rejection ends the session — and it broadcasts, so pages stop fetching unauthenticated. */
  it('clears tokens and announces the end on a decisive refresh rejection', async () => {
    sessionValues.set('alx_portal_api_access_token', 'access-1');
    sessionValues.set('alx_portal_api_refresh_token', 'refresh-1');
    sessionValues.set('alx_portal_api_access_token_expires_at', String(Date.now() + 300_000));
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: { code: 'PORTAL_AUTH_INVALID_TOKEN' } }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: { code: 'PORTAL_AUTH_INVALID_CREDENTIALS' } }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.getCustomerBalance()).rejects.toThrow('PORTAL_AUTH_REQUIRED');

    expect(sessionValues.size).toBe(0);
    expect(dispatchedEvents).toEqual(['alx-portal:session-terminated']);
  });

  /** عارضٌ (5xx/شبكة) لا يمسح جلسة عميلٍ نشط: يبقى الرمز ويفشل الطلب الحالي وحده.
   *  A transient fault (5xx/network) never wipes an active session: the tokens stay and only this request fails. */
  it('keeps the session when the refresh endpoint fails transiently', async () => {
    sessionValues.set('alx_portal_api_access_token', 'access-1');
    sessionValues.set('alx_portal_api_refresh_token', 'refresh-1');
    sessionValues.set('alx_portal_api_access_token_expires_at', String(Date.now() + 300_000));
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: { code: 'PORTAL_AUTH_INVALID_TOKEN' } }))
      .mockResolvedValueOnce(new Response('gateway timeout', { status: 504 }));

    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.getCustomerBalance()).rejects.toThrow('PORTAL_AUTH_TEMPORARY_FAILURE');

    expect(sessionValues.get('alx_portal_api_refresh_token')).toBe('refresh-1');
    expect(dispatchedEvents).toEqual([]);
  });

  /** بلا رموز على الإطلاق لا تُرسل طلبات عبثية: لا سيل 401 غير الموثّق كما ظهر في الـHAR بعد المحو.
   *  With no tokens at all nothing is sent pointlessly: no unauthenticated 401 flood as the HAR showed after the wipe. */
  it('refuses to fetch protected data without any stored token', async () => {
    const gateway = createPortalAuthGateway({ apiBaseUrl: 'https://api.example.test', enabled: true });
    await expect(gateway?.listCustomerLedger()).rejects.toThrow('PORTAL_AUTH_REQUIRED');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
