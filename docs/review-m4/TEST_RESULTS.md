# M4 test results

Automated/API verdict: **PASS for executed final suites**. Native/provider/platform results have separate gates; no JavaScript result is treated as native tile proof.

| Check | M4 baseline | Final |
| --- | --- | --- |
| lint / typecheck | Exit0 / Exit0 | Exit0 / Exit0 |
| auth | 10/10 | 10/10 |
| foundation (includes auth) | 26/26 | 26/26 |
| M2 | 22/22 | 22/22 |
| M3 | 28/28 | 28/28 |
| M4 | New | 39/39 |
| shared contrast | 14/14 | 14/14 |
| Backend location DTO unit | New | 12/12 |
| real isolated M1 | 7/7 replay | 7/7 |
| real isolated M2 | 6/6 replay | 6/6 |
| real isolated M3 | Not run in inherited baseline mode | 12/12 |
| real isolated M4 | New | 17/17 |

Counts overlap: auth10 is already in foundation26. Unique final JavaScript tests:115. Backend DTO cases:12. Real API scenario groups:42, each with multiple assertions; these are not device-test counts. M4 tests use actual source with adapted RN primitives/hooks and real HTTP source transport where applicable. The39th M4 case exercises real VIETMAP TS codegen and default Metro resolver delegation after a reproduced native import failure.

M4 covers strict DTO/group/count parsing, empty and zero/boundary coordinates, malformed IDs/nonfinite coordinates, full Vietnamese search, filters/150 results, fit/focus/no polling recenter, tap draft/cancel/explicit confirmation, status copy, actual retry counters, stale editor/account changes, canceled/late responses, and focus/background polling. Real Backend scenarios add address invalidation, relation/avatar preservation, Web cookie↔Expo Bearer parity, rights rejection, failed/enabled/disabled geocoding states and in-flight automatic/manual precedence through the actual queue.

Reproduce on this Windows host with `npm.cmd`/`npx.cmd` (unsigned npm.ps1 is blocked): required npm commands plus `npm.cmd run test:m4`, `npm.cmd run test:integration:m4`. PostgreSQL bin `E:\PostgreSQL\18\bin` and .NET10 are required. The wrapper replays unchanged M1–M3 assertions into M4 evidence paths and enables test-only hosting startup solely in its disposable process. Never enable that hosting startup in deployment. Every completed final run must show databaseDropped/postgresStopped true in `final-backend/final-lifecycle.json`.

DTO regression: `dotnet test Tests/Backend-MyLife.Tests.csproj -c Release --no-restore -p:UseAppHost=false --filter FullyQualifiedName~FamilyLocationInputValidationTests`. Release avoids an unrelated user's running Debug apphost lock; that service was not stopped or queried. TRX is in `test-results/backend-unit/`.

Intermediate failures were resolved rather than assertions weakened: VM cross-realm comparisons normalized for test assertions; a synthetic registration name containing a digit was corrected; actual Backend NaN500 fixed narrowly; an initial geocoder DI adapter was replaced with a named in-process HTTP handler; one M3 raw avatar read crossed its five-second test-token expiry under heavy native compilation and passed on replay. Existing M1–M3 tests/helpers/harnesses remain unchanged. React Compiler ref-access lint findings were corrected with state/effect boundaries, not rule suppression.

Final logs, structured audit, API traces, contrast results, TRX, build attempts and native results are under `test-results/`. NATIVE_SMOKE_RESULTS.md states exact APK/tile/device coverage. CI workflow is prepared but **GitHub run NOT RUN**; local results do not substitute for remote CI or Backend CI.
