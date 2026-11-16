# M8 delivery report

Development verdict: PARTIAL PASS. Real Profile/account security and native Admin functionality are implemented and locally verified. Application release remains NOT READY because real-provider, native stability, platform and privacy gates remain open. This delivery contains no commit, push, PR, merge, deployment or publication.

## Delivered behavior

Profile reads fresh /api/me and edits only displayName, phoneNumber, gender and date-only DOB. It preserves original fullName and identity, validates and normalizes allowed fields, confirms unsaved discard, detects stale values before writing and refreshes shared identity after save. Home/Profile names and avatar use the updated user. Inline success avoids the reproduced native mounting failure on automatic return.

Account avatar uses the native picker, local preview, explicit upload/remove,5MiB/signature/format checks and verified SDK58 multipart transport. Password security uses authoritative provider flags,8-character/72-UTF8-byte constraints, strength guidance, secure visibility controls and clearing on success/leave/background. Existing sessions remain usable after password change; the UI discloses that limitation. Unsupported MFA/session-list/self-delete/reset/linking controls are absent.

ADMIN receives native Overview/Users/Logs/Profile tabs. Overview validates real counts. Virtualized users/logs support search, actual contract filters, sorting, details and limited-history notice. Role/status/delete actions require confirmation, prevent duplicate dispatch, reconcile authoritative data and respect administrator/family protection. USER keeps Home/Family/Memories/Profile. Protected route entry, API role checks, exclusive Backend roles and revoked session IDs enforce separation.

AuthProvider and SecureStore writes fence stale operation/account results. Foreground/resume identity checks and focused polling detect remote role/lock changes. Sensitive Admin state clears on background, blur or errors. Native role transitions revoke the old session and require fresh sign-in. VI/EN, Light/Dark, keyboard avoidance, accessible field/dialog labels and existing reduced-motion behavior are integrated.

## Scope and contract decisions

Backend changes are limited to three files for confirmed defects: profile phone/gender/future-DOB validation and tests, plus shared advisory transaction locking and caller-session revalidation for role/status/delete races. Web remains reference-only and Flutter is untouched. SDK58/RN0.88.1/VietMap3 and dependency lockfiles are preserved.

An Android config plugin marks POST request bodies one-shot. Native fault injection on the original APK demonstrates an implicit transport replay creating two albums after one committed response is lost. The rebuilt APK retains exactly one album and the account-wide uncertain-write barrier across route reopening until explicit reconciliation. This requires a native rebuild. Backend cross-platform idempotency and conditional versions remain future contracts.

Account-avatar GET by email is an anonymous302 provider redirect. It is not private media and its visibility is unchanged. Real Google Drive remains BLOCKED; adapter and native multipart tests do not prove provider behavior. Existing password-change sessions are not globally revoked. Profile stale-edit detection has a check-to-write race until Backend supports atomic versions.

## Verification

Local lint/typecheck and all required JS suites pass:407 unique tests, including61 M8 cases, plus14 contrast checks. Full Backend208/208 and targeted anniversary9/9 pass, with targeted cases already included in208. Final real HTTP134/134 scenario groups PASS, comprising unchanged inherited105 plus29 M8 groups. Every harness stage exits0, the random database is dropped and PostgreSQL stops. Android API35 emulator coverage is PARTIAL PASS with build-specific evidence in NATIVE_SMOKE_RESULTS.md.

M7 CI and Backend M6 remote test synchronization are verified CLOSED. M8 CI is NOT RUN until a separately authorized future pushed commit finishes its own workflow. Current branches/HEADs remain the verified starting commits.

## Release blockers and handoff

Keep M7-13 FocusEvent ANR, M5-07 lazy Map reload and M8 Profile Fabric mounting distinct and OPEN. Covered inline save/Back succeeds, but no root-cause or release-build resolution is claimed. Measured cached-development cold/warm readiness is23,424/10,439ms with hierarchy-poll overhead. Physical Android, iOS, TalkBack/VoiceOver and release-like builds remain NOT TESTED.

Private media is inaccessible across tested account/session boundaries. However the synthetic private photo remains visible in the Android recent-app snapshot. Product/platform snapshot policy, native cache forensics and physical background tests remain open. Account-avatar public discovery and password global-revocation behavior also need product decisions. Authorized provider cleanup/reconciliation, real map keys/tiles, dependency remediation and cross-client concurrency remain release gates.

Read CARRY_FORWARD_RISKS.md for severity/evidence/remaining blockers, M9_HANDOFF.md for reproduction and next-phase gates, TEST_RESULTS.md for exact test evidence, and the remaining contract/security reports for review details. All17 required M8 reports are supplied.

Temporary QA credentials and the dedicated AVD are removed. Task-owned API/PostgreSQL, Metro, fault proxy, emulator and private ADB are stopped. Known temporary credential/JWT scanning finds zero retained text matches after redaction; screenshots are filtered separately and the synthetic recent-app bitmap inspected manually. This is evidence hygiene, not native cache forensics. See test-results/evidence-scan.json and cleanup.json.
