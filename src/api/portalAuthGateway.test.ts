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
});
