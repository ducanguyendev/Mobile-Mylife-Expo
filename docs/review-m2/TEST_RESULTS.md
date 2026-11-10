# M2 verification

All final required automated checks pass. Evidence is under `test-results/`; exact command/exit-code inventory is `test-results/commands.json`.

| Check | Result | Level |
| --- | --- | --- |
| Baseline npm install --no-audit --no-fund | Exit 0, up to date | Dependency installation; no package added |
| Baseline lint / TypeScript | Exit 0 / 0; no lint errors/warnings | Static |
| Baseline test:auth | Exit 0; 10 pass | Unit |
| Baseline test:foundation | Exit 0; 26 pass, no skips | Unit/native bridge adapters |
| Starting M1 real integration replay | Exit 0; 7 checks | Real Backend/PostgreSQL, adapted native bridges |
| Final lint / TypeScript | Exit 0 / 0; no lint errors/warnings | Static |
| Final test:auth | Exit 0; 10 pass | Unit |
| Final test:foundation | Exit 0; 26 pass, no skips | Unit/native bridge adapters |
| test:m2 | Exit 0; 22 pass, no skips | Unit/adapter |
| M2 real integration | Exit 0; 7 unchanged M1 checks + 6 M2 checks | Real Backend/PostgreSQL, adapted native bridges |
| Contrast audit | Exit 0; 14/14 representative pairs pass | Numeric sRGB calculation; native samples also inspected |
| Android export | Exit 0, Metro/Hermes Android output | Bundle validation only |
| Android functional smoke | 14 requested scenarios passed with qualifications | Actual Expo Go native runtime + real disposable Backend/PostgreSQL |
| TalkBack / VoiceOver | NOT TESTED / BLOCKED on Windows | No speech/focus conformance claim |

The standalone auth suite is included in the 26-test foundation suite. There are **48 unique foundation + M2 automated tests**, not 58 unique tests. Node's MODULE_TYPELESS_PACKAGE_JSON warning in the existing auth suite is pre-existing and does not indicate a test skip/failure. No M1 test was deleted, edited or weakened.

New tests cover authentic Home counts/generations/order, missing/empty/malformed contracts, date-only validation/formatting, Vietnam boundary filtering, device-local greeting boundaries, album sorting/zero photo count, request coalescing, independent failure/retry, cancellation and late responses, cancel/refocus, separate accounts, preference roundtrip/whitelisting/corruption/read-write failure/retry/queue/hydration timeout, locale fallback/dictionary shape, native transport/caller cancellation, feedback/busy/retry semantics, minimum target sizes/label wrapping and avatar failure fallback.

The real HTTP suite creates two synthetic USERs, uses actual family and anniversary creation contracts, seeds only empty album metadata inside its own disposable DB (Drive disabled), fetches through actual authenticated endpoints, verifies owner separation and ADMIN 403s, then checks logout revocation. Its one injected transport failure is labelled explicitly; actual recovery goes through real HTTP. Device offline/retry is separately verified in native evidence.

Baseline integration pins production source overrides to the starting M1 commit while retaining the fixed-M1 assertions. The original M1 script/test/helper files and `docs/review-m1` are untouched. A temporary replay changes only test evidence paths, helper resolution and baseline source selection. M2 adds its own suite after M1 and checks the replay cannot overwrite M1 outputs. Native testing and final integration have separate lifecycle evidence, proving database drop and cluster stop.

Setup/retest notes: sandboxed PostgreSQL startup initially failed with restricted-token error 87; the same isolated harness succeeded with authorized escalation. The first synthetic registration fixture used a digit in its name and was correctly rejected by Backend validation; the fixture was corrected, with no validation assertion weakened. The Android default partition initially exceeded available space; a smaller disposable partition booted successfully. Network keep-alive behavior required correcting the offline-test method; early connected attempts are not claimed as offline PASS. Native visual inspection exposed clipped header/button labels during resize/font tests; shared flex sizing was corrected and final compact/large screenshots verify complete labels.

Final automated checks were rerun after the shared UI corrections. No deployment, publish, commit, push, merge or PR was performed. Web, Backend and Flutter source trees were not modified.
