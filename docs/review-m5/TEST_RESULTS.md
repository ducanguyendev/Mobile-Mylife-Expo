# M5 test results

Unit/API verdict: PASS for final executed checks below. Android and remote CI are separately reported; JS tests are not native verification.

| Check | Baseline | Final |
| --- | --- | --- |
| lint / typecheck |0 /0 |0 /0 |
| auth |10 |10 (included in foundation) |
| foundation |26 |26 |
| M2 |22 |22 |
| M3 |28 |28 |
| M4 |39 |39 |
| M5 |new |60 |
| shared contrast |14 |14 |
| targeted Backend M4 DTO |12 |12 |
| full existing Backend suite |Initial default test DB unavailable |194 passed,0 failed/skipped in corrected isolated environment |
| real Kestrel/PostgreSQL scenario groups |M1–M4 inherited coverage |M1 7 + M2 6 + M3 12 + M4 17 + M5 21 =63 |

Unique JS cases175 (26+22+28+39+60). Auth10 overlaps foundation26. Targeted DTO12 is included in full Backend194, not an additional194+12. API scenario groups contain multiple assertions and are not device-test counts.

M5 cases cover strict fields/nullable DTO/source identities, negative collisions, duplicate/malformed IDs, Gregorian/date-only/year1–99/leap/unknown/approximate/year-only behavior, exact-year consistency,650 events/no truncation, Web filters/normalized Vietnamese search, allowed creation and legacy preservation, coordinate/text validation, real component member-picker draft/cancel and editor/discard handlers, derived details without edit/delete, serial mutations, stale read conflict, post-save absence, uncertain network lock/reconciliation, background abort, account-keyed late-response isolation and language keys. No inherited assertions/tests were changed.

Real integration uses the new disposable harness, replaying unchanged M1–M4 into M5 paths and then21 Timeline scenarios. All five Timeline endpoints plus native Bearer/Web cookie isolation are exercised; detailed method/path/status traces contain no tokens, cookies or passwords. User accounts, members/events, anniversary and adapters are synthetic. Existing M3 avatar and M4 manual-location/relationship/background-precedence tests are revalidated, including malformed coordinates400. No real browser UI or provider accuracy is inferred from HTTP tests.

Reproduce: npm.cmd run lint/typecheck/test:auth/test:foundation/test:m2/test:m3/test:m4/test:m5 and audit:contrast:m2. npm.cmd run test:integration:m5 needs PG_BIN=E:/PostgreSQL/18/bin and .NET10. scripts/run-backend-suite-m5.cjs runs the full existing .NET suite with a new disposable cluster; targeted command uses dotnet test Tests/Backend-MyLife.Tests.csproj -c Release --no-restore -p:UseAppHost=false --filter FullyQualifiedName~FamilyLocationInputValidationTests. Final lifecycle JSON must show DB dropped/PG stopped. Held native mode inherits MYLIFE_M3_NATIVE_HOLD=1 and a three-hour teardown/stop marker.

Resolved intermediate issues are retained in logs: unavailable default Backend test DB, disabled test geocoder queue causing5/194 failures (environment corrected;194 then pass), missing new route types until Expo generated them, incorrect shared-field editable prop corrected to disabled, React Compiler ref callback construction replaced by account-local lifecycle state, and missing post-save helper import caught by M5 tests. No lint rule suppression, weakened assertion or Backend service refactor. Initial native actions before bundle readiness are transitional/failing attempts, not successful scenario evidence.

| Retained intermediate run | Passed / total | Failure explanation |
| --- | --- | --- |
| backend-full.trx |140/194,54 failed |Default loopback test DB unavailable |
| backend-full-geocoder-disabled.trx |189/194,5 failed |Wrapper disabled queue expected by existing test geocoder |
| backend-full-isolated.trx |194/194,0 failed |Corrected isolated test configuration, unchanged assertions |
| interim-test-m5.log |57/57 |Initial green new suite |
| interim-test-m5-2.log |55/57,2 failed |New post-save check missing eventWrite import; import corrected |
| interim-test-m5-3.log |59/59 |Additional reconciliation/lifecycle cases |
| final-test-m5.log |60/60 |Includes actual account-keyed hook late-response/state isolation case |

M4 actual GitHub CI success is verified independently (run43173508106). M5 workflow includes test:m5 but M5 remote CI NOT RUN until a later authorized push. Android observations, failures and NOT TESTED gates belong in NATIVE_SMOKE_RESULTS.md and native/results.json.

Final Android scope: dedicated API35 custom development APK,523 real synthetic events/125 members, native CRUD independently checked through both native/Web authentication, derived read-only/details/profile links, VI/EN/theme, compact360dp/font130%, offline recovery, graph fit/pan, actual VIETMAP tiles, corrected same-stack Back/Close and actual revoked-session return to login. First lazy Map dev-client reload remains OPEN. No physical/iOS/TalkBack/FPS or real Drive certification. Final source freeze was followed by a fresh successful lint/typecheck/auth/foundation/M2/M3/M4/M5/contrast run (final-summary.json).
