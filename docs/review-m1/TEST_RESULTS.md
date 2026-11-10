# M1 test results and reproduction

Date: 10 November 2026, Asia/Saigon. Baseline Expo commit `7fa31245bc2bcfc6a58a28879bba9df028f13e45`; Backend reference `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`.

## Baseline and final checks

| Command/check | Baseline result | Final result |
|---|---|---|
| `npm install --no-audit --no-fund` | Exit 0, up to date | Exit 0, up to date; no dependency/lockfile changes |
| `npm run lint` | Exit 1: 4 errors, 3 warnings | Exit 0: 0 errors/warnings |
| `npx tsc --noEmit` | Exit 2: TS7053 (`form` not in result type) | Exit 0 |
| `npm run test:auth` | Exit 0: 10 pass, 0 fail | Exit 0: 10 pass, 0 fail |
| New family/guard safety tests | 5 cases: 2 pass, 3 fail before fixes | All 5 pass |
| `npm run test:foundation` | Not present initially | Exit 0: 26 pass, 0 fail/skip (10 original + 5 family/guard + 11 native-session) |
| Isolated original-source integration | Exit 0 for expected reproduction: 4 pass groups, 2 reproduced defects | Original source remains reproducible using `--baseline`, without altering the worktree |
| `npm run test:integration` | Original payload erased relation; original late refresh restored a usable logged-out session | Exit 0: 7 groups pass with real Kestrel/PostgreSQL |
| Android Metro/Hermes export | Not run initially | Exit 0; approximately 3.1 MB bundle; not an APK/device test |

Raw logs/TAP, [baseline integration](test-results/baseline-integration.json), [final integration](test-results/final-integration.json), [baseline lifecycle](test-results/baseline-lifecycle.json), [final lifecycle](test-results/final-lifecycle.json) and contrast measurements are retained in `test-results/`.

Baseline lint errors were synchronous state updates in the family list/detail/edit initialization and MemberForm effect. Warnings were unused Alert/IconButton and a ternary used as an expression. Fixes use one focus-owned screen load, keyed per-account content and lazy form initialization; the lint rule was not disabled. A follow-up concurrency test initially failed for logging out a newly signed-in session while an older logout was pending; its test result is retained as `logout-followup-before.tap`. The final 11 native-session tests cover that correction.

## What the real integration actually proves

The suite executes the actual Expo TypeScript API client, auth API/provider methods, token-storage serialization, family service and converter. Fetch requests go to real Kestrel and a newly provisioned PostgreSQL database; no API responses are fabricated.

Only the unavailable native runtime boundaries are adapted: `Platform.OS = android`, SecureStore/AsyncStorage storage primitives and React hook execution in Node. This verifies source-level transport/state behavior and real server/database effects. It does **not** verify Android/iOS native bridges, actual Keychain/Keystore encryption, native UI navigation, app restart persistence, screenshots or device performance.

Final real HTTP groups cover:

1. Synthetic registration/login and session restoration using a new runtime with the persisted serialized pair.
2. Two members, explicit sibling relation, unrelated phone edit and refetch proving both relation directions survive.
3. USER/ADMIN restrictions and foreign member IDs; generation metadata matches its DTO.
4. Six concurrent requests after access expiry share one refresh POST and persist rotation. An additional immediate rotation rejects an old access token while it is still unexpired, exercising W10 `sid` rather than only expiration.
5. Logout clears storage; copied access and refresh are rejected immediately.
6. A deliberately delayed **real** refresh response cannot resurrect storage after logout; the late rotated `sid` is also revoked on Backend.
7. Invalid sessions are rejected/cleared and anonymous family access is denied.

Native transport asserts Bearer/mobile-header usage, `credentials: omit`, no Cookie header and no Set-Cookie responses. The lifetime is deliberately five seconds to exercise expiry without long waits. All accounts/keys are synthetic. No token/password/connection secret is printed.

## Commands

From Expo:

```powershell
npm.cmd install
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run test:auth
npm.cmd run test:foundation
```

For isolated HTTP verification, install PostgreSQL binaries and restore the reference Backend first:

```powershell
dotnet restore ..\Backend-MyLife\MyLife.csproj
# Optional when PostgreSQL bin is not on PATH:
$env:PG_BIN = 'E:\PostgreSQL\18\bin'
npm.cmd run test:integration
```

The runner creates a unique `.tmp/m1-integration-*` cluster bound only to loopback and a database named `mylife_m1_*`. It overrides connection/auth/provider settings with test-only values, builds/starts Kestrel and applies migrations only to that new database. It drops exactly that database and stops the cluster in `finally`, including on a failed check. Cluster files remain for inspection. Local trust authentication applies only to this temporary loopback test cluster. Do not point tests at an application/production database.

To replay the original defects from the pinned baseline source in memory:

```powershell
node scripts/run-isolated-m1.cjs --baseline
```

This requires commit `7fa3124` to exist locally. It uses `git show`, does not checkout/reset any files, and runs in a fresh disposable cluster. The original API client/provider/converter are loaded from that commit while the current test harness remains in place. Expected reproduced defects are labelled REPRODUCED, not successful corrected behavior.

Optional bundling check used in M1 (offline, no local credentials loaded):

```powershell
$env:EXPO_NO_DOTENV = '1'
$env:EXPO_OFFLINE = '1'
$env:CI = '1'
$env:EXPO_PUBLIC_API_BASE_URL = 'http://127.0.0.1:1'
node node_modules/expo/bin/cli export --platform android --output-dir ../.tmp/m1-android-export
```

This does not generate/edit native `android/` or `ios/` projects, deploy, submit or publish. [Expo CLI reference](https://docs.expo.dev/more/expo-cli/).

## Not tested

Physical Android/iOS, actual SecureStore/Keychain/Keystore persistence, native deep-link/back-stack behavior, VoiceOver/TalkBack, rendered theme/responsive screenshots, Google OAuth, Drive storage/media lifecycle, native map provider, HTTPS staging and long-duration memory/performance. Unit/adapter/export successes must not be presented as those passes.
