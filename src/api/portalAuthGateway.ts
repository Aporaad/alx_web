import type { ApprovalStatus, PortalRole } from '../types/portalTypes';

export interface PortalAuthProfileDto {
  portalUserId: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  role: PortalRole;
  approvalStatus: ApprovalStatus;
  onboardingCompleted: boolean;
}

export interface PortalRegistrationInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  portalRole: PortalRole;
  username?: string;
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
  updateProfile(input: Partial<Pick<PortalAuthProfileDto, 'fullName' | 'phone' | 'email'>>): Promise<PortalAuthProfileDto>;
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
    && typeof value.onboardingCompleted === 'boolean';
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
    let data = await this.request('/api/v1/portal/auth/me', {}, true);
    if (data === null && await this.refresh()) {
      data = await this.request('/api/v1/portal/auth/me', {}, true);
    }
    if (data === null) {
      clearTokens();
      return null;
    }
    if (!isProfile(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
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

  async updateProfile(input: Partial<Pick<PortalAuthProfileDto, 'fullName' | 'phone' | 'email'>>): Promise<PortalAuthProfileDto> {
    let data = await this.request('/api/v1/portal/auth/profile', { method: 'PATCH', body: JSON.stringify(input) }, true);
    if (data === null && await this.refresh()) data = await this.request('/api/v1/portal/auth/profile', { method: 'PATCH', body: JSON.stringify(input) });
    if (!isProfile(data)) throw new Error(data === null ? 'PORTAL_AUTH_REQUIRED' : 'PORTAL_API_INVALID_RESPONSE');
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

export function createPortalAuthGateway(
  config: PortalAuthGatewayConfig = portalAuthGatewayConfig(),
): PortalAuthGateway | null {
  return config.enabled ? new HttpPortalAuthGateway(config.apiBaseUrl) : null;
}

export const portalAuthGateway = createPortalAuthGateway();
