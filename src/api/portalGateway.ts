import type {
  PortalAnnouncementDto,
  PortalUserSessionDto,
  PublicTrackingDto,
  PublicTrackingQuery,
} from '../contracts/portal.contracts';

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

function getApiBaseUrl(): string {
  return String(
    import.meta.env.VITE_PORTAL_API_BASE_URL
      || import.meta.env.VITE_ALX_API_URL
      || import.meta.env.VITE_API_BASE_URL
      || '',
  ).replace(/\/$/, '');
}

export function portalGatewayConfig(): PortalGatewayConfig {
  const apiBaseUrl = getApiBaseUrl();
  return {
    apiBaseUrl,
    useApi: apiBaseUrl.length > 0 && import.meta.env.VITE_PORTAL_API_ENABLED !== 'false',
  };
}

class HttpPortalGateway implements PortalGateway {
  constructor(private readonly baseUrl: string) {}

  private async getData(path: string, notFoundIsNull = false): Promise<unknown | null> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (response.status === 401 || (notFoundIsNull && response.status === 404)) return null;
    if (!response.ok) throw new Error('PORTAL_API_UNAVAILABLE');
    const payload: unknown = await response.json();
    if (!isRecord(payload) || payload.success !== true || !('data' in payload)) {
      throw new Error('PORTAL_API_INVALID_RESPONSE');
    }
    return payload.data;
  }

  async getCurrentSession(): Promise<PortalUserSessionDto | null> {
    return null;
  }

  async getPublicTracking(query: PublicTrackingQuery): Promise<PublicTrackingDto | null> {
    const data = await this.getData(`/api/v1/portal/tracking/${encodeURIComponent(query.trackingToken)}`, true);
    if (data === null) return null;
    if (!isPublicTrackingDto(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    return data;
  }

  async getAnnouncements(): Promise<PortalAnnouncementDto[]> {
    const data = await this.getData('/api/v1/portal/announcements');
    if (!Array.isArray(data)) throw new Error('PORTAL_API_INVALID_RESPONSE');
    const announcements = data.map(toAnnouncementDto);
    if (announcements.some((announcement) => announcement === null)) throw new Error('PORTAL_API_INVALID_RESPONSE');
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
  const createdAt = typeof value.createdAt === 'number' ? value.createdAt : 0;
  return { id, title, content, priority, createdAt };
}

export function createPortalGateway(config: PortalGatewayConfig = portalGatewayConfig()): PortalGateway {
  if (!config.useApi) {
    return {
      getCurrentSession: async () => null,
      getPublicTracking: async () => { throw new Error('PORTAL_API_NOT_CONFIGURED'); },
      getAnnouncements: async () => { throw new Error('PORTAL_API_NOT_CONFIGURED'); },
    };
  }
  return new HttpPortalGateway(config.apiBaseUrl);
}

export const portalGateway = createPortalGateway();
