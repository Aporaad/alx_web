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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullableTimestamp(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isPublicTrackingDto(value: unknown): value is PublicTrackingDto {
  return isRecord(value)
    && typeof value.trackingToken === 'string'
    && typeof value.status === 'string'
    && isNullableTimestamp(value.updatedAt)
    && Array.isArray(value.events)
    && value.events.every((event) => isRecord(event)
      && typeof event.status === 'string'
      && isNullableTimestamp(event.occurredAt));
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

  private async getData(path: string, notFoundIsNull = false): Promise<unknown | null> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if ((response.status === 401 || (notFoundIsNull && response.status === 404))) return null;
    if (!response.ok) throw new Error('PORTAL_API_UNAVAILABLE');

    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
      throw new Error('PORTAL_API_INVALID_RESPONSE');
    }
    return payload.data;
  }

  async getCurrentSession(): Promise<PortalUserSessionDto | null> {
    throw new Error('PORTAL_SESSION_API_NOT_IMPLEMENTED');
  }

  async getPublicTracking(query: PublicTrackingQuery): Promise<PublicTrackingDto | null> {
    const data = await this.getData(
      `/api/v1/portal/tracking/${encodeURIComponent(query.trackingToken)}`,
      true,
    );
    if (data === null) return null;
    if (!isPublicTrackingDto(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async getAnnouncements(): Promise<PortalAnnouncementDto[]> {
    const data = await this.getData('/api/v1/portal/announcements');
    if (data === null) return [];
    if (!Array.isArray(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    const announcements = data.map(toAnnouncementDto);
    if (announcements.some((announcement) => announcement === null)) {
      throw new Error('PORTAL_API_INVALID_RESPONSE');
    }
    return announcements.filter((announcement): announcement is PortalAnnouncementDto => announcement !== null);
  }
}

function toAnnouncementDto(value: unknown): PortalAnnouncementDto | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id : '';
  const title = typeof value.title === 'string' ? value.title : '';
  const content = typeof value.content === 'string' ? value.content : '';
  if (!id || !title || !content) return null;
  const priority = value.priority === 'urgent' || value.priority === 'high' ? value.priority : 'normal';
  const createdAt = typeof value.createdAt === 'number' ? value.createdAt : Date.now();
  return { id, title, content, priority, createdAt };
}

const legacyPortalGateway: PortalGateway = {
  async getCurrentSession() { return null; },
  async getPublicTracking(query) {
    const token = query.trackingToken.trim().toLowerCase();
    if (!token) return null;
    const rows = await getCollection('orders');
    const matched = rows.find((value) => {
      if (!isRecord(value)) return false;
      return [value.trackingNumber, value.tracking_number]
        .some((candidate) => typeof candidate === 'string' && candidate.toLowerCase() === token);
    });
    if (!matched) return null;
    const status = typeof matched.orderStatus === 'string'
      ? matched.orderStatus
      : typeof matched.status === 'string' ? matched.status : 'pending';
    const occurredAt = typeof matched.updatedAt === 'number'
      ? matched.updatedAt
      : typeof matched.updated_at === 'number' ? matched.updated_at : null;
    return { trackingToken: query.trackingToken, status, events: [{ status, occurredAt }], updatedAt: occurredAt };
  },
  async getAnnouncements() {
    const rows = await getCollection('announcements');
    return rows.map(toAnnouncementDto).filter((row): row is PortalAnnouncementDto => row !== null);
  },
};

/** Legacy remains a deliberate opt-out while auth and remaining Portal features are migrated. */
export function createPortalGateway(
  config: PortalGatewayConfig = portalGatewayConfig(),
): PortalGateway {
  if (config.useApi) return new HttpPortalGateway(config.apiBaseUrl);
  return legacyPortalGateway;
}

export const portalGateway = createPortalGateway();
