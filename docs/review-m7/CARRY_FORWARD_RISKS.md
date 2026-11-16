# M7 continuous risk register

> Current verification, 16 November 2026. GitHub Expo quality run 43792501120 succeeded on c55a476f01c14cb0cd24428deb17e4d1af9d85c9. Backend Tests/AnniversaryDateIntegrityTests.cs resolves remotely at ca20ba52635a026b32449f919e60410ff880c829, and M8 independently reruns all nine cases successfully. Historical pending-CI and remote-sync statements below are superseded. Production deployment remains unverified. See ../review-m8/test-results/github-evidence.json.


| ID | Severity | Status | Evidence and action | Unresolved blocker and next phase |
| --- | --- | --- | --- | --- |
| RISK-01 | High | BLOCKED | Existing avatar adapter replay passes | Actual disposable Google Drive lifecycle remains unverified before release |
| RISK-02 | Medium | PARTIAL / OPEN | Existing graph regressions preserved, native fit/pan scope recorded separately | Physical pinch/FPS and coexistence profiling in M7 QA |
| RISK-03 | High | MITIGATED / OPEN | Existing member/location guarantees plus fresh anniversary write comparison and reconciliation | Atomic Backend conditional version is absent, GET/write races remain before release |
| RISK-04 | Medium | OPEN | Fresh audit14 moderate,0 high/critical matches M5, no new dependency | Coordinated Expo58-compatible fixes and native dependency assessment before release |
| RISK-05 | Medium | PARTIAL | Contrast14, selected semantics, date labels, virtualized list alternative and modal/keyboard protection | Actual TalkBack speech/focus, external keyboard and reduced-motion traversal in M7 QA |
| RISK-06 | High | NOT TESTED | Dedicated Android API35 emulator coverage only | Physical Android, iOS and VoiceOver before cross-platform release |
| RISK-07 | Medium | M5 VERIFIED PASS / M6 NOT RUN | Exact M5 SHA8d650188 run43201911893/job131127198646 success, local test:m6 workflow added | M6 remote execution after a later authorized push |
| M4-01 | High | OPEN | Exact VIETMAP3/scoped resolver and authorized public-key synthetic QA retained | Production key restrictions, quotas, signing and platform validation before Map release |
| M4-02 | Medium | OPEN | Cold-start checks use fixed viewport per process | Rapid mounted font/density recreation warning needs separate release-build investigation |
| M5-01 | High | MITIGATED / MONITORED | Source-qualified negative IDs, original-date derivation and read-only M5 regressions pass, new source-management action | Preserve source identity when M7 links further memories |
| M5-02 | High | MITIGATED / OPEN | Existing Timeline stale/uncertain-write tests unchanged and pass | Conditional writes remain a Backend contract dependency |
| M5-03 | High | PASS covered cases / MONITORED | M5 historical/year-only/leap tests retained, M6 original/upcoming separation and Vietnam-day cases added | Preserve exact date semantics in future Calendar/Library integration |
| M5-04 | Medium | VIRTUALIZED / OPEN | Existing650-event unit case and native Timeline integration retained | Physical memory/FPS/long-session profiling before release |
| M5-05 | High | MITIGATED / MONITORED | Existing account isolation plus M6 keyed query/preview/mutation guards and foreign-ID HTTP checks | Continue account-switch/background regression in every phase |
| M5-06 | High | CLOSED remote-push issue | Remote53e47251 contains double ranges and12 regressions, full203 pass, actual nonfinite400 | Deployment status remains NOT VERIFIED and is tracked separately |
| M5-07 | Medium | OPEN / actively investigated | First/subsequent/after-Calendar Map paths have zero additional reloads. Controlled fast physical RR in an unsaved Modal reproduces a developer reload outside Map. QA injection corrected | Original M5 initiating event and release impact remain unproven, see controlled-rr-verification and VIETMAP_FIRST_OPEN_INVESTIGATION |
| M6-01 lunar/leap conversion | High | MITIGATED / MONITORED | Authoritative endpoints, fixture conversions, invalid29/30-day/leap/boundary cases, stale preview cancellation | Maintain Backend-owned algorithm and boundary regressions in M7 |
| M6-02 timezone recurrence | High | MITIGATED / MONITORED | Frozen UTC+7 boundary and leap-day solar recurrence tests, authoritative daysUntil | Device wall-clock drift and business-day refresh deserve continued long-session QA |
| M6-03 original/upcoming confusion | High | MITIGATED / MONITORED | Separate field labels, calendar next date placement, historical Timeline source assertions | Preserve separation for M7 photo/memory associations |
| M6-04 cross-module synchronization | High | PASS covered refetch / MONITORED | Save/delete authoritative reload, focus reload and HTTP Home/Profile/Timeline parity | No push-based cross-device cache invalidation, continue refocus regression |
| M6-05 anniversary concurrency | High | MITIGATED / OPEN | Fresh GET/updatedAt/write-field comparison, serial writes and uncertain-outcome lock | GET→PUT/DELETE remains nontransactional until Backend conditional writes |
| M6-06 calendar accessibility/performance | Medium | PARTIAL / OPEN | Bounded month grid and virtualized100+ list/member picker, list alternative | Physical profiling and TalkBack/VoiceOver before release |

M6 development may proceed toward M7 with these explicit gates. Application release readiness remains NOT READY.


M7 updates follow below. Historical entries remain open unless explicit new evidence closes them.

| ID | Severity | M7 status and evidence | Mitigation / follow-up |
| --- | --- | --- | --- |
| RISK-01 real Drive | Critical | BLOCKED, no authorized disposable real-provider environment; Backend203 and M7 HTTP adapter scope only | Execute Phase B in GOOGLE_DRIVE_PROVIDER_QA before release; keep M3 avatar gate |
| RISK-02 graph physical FPS/pinch | Medium | OPEN, M1–M6 regressions retained | Physical profiling and gesture tests |
| RISK-03 conditional writes | High | OPEN, Library adds serial gate/fresh comparisons/uncertainty lock | Backend atomic version contract; read/write race remains |
| RISK-04 dependency advisories | Medium | OPEN, fresh14 Moderate,0 High/Critical, unchanged lockfile | Expo58-compatible coordinated remediation |
| RISK-05 accessibility | Medium | PARTIAL, labels/selected state/scrollable forms/contrast14 | Actual TalkBack/VoiceOver/focus/keyboard |
| RISK-06 physical/iOS | High | NOT TESTED, Android emulator only if reported separately | Physical Android/iOS release matrix |
| RISK-07 GitHub CI | Medium | M7 PASS16 November, exact c55a476f run43792501120 | Local workflow adds test:m7; verify exact future pushed SHA |
| M4-01 production VIETMAP | High | OPEN, no Map native/config change | Key restrictions/quotas/signing/release-build validation |
| M4-02 dev-client recreation | Medium | OPEN | Cold-start device testing and release behavior |
| M5-07 first lazy Map reload | Medium | OPEN, RR automation spacing preserved; original cause unproven | Revalidate Map after Library and release behavior |
| M5/M6 historical/next dates | High | MITIGATED / MONITORED, inherited Timeline/lunar/Calendar tests and84 HTTP groups pass | Keep originalSolarDate distinct from nextSolarDate and photo displayDate |
| M6 synchronization | High | MONITORED, existing Home/Profile/Calendar focus behavior preserved | Cross-device updates still require refetch |
| BACKEND-M6 tests | Medium | CLOSED16 November, remote file at ca20ba52 and M8 targeted9 PASS | Remote synchronization complete. Production deployment remains unverified |
| M7-01 private photo exposure | Critical | MITIGATED / OPEN, owner endpoint only, foreign404/anonymous401, redirect error | Native platform/network/cache forensics |
| M7-02 token URL/log leakage | Critical | MITIGATED, no URL/query token, existing SecureStore and redacted evidence | Preserve scans and session guards |
| M7-03 wrong-account media reuse | Critical | MITIGATED / OPEN, per-account pool, generation clear, background removal, body-after-logout test | Real native account-switch/long-session gate |
| M7-04 multipart compatibility | High | AUTOMATED PASS; native result separately recorded | Current SDK58 device upload and HEIC/GIF matrix |
| M7-05 upload volume/memory | High | OPEN,20 files×5MiB, sequential signature reads; API15s timeout remains | Smaller batches, physical memory/slow-network profiling, transport timeout review |
| M7-06 provider throttling | High | PARTIAL, Retry-After retained/enforced, bounded image queue | Actual Google quotas and429/502 operational soak |
| M7-07 orphan files/folders | High | OPEN, existing Backend compensation/tests retained | Real Drive/DB fault-injection reconciliation and admin recovery procedure |
| M7-08 incomplete deletion/rollback | High | OPEN, UI retains DB state after adapter502 and never claims cleanup success | Provider-success/DB-failure cannot be atomic |
| M7-09 metadata consistency | High | MITIGATED / OPEN, full edit initialization, immutable slugs, exact display date | Conditional versions; no assignment-clear endpoint |
| M7-10 large gallery performance | Medium | PARTIAL, virtualized6/batch4/window3, concurrent3,1000-row selection unit case | Full-resolution-only API, physical FPS/decoded memory, many categories header |
| M7-11 provider credentials/availability | Critical | BLOCKED | Dedicated nonproduction Apps Script/folder authorization, no production fallback |
| M7-12 picker process death | Medium | OPEN, cancel/reselect supported; M7 does not persist/recover pending results | Dedicated process-kill UX and lifecycle tests |
| M7-13 native focus ANR | High | OPEN, repeated Android input-dispatch FocusEvent timeout during fixed-source cold Metro reload; recovered UI and later cached relaunch | Diagnose development versus release behavior on physical/release build; do not infer original M5 Map cause |
| M7-14 original filename | Low | OPEN, native multipart uses actual picker-cache File basename despite the picker display filename | Preserve original display filename through a verified SDK-compatible transport; no storage IDs are exposed |
| M7-15 final coordinator native replay | Medium | UNIT/HTTP PASS, final14 November account-wide gate retains uncertainty across routes and fences stale activation; native matrix predates this pure-JS hardening | Repeat the route-retry smoke on the next Android development-build QA |

M7 development acceptance and M8 continuation are PARTIAL PASS pending the actual native matrix. Application release remains NOT READY. Historical M6 status text above is retained as inherited evidence, not a claim that those gates were newly retested physically.
