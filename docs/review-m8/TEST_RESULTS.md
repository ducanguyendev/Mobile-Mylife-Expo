# M8 test results

Local quality: PASS. Baseline346 unique Expo JS tests pass before changes. Final407 unique tests pass, including61 M8 cases. test:auth contains10 cases already included within the foundation26 and is not counted twice. Contrast14 is reported separately. lint, typecheck, test:auth, test:foundation, test:m2 through test:m8 and audit:contrast:m2 all exit0. Exact command results and logs are in test-results/final-quality.json.

Backend: PASS,208/208 full-suite tests,0 failed/0 skipped, against isolated PostgreSQL. The9 deterministic anniversary cases also pass independently. They are included in208 rather than added to it. The separate output directory avoids overwriting DLLs used by native QA. See backend-suite/full-backend-tests.log and backend-unit/backend-full-isolated.trx, with targeted evidence under anniversary-targeted.

## Real HTTP isolation

Final real HTTP: PASS,134/134 scenario groups. The M1–M8 replay uses a fresh random PostgreSQL database and real Kestrel/.NET10 HTTP requests. Storage is substituted only through a test-host HTTP adapter, with outbound provider fallback blocked. It is not a Google Drive test. Inherited M1–M7 suites remain unchanged and cover105 scenario groups. M8 adds29 groups, including concurrent status actions, promotion versus delete and two-admin last-active protection. All harness stages exit0, the database is dropped and PostgreSQL stops. Exact totals are in test-results/verified-totals.json and final-backend/final-lifecycle.json.

M8 checks own profile, Web-cookie reads of native edits, invalid/overposted values, exact DOB, stale form preflight, password validation and existing-session behavior, Google-only restrictions, avatar upload/delete/failure and public redirect, real stats/search/logs, roles/locks/deletion, actual401/403/404/409 responses, stale access/refresh rejection, last-active Admin, logout and cookie/Bearer/CSRF separation. Inherited suites retain media ownership, late binary/session boundaries and shared Library uncertainty across route reopening.

The test fixture changes login-provider flags directly only to create a synthetic Google-only account. Normal account and Admin actions use supported HTTP endpoints. Fixtures, passwords and random tokens are not emitted in retained evidence. Concurrent test outcomes accept the valid orderings enforced by PostgreSQL locking rather than assuming request scheduling.

## Native and provider evidence

Android emulator: PARTIAL PASS. See NATIVE_SMOKE_RESULTS.md for build-specific coverage and the final lost201 replay. Native checks are observations and fault-injection scenarios, not added to the407 JS or134 HTTP count. Physical Android, iOS, TalkBack and release-like execution are NOT TESTED. Actual map tiles and Google Drive account/member/Library lifecycles are BLOCKED by missing authorized nonproduction configuration.

## Dependencies and CI

Fresh npm audit:14 Moderate,0 High/Critical. No dependency or lockfile changes and no SDK downgrade. The audit command's advisory exit is recorded independently from passing quality commands. Existing M7 GitHub Expo quality run43792501120 is verified successful for exact SHA c55a476f01c14cb0cd24428deb17e4d1af9d85c9. The remote Backend anniversary file is verified at ca20ba52635a026b32449f919e60410ff880c829. See github-evidence.json.

M8 CI: NOT RUN. The workflow includes test:m8 and local checks pass. No M8 commit, push or workflow run is created. No provider secret is required by ordinary quality CI.
