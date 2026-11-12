# M4 initial audit — 11 November 2026

Started on `feature_minhduc` with a clean Expo working tree. Verified actual HEADs:

| Repository | Starting HEAD |
| --- | --- |
| Expo | `0bf11275802fcceac8e3254214033de9d646b556` |
| Web W10 (read-only) | `144fc506c0ec7957d40a137351aeda296b8937b5` |
| Backend W10 | `c1b43b1f83e17f9546edc9bb314b8345b8d947ad` |

Read M3 handoff, report, native smoke, avatar/graph QA, relationship audit, API integration, feature parity, design review, initial audit and test results. M3 remains PARTIAL PASS for development, not release. Reviewed existing protected Router family stack, account-keyed query/cancellation, Bearer transport, member DTOs/edit merge, avatar transport, shared theme/localization/design components; Web FamilyMapTab/FamilyLocationMap/VietMapBaseLayer/familyMapService; Backend map/location/retry DTOs, controller, status resolver, five-decimal grouping, address invalidation and background queue conditional update.

Baseline before application edits: lint/typecheck pass; auth10, foundation26 (includes auth10), M2 22, M3 28 pass; contrast14 pass. Raw logs and `baseline-summary.json` are in `test-results/`. Initial isolated integration could initialize PostgreSQL but sandbox prevented server startup (`could not create restricted token`, error87). Replay outside sandbox passed legacy M1 7/M2 6 with database dropped/server stopped. The inherited `--baseline` mode does not execute M3's twelve scenarios; full M3 integration is revalidated in the final replay, not mislabelled as pre-edit evidence.

The first inherited command wrote three M3 baseline evidence files. Those generated attempts were copied into M4 and the original files restored byte-for-byte/canonical working-tree line endings; no old assertions or evidence content was retained as a new M3 result.

Installed baseline: Expo58.0.22 / RN0.88.1 / React19.3.0, Node24.17.0, .NET10/PostgreSQL18. Current Expo58 docs were fetched before native/API changes. Official VIETMAP Expo page contains old examples; inspected registry metadata and actual 3.0.0 tarball rather than copying them. No tile/service credentials were assumed available. No production database or real family records were accessed.

Later confirmed exception to Backend read-only rule: NaN input raised HTTP500 in integer RangeAttribute conversion before the service's finite check. Only two DTO range bounds changed to double, with twelve targeted regression cases. See LOCATION_INTEGRITY.md. M4 made no Web/Flutter writes. Final Web status is clean; Flutter's observed `.gitignore` and generated `android/build/reports/problems/problems-report.html` working changes were left untouched and are not M4 deliverables. The status inventory includes these for transparency, not as attribution to M4. No commit, push, PR, merge, deploy or published build.
