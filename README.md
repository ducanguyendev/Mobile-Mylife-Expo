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

Google login is not enabled because no public Google client IDs are configured for this Expo app. The backend accepts an ID token from native clients; Google client secrets must remain server-side. Configure platform-appropriate public client IDs and an Expo OAuth redirect flow before exposing a Google button.

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
