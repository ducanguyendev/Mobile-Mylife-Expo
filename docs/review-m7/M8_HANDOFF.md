# M8 handoff

> Current verification, 16 November 2026. GitHub Expo quality run 43792501120 succeeded on c55a476f01c14cb0cd24428deb17e4d1af9d85c9. Backend Tests/AnniversaryDateIntegrityTests.cs resolves remotely at ca20ba52635a026b32449f919e60410ff880c829, and M8 independently reruns all nine cases successfully. Historical pending-CI and remote-sync statements below are superseded. Production deployment remains unverified. See ../review-m8/test-results/github-evidence.json.


M7 Library source is implemented and automated checks pass; development verdict PARTIAL PASS and application release NOT READY. M8 development may proceed while retaining all carry-forward release gates. Do not treat new Profile/Admin/Security scope as part of M7.

Entry points: protected `/library`, `/library/[albumId]`; both Timeline and Calendar push Library, so Back returns to the originating module. No automatic photo/member or photo/Timeline relation was invented. Home continues to refetch raw album counts when focused. `src/features/library/` owns DTO validation, API, mutation serialization, native File/picker upload, byte media scheduler, shared-theme UI and dialogs.

Keep raw Library successes distinct from anniversary envelopes. Never fetch DTO url/driveFileId. Byte mode in apiClient shares refresh/logout/sessionVersion and rejects stale binary bodies. Image redirect mode is error, expo-image cachePolicy none and account-local pools clear on blur/background. Never persist private image bytes/tokens in AsyncStorage or add public sharing.

Backend category null on photo PUT preserves assignment; there is no clear operation. DisplayDate is exact DD/MM/YYYY with Backend UTC-today validation, not next anniversary date. Overview includes full metadata but no pagination/thumbnails; gallery requests are virtualized/bounded, yet physical decoding/memory still needs profiling. No conditional version exists; fresh comparisons do not close atomic races.15s global request timeout and full-resolution batches need slow-network testing.

No real Drive configuration was authorized; do not reuse production credentials/folders. Run Phase B only in a dedicated authorized disposable environment. Preserve M3 avatar provider gate. Backend203/targeted9 and105 HTTP groups prove local/adapter coverage, not actual Google. The initial AnniversaryDateIntegrityTests.cs remote-sync issue is now CLOSED by Backend ca20ba52 and independent16 November verification.

Follow CARRY_FORWARD_RISKS for physical graph pinch/FPS, iOS/accessibility, dependency14 Moderate, Map production keys/quotas and release build, development-client recreation, original M5 first-Map cause, private media account switching, multipart/platform formats, orphan cleanup and provider availability. Native executed cases and missing matrix are listed separately. M7 GitHub Actions is now verified PASS on exact SHA c55a476f, run43792501120. M8 requires its own future workflow.

Final delivery has88 M7 unit cases and346 unique Expo cases. `libraryMutationsForAccount` shares only mutation flags across overview/detail routes and retains uncertainty after route unmount. It also rejects stale focus activation after another account becomes current. Native core media/CRUD/session tests precede this final pure-JS hardening; re-execute its route-retry scenario during the next Android development-build QA. Do not replace the shared coordinator with a per-screen factory.

Reproduction and cleanup: package test:m7, test:integration:m7, scripts/run-m7-quality.cjs, run-backend-suite-m7.cjs and seed-isolated-m7-native.cjs. Native fixtures require the disposable runtime marker; never seed production. All final task-owned server/emulator/Metro/ADB processes must be stopped and temporary DB dropped before delivery. No automatic commit/push/merge/PR/deploy/publish.
