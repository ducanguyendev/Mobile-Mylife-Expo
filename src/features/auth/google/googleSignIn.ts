import * as Google from 'expo-auth-session/providers/google';
import type { AuthSessionResult } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { appEnv } from '@/config/env';

// Completes the browser-based OAuth flow when Google redirects back to the app.
// Must run at module level, before any prompt is shown.
WebBrowser.maybeCompleteAuthSession();

// The client ID that matters is the one for the platform the app runs on.
// The backend validates the ID token audience against its own Google client ID
// plus Authentication:Google:AllowedClientIds, so each platform client ID used
// here must also be listed there.
const googleClientIdForPlatform =
  Platform.OS === 'android' ? appEnv.googleAndroidClientId : Platform.OS === 'ios' ? appEnv.googleIosClientId : appEnv.googleWebClientId;

export const isGoogleSignInConfigured =
  googleClientIdForPlatform !== null && !googleClientIdForPlatform.startsWith('YOUR_GOOGLE_');

// useIdTokenAuthRequest throws at render time when the platform client ID is
// missing, so the hook always receives a value; the sign-in button is gated on
// isGoogleSignInConfigured and never prompts with a placeholder.
const PLACEHOLDER_ANDROID_CLIENT_ID = 'YOUR_GOOGLE_ANDROID_CLIENT_ID';
const PLACEHOLDER_IOS_CLIENT_ID = 'YOUR_GOOGLE_IOS_CLIENT_ID';
const PLACEHOLDER_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID';

// Note: the expo-auth-session Google provider is deprecated upstream in favour
// of @react-native-google-signin/google-signin (native). It still works on the
// pinned SDK 58 and needs no native rebuild; revisit when upgrading the SDK.
export function useGoogleIdTokenRequest(language: 'vi' | 'en') {
  return Google.useIdTokenAuthRequest({
    androidClientId: appEnv.googleAndroidClientId ?? PLACEHOLDER_ANDROID_CLIENT_ID,
    iosClientId: appEnv.googleIosClientId ?? PLACEHOLDER_IOS_CLIENT_ID,
    webClientId: appEnv.googleWebClientId ?? PLACEHOLDER_WEB_CLIENT_ID,
    language,
  });
}

// On native the hook exchanges the authorization code for tokens and the ID
// token arrives in `authentication`; on web it arrives in the redirect params.
export function extractGoogleIdToken(result: AuthSessionResult): string | null {
  if (result.type !== 'success') return null;
  return result.authentication?.idToken ?? result.params.id_token ?? null;
}
