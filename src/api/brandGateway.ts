import { portalApiConfig } from './config';

/**
 * هوية الشركة من قاعدة البيانات — company identity read from the database.
 * اسم الشركة وشعارها يملأهما المالك في الإعدادات العامة، فلا ثابت منها في الكود.
 * The owner fills both in General Settings, so nothing about the brand is hard-coded here.
 */
export interface PortalBrand {
  systemName: string | null;
  companyName: string | null;
  systemLogo: string | null;
}

const BRAND_PATH = '/api/v1/settings/brand';

function text(value: unknown): string | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw.length > 0 ? raw : null;
}

function toBrand(payload: Record<string, unknown> | undefined): PortalBrand {
  return {
    systemName: text(payload?.systemName),
    companyName: text(payload?.companyName),
    systemLogo: text(payload?.systemLogo),
  };
}

/**
 * طلب واحد لكل تحميل الصفحة: الهوية مرجعية ثابتة، والفشل يعني الافتراضي لا الانهيار.
 * One request per page load — branding is static reference data, and a failure falls back to the
 * neutral default instead of breaking the portal shell.
 */
let brandRequest: Promise<PortalBrand> | null = null;

export function loadPortalBrand(): Promise<PortalBrand> {
  if (brandRequest) return brandRequest;
  const { apiBaseUrl, enabled } = portalApiConfig();
  if (!enabled) return Promise.resolve(toBrand(undefined));
  brandRequest = fetch(`${apiBaseUrl}${BRAND_PATH}`, { headers: { accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('BRAND_REQUEST_FAILED'))))
    .then((body: { data?: Record<string, unknown> }) => toBrand(body?.data))
    .catch(() => toBrand(undefined));
  return brandRequest;
}
