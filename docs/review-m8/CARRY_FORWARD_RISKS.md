# M8 carry-forward release risks

Application release remains NOT READY. Development continuation requires the evidence and gates below. Historical M3–M7 data-integrity assertions remain in unchanged regression suites.

| Risk | Severity | Status and evidence | Remaining blocker | Target |
| --- | --- | --- | --- | --- |
| Real Google Drive | Critical | BLOCKED. Account/member/Library adapter suites pass | Authorized disposable provider, actual create/read/update/delete/checksums/quotas and reconciliation | M9 before release |
| Private media ownership/session | High | MITIGATED, JS binary/session fences and inherited HTTP isolation replay | Physical/iOS account switching, native cache/network forensics and long sessions | M9 |
| Task-switcher preview | High | OPEN, synthetic private photo visibly retained in Android recent-app card; task-switcher.json | Product snapshot policy and platform protection, physical/iOS checks | M9 release gate |
| Concurrent Library mutations | High | MITIGATED, shared account gate, HTTP replay and rebuilt-APK lost201 route-reopen PASS | Physical slow networks, cross-client versions and longer concurrency stress | M9 |
| Native POST transport replay | Critical | MITIGATED for covered Android path. Original APK duplicates; final one-shot POST APK retains exactly one album after dropped201 | Required native rebuild, physical/iOS and Backend idempotency coverage | M9 release gate |
| Cross-client conditional writes | High | OPEN across Profile and M3–M7 writes | Backend atomic version/If-Match contract | M9 dependency |
| M7-13 FocusEvent ANR | High | OPEN, active cold/warm/development-reload investigation | Physical and release-like reproduction, main-thread evidence | M9 release gate |
| M5-07 first lazy Map reload | Medium | OPEN, tracked separately from M7 ANR | Original initiating event and release impact | M9 |
| M8 Profile Fabric mounting | High | OPEN / controlled inline-save replay | Longer repeated save/back/device matrix and release build | M8/M9 |
| Physical Android/iOS | High | NOT TESTED | Physical Android, iOS, VoiceOver and long-session performance | M9 before release |
| Native release build | High | NOT TESTED | Compatible release-like artifact and execution matrix | M9 before release |
| Dependency advisories | Medium | OPEN, fresh14 Moderate,0 High/Critical | Expo58-compatible coordinated remediation and native verification | M9 |
| Accessibility | Medium | PARTIAL, labels, contrast14, large-font emulator forms | TalkBack speech/focus, external keyboard, VoiceOver, reduced-motion traversal | M9 |
| VietMap production readiness | High | OPEN | Restricted keys, quotas, signing, platform/release validation and Map-first reload | M9 |
| M4 density/font recreation | Medium | OPEN | Rapid mounted configuration recreation and release behavior | M9 |
| M3 relationships / coordinates | High | MITIGATED / MONITORED, inherited JS/HTTP regressions | Physical graph pinch/FPS and concurrency versions | M9 |
| M5 Timeline derivation | High | MITIGATED / MONITORED, unchanged historical/source-qualified regressions | Preserve source identity and original dates in future phases | Ongoing |
| M6 lunar/date integrity | High | MITIGATED / MONITORED, existing cases plus targeted Backend9 pass | Boundary/clock drift and long-session recurrence checks | Ongoing |
| Backend M6 remote synchronization | Medium | CLOSED. Remote file at ca20ba52, targeted9 pass | Production deployment tracked separately | Closed16 Nov2026 |
| M7 GitHub CI | Medium | CLOSED. Exact SHA c55a476f run43792501120 success | M8 requires its own future pushed workflow | Closed16 Nov2026 |
| M8 CI | Medium | NOT RUN, workflow adds test:m8 and local quality passes | Authorized future commit/push and completed exact-SHA workflow | After review |
| ADMIN route/data leakage | High | MITIGATED, protected routes, fresh API role checks, real403/401 and native USER/Admin deep-link denial | Physical/release route matrix | M9 |
| Stale role / account lock | High | MITIGATED, Backend sid revocation, foreground checks/poll; native current-account demotion/promotion expires old sessions | Previously visible data until next request/resume/poll and offline policy | M9 |
| Destructive administrative actions | High | MITIGATED, confirmations, Backend guards, shared PostgreSQL lock | Cross-client versioning and longer concurrency stress | M9 |
| Account-avatar public visibility | High | OPEN, anonymous302 demonstrated | Product privacy decision for email-discoverable provider redirect | M9 before release |
| Password-change session behavior | High | VERIFIED limitation. Existing sessions remain active | Product decision on global revocation contract | M9 |
| Form leakage on account switching | High | MITIGATED, keyed routes, aborts, conditional SecureStore writes | Physical background/process-death/long-session matrix | M9 |
| Sensitive login logs | High | MITIGATED, Admin-only, transient state, redacted evidence | OS previews and production telemetry review | M9 |
| Large private gallery/full-size decode | High | OPEN, bounded downloads/virtualized windows retained | Physical decoded-memory/FPS, thumbnails/pagination and slow-network profiling | M9 |
| Provider orphans/partial cleanup | High | OPEN, adapter compensation cases retained | Real provider-success/DB-failure reconciliation and recovery procedure | M9 before release |
| Picker lifecycle/formats | Medium | PARTIAL, synthetic PNG native transport | Process death, iOS HEIC export, native GIF/WebP/device matrix | M9 |

M9 must supply only dedicated explicitly authorized nonproduction Drive configuration. Required operations include isolated folder/deployment provisioning, server-side credential setup, quotas/throttling/availability, secret rotation, orphan inventory/recovery, provider/DB reconciliation and confirmed cleanup. Production Drive is excluded from synthetic QA.
