# M2 Android native smoke

Verdict for the 14 requested functional smoke scenarios: **PASS — native Android Expo Go experience verified against real disposable Backend/PostgreSQL**. This is not a standalone/release-build or complete accessibility certification.

Android 15 / API 35, Expo Go 58.0.5, SDK 58, emulator `emulator-5580`, disposable AVD `MyLife_M2`. WHPX acceleration was available. AVD data was created under this repository's ignored `.tmp/m2-avd`, using an already installed image/APK; existing personal AVDs were not changed. The default 12 GB partition exceeded available disk space; the isolated AVD successfully ran with a 2047 MB partition.

Backend source stayed at `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`. The harness created a separate loopback PostgreSQL cluster/database with synthetic accounts, a random JWT key, five-second access expiry, ten-minute refresh expiry and Google/Drive/geocoding disabled. These overrides affected only that process. No production database or real account was used. Runtime metadata contains no password/token.

| Requested scenario | Result and evidence |
| --- | --- |
| Cold start | PASS — native. Logged-out English login (`01`); force-stop/reopen restored authenticated Dark/VI Home (`05`). Expo Go host/developer-menu handoff sometimes required opening the experience again; this is not a standalone app launch result. |
| Registration | PASS — native UI submitted valid synthetic registration to real API, then returned to login with registered email. The subsequent native login/Home (`02`) and DB account/session prove persistence. |
| Login | PASS — native USER login (`02`), seeded ADMIN login (`18`), separate second USER (`21`). |
| Session after restart | PASS — native authenticated Home after force-stop/reopen (`05`), without clearing app data. |
| SecureStore behavior | PASS — real native module behavior, not a storage adapter. Session survives process restart, rotating pair remains usable after restart, logout/revocation returns to auth. Keystore internals/encryption-at-rest were not inspected. |
| Logout | PASS — Profile sign-out returns to login (`20`); native ADMIN session is revoked in `admin-session-after-logout.txt`. |
| Access-token expiry | PASS — native real 401 responses after the five-second expiry, followed by successful automatic refresh/retries in `network-observation.json`. |
| Refresh-token rotation | PASS — native sessions `13 -> 15 -> 16 -> 17` retire old rows and retain one native active row; see session-before/after-refocus/after-restart text files. Network evidence shows one refresh for three simultaneous Home 401s. No tokens were printed/read into evidence. |
| Session revocation | PASS — only the synthetic user's active refresh rows were revoked in the disposable DB; next Home request returned the app to login (`17`, `session-revoked.txt`). |
| USER/ADMIN restrictions | PASS — real USER Home/member navigation (`04`, `06`); ADMIN Home is honestly unavailable (`18`) and member detail is inaccessible (`19`). Backend integration independently verifies all three endpoints return 403 to ADMIN. |
| Protected family deep links | PASS — authenticated USER opens the actual member (`14`); anonymous and post-logout links stay on login; ADMIN redirects to its family-unavailable screen (`19`). |
| Android Back | PASS — Home member row opens actual detail; hardware Back returns to Home (`06` and observed post-Back tab state). Keyboard Back also dismissed inputs during registration/login. |
| Background/foreground | PASS — after Home was backgrounded, a synthetic member was edited through real HTTP. Foreground displayed the new name without manual reload (`16`). |
| Connection loss | PASS — native real API connection failure displayed localized per-section errors (`07`); retry restored family, pull-to-refresh restored anniversaries and actual empty album metadata (`08`). See method qualification below. |

Numbers refer to corresponding filename prefixes in `test-results/native/`. Machine summary: `smoke-results.json`.

## Additional settings and layout checks

Dark/VI and Light/English apply immediately to Home, tab labels, Profile and Auth. Dark/VI survives cold restart. System appearance follows Android `cmd uimode night yes/no` (`12`, `15`). System language follows Android's OS-managed per-app locale when changed to `vi-VN`; Auth is Vietnamese in `26`. That last capture is logged out because the deliberately short ten-minute refresh lifetime had elapsed; `second-user-session-locale-change.txt` records expiry times. It is not counted as a new session-persistence success or failure.

One AVD simulated three viewport classes: standard approximately 393x851dp, compact 360x640dp at 130% font scale, large 800x1280dp. Long display name/email wrap in Profile (`22`, `23`). Disabled profile/avatar/password workflows expose enabled=false in the accessibility tree (`13`). Font/device configuration changes can recreate the Android activity; do not infer preserved navigation state across those emulator configuration changes.

Intermediate resize captures exposed clipped intrinsic header/button labels. Shared title/button flex was corrected; `24-compact-home-final` and `25-large-home-final` supersede `10`, `15` and `21` for final label-layout verification. Other earlier captures remain evidence for their specific auth/data/theme behavior. Expo Go's floating Tools and Refreshing overlays are development chrome, not product UI.

## Network-test qualification

Removing an adb reverse listener and disabling emulator Wi-Fi alone left existing HTTP keep-alive connections working. `network-observation.json` therefore proves refresh/rotation, **not** offline failure. The decisive test reconnected only `emulator-5580` to close its existing transport sockets, restored Metro forwarding only, then pulled Home with API forwarding absent. The actual app displayed errors. Restoring API forwarding, tapping retry and pulling again recovered actual HTTP data. This verifies loss of API connectivity; it is not a claim about every physical-radio/offline/bootstrap combination.

## Unverified coverage

- NOT TESTED — TalkBack spoken output/focus traversal, although the TalkBack package is installed. UIAutomator labels/states are not a substitute for assistive-technology testing.
- BLOCKED — iOS Simulator/VoiceOver on this Windows host. No iOS device test is claimed.
- NOT TESTED — physical Android devices, standalone development/release builds, native private-image delivery, OS maximum font scaling, complete keyboard/safe-area/transition matrices and direct native storage-fault injection.
- Reduced motion: Android transition/animator scales were set to zero for navigation smoke without a navigation failure. Source subscribes to the native reduced-motion signal; perceptual timing and screen-reader behavior were not separately measured.

## Reproduction and cleanup

`PG_BIN` selects the installed PostgreSQL bin directory. `node scripts/run-isolated-m2.cjs` runs M1 and M2 integration with cleanup. `MYLIFE_M2_NATIVE_HOLD=1` additionally keeps its disposable runtime available and writes ignored `.tmp/m2-runtime.json`; create `.tmp/m2-native-done` to stop. The ignored runtime file contains only synthetic test credentials and is removed when the hold ends.

For Expo Go, disable dotenv loading for the test process (`EXPO_NO_DOTENV=1`), set `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:7902`, start Metro on localhost port 8086 and adb-reverse that port plus API port 7902 to the runtime's allocated Kestrel port. No tracked environment file was changed. Open `exp://127.0.0.1:8086`; family deep links use `/--/family/<synthetic-member-id>`.

The test AVD was shut down, native runtime database dropped and PostgreSQL cluster stopped. See `emulator-cleanup.json` and `runtime-lifecycle.json`. No native build was published/submitted and no personal AVD was reset.
