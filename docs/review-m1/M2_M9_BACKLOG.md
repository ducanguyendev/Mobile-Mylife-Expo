# M2–M9 work packages

Planning only. M1 did not begin these implementations. Keep Expo's native design system/navigation/auth architecture and Web W10's actual API/business rules. Do not invent API data or embed Web desktop pages.

## M2 — Honest Home, shared UX and localization foundation

Replace fabricated personal summaries with current authenticated identity and only real, already-supported data. Establish app-wide VI/EN strings and persistent non-sensitive theme/locale preference. Correct the measured semantic text/control contrast risks without replacing the design system. Address inert affordances, accessible validation/targets and shared loading/empty/error/retry conventions.

Acceptance:

- No fabricated name, member count, event date or album count presented as personal data.
- System/Light/Dark and VI/EN work consistently across shell/auth/Home and persist without storing tokens in AsyncStorage.
- Measured text/control pairs and representative rendered screens pass agreed contrast/target checks; VoiceOver/TalkBack labels and large-text behavior verified on device.
- Login/reload/expired-session/logout/deep-link smoke passes on a real Android or iOS runtime, including SecureStore persistence. Record the untested platform explicitly.

## M3 — Family member/relationship parity

Finish native member list/detail/profile aggregate, filters, correct gender display across server aliases, avatar pipeline and graph navigation. Replace the eight-candidate Alert with the searchable, virtualized native sheet specified in API_CONTRACT_AUDIT. Add relationship editing only when the entire payload/preservation contract is implemented.

Acceptance:

- Select candidates beyond positions 8/100; current selection stays visible and cancel does not mutate state.
- All parent/child/spouse/horizontal rules remain Backend-authoritative; foreign IDs/self-links/cycles fail safely.
- Unrelated edits preserve every field/relationship the screen cannot edit. Explicit removal is distinct from omission; bilateral relation regression passes.
- Real create/update/delete/refetch, avatar permission/fallback and member profile API are verified on disposable data.
- No duplicate initial fetch; stale/aborted reads cannot replace a newer member/account. Native graph gestures/Back behavior work without a desktop layout clone.

## M4 — Family Map

Consume the existing map/location APIs, grouped coordinates and statuses. Provide mobile markers, search/filter, missing/pending/failed states, selected-member details and manual location/retry where authorized. Evaluate a compatible native provider/build configuration before choosing dependencies.

Acceptance:

- Valid, zero, missing and invalid coordinates handled; cross-account location writes denied.
- Address changes/manual pin/re-geocoding use existing Backend semantics and survive refetch.
- Provider credentials are restricted test keys; no server secret placed in Expo public configuration.
- Actual native map interaction/provider failure and device performance are measured. Mock markers are not a live-provider pass.

## M5 — Timeline

Implement native chronological event list/detail/create/edit/delete with member association and approximate/year-only dates. Use existing read-only derived-event rules.

Acceptance:

- Mixed date/year-only/unknown dates sort correctly, and unsupported derived mutations are unavailable.
- Payloads preserve read-only/source fields; foreign member/event IDs are rejected.
- CRUD/refetch and empty/loading/error/retry/form cancellation pass against real Backend/disposable PostgreSQL.
- Long content, large text, VI/EN and native keyboard/Back behavior are verified.

## M6 — Anniversaries

Implement real event listing, filters, member links, CRUD and Vietnamese lunar/solar date preview using Backend endpoints as the authority.

Acceptance:

- Historical death date, lunar year/day/month/leap flag and member life status follow Backend validation.
- Legacy events and family events without lunar fields remain readable without fabricated conversions.
- Next occurrence and Vietnam-date boundaries are tested with fixed cases and real API requests.
- Offline/error/retry states preserve entered values and do not create duplicates.

## M7 — Library and native media

Implement albums, image picker/upload, private image display/lightbox, metadata edit, delete and permission states. Integrate Drive only through Backend-owned storage endpoints.

Acceptance:

- MIME/signature/size/batch rules, permission denial, cancellation, partial failures and retry are covered.
- Real album/photo upload/read/update/delete/refetch succeeds against a dedicated non-production Drive root; cleanup verified.
- Tokens are sent only to trusted Backend image endpoints, never arbitrary image URLs or Drive.
- Native media permission/device lifecycle and memory use are measured; fixture storage tests remain labelled as such.

## M8 — Profile/security and Admin native workflows

Finish current-user profile/password/avatar flows and role-specific Admin metrics/users/status/role/login-log views. Reuse existing APIs and loaded-record limits; do not add fake server pagination. Native Google sign-in is a conditional sub-package requiring dedicated platform client configuration, verified Backend audience compatibility and test accounts; leave it explicitly BLOCKED until those exist.

Acceptance:

- Profile changes roundtrip through `/api/me` contracts; password/provider rules and session effects match W10.
- ADMIN routes/mutations reject USER/anonymous server-side; USER family routes still reject ADMIN.
- Lock/demotion/logout revoke affected sessions immediately; protected UI exits without stale data.
- Pending/duplicate/error/stale-refetch behaviors pass; logs/users scope and pagination limits are described honestly.

## M9 — Integrated release verification

Run the complete native/Web parity matrix against isolated Backend/PostgreSQL and test provider accounts. Validate production-like HTTPS transport and mobile builds before any release action is separately authorized.

Acceptance:

- Android and iOS device/runtime coverage for cold start, SecureStore, deep links, Back, foreground/background, expiry, rotation/logout races and invalid/revoked sessions.
- Cross-account isolation, real provider lifecycle, uploads, VI/EN, themes, long text, a11y and responsive/tablet cases are recorded.
- Request cancellation, slow/offline networks, duplicate requests, memory/performance and sensitive-log checks have no unexplained failures.
- Build/signing/update readiness is documented without committing credentials, deploying, submitting or publishing automatically.
- Final verdict distinguishes device/real API/provider passes from adapters/mocks and lists every remaining blocker.

## Dependencies and sequencing

M2 can begin after M1 review, with physical-device auth/deep-link checks an early acceptance gate. M3 is prerequisite for rich member-linked Map/Timeline/Anniversary screens. Google OAuth/Drive/VietMap and native build/device access are explicit external dependencies. Existing M1 reproducible safety tests remain required gates throughout M2–M9.
