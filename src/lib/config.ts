const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
if (process.env.NODE_ENV === 'production' && (!rawApiBaseUrl || !rawApiBaseUrl.startsWith('https://'))) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL must be an HTTPS URL for production builds.');
}
const configuredApiBaseUrl = trimTrailingSlash(rawApiBaseUrl || 'http://localhost:5000/api/v1');
const configuredApiFallbackBaseUrl = process.env.EXPO_PUBLIC_API_FALLBACK_BASE_URL
  ? trimTrailingSlash(process.env.EXPO_PUBLIC_API_FALLBACK_BASE_URL)
  : '';
const apiBaseUrls = Array.from(new Set([configuredApiBaseUrl, configuredApiFallbackBaseUrl].filter(Boolean)));

export const appConfig = {
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'HealthClan',
  apiBaseUrl: configuredApiBaseUrl,
  apiBaseUrls,
  apiTimeoutMs: Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 20000),
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};
