import type { ApprovalStatus, CustomerDetails, PortalRole } from '../types/portalTypes';

export type PortalTicketType = 'inquiry' | 'suggestion' | 'complaint';

export interface PortalTicketDto {
  id: string;
  userUid: string;
  userName: string;
  userRole: PortalRole;
  type: PortalTicketType;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminResponse?: string;
  respondedAt?: number;
  createdAt: number;
}

export interface PortalOrderDto {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  status: string;
  orderStatus: string;
  createdAt: number;
  [customerVisibleField: string]: unknown;
}

export interface PortalPaymentRequestDto {
  id: string;
  amount: number;
  currency: 'YER' | 'USD' | 'SAR';
  paymentMethod: 'cash' | 'transfer' | 'wallet' | 'check';
  reference?: string;
  notes?: string;
  status: 'pending_verification' | 'settled' | 'rejected';
  financeEntryId?: string;
  reviewNote?: string;
  createdAt: number;
  reviewedAt?: number;
}

export interface PortalPaymentRequestInput {
  amount: number;
  currency: PortalPaymentRequestDto['currency'];
  paymentMethod: PortalPaymentRequestDto['paymentMethod'];
  reference?: string;
  notes?: string;
}

export type PortalCustomerDetailsDto = CustomerDetails;
export type PortalCustomerDetailsUpdateInput = Partial<Pick<
  CustomerDetails,
  | 'privacyPolicyAgreed'
  | 'gender'
  | 'age'
  | 'location'
  | 'bodyDetails'
  | 'preferredCategories'
  | 'acquisitionSource'
  | 'joinBy'
  | 'referrerId'
  | 'onboardingCompleted'
>>;

export interface PortalOrderCreateInput {
  orderSourceId?: string;
  externalOrderNumber?: string;
  cartShareCode?: string;
  items: Array<{
    productName: string;
    productUrl?: string;
    quantity: number;
    productPrice: number;
    weight?: number;
    cbm?: number;
    length?: number;
    width?: number;
    height?: number;
    trackingNumber?: string;
  }>;
  packagingType: 'normal' | 'gift' | 'vip';
  isUrgent: boolean;
  packageType: 'standard' | 'express' | 'factory_cbm' | 'heavy';
  paymentMethod?: 'Cash' | 'Transfer' | 'Wallet';
  notes?: string;
}

export interface PortalAuthProfileDto {
  portalUserId: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: PortalRole;
  approvalStatus: ApprovalStatus;
  onboardingCompleted: boolean;
  address?: string;
  linkedAccId?: string;
  linkedCustomerId?: string;
  linkedCourierId?: string;
  linkedSourceId?: string;
  financialAccountId?: string;
  financialAccountCode?: string;
  financialCurrency?: string;
  joinBy?: string;
  referrerId?: string;
}

export interface PortalRegistrationInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  portalRole: PortalRole;
  username?: string;
  address?: string;
  joinBy?: string;
  referrerId?: string;
  companyName?: string;
  commercialRegister?: string;
  courierType?: 'local' | 'sourcing';
  identityDocNote?: string;
}

export interface PortalRegistrationResult {
  profile: PortalAuthProfileDto;
  pendingApproval: boolean;
  tokens: PortalAuthTokenPairDto | null;
}

interface PortalAuthTokenPairDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
}

export interface PortalAuthGateway {
  login(identifier: string, password: string): Promise<PortalAuthProfileDto>;
  register(input: PortalRegistrationInput): Promise<PortalRegistrationResult>;
  getProfile(): Promise<PortalAuthProfileDto | null>;
  updateProfile(input: Partial<Pick<PortalAuthProfileDto, 'fullName' | 'phone' | 'address'>>): Promise<PortalAuthProfileDto>;
  getCustomerDetails(): Promise<PortalCustomerDetailsDto | null>;
  saveCustomerDetails(input: PortalCustomerDetailsUpdateInput): Promise<PortalCustomerDetailsDto>;
  listTickets(): Promise<PortalTicketDto[]>;
  createTicket(input: { type: PortalTicketType; subject: string; message: string }): Promise<PortalTicketDto>;
  listCustomerOrders(): Promise<PortalOrderDto[]>;
  createCustomerOrder(input: PortalOrderCreateInput, idempotencyKey: string): Promise<PortalOrderDto>;
  listPaymentRequests(): Promise<PortalPaymentRequestDto[]>;
  createPaymentRequest(input: PortalPaymentRequestInput, idempotencyKey: string): Promise<PortalPaymentRequestDto>;
  logout(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

export interface PortalAuthGatewayConfig {
  apiBaseUrl: string;
  enabled: boolean;
}

const ACCESS_TOKEN_KEY = 'alx_portal_api_access_token';
const REFRESH_TOKEN_KEY = 'alx_portal_api_refresh_token';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProfile(value: unknown): value is PortalAuthProfileDto {
  return isRecord(value)
    && typeof value.portalUserId === 'string'
    && typeof value.username === 'string'
    && typeof value.email === 'string'
    && typeof value.fullName === 'string'
    && typeof value.phone === 'string'
    && (value.role === 'customer' || value.role === 'courier' || value.role === 'supplier')
    && (value.approvalStatus === 'approved' || value.approvalStatus === 'pending_approval' || value.approvalStatus === 'rejected')
    && typeof value.onboardingCompleted === 'boolean'
    && ['address', 'linkedAccId', 'linkedCustomerId', 'linkedCourierId', 'linkedSourceId', 'financialAccountId',
      'financialAccountCode', 'financialCurrency', 'joinBy', 'referrerId'].every(
      (key) => value[key] === undefined || typeof value[key] === 'string',
    );
}

function isTokenPair(value: unknown): value is PortalAuthTokenPairDto {
  return isRecord(value)
    && typeof value.accessToken === 'string'
    && typeof value.refreshToken === 'string'
    && value.tokenType === 'Bearer'
    && typeof value.expiresInSeconds === 'number';
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function read(key: string): string | null {
  return storage()?.getItem(key) ?? null;
}

function writeTokens(tokens: PortalAuthTokenPairDto): void {
  storage()?.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage()?.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

function clearTokens(): void {
  storage()?.removeItem(ACCESS_TOKEN_KEY);
  storage()?.removeItem(REFRESH_TOKEN_KEY);
}

export function portalAuthGatewayConfig(): PortalAuthGatewayConfig {
  const apiBaseUrl = String(import.meta.env.VITE_PORTAL_API_BASE_URL || '').replace(/\/$/, '');
  return {
    apiBaseUrl,
    enabled: import.meta.env.VITE_PORTAL_AUTH_API_ENABLED === 'true' && apiBaseUrl.length > 0,
  };
}

class HttpPortalAuthGateway implements PortalAuthGateway {
  constructor(private readonly baseUrl: string) {}

  private async request(path: string, init: RequestInit = {}, allowUnauthorized = false): Promise<unknown | null> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) headers.set('Content-Type', 'application/json');
    const accessToken = read(ACCESS_TOKEN_KEY);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (allowUnauthorized && response.status === 401) return null;
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const code = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === 'string'
        ? payload.error.code
        : 'PORTAL_AUTH_API_ERROR';
      throw new Error(code);
    }
    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
      throw new Error('PORTAL_API_INVALID_RESPONSE');
    }
    return payload.data;
  }

  private async refresh(): Promise<boolean> {
    const refreshToken = read(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;
    const data = await this.request('/api/v1/portal/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (!isTokenPair(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    writeTokens(data);
    return true;
  }

  private async getProfileWithRefresh(): Promise<PortalAuthProfileDto | null> {
    let data: unknown | null;
    try {
      data = await this.authenticatedRequest('/api/v1/portal/auth/me');
    } catch (error) {
      if (error instanceof Error && error.message === 'PORTAL_AUTH_REQUIRED') return null;
      throw error;
    }
    if (data === null) {
      clearTokens();
      return null;
    }
    if (!isProfile(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  private async authenticatedRequest(path: string, init: RequestInit = {}): Promise<unknown> {
    let data = await this.request(path, init, true);
    if (data === null && await this.refresh()) data = await this.request(path, init, true);
    if (data === null) {
      clearTokens();
      throw new Error('PORTAL_AUTH_REQUIRED');
    }
    return data;
  }

  async login(identifier: string, password: string): Promise<PortalAuthProfileDto> {
    const data = await this.request('/api/v1/portal/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (!isTokenPair(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    writeTokens(data);
    const profile = await this.getProfileWithRefresh();
    if (!profile) throw new Error('PORTAL_AUTH_INVALID_TOKEN');
    return profile;
  }

  async register(input: PortalRegistrationInput): Promise<PortalRegistrationResult> {
    const data = await this.request('/api/v1/portal/auth/register', { method: 'POST', body: JSON.stringify(input) });
    if (!isRecord(data) || !isProfile(data.profile) || typeof data.pendingApproval !== 'boolean' || (data.tokens !== null && !isTokenPair(data.tokens))) throw new Error('PORTAL_API_INVALID_RESPONSE');
    if (data.tokens) writeTokens(data.tokens);
    return { profile: data.profile, pendingApproval: data.pendingApproval, tokens: data.tokens };
  }

  async getProfile(): Promise<PortalAuthProfileDto | null> {
    return this.getProfileWithRefresh();
  }

  async updateProfile(input: Partial<Pick<PortalAuthProfileDto, 'fullName' | 'phone' | 'address'>>): Promise<PortalAuthProfileDto> {
    const data = await this.authenticatedRequest('/api/v1/portal/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    if (!isProfile(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async getCustomerDetails(): Promise<PortalCustomerDetailsDto | null> {
    const data = await this.authenticatedRequest('/api/v1/portal/customer-details');
    if (data === null) return null;
    if (!isPortalCustomerDetails(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async saveCustomerDetails(input: PortalCustomerDetailsUpdateInput): Promise<PortalCustomerDetailsDto> {
    const data = await this.authenticatedRequest('/api/v1/portal/customer-details', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    if (!isPortalCustomerDetails(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async listTickets(): Promise<PortalTicketDto[]> {
    const data = await this.authenticatedRequest('/api/v1/portal/tickets');
    if (!Array.isArray(data) || !data.every(isPortalTicket)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async createTicket(input: { type: PortalTicketType; subject: string; message: string }): Promise<PortalTicketDto> {
    const data = await this.authenticatedRequest('/api/v1/portal/tickets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (!isPortalTicket(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async listCustomerOrders(): Promise<PortalOrderDto[]> {
    const data = await this.authenticatedRequest('/api/v1/portal/orders');
    if (!Array.isArray(data) || !data.every(isPortalOrder)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async createCustomerOrder(input: PortalOrderCreateInput, idempotencyKey: string): Promise<PortalOrderDto> {
    const data = await this.authenticatedRequest('/api/v1/portal/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    });
    if (!isPortalOrder(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async listPaymentRequests(): Promise<PortalPaymentRequestDto[]> {
    const data = await this.authenticatedRequest('/api/v1/portal/payment-requests');
    if (!Array.isArray(data) || !data.every(isPortalPaymentRequest)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async createPaymentRequest(
    input: PortalPaymentRequestInput,
    idempotencyKey: string,
  ): Promise<PortalPaymentRequestDto> {
    const data = await this.authenticatedRequest('/api/v1/portal/payment-requests', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    });
    if (!isPortalPaymentRequest(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = read(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) {
        await this.request('/api/v1/portal/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }, true);
      }
    } finally {
      clearTokens();
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    let data = await this.request('/api/v1/portal/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, true);
    if (data === null && await this.refresh()) {
      data = await this.request('/api/v1/portal/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    }
    if (data === null) throw new Error('PORTAL_AUTH_REQUIRED');
  }
}

function isPortalTicket(value: unknown): value is PortalTicketDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.userUid === 'string'
    && typeof value.userName === 'string'
    && (value.userRole === 'customer' || value.userRole === 'courier' || value.userRole === 'supplier')
    && (value.type === 'inquiry' || value.type === 'suggestion' || value.type === 'complaint')
    && typeof value.subject === 'string'
    && typeof value.message === 'string'
    && (value.status === 'open' || value.status === 'in_progress' || value.status === 'resolved' || value.status === 'closed')
    && typeof value.createdAt === 'number';
}

function isPortalOrder(value: unknown): value is PortalOrderDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.orderNumber === 'string'
    && typeof value.trackingNumber === 'string'
    && typeof value.status === 'string'
    && typeof value.orderStatus === 'string'
    && typeof value.createdAt === 'number';
}

function isPortalPaymentRequest(value: unknown): value is PortalPaymentRequestDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.amount === 'number'
    && (value.currency === 'YER' || value.currency === 'USD' || value.currency === 'SAR')
    && (value.paymentMethod === 'cash' || value.paymentMethod === 'transfer'
      || value.paymentMethod === 'wallet' || value.paymentMethod === 'check')
    && (value.status === 'pending_verification' || value.status === 'settled' || value.status === 'rejected')
    && typeof value.createdAt === 'number'
    && ['reference', 'notes', 'financeEntryId', 'reviewNote', 'reviewedAt'].every(
      (key) => value[key] === undefined || (key === 'reviewedAt'
        ? typeof value[key] === 'number'
        : typeof value[key] === 'string'),
    );
}

function isPortalCustomerDetails(value: unknown): value is PortalCustomerDetailsDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.userUid === 'string'
    && typeof value.customerId === 'string'
    && typeof value.privacyPolicyAgreed === 'boolean'
    && Array.isArray(value.preferredCategories)
    && value.preferredCategories.every((category) => typeof category === 'string')
    && typeof value.joinBy === 'string'
    && typeof value.referrerId === 'string'
    && typeof value.onboardingCompleted === 'boolean'
    && typeof value.createdAt === 'number'
    && typeof value.updatedAt === 'number';
}

export function createPortalAuthGateway(
  config: PortalAuthGatewayConfig = portalAuthGatewayConfig(),
): PortalAuthGateway | null {
  return config.enabled ? new HttpPortalAuthGateway(config.apiBaseUrl) : null;
}

export const portalAuthGateway = createPortalAuthGateway();
