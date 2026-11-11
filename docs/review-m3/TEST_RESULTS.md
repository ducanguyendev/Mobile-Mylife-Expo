# M3 validation

Verdict: **PASS for executed automated/integration checks; PARTIAL PASS overall native/provider coverage**.

| Check | Before M3 | After M3 |
| --- | --- | --- |
| npm install | Exit0 | SDK58 picker/SVG/FileSystem install Exit0 |
| lint | Exit0 | Exit0; no warnings suppressed |
| typecheck | Exit0 | Exit0 |
| test:auth | 10/10 | 10/10 (also included in foundation) |
| test:foundation | 26/26 | 26/26 |
| test:m2 | 22/22 | 22/22 |
| Contrast audit | 14/14 pairs | 14/14 pairs; unchanged M2 script, output redirected to M3 |
| test:m3 | Absent | 28/28 |
| Real isolated M1 integration | 7/7 | 7/7 |
| Real isolated M2 integration | 6/6 | 6/6 |
| Real isolated M3 integration | Absent | 12/12 scenario groups |
| Android export | Not used as baseline device proof | Exit0, final Hermes bundle |
| Android native | M2 evidence retained | Actual M3 emulator scenarios, 38 screenshot positions, explicit coverage limits |

Counts overlap: auth10 is included in foundation26. Do not report 10+26 as independent tests. M3 28 includes pure data/graph checks, actual component-picker handlers through adapted RN primitives, cancellation/account boundaries, transport and native-bridge adapters. It is not 28 device tests. Integration groups contain multiple HTTP/data assertions; scenario count is not endpoint count.

Commands: `npm run lint`, `npm run typecheck`, `npm run test:auth`, `npm run test:foundation`, `npm run test:m2`, `npm run test:m3`, `npm run test:integration:m3`. On this PowerShell host use `npm.cmd`/`npx.cmd` because the unsigned npm.ps1 shim is blocked. Backend tests require `PG_BIN=E:\PostgreSQL\18\bin`, .NET10 and permission to run local services. SDK58 Android export used `EXPO_NO_DOTENV=1` and loopback `EXPO_PUBLIC_API_BASE_URL`, not the project's production-facing local env.

Baseline/final command logs are under `test-results/`. Backend evidence is in `baseline-backend/` and `final-backend/`. `existing-test-integrity.json` compares 10 tracked M1/M2 tests/helpers/harness/audit files byte-for-byte against the starting commit: unchanged. M1 validation source and earlier review reports are also preserved. No assertions weakened, tests deleted or linter rules disabled.

Issues encountered and resolved: original M1 VM transpiler treats generic arrow `<T>` as TSX, so the new generic uses `<T,>`; this fixed the first M3 integration start without changing the loader. SDK58 File uploads needed native testing despite Node multipart tests passing. React Compiler warnings were fixed in gesture/form architecture. Fast Refresh briefly served stale graph code after module additions; final native run used a clean Metro restart. Failed intermediate attempts are not presented as final passes.

`dependency-audit.json`: 13 moderate advisories, 0 high/critical. The install/audit did not apply a force fix or incompatible Expo downgrade suggested by npm. These dependency-chain advisories remain a release risk to assess with an SDK-compatible upstream update. No automatic major-version remediation was attempted.

Not tested: real Google Drive, iOS, physical devices, native injected pinch, full TalkBack traversal, Android picker process-kill recovery. These do not become PASS from typecheck/export or adapter coverage.
