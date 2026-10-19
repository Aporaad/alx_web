/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** العنوان الأساسي لـ alx_api — primary alx_api base URL. */
  readonly VITE_PORTAL_API_BASE_URL?: string;
  /** بدائل اختيارية لنفس العنوان — optional aliases for the same base URL. */
  readonly VITE_ALX_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  /** تفعيل مرور كل البيانات عبر alx_api (مفعّل افتراضياً عند توفر عنوان). */
  readonly VITE_PORTAL_API_ENABLED?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
