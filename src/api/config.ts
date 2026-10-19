/**
 * إعداد موحّد لاتصال البوابة بـ alx_api.
 * Single source of truth for the alx_api base URL and the enable flag.
 *
 * كل بيانات الموقع تمر عبر alx_api ثم PostgreSQL — لا يوجد أي اعتماد على Supabase.
 */
export interface PortalApiConfig {
  apiBaseUrl: string;
  enabled: boolean;
}

/** يقرأ عنوان الـ API من المتغيرات المتاحة ويوحّدها — resolves the base URL from the supported env aliases. */
function readApiBaseUrl(): string {
  return String(
    import.meta.env.VITE_PORTAL_API_BASE_URL
      || import.meta.env.VITE_ALX_API_URL
      || import.meta.env.VITE_API_BASE_URL
      || '',
  ).replace(/\/$/, '');
}

/**
 * البوابة مفعّلة عندما يتوفر عنوان API ولم يُعطَّل العلم صراحةً بـ "false".
 * Enabled when a base URL exists and the single flag is not explicitly "false".
 */
export function portalApiConfig(): PortalApiConfig {
  const apiBaseUrl = readApiBaseUrl();
  return {
    apiBaseUrl,
    enabled: apiBaseUrl.length > 0 && import.meta.env.VITE_PORTAL_API_ENABLED !== 'false',
  };
}
