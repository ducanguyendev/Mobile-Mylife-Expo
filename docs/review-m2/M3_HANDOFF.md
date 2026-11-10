# M3 handoff

M2's functional Home/preferences foundation and Android Expo Go smoke are ready to build on. Full accessibility and standalone-device release verification remain open; M2 is not a release-readiness certification.

Keep the existing Router protected groups, native tabs and M1 session protocol. USER-only family routes must remain guarded at root as well as authorized by Backend. Do not use client navigation guards as a substitute for owner checks. ADMIN does not use a personal family tree.

Preserve M1 relation integrity: unrelated family edits must omit `horizontalRelations`, rather than send an empty array that clears bilateral relationships. Continue roundtripping supported scalar/father/mother/spouse/child fields. Existing M1 tests and helper files remain byte-for-byte unchanged; `test-results/m1-test-integrity.json` records this.

Use the existing central theme/context, preference store and VI/EN architecture for new screens. `useAppTheme` keeps mode/setMode/colors/resolvedMode and now also exposes language preference, resolved language, preference-save error/retry and reducedMotion. Non-sensitive preferences are independent of auth. Translate new product copy centrally; the remaining unfinished Family/Map/Timeline/Memories text still needs module work and the M8 final audit.

Home provides a small account-local resource pattern with subscription, coalescing, independent retries, cancel and stale-response protection. Any future family graph/map/list cache must likewise reset synchronously on account changes. Current Home loads three list endpoints per focus/foreground; pagination/aggregate endpoints for very large families would need future contract support.

Use Backend `nextSolarDate`/calendar semantics. `home-data.ts` has tested date-only formatting and Vietnam day filtering; do not use device UTC shifts or invent client lunar conversion. Private photos/Drive delivery, album opening, anniversary management, graph/map/timeline and ADMIN implementation were deliberately not started in M2.

M8 must implement profile editing, avatar upload and password change against their actual contracts. Current Profile explicitly disables those workflows. Keep accurate role/provider labels and avoid fabricated joined dates. Library work must design authenticated native image transport before replacing neutral Home album covers.

Run `npm run lint`, `npm run typecheck`, `npm run test:auth`, `npm run test:foundation`, `npm run test:m2`, `npm run audit:contrast:m2` and `npm run test:integration:m2`. Set `PG_BIN` when PostgreSQL tools are not on PATH. The M2 harness preserves M1 assertions/evidence and targets only a disposable cluster. Android smoke reproduction is in `NATIVE_SMOKE_RESULTS.md`.

Carry-forward validation: TalkBack/VoiceOver focus/speech, physical/standalone builds, maximum font size, fuller keyboard/safe-area/back/transition combinations, locale/calendar edge cases on more OS versions and storage-failure behavior on real devices. Compact and large screenshots in M2 are viewport overrides on one Android AVD, not separate device coverage. Do not upgrade those qualified results into a full accessibility or release PASS.
