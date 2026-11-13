# M6 initial audit

Recorded before implementation on 2026-11-12. Expo feature_minhduc is clean at 8d65018817363a26f2be3b7661aeefd1a0ea2315. Backend feature_minhduc is clean at 53e472513eec18bb26f0b33a866785c532bcdc85. Web reference is clean at 144fc506c0ec7957d40a137351aeda296b8937b5. Flutter1e2116ed retains its preexisting .gitignore and generated Android problems report modifications.

Read all12 M5 reports, Backend anniversary controller/read/write DTO/service, lunar service/tests and Timeline derivation, Web AnniversaryTab/modal/calendar and Can Chi utilities/service/page, Expo Timeline picker/editor/query, profile, Home resource and protected Family routes. Existing M4 native compatibility evidence remains applicable to the exact VIETMAP3 custom development APK.

Baseline lint, typecheck, auth10, foundation26, M2 22, M3 28, M4 39, M5 60 and contrast14 pass. Unique JS175 includes auth inside foundation. Raw outputs are in test-results/baseline-*. A fresh npm audit was executed, with its advisory payload in audit-before.json.

Remote Backend DTO fetched from feature_minhduc now contains both double Range bounds. Local regression12 is committed in53e47251. Deployment status requires separate evidence. Actual M5 push workflow43201911893 completed successfully for exact starting Expo SHA, quality job131127198646 including test:m5 and all inherited checks. M6 remote CI requires its future execution.

Backend read DTO has20 fields, including nullable nextLunarYear. FAMILY_EVENT normally uses original solar recurrence, with February29 clamped to February28 in non-leap years. Backend also reads legacy FAMILY_EVENT records with no original date through retained lunar recurrence fields. The mobile reader must preserve these legacy records while requiring an original solar date for new/saved forms. DEATH_ANNIVERSARY requires lunar conversion matching the historical date, and linked members must be deceased with that exact recorded death date.

The list supplies one next occurrence per record. Calendar placement will use nextSolarDate and display the available-occurrence limitation during month browsing. Lunar conversion and recurrence remain authoritative HTTP calls. Gregorian grid arithmetic and Web Can Chi labels require no astronomical client implementation or new native dependency.

Implementation approach uses account-local cancelable queries, existing virtualized member selection, a FlatList upcoming alternative, a bounded month grid, exact field drafts, stale checks and uncertain-write reconciliation. Memories retains Timeline entry and enables Calendar, with protected Family routes for member/source navigation. Home/profile/Timeline refocus reload remains the synchronization boundary.

Documentation consulted before new React Native/Router API use includes Expo58 reference, Expo llms index, Router introduction, React Native FlatList and Modal documentation. Existing M5-07 Map first-open reload will receive a clean-cold reproduction and redacted lifecycle diagnostics.

[Expo58 reference](https://docs.expo.dev/versions/v58.0.0/), [Router](https://docs.expo.dev/router/introduction/), [FlatList](https://reactnative.dev/docs/flatlist), [Modal](https://reactnative.dev/docs/modal).
