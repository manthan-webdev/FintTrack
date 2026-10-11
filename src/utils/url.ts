/**
 * FinTrack Application URL & Redirect Resolver
 * Provides environment-aware, production-safe URL resolution for Supabase Auth flows
 * (password reset, email verification, and OAuth).
 */

/**
 * Returns the canonical application base URL.
 * Priority:
 * 1. Explicitly configured production environment variable (VITE_APP_URL or VITE_SITE_URL).
 * 2. Active client-side browser origin when accessing over non-localhost (e.g., Cloud Run preview or custom domain).
 * 3. AI Studio preview origin (APP_URL / VITE_PREVIEW_URL) if available.
 * 4. Local browser origin (http://localhost:3000).
 * 5. Default local dev fallback.
 */
export function getAppBaseUrl(): string {
  // 1. Explicitly configured frontend environment variable (recommended for production deployment)
  const envUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.VITE_SITE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 2. Active browser origin: If accessed via a publicly accessible host (e.g. Google Cloud Run preview)
  if (typeof window !== 'undefined' && window.location?.origin) {
    const hostname = window.location.hostname;
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1';

    if (!isLocal) {
      return window.location.origin.replace(/\/+$/, '');
    }
  }

  // 3. AI Studio preview environment detection (injected via vite define from process.env.APP_URL)
  const previewUrl =
    (import.meta as any).env?.VITE_PREVIEW_URL ||
    (typeof process !== 'undefined' && (process as any).env?.APP_URL);
  if (previewUrl && typeof previewUrl === 'string' && previewUrl.trim()) {
    return previewUrl.trim().replace(/\/+$/, '');
  }

  // 4. Localhost browser origin fallback
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  // 5. Build/SSR fallback
  return 'http://localhost:3000';
}

/**
 * Returns the current preview origin if running in AI Studio preview, or undefined.
 */
export function getPreviewOrigin(): string | undefined {
  const preview =
    (import.meta as any).env?.VITE_PREVIEW_URL ||
    (typeof process !== 'undefined' && (process as any).env?.APP_URL);
  if (preview && typeof preview === 'string' && preview.trim()) {
    return preview.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.run.app')) {
      return window.location.origin.replace(/\/+$/, '');
    }
  }
  return undefined;
}

/**
 * Resolves the absolute redirect URL for Supabase password recovery.
 * Directs the user back to the /reset-password route.
 * e.g., https://fintrack.example.com/reset-password or http://localhost:3000/reset-password in dev.
 */
export function getPasswordResetRedirectUrl(): string {
  const base = getAppBaseUrl();
  return `${base}/reset-password`;
}

/**
 * Resolves the absolute redirect URL for Supabase signup email confirmation.
 * Directs the user back to the /login route.
 * e.g., https://fintrack.example.com/login or http://localhost:3000/login in dev.
 */
export function getEmailConfirmRedirectUrl(): string {
  const base = getAppBaseUrl();
  return `${base}/login`;
}

/**
 * Checks whether the current runtime environment is local development.
 */
export function isLocalEnvironment(): boolean {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  }
  return Boolean((import.meta as any).env?.DEV);
}
