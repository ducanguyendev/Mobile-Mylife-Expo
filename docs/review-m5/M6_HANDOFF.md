# M6 handoff

M5 adds real Timeline under Memories and full member Timeline in protected Family routes. Calendar and Library are explicitly future scope; no M6/M7 management or fabricated personal content was introduced. Read REPORT/TEST_RESULTS/NATIVE_SMOKE_RESULTS for final executed verdicts rather than treating this handoff as release approval.

Reuse features/timeline/timeline-data.ts strict DTO/date/write validation, source-qualified derived identity, Web-equivalent filters, numeric ascending grouping and source-aware localized presentation. Derived negative IDs can collide across sources; never key or mutate them as ordinary positive custom IDs. Anniversary-derived dates are original solar dates, not next occurrence. M6 must preserve the traceability and read-only Timeline representation when adding anniversary management.

The form's exact date/year-only distinction is deliberate: do not convert unknown day/month to January1. Approximate is preserved for exact or year-only values. Avoid Date.UTC0–99 coercion/timezone shifts. Custom titles are not translated. Normal new event types are CUSTOM/MEMORY/ADDRESS_CHANGE/MARRIAGE. Read-only legacy birth/death and writable legacy CHILD_BIRTH/ANNIVERSARY conventions follow Web; source metadata stays server-owned.

All five Timeline endpoints use existing auth transport. Member scope includes primary OR related member; load member directory once, not a profile per row. Profile preview links to complete member Timeline. Account/member keyed screen state, focus/background cancellation, active mutation lifecycle and existing SecureStore/refresh/logout protections must remain intact.

Map→Timeline uses `/family/timeline` in the same protected Family stack, with an explicit Close option. Routing that action to the Memories tab caused Back to visit Home in actual Android QA; do not reintroduce that cross-tab bridge. Main Memories remains a normal tab. A separate first lazy Map entry caused a dev-client ReactHost reload/navigation reset; cold retry recovered and real tiles rendered. This cause is unproven and remains M5-07, distinct from the resolved same-stack navigation issue and the inherited M4 recreation warning.

Mutation controller reads current Timeline before edit/delete, compares relevant fields, serializes requests and verifies authoritative post-write state. Uncertain dispatch blocks new writes until reconciliation; do not blindly retry POST or DELETE. Remaining GET/write race cannot be fixed atomically without a Backend conditional-write contract.

Local Backend M4 double-range fix and12 tests still need user-coordinated commit/push; remote feature branch was verified missing it. Preserve both local files and no unrelated Backend refactor. Full Backend suite is reproducible via scripts/run-backend-suite-m5.cjs against a disposable PG18 cluster with its existing TestGeocodingService enabled. test:integration:m5 replays unchanged M1–M4 and adds Timeline HTTP cases; never ship fixture hosting startup or QA credentials.

No native dependency change: existing SDK58/RN0.88 custom development APK is reused. Preserve exact VIETMAP3/scoped Metro resolver; Expo Go is insufficient for whole-app QA. Public map key only under authorized restricted QA/release setup; no private service key in Expo. Native helper/seed use only guarded random loopback DB and MyLife_M4 AVD serial5584; the name reflects the reused QA environment. Cleanup DB/PG/Metro/AVD after use.

M4 GitHub quality run43173508106 is independently verified successful. M5 workflow now includes test:m5 but has not run remotely until a later authorized push. Carry all inherited/new risks, including Drive, conditional writes, dependencies, TalkBack, physical/iOS, key restrictions and dev-client recreation warning. Do not promote a NOT TESTED platform gate to PASS.

At handoff both disposable QA databases/clusters and the task-owned Metro/emulator are stopped. Recreate a fresh isolated runtime rather than reusing expired credentials. The final actual session-revocation check returned Android to login (native121). No commit/push/PR was performed. Development can proceed to M6 while the application remains NOT READY for release.
