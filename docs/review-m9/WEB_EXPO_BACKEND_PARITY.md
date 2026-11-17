# Web, Expo and Backend parity

Repository/build context: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md). Web W10 stays at `144fc506`; no Web redesign or Flutter edit.

Native uses Bearer and the mobile header, omitting browser cookies. Web keeps cookie/Origin/CSRF protections and receives no token JSON. The preserved Backend patch validates profile values and serializes Admin safety without removing routes/fields. Shared family relationships, manual coordinates, derived Timeline source dates, lunar recurrence, Library ownership and Profile/Admin data are covered by `test-results/final-http/m1–m9` evidence. Individual names appear in the JSON files; these are Web-compatible HTTP tests, not browser UI execution.

| Shared contract | Evidence | Limitation |
| --- | --- | --- |
| Auth/session/roles | final-integration.json; m8/m9-integration.json | Real Google OAuth not executed |
| Family/map | m3/m4-integration.json | Native tiles/key not verified |
| Timeline/lunar/Home | m2-home.json; m5/m6-integration.json | Physical long-session coverage absent |
| Library/private bytes | m7/m9-integration.json | HTTP storage adapter only |
| Profile/password/Admin | m8/m9-integration.json | Backend patch not on GitHub |

Accepted policies: email-discoverable public account avatars and existing sessions retained after password changes. No silent privacy/session-policy change.

Missing atomic versions/idempotency affect both clients. Fresh reads and local gates do not prevent stale cross-client writes. `VietMapSurface.web.tsx` fixes release Router web/server manifest bundling by keeping native codegen out of web; its unavailable fallback is not tile proof.
