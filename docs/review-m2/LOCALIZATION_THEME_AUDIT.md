# M2 localization and theme

`src/preferences/preferences.ts` persists only `{theme,language}` under `mylife.preferences.v1` in existing AsyncStorage. Values are whitelisted; malformed/missing storage falls back to System. Reads have a three-second startup bound. Serialized writes preserve the latest choice, failures retain the current in-memory choice and expose a localized retry on Profile. Late hydration cannot overwrite a selection made meanwhile. Preferences are independent of login/logout; tokens remain in Expo SecureStore.

AppThemeProvider hydrates before mounting the auth/navigation tree and holds the native splash while reading. This avoids painting the wrong theme before preference restoration; Expo Go's own white launch/developer surfaces and the native launch screen are not claimed as a fully branded release splash. System theme uses React Native useColorScheme. System language uses Expo useLocales, including OS locale-change rerenders. Explicit vi/en overrides take precedence; unsupported languages fall back to Vietnamese.

One typed VI/EN dictionary covers Home, main tab labels/accessibility labels, Profile/settings, feedback/retry/search/select/date/password/avatar defaults and new M2 copy. Existing centralized Auth dictionaries/error-code mapping are reused with the resolved preference; arbitrary Backend messages are not rendered. Auth, root bootstrap and session-expiry feedback receive the same language. The M2 clock uses device-local greeting/hour and date; Backend date-only values use validated Gregorian dates formatted in UTC to prevent timezone shifting. Only Vietnam-specific event filtering uses Asia/Ho_Chi_Minh.

Profile implements real theme and language segmented choices. Edit profile/avatar and change password are explicitly disabled/coming soon, with no chevron or press effect. Name, email, role and provider are derived from the account contract; unknown provider has a localized fallback. No fabricated joined date. Logout delegates to the unchanged native session provider and reports server-logout failure.

Native evidence includes English System cold start, changing to Dark/VI, translated Home/labels and persisted Dark/VI after force-stop/reopen. Unit tests additionally cover corrupt storage, read/write failure/retry, late hydration, write ordering and language fallback. Storage failures are adapter-injected, not a claim of device storage fault testing.

Unfinished Family/Map/Timeline/Memories screens retain existing module copy. Their shared components receive translated defaults; a final audit and full module translation remain M8 work. No complete app-wide or iOS localization PASS is asserted.

API references consulted: [SDK 58 Localization](https://docs.expo.dev/versions/v58.0.0/sdk/localization/), [SDK 58 AsyncStorage](https://docs.expo.dev/versions/v58.0.0/sdk/async-storage/), [SDK 58 SplashScreen](https://docs.expo.dev/versions/v58.0.0/sdk/splash-screen/).
