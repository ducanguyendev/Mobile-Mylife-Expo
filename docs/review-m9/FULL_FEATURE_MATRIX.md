# Full feature matrix

Reviewed 17 November 2026, Asia/Saigon. Base commits: Expo `1e64130e898cdeb5f30b0ac6dd07a28d7ab9a8c1`, Backend `ca20ba52635a026b32449f919e60410ff880c829`, Web `144fc506c0ec7957d40a137351aeda296b8937b5`; branch `feature_minhduc`. M9 is uncommitted. Remote heads were rechecked with `git ls-remote` and equal these bases. Web/Flutter receive no task edits.

Evidence paths are relative to this directory. HTTP tests use real loopback Kestrel/.NET10/PostgreSQL18, adapted native bridges and synthetic accounts. Storage is an HTTP adapter, not Google Drive. Counts below are scenario groups, not individual assertions.

| Module | Source / API | Role and integrity | Tests / parity | Release gate |
| --- | --- | --- | --- | --- |
| M1 Auth | `src/features/auth`, `src/api`; /api/auth/register, /api/login, /api/me, /api/refresh-token, /api/logout | Anonymous auth; sid-bound Bearer, rotating refresh, serialized SecureStore | foundation26; HTTP7; cookie/native contracts | Physical/iOS, real Google OAuth |
| M2 Home | `src/features/home`, theme/localization; family-tree, anniversaries, library/overview | USER; real counts/original dates; section-local errors | JS22/HTTP6; real shared data | Device/font/a11y breadth |
| M3 Family | `src/features/family/api`, graph/validation; family-tree and member/avatar routes | USER owner; parents/spouse/children/horizontal relationships preserved | JS28/HTTP12; Web member roundtrips | Concurrent writes, real provider, physical graph |
| M4 Map | `src/features/family/map`; family-tree/map and member location | USER; manual coordinates/source preserved | JS39/HTTP17; honest list/fallback | Real restricted key/tiles; historical reload |
| M5 Timeline | `src/features/timeline`; family-tree/timeline/events | USER; derived source identity and exact/approximate dates | JS60/HTTP21; shared Web events | Conditional writes; native stability |
| M6 Anniversaries | `src/features/anniversaries`; anniversary/lunar routes | USER; original vs next date, lunar leap recurrence | JS83/HTTP21; Web roundtrips | Device long-session/date boundary |
| M7 Library | `src/features/library`; library/categories/albums/photos | USER owner; authenticated private bytes, metadata/delete consistency | JS88/HTTP21; native/Web-cookie bytes | Real Drive, decoded memory, idempotency |
| M8 Profile/Admin | `src/features/profile`, admin; /api/me/profile, /api/auth/change-password, /api/avatar/upload, /api/avatar and /api/admin/stats/users/logs | Authenticated account; exclusive ADMIN; protected deletion and fresh actor/session | JS61/HTTP29; deterministic Backend admin races | Remote patch, conditional writes, device stability |

M9 adds20 JS cases and41 HTTP groups. Production screens load source APIs; synthetic seed records are confined to QA. Empty/error/map fallback states do not invent family data. Native coverage is separately limited in [DEVICE_TEST_MATRIX.md](DEVICE_TEST_MATRIX.md). All modules support continued development; overall production verdict remains NO-GO.
