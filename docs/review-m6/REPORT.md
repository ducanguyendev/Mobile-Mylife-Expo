# MyLife Expo M6 review

**Development verdict PARTIAL PASS. Application release readiness NOT READY.** Calendar/Anniversary implementation and final local unit/Backend/HTTP checks pass. Native executed scope and remaining device gates are recorded in NATIVE_SMOKE_RESULTS. Actual M6 remote CI awaits a later authorized push.

Starting feature_minhduc commits are Expo8d65018817363a26f2be3b7661aeefd1a0ea2315, Backend53e472513eec18bb26f0b33a866785c532bcdc85 and Web144fc506c0ec7957d40a137351aeda296b8937b5. Expo/Backend/Web began clean. Flutter's two preexisting dirty files are preserved. Primary feature changes are in Expo, plus one new deterministic Backend regression file.

Memories enables a native Monday-first calendar with current month, previous/next, month/year jump, Today, selected date and per-type event counts. A chronological virtualized list supports full accent-insensitive search, All/Death/Family filters, selected date, clear, refresh, errors and empty states. Calendar places only provided nextSolarDate values and explains its coverage. Upcoming cards use Backend daysUntil and next dates, with member/place/host/details. Library retains future scope.

Create/edit/delete uses authoritative details and all supported optional fields. Family events recur by original solar date with Backend February29 policy. Death anniversaries have lunar day/month/year1800–2200/leap mode, cancelable debounced conversion and next-occurrence previews, original-date matching and deceased-member death-date validation. Searchable member selection supports100+ candidates and draft/cancel. Unsaved warnings, title-specific delete, serialized mutations, fresh conflict checks and uncertain-write reconciliation are implemented.

All seven existing anniversary endpoints use native Bearer transport with strict20-field DTO/envelope validation and nullable nextLunarYear. Legacy lunar-backed records remain readable. Backend owns lunar conversion, Vietnam UTC+7 recurrence and countdown. Can Chi matches Web. Calendar uses upcoming dates while source-qualified read-only Timeline rows keep historical original dates. Profile/member Calendar/source management and Home Calendar links reuse protected routes and authoritative refocus reload.

Final validation passes lint/typecheck,258 unique JS cases including83 M6,14 contrast, full Backend203 including9 new deterministic cases, and84 real HTTP scenario groups including21 M6. M1–M5 assertions/helpers remain intact. The initial audit/network and three integration-harness failures are retained with fixes and teardown records. Native device coverage is separately documented.

Backend M4 remote-push issue is closed after verifying53e47251 contains double ranges and12 regressions. Real malformed nonfinite input returns400. Deployment status remains unverified. Actual M5 GitHub CI43201911893/job131127198646 passes for the exact starting Expo SHA. Workflow now includes test:m6, with M6 remote status NOT RUN.

M5-07 received active cold/first/subsequent/Calendar-path investigation and redacted native/Metro diagnostics. The initial M6 process had0 ReactHost reload/fatal lines across first/subsequent entries and rendered real tiles on the second. The prior initiating cause remains unproven, with release impact open. M4 recreation warning is tracked separately. The existing verified development APK is reused with the same SDK58/RN0.88/VIETMAP3 resolver.

Controlled rapid physical RR in an unsaved native Modal later reproduced15 ReactHost developer reload lines with the same PID and no fatal exception. Focus-verified paced input completed the real CRUD. Map after Calendar/Timeline/Graph rendered tiles with zero additional reloads. This identifies an automation trigger, while the original M5 Map-first cause remains OPEN. Compact360dp/font130%, actual offline/retry and revoked-session protection have native evidence.

Exact application source files changed or added follow.

```text
src/app/(tabs)/index.tsx
src/app/(tabs)/memories.tsx
src/app/family/anniversaries.tsx
src/features/family/components/MemberProfile.tsx
src/features/timeline/TimelineScreen.tsx
src/features/timeline/TimelineEventDetails.tsx
src/features/timeline/timeline-strings.ts
src/localization/strings.ts
src/features/anniversaries/AnniversaryScreen.tsx
src/features/anniversaries/AnniversaryCalendar.tsx
src/features/anniversaries/AnniversaryEditor.tsx
src/features/anniversaries/AnniversaryDetails.tsx
src/features/anniversaries/MemoriesScreen.tsx
src/features/anniversaries/anniversary-api.ts
src/features/anniversaries/anniversary-data.ts
src/features/anniversaries/anniversary-draft.ts
src/features/anniversaries/anniversary-strings.ts
src/features/anniversaries/calendar-data.ts
src/features/anniversaries/lunar-preview.ts
src/features/anniversaries/use-anniversaries.ts
```

Supporting changes include package scripts, Expo quality workflow, fixture-output ignores, M6 unit/HTTP/date tests, disposable native/parity/diagnostic scripts and14 reports/evidence. Backend adds only Tests/AnniversaryDateIntegrityTests.cs. Exact full inventory and integrity/cleanup records are under test-results.

M7 development can proceed with CARRY_FORWARD_RISKS and M7_HANDOFF. Open release gates include real Drive, physical/iOS/accessibility/performance, conditional writes,14 moderate advisories, Map release-key setup, development-client lifecycle warnings, deployment verification and M6 remote CI. No automatic commit/push/PR/deploy or release artifact was produced.
