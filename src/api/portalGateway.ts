import type {
  PortalUserSessionDto,
  PublicTrackingDto,
  PublicTrackingQuery,
} from '../contracts/portal.contracts';

export interface PortalGateway {
  getCurrentSession(): Promise<PortalUserSessionDto | null>;
  getPublicTracking(query: PublicTrackingQuery): Promise<PublicTrackingDto | null>;
}

export interface PortalGatewayConfig {
  apiBaseUrl: string;
  useApi: boolean;
}

export function portalGatewayConfig(): PortalGatewayConfig {
  const apiBaseUrl = String(import.meta.env.VITE_PORTAL_API_BASE_URL || '').replace(/\/$/, '');
  return {
    apiBaseUrl,
    useApi: import.meta.env.VITE_PORTAL_API_ENABLED === 'true' && apiBaseUrl.length > 0,
  };
}

class HttpPortalGateway implements PortalGateway {
  constructor(private readonly baseUrl: string) {}

  async getCurrentSession(): Promise<PortalUserSessionDto | null> {
    const response = await fetch(`${this.baseUrl}/api/v1/portal/session`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error('PORTAL_API_UNAVAILABLE');
    return response.json() as Promise<PortalUserSessionDto | null>;
  }

  async getPublicTracking(query: PublicTrackingQuery): Promise<PublicTrackingDto | null> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/portal/tracking/${encodeURIComponent(query.trackingToken)}`,
      { credentials: 'include', headers: { Accept: 'application/json' } },
    );
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('PORTAL_API_UNAVAILABLE');
    return response.json() as Promise<PublicTrackingDto | null>;
  }
}

/**
 * Legacy implementation is injected lazily to keep Supabase out of new API consumers.
 * It is intentionally not enabled until the HTTP endpoints are deployed and verified.
 */
export function createPortalGateway(
  config: PortalGatewayConfig = portalGatewayConfig(),
): PortalGateway {
  if (config.useApi) return new HttpPortalGateway(config.apiBaseUrl);
  return {
    async getCurrentSession() { return null; },
    async getPublicTracking() { return null; },
  };
}

export const portalGateway = createPortalGateway();
