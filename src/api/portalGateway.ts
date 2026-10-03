import type {
  PortalAnnouncementDto,
  PortalUserSessionDto,
  PublicTrackingDto,
  PublicTrackingQuery,
} from '../contracts/portal.contracts';
import { getCollection } from '../lib/legacy-supabase/supabase';

export interface PortalGateway {
  getCurrentSession(): Promise<PortalUserSessionDto | null>;
  getPublicTracking(query: PublicTrackingQuery): Promise<PublicTrackingDto | null>;
  getAnnouncements(): Promise<PortalAnnouncementDto[]>;
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

  async getAnnouncements(): Promise<PortalAnnouncementDto[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/portal/announcements`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('PORTAL_API_UNAVAILABLE');
    return response.json() as Promise<PortalAnnouncementDto[]>;
  }
}

function toAnnouncementDto(value: unknown): PortalAnnouncementDto | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  const title = typeof row.title === 'string' ? row.title : '';
  const content = typeof row.content === 'string' ? row.content : '';
  if (!id || !title || !content) return null;
  const priority = row.priority === 'urgent' || row.priority === 'high' ? row.priority : 'normal';
  const createdAt = typeof row.createdAt === 'number' ? row.createdAt : Date.now();
  return { id, title, content, priority, createdAt };
}

const legacyPortalGateway: PortalGateway = {
  async getCurrentSession() { return null; },
  async getPublicTracking(query) {
    const token = query.trackingToken.trim().toLowerCase();
    if (!token) return null;
    const rows = await getCollection('orders');
    const matched = rows.find((value) => {
      if (typeof value !== 'object' || value === null) return false;
      const row = value as Record<string, unknown>;
      return [row.trackingNumber, row.tracking_number, row.orderNumber, row.order_number, row.id]
        .some((candidate) => typeof candidate === 'string' && candidate.toLowerCase() === token);
    });
    if (!matched || typeof matched !== 'object') return null;
    const row = matched as Record<string, unknown>;
    const status = typeof row.orderStatus === 'string' ? row.orderStatus : typeof row.status === 'string' ? row.status : 'pending';
    const occurredAt = typeof row.updatedAt === 'number' ? row.updatedAt : typeof row.updated_at === 'number' ? row.updated_at : null;
    return { trackingToken: query.trackingToken, status, events: [{ status, occurredAt }], updatedAt: occurredAt };
  },
  async getAnnouncements() {
    const rows = await getCollection('announcements');
    return rows.map(toAnnouncementDto).filter((row): row is PortalAnnouncementDto => row !== null);
  },
};

/**
 * Legacy implementation is injected lazily to keep Supabase out of new API consumers.
 * It is intentionally not enabled until the HTTP endpoints are deployed and verified.
 */
export function createPortalGateway(
  config: PortalGatewayConfig = portalGatewayConfig(),
): PortalGateway {
  if (config.useApi) return new HttpPortalGateway(config.apiBaseUrl);
  return legacyPortalGateway;
}

export const portalGateway = createPortalGateway();
