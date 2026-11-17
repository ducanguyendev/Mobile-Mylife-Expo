# Device test matrix

Repository context: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md); artifact identity: [RELEASE_BUILD_VALIDATION.md](RELEASE_BUILD_VALIDATION.md).

| Environment | Executed | Status / limit |
| --- | --- | --- |
| MyLife_M9 Android15/API35 x86_64 | Release install/login/restore, private photo/Recent Apps, background/power/font recreation; resumed Profile/Admin/fault/performance evidence separate | PARTIAL PASS;720×1280,320dpi,360dp,font1.3,WHPX/SwiftShader |
| Physical Android | No authorized physical device in inventory | NOT TESTED; no user device changed |
| iOS simulator/iPhone | No authorized macOS/Xcode/iOS environment | NOT TESTED |
| TalkBack/VoiceOver | Accessibility tree/contrast only | Speech/focus NOT TESTED |
| Real Google Drive | Dedicated provider missing | BLOCKED |
| Real VietMap tiles | Authorized key missing | BLOCKED |

Reproduce with `PG_BIN=E:/PostgreSQL/18/bin`, `MYLIFE_M9_NATIVE_HOLD=1 node scripts/run-isolated-m9.cjs --native-only`; then `node scripts/m9-native.cjs seed`, `node scripts/m9-performance.cjs seed`, `node scripts/m9-performance.cjs measure`, and `node scripts/m9-native-proxy.cjs`. Private ADB5042 targets emulator-5592/MyLife_M9,5088 reverse to5091. ADB/PostgreSQL require sandbox escalation on this host. Do not reuse credentials from a dropped dataset.

Normal synthetic logins: `node scripts/m9-native.cjs login USER 410`, `ADMIN 700`, `PERF 800`. Release helper: `node scripts/m9-release-regression.cjs profile 550`; use fresh evidence indices. UI dump uses `/data/local/tmp` after external-storage shell access failed. Harness writes only redacted hierarchy and filtered screenshots; filled forms/emails are excluded from screenshots.

Stop held runtime with `.tmp/m9-native-done`, verify DB drop/PostgreSQL/API stop, then stop task proxy/emulator/private ADB and remove temporary credentials. Leave the user's default ADB/device connections alone. Final cleanup evidence is authoritative.

Final17-Nov coverage on `eda69836…`: three Profile save/Back/read-back cycles; password change/cleared fields/new-password login; USER↔ADMIN revocation/fresh tabs; Admin stats/users/logs/family denial/read503 recovery/confirmed interrupted lock; lost committed album201/reopen/reconcile; pre-dispatch/body46-byte/429/502/503; background/process death/double-tap;100/500/100/120 dataset memory/frames; three cold/three warm meaningful-Home observations; actual black Recent Apps card. Detailed results are separate native JSON. Successful measurement collection does not imply all performance gates passed.

System picker opens/cancels, but no selectable media is provisioned on this dedicated emulator; final-APK avatar upload/remove and interrupted photo upload NOT TESTED. No broader photo permission is granted to bypass that fixture issue. Default ADB5037 was re-enumerated17-Nov and lists no physical devices. iOS remains unavailable.
