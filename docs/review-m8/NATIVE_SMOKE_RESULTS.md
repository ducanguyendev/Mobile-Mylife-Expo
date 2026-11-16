# M8 Android native smoke

Verdict: PARTIAL PASS on Android emulator. This is development-build evidence. Physical Android, iOS, TalkBack and release-like builds are NOT TESTED. Real Google Drive is BLOCKED. All accounts, family records and selected images are synthetic in a disposable PostgreSQL database.

## Environment and build identity

Dedicated MyLife_M8 Android15/API35 x86_64 emulator, WHPX/SwiftShader,720×1280 at320dpi,360dp and130% system font. SDK58, React Native0.88.1 and VietMap3 remain unchanged. A private ADB server and loopback API/proxy isolate the run. Metro serves the development bundle.

Initial Profile/avatar/password and Graph/Map checks use the existing SDK58 development APK, SHA256 `e7a7d25991741489481c8546d091d0a2637ce28d563d04b0b7538918358d9540`. The final APK adds the one-shot POST config plugin, SHA256 `ec9103b79ba1d1ee05e5bfcf8e9ccb97d8c0da4734026fe7e88ac33bc585e7b3`. Its Gradle debug build completes successfully in10m57s with523 tasks. The intermediate61896462 build broadly disabled connection recovery and is superseded. A native rebuild is required to apply the final plugin.

## Executed coverage

| Scenario | Result | Evidence in test-results/native |
| --- | --- | --- |
| USER login, fresh Profile, edit/discard, inline save, Back, Home displayName | PASS covered paths | profile-save-api.json, captures35–37 |
| System picker, local PNG preview, singular multipart avatar upload, confirmed delete | PASS with adapter | captures38–43, avatar-upload-api.json, password-avatar-api.json |
| Password change, cleared fields, logout, new-password login | PASS on initial APK | password-avatar-api.json and native captures |
| Graph five members, Map entry and coordinate list | PASS initial APK; tiles BLOCKED | captured Graph/Map screens; authorized map key unavailable |
| USER Admin deep link | PASS denied | capture68 |
| Final APK USER login | PASS | login-user.json |
| Lost committed201 album acknowledgment | PASS mitigation on final APK | fixed-uncertainty.json, captures200–212; exactly one album, shared gate retained on reopen, explicit reconcile |
| Timeline and Calendar | PASS final APK | captures220–222, six source events |
| Private image, session revocation and account switch | PASS covered paths | captures225–268, login-switch.json, session-revocation.json, switched-account-api.json; foreign API404 and empty switched Library |
| ADMIN login and native tab separation | PASS | login-admin.json, captures300–307 |
| Real stats, users search/details, role promotion/demotion | PASS | captures307–327, admin-role-admin-api.json, admin-role-user-api.json |
| Lock/unlock and refreshed status/counts | PASS | captures332–345, admin-locked-api.json, admin-unlocked-api.json; unlock requires new sign-in |
| Permitted delete and family-protected409 rejection | PASS | captures353–359, admin-deleted-api.json, admin-protected-delete-api.json |
| Login logs, actual statuses, filters/sort and latest50 notice | PASS | captures360–365, redacted XML; screenshots containing email/IP omitted |
| ADMIN deep link to USER family route | PASS denied | capture366 returns Overview |
| Light/Dark and VI/EN | PASS sampled final APK | captures368–374; settings restored to English/Light |
| Offline stats hide cached counts, retry restores authoritative data | PASS | captures375–378, controlled loopback proxy outage |
| Current ADMIN demoted remotely, old session rejected, fresh USER tabs | PASS | current-admin-demote.json, login-demoted.json, captures400–411 |
| Current USER promoted remotely, private gallery replaced by expired-session login | PASS | current-admin-restore.json, capture422 |
| Task-switcher snapshot privacy | OPEN / observed exposure | task-switcher.json, task-switcher-synthetic.png; synthetic private photo remains visible in OS recent-app card |

The current-account role transitions use supported Admin endpoints through a separate disposable actor. Both transitions revoke old sessions. The native session returns to login before the new role can be used. This directly exercises the protected route and native-tab transition, beyond changing another account in a list.

## Stability and limits

Profile automatic return after save repeatedly triggers Fabric addViewAt failures on the initial APK. Stable native containers and inline save feedback allow the covered save/Back/Home replay to pass. The underlying renderer cause and wider matrix remain OPEN. Historical M7-13 FocusEvent ANR and M5-07 first lazy Map reload remain distinct OPEN issues.

Final cached-bundle cold first-screen readiness is23,424ms and warm readiness10,439ms. Both observe real Admin UI; hierarchy-dump polling adds overhead. These are development observations rather than release startup benchmarks. See readiness.json and ANDROID_ANR_INVESTIGATION.md. Blank/EOF attempts while Metro recovered from host pressure/cache corruption are excluded from successful readiness claims.

No native percentage progress is fabricated. Adapter provider IDs intentionally cannot prove remote avatar rendering. Native GIF/WebP, iOS HEIC export, picker process death, repeated configuration recreation, cache forensics, physical slow networks, screen-reader speech and release startup remain unverified. Graph/Map were not repeated on the final native-policy APK; Timeline/Calendar/Library and Profile/Admin navigation were.

## Evidence and cleanup

Hierarchy evidence redacts email, IP and password nodes. Screenshots containing typed fields, email or IP are omitted. Task-switcher evidence is inspected separately because its bitmap can contain content absent from the accessibility hierarchy. Only the synthetic striped photo is retained there. No production data or provider credentials are used.

The held API and PostgreSQL are stopped and the random database dropped, recorded in backend-cleanup.json. Task-owned Metro, proxy, emulator/private ADB and temporary credentials are removed after QA. Final cleanup.json records independently checked process/port and filesystem outcomes.
