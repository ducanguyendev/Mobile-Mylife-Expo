# M9 handoff

M8 adds real Profile editing, account-avatar lifecycle, provider-aware password security and native Admin Overview/Users/Login logs. Shared preferences and M1–M7 regressions remain part of acceptance. Read REPORT, TEST_RESULTS, NATIVE_SMOKE_RESULTS and CARRY_FORWARD_RISKS before planning M9. Application release remains NOT READY.

## Entry points and contracts

USER keeps Home, Family, Memories and Profile. ADMIN uses `/admin` native tabs with Overview, Users, logs and shared Profile. `/account/edit`, `/account/avatar` and `/account/security` are authenticated shared screens. Root protected navigation, account/role keys, fresh Admin API role checks and Backend RBAC all remain necessary.

Profile writes only displayName, phoneNumber, gender and exact date-only DOB. Password change is available only with authoritative loginProviders.local. Existing sessions remain active after password change. Account-avatar email lookup is publicly discoverable through a provider redirect and requires a product privacy decision. No MFA, device/session list, self-delete, password-reset or Google-linking API exists. Treat those as future contract requirements.

## Native transport dependency

The old development APK can replay a committed POST after a dropped acknowledgment. JavaScript account-wide mutation flags cannot observe that replay. The config plugin installs one-shot POST request bodies through OkHttpClientProvider before React loads. Rebuild the development client after applying this native configuration. Preserve ordinary safe-read recovery, explicit401 single-flight refresh and uncertain-write reconciliation. Read the failure and fixed replay evidence in ANDROID_ANR_INVESTIGATION and `test-results/native`.

Do not use the old e7a7d259 APK as proof of the new policy. The intermediate61896462 build broadly disabled connection recovery and was narrowed to one-shot POST handling. Final build identity and executed scope belong to NATIVE_SMOKE_RESULTS. SDK58/RN0.88.1/VietMap3 stay unchanged.

## Required release work

- Supply a dedicated explicitly authorized disposable Google Drive folder and nonproduction provider deployment. Verify account/member avatars and Library end to end, real IDs/checksums, actual removal, quotas, failure compensation, reconciliation and cleanup.
- Keep M7-13 FocusEvent ANR, M5-07 lazy Map reload and the M8 Fabric save/navigation finding distinct. Perform main-thread tracing and repeated physical/release-like cold/warm/background tests.
- Decide and implement the OS task-snapshot privacy policy. The emulator retains a synthetic private image in its recent-app card, despite network/session fences. Complete physical Android, iOS, TalkBack/VoiceOver, keyboard, reduced-motion, large-font and cache-forensic coverage.
- Add Backend atomic conditional-write and cross-platform idempotency contracts where needed. Preserve last-active-admin locking, caller session revalidation and family-data deletion protection.
- Verify production VietMap key restrictions, quotas, signing, actual tiles and release-build behavior with authorized keys.
- Resolve14 Moderate dependency advisories through an Expo58-compatible update and repeat native regressions.

## Reproduction

Run `node scripts/run-m8-quality.cjs`, `npm run test:m8`, `npm run test:integration:m8`, `node scripts/run-backend-suite-m8.cjs` and its `--anniversary` variant. Windows isolation uses PG_BIN pointing at PostgreSQL18 and .NET10. The HTTP harness creates a random loopback database, substitutes test-only HTTP storage adapters and drops its database on completion.

For explicitly disposable native QA, set MYLIFE_M3_NATIVE_HOLD=1 when launching the M8 integration harness, then use seed-isolated-m8-native.cjs. Credentials stay in ignored `.tmp` files. The native helper targets only MyLife_M8/ADB5041/emulator5590. The fault proxy is loopback-only. `verify-m8-native-uncertainty.cjs` requires the rebuilt APK, correct reverse tunnels and a fresh unique test-album name.

Stop task-owned API, PostgreSQL, Metro, proxy, emulator and private ADB, drop the random database and remove temporary credentials after QA. Exact cleanup evidence is in test-results. The M8 Backend suite uses a separate output directory so it can compile while the held native API DLL is locked on Windows.

M7 GitHub CI and Backend M6 remote test synchronization are verified CLOSED. M8 CI remains NOT RUN until a separately authorized future commit/push finishes its exact-SHA workflow. No commit, push, merge, PR, deploy or publish is part of this delivery.

Final local acceptance is407 unique Expo JS tests,14 contrast checks,134 real HTTP scenario groups and208 Backend tests. The9 anniversary cases are a subset of208. Native one-shot POST fault replay passes on the final ec9103b7 APK. All temporary databases are dropped, PostgreSQL/API and task-owned native servers stopped, the dedicated AVD removed and temporary credential files deleted. Read verified-totals.json, cleanup.json and native/backend-cleanup.json for exact evidence.
