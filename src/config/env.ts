const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export const appEnv = {
  apiBaseUrl: normalizeBaseUrl(rawApiBaseUrl),
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || null,
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || null,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || null,
} as const;

export const hasGoogleClientConfiguration = Boolean(
  appEnv.googleAndroidClientId || appEnv.googleIosClientId || appEnv.googleWebClientId,
);
