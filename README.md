# MyLife Mobile V3

React Native + Expo application for a calm, image-first family archive. It includes the Phase 1 design system and Phase 2 mobile authentication foundation. Home, Family, and Memories remain illustrative mock screens; no family data APIs are connected.

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
```

## Routes

- `/(tabs)` — Home
- `/(tabs)/family` — Family prototype
- `/(tabs)/memories` — Memories prototype
- `/(tabs)/profile` — Profile and theme settings
- `/(auth)/login` — Login
- `/(auth)/register` — Registration
- `/dev/design-system` — internal component showcase, reachable from Profile

Theme preference supports System, Light, and Dark modes for this app session. Session bootstrap, protected routes, login, registration, refresh-token rotation, and logout use the backend contract; the remaining feature screens still use mock content.
