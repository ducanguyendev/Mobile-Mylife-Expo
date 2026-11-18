# MyLife Mobile V3

React Native + Expo application for a calm, image-first family archive. Milestones M1–M9 are implemented: a live-data Home dashboard, family member CRUD with an SVG family graph and a native VietMap map, a Timeline + lunar anniversary calendar + photo Library, and Profile with account editing, security, and admin screens. See the milestone reports under `docs/` for verified scope (M2–M9 work packages, M9 release-safety audit).

The working branch is `feature_minhduc`. `main` is a placeholder.

## Requirements

- Node.js 20+ and npm
- Android Studio (for the Android emulator and SDK) or a physical Android device
- JDK 17 or 21, with `JAVA_HOME` pointing at it. The JDK bundled with Android Studio works:

  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
  ```

  A wrong `JAVA_HOME` (for example a JDK 8/11 install, or a JDK whose `java` is not on the build path) fails the Gradle build with a "could not find java" style error — point `JAVA_HOME` at the Android Studio JBR first.

- The MyLife backend running locally (see below).

## Run (development build, not Expo Go)

This app uses native modules (`expo-dev-client`, VietMap GL, `expo-crypto`) that are **not** included in Expo Go, so it needs a development build. Do not open it in Expo Go.

```powershell
npm install
npm run android
```

`npm run android` runs `expo run:android`: it builds the native app and installs it on the connected emulator or device, then starts the Metro bundler. After adding or updating a package with native code, re-run `npm run android` so the dev build includes the new module.

For a quick web preview (no native modules, layout only):

```powershell
npm run web
```

## Authentication API setup

Create `.env.local` from `.env.example` and set `EXPO_PUBLIC_API_BASE_URL`. For the Android emulator, use `http://10.0.2.2:5274`; `localhost` inside the emulator points to the emulator itself. A physical device needs the development computer's reachable LAN address. Do not commit `.env.local` or put private OAuth/API secrets in Expo public variables.

Start the backend in a separate terminal:

```powershell
cd D:\DUAN\MYLIFE\Backend-MyLife
dotnet run
```

The backend development profile is expected at `http://localhost:5274` on the host machine. Expo sends `X-Client-Platform: mobile` on API requests, uses Bearer access tokens, and keeps the access/rotating refresh token pair together in SecureStore. The Remember email option stores only the email in AsyncStorage; passwords are never persisted.

Forgot password is available from the login screen: the app sends the reset request and the email link opens the web reset page (`/reset-password` on the MyLife website).

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

### VietMap

The family map renders VietMap tiles through the native GL module. Set the public, domain/IP-restricted tile key in `.env.local` (see `.env.example`):

```text
EXPO_PUBLIC_VIETMAP_TILE_KEY=
```

Never use a services/geocoding key here. Without a key the map tiles do not load.

Avatars and library photos are served by the backend (Google Drive via the backend's Apps Script integration); there is no Drive configuration on the mobile side.

## Validation

```powershell
npm run lint
npm run typecheck
npm run test:foundation
npm run test:m7
npm run test:m8
npm run test:m9
```

Run lint and typecheck before declaring any task done. Each milestone has its own suite (`test:m2` … `test:m9`); the `test:integration:*` scripts run the same suites against an isolated backend + PostgreSQL cluster.

## Routes

- `/(tabs)` — Home (live dashboard: family summary, next anniversary, recent albums)
- `/(tabs)/family` — Family graph (SVG, pan/zoom), member list, and VietMap map
- `/(tabs)/memories` — Timeline, lunar anniversary calendar, and photo Library
- `/(tabs)/profile` — Profile, account editing, avatar, security, and admin (admin role only)
- `/(auth)/login` — Login (email/password + Google)
- `/(auth)/register` — Registration
- `/(auth)/forgot-password` — Password reset request (the email link opens the web reset page)
- `/family/new`, `/family/[id]`, `/family/[id]/edit` — USER-only member forms/details
- `/dev/design-system` — internal component showcase, reachable from Profile

Theme preference supports System, Light, and Dark modes, persisted across sessions. The app is fully bilingual (Vietnamese/English) and follows the device locale, with a language switcher on the login/register screens and in Profile settings.

## Known limitations

Per the M9 release-safety audit, the app is feature-complete but **not release-ready**: the family graph misses its frame budget on large trees, memory usage exceeds budget on long sessions, and cold Home load is ~4–5s. Real Google Drive and VietMap quota/release-key verification is still pending, and the release identity is not set yet (`android.package` is still `com.anonymous.mylifemobile`, no `ios.bundleIdentifier`). See the M9 report under `docs/` for details.

## Isolated M1 verification

Install PostgreSQL binaries and restore/build the reference Backend first. From this repo, run `npm run test:integration`. The runner creates its own loopback PostgreSQL cluster and synthetic accounts, then tests actual Expo API/auth/payload source against real Kestrel HTTP. Only the native Platform/SecureStore bridge is adapted for Node; this does not replace on-device Keychain/Keystore QA. The database is dropped and the cluster stopped afterward. It never targets the normal MyLife database. See [test results and commands](docs/review-m1/TEST_RESULTS.md).
