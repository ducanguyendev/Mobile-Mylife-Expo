# MyLife Expo M1 — Foundation safety and Web parity

Date: 10 November 2026, Asia/Saigon.

## Outcome

**PARTIAL PASS. The corrected foundation is ready for M2 development after review, with native-device authentication/deep-link verification an early acceptance gate. It is not ready for public release.**

The confirmed relation-loss defect and a reproduced logout/refresh resurrection defect are fixed in Expo. Missing client protection for all `/family/*` routes is fixed. Lint/typecheck now pass, all 26 foundation tests pass, and seven real HTTP/Backend/PostgreSQL groups pass. Android JS/Hermes export succeeds.

The integration harness runs actual Expo source with adapters for unavailable native bridges; it does not prove physical SecureStore persistence or native navigation. Remaining feature, design/accessibility and provider work is explicitly classified and planned, not implemented as M2–M9.

## 1. Initial state and references

| Repository | Branch | HEAD at audit | State |
|---|---|---|---|
| Expo | `feature_minhduc` | `7fa31245bc2bcfc6a58a28879bba9df028f13e45` | Clean before M1. |
| Web W10 reference | `feature_minhduc` | `144fc506c0ec7957d40a137351aeda296b8937b5` | Read-only; no source edits. |
| Backend W10 reference | `feature_minhduc` | `c1b43b1f83e17f9546edc9bb314b8345b8d947ad` | Read-only source; built and run only against disposable M1 databases. |

The outer workspace repository is on `master`; no branch was switched there. Existing outer/Flutter changes were left alone. Expo is a separate Git repository on the requested branch.

Inspected the Router tree, all current screens, family/auth services/types/validation/storage/provider, API client, design-system primitives/theme and tests. Compared family DTO/synchronization and native auth against Backend W10 and Web W10. Expo uses SDK `58.0.22` range, Router `58.0.29`, React Native `0.88.1`, React `19.3.0`; the lockfile/dependencies were not changed by installation. SDK 58 docs were consulted before routing/focus changes: [SDK reference](https://docs.expo.dev/versions/v58.0.0/), [Router protected routes](https://docs.expo.dev/router/advanced/protected/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/).

## 2. Fresh baseline

| Required command | Actual baseline |
|---|---|
| `npm install --no-audit --no-fund` | Exit 0, up to date. |
| `npm run lint` | Exit 1, 4 errors and 3 warnings. |
| `npx tsc --noEmit` | Exit 2, TS7053 on `backendFieldErrors` result `form` key. |
| `npm run test:auth` | Exit 0, 10 pass, 0 fail. These tests did not exercise the real API client/logout race. |

Before fixes, five newly targeted family/guard tests produced two passes and three failures. The isolated real HTTP baseline reproduced both relation loss and a usable persisted session after logout raced a late refresh. Original-source replay remains available from commit `7fa3124` using `git show` in memory, without resetting the worktree.

## 3. Confirmed defects and fixes

### Horizontal relation loss — critical data integrity

The original converter always supplied `horizontalRelations: []`. Backend treats a supplied empty list as a synchronization request to remove existing explicit links; omission/null leaves them alone.

Reproduction used two synthetic members in a newly created PostgreSQL database, established an explicit sibling link, submitted an unrelated Expo phone edit and refetched both members. The original source removed the link in both directions.

The smallest production fix is to omit the field from `toFamilyInput`, because this form has no horizontal editor. The input type now permits omission/null. No Backend validation or relationship semantics changed. Final real HTTP checks confirm the phone is updated and the explicit relation survives in both directions. Unit roundtrip tests also retain all supported scalar fields and father/mother/spouse/child IDs.

### Logout racing refresh — session safety

The original provider started logout with the old refresh token and cleared local storage, while an already-running refresh could subsequently persist a new, usable token pair. The baseline reproduced this using an actual Backend rotation response delayed in the test transport; a raw request with the resurrected access token returned 200.

The existing API client now tracks active refresh/logout operations and a session version. Intentional logout blocks new authenticated work, clears locally, and retires any rotated session arriving late without persisting it. Old operations cannot erase a newer login. A newly signed-in session can also log out independently while an older logout is pending. Existing warning behavior remains when server/local clearing is not acknowledged. The auth subsystem, SecureStore format, Bearer transport and Backend are preserved.

Final real HTTP checks show no stored pair after the race and HTTP 401 for the late rotated access `sid`. Unit tests cover duplicate/coalesced refresh, delayed old 401s, failed refresh/retry, newer login, independent overlapping logout, storage failure and server failure. A follow-up test caught and corrected an overly broad logout coalescing case during implementation; it is recorded rather than hidden.

### Missing family client guard

Only `(tabs)` and `(auth)` were explicitly guarded in the root layout. The auto-discovered `family` navigator containing new/detail/edit was outside that protection. Backend still rejected unauthorized requests; M1 does not claim an original server data leak.

The root now explicitly places `family` under authenticated **USER** protection. Anonymous/checking users redirect to login; authenticated non-USER accounts redirect to the existing Family denial screen. This covers `/family/new`, `/family/[id]` and `/family/[id]/edit` together. Rendered-layout policy tests cover checking/anonymous/ADMIN/USER states; real HTTP also rejects anonymous, ADMIN and foreign-account access. Native deep-link/back-stack execution remains untested.

### Type/lifecycle correctness

- `backendFieldErrors` returns `FormErrors`, including `form`, instead of an incompatible narrower type.
- Form initialization uses one shared `memberToFormValues` initializer, keyed by member ID, preserving supported values without synchronous initialization effects.
- Family list/detail now have one focus-owned load instead of both initial and focus fetches. Keyed content resets on account change. Edit validates IDs and clears stale member/error state before reloading.
- Unused imports/expression warnings were removed. No lint rule or Backend validation was disabled.
- Read-only location/managed-avatar/timestamp fields missing from Expo's member response type were added. They are not written by the scalar form.

## 4. Exact authored files

Paths relative to Expo:

- `README.md`
- `package.json` — repeatable check scripts only; no new dependency.
- `src/api/apiClient.ts`
- `src/app/_layout.tsx`
- `src/app/(tabs)/family.tsx`
- `src/app/family/[id].tsx`
- `src/app/family/[id]/edit.tsx`
- `src/features/auth/context/auth-provider.tsx`
- `src/features/family/components/MemberForm.tsx`
- `src/features/family/types/family.ts`
- `src/features/family/validation/familyValidation.ts`
- `scripts/run-isolated-m1.cjs`
- `tests/helpers/load-foundation.cjs`
- `tests/foundation-safety.test.cjs`
- `tests/native-session.test.cjs`
- `tests/real-backend.m1.cjs`
- `docs/review-m1/REPORT.md`
- `docs/review-m1/FEATURE_PARITY_MATRIX.md`
- `docs/review-m1/API_CONTRACT_AUDIT.md`
- `docs/review-m1/DESIGN_SYSTEM_AUDIT.md`
- `docs/review-m1/M2_M9_BACKLOG.md`
- `docs/review-m1/TEST_RESULTS.md`
- Generated evidence under `docs/review-m1/test-results/`, inventoried in `summary.json`.

No Web, Backend or Flutter source was edited. No production credentials, old migrations or generated native project folders were changed. No commit/push/merge/PR, deployment, EAS build/submit/update or M2–M9 implementation was performed.

## 5. Feature/API/design parity

The [feature matrix](FEATURE_PARITY_MATRIX.md) classifies Home/Timeline/Anniversaries/Library as MOCK, Profile/Auth/Family members as PARTIAL, graph/map/Admin as MISSING, and native Google sign-in as BLOCKED. No entire Web-equivalent module is declared COMPLETE from illustrative data or adapter-only execution.

The [API audit](API_CONTRACT_AUDIT.md) covers DTOs, replacement-versus-omission semantics, supported/unsupported fields, W10 `sid`, generations, profile and avatar gaps. The relation picker still exposes only the first eight candidates through Alert; its Android button-limit issue and searchable native-sheet design are documented for M3, not redesigned in M1.

The [design-system audit](DESIGN_SYSTEM_AUDIT.md) preserves the mobile palette/type/spacing/cards/inputs. Light/dark/system exists but theme preference is session-only. Auth has VI/EN device-locale strings; most feature/navigation labels remain Vietnamese. Fourteen palette pairs were measured: five fall below the chosen text/control thresholds. Contrast, targets, error announcements, large text and actual native visual verification are scheduled explicitly in M2/M3. These gaps are not presented as accessibility passes.

## 6. Final verification and limits

| Check | Final |
|---|---|
| Install | Exit 0; dependency/lockfile unchanged. |
| Lint | Exit 0; zero errors/warnings. |
| Typecheck | Exit 0. |
| Existing auth tests | Exit 0; 10/10. |
| All foundation tests | Exit 0; 26/26, zero failures/skips. |
| Real source/API integration | Exit 0; seven groups with real Kestrel/PostgreSQL. |
| Android JS/Hermes export | Exit 0; approximately 3.1 MB; bundling only. |

The final HTTP groups include registration/login/restore; preserved bilateral relation; role/ownership restrictions; six calls sharing one refresh; immediate rotation rejection of an **unexpired** old access token; copied-session rejection after logout; delayed-refresh retirement; invalid/anonymous rejection. Platform/storage/hook boundaries are adapted in Node, but fetched API responses are real. No production/development user database or personal account was used. Both baseline and final lifecycle records confirm database deletion and cluster shutdown.

Physical Android/iOS, actual SecureStore encryption/persistence, native Router deep links/Back, screenshots, screen-reader/responsive device behavior, live Google/Drive/VietMap, HTTPS staging and long-duration performance remain NOT TESTED. The original and final commands/exit codes, failed intermediate cases and safe reproduction instructions are in [TEST_RESULTS](TEST_RESULTS.md).

## 7. M2 readiness

**Ready for controlled M2 development after M1 review.** Confirmed data/session/guard foundations are repaired and reproducible checks are available. Native auth/storage/deep-link smoke should be the first M2 gate; the measured design risks and unfinished modules remain explicit acceptance work, not hidden release readiness.

The [M2–M9 backlog](M2_M9_BACKLOG.md) defines work packages, dependencies and acceptance criteria. Work stops here for review; no subsequent package has been started.
