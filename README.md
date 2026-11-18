# MyLife Mobile V3

React Native + Expo application for a calm, image-first family archive. It includes the mobile design system, native authentication and an API-backed family member list/detail/CRUD foundation. Home and Memories remain illustrative; family graph/map and the other Web W10 modules are not yet implemented. See [M1 review](docs/review-m1/REPORT.md) for verified scope and M2–M9 work packages.

## Run in Expo Go

```powershell
npm install
npm run start
```

Open the project in Expo Go or press `a` in the Expo terminal to open an Android emulator.

## Authentication API setup

Create `.env.local` from `.env.example` and set `EXPO_PUBLIC_API_BASE_URL`. For the Android emulator, use `http://10.0.2.2:5274`; `localhost` inside the emulator points to the emulator itself. A physical device needs the development computer's reachable LAN address. Do not commit `.env.local` or put private OAuth/API secrets in Expo public variables.

Start the backend in a separate terminal:

```powershell
cd D:\DUAN\MYLIFE\Backend-MyLife
dotnet run
```

The backend development profile is expected at `http://localhost:5274` on the host machine. Expo sends `X-Client-Platform: mobile` on API requests, uses Bearer access tokens, and keeps the access/rotating refresh token pair together in SecureStore. The Remember email option stores only the email in AsyncStorage; passwords are never persisted.

Google sign-in is available on the login screen. It uses `expo-auth-session` to obtain a Google ID token and posts it to the backend (`POST /api/auth/google`), which verifies the token and returns the same native token pair as password login. No client secret is used on the device.

### Google sign-in setup

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth 2.0 client ID for each platform:
   - **Android**: package name `com.anonymous.mylifemobile` (from `app.json`), plus the SHA-1 of the signing key.
   - **iOS**: first set `ios.bundleIdentifier` in `app.json` (none is configured yet), then create the client for that bundle ID.
   - **Web**: needed for Expo web.
2. Copy the three client IDs into `.env.local` (see `.env.example`):
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
3. In the backend config, add the Android and iOS client IDs to `Authentication:Google:AllowedClientIds` (the backend also needs `Authentication:Google:ClientId` set). Without this the backend rejects the ID token (audience mismatch).
4. The OAuth redirect uses the app scheme from `app.json` (`mobilemylifeexpo`). No redirect URI registration is needed for the Android/iOS clients.

Until the client IDs are configured, tapping the Google button shows a "not configured" message instead of opening the browser. Note: the `expo-auth-session` Google provider is deprecated upstream in favour of `@react-native-google-signin/google-signin` (native); it still works on the pinned SDK 58, revisit when upgrading the SDK.

## Validation

```powershell
npm run lint
npx tsc --noEmit
npm run test:auth
npm run test:foundation
```

## Routes

- `/(tabs)` — Home
- `/(tabs)/family` — API-backed member list; tree/map placeholders
- `/(tabs)/memories` — Memories prototype
- `/(tabs)/profile` — Profile and theme settings
- `/(auth)/login` — Login
- `/(auth)/register` — Registration
- `/family/new`, `/family/[id]`, `/family/[id]/edit` — USER-only member forms/details
- `/dev/design-system` — internal component showcase, reachable from Profile

Theme preference supports System, Light, and Dark modes for this app session. Authentication strings support VI/EN using the device locale; most feature/navigation text is still Vietnamese. Profile account data is real, but profile editing/security settings are not implemented.

## Isolated M1 verification

Install PostgreSQL binaries and restore/build the reference Backend first. From this repo, run `npm run test:integration`. The runner creates its own loopback PostgreSQL cluster and synthetic accounts, then tests actual Expo API/auth/payload source against real Kestrel HTTP. Only the native Platform/SecureStore bridge is adapted for Node; this does not replace on-device Keychain/Keystore QA. The database is dropped and the cluster stopped afterward. It never targets the normal MyLife database. See [test results and commands](docs/review-m1/TEST_RESULTS.md).
