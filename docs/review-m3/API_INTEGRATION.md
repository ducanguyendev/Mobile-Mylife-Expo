# API integration and parity

Verdict: **PASS for real Backend/PostgreSQL and Web-compatible HTTP parity; real storage provider NOT TESTED**.

All destructive work uses a loopback Kestrel instance and random disposable `mylife_m1_<12 hex>` database, reusing M1 isolation/cleanup guards. `scripts/run-isolated-m3.cjs` replays existing M1/M2 assertions without editing their source or overwriting their evidence. M3 adds 12 scenario groups. Final lifecycle JSON records drop/stop completion. PostgreSQL 18 and .NET 10 were available.

| Endpoint | Use |
| --- | --- |
| GET `/api/family-tree` | Authoritative directory and relationship candidates |
| GET `/api/family-tree/generations` | Optional generation metadata |
| GET `/api/family-tree/{id}` | Fresh edit state / mutation reconciliation |
| GET `/api/family-tree/{id}/profile` | `{member,relatives,timeline,anniversaries,libraryMemberLinkAvailable}` aggregate |
| POST `/api/family-tree` | Create |
| PUT `/api/family-tree/{id}` | Full editable scalar update with intentional relation collections |
| DELETE `/api/family-tree/{id}` | Confirmed member delete |
| POST `/api/family-tree/{id}/avatar` | Multipart `file` |
| DELETE `/api/family-tree/{id}/avatar` | Managed photo removal |
| GET `/api/family-tree/{id}/avatar/image` | Authenticated private image bytes |
| PUT `/api/family-tree/{id}/location` | Test-only manual-coordinate seed; no M4 UI |

Native requests retain Bearer + `X-Client-Platform: mobile`, `credentials: omit`, SecureStore and existing refresh/logout version guards. Only multipart header handling changed in `apiClient`: fetch supplies its boundary. Avatar recovery probes `/api/me` through the existing single-flight auth boundary. No token store was added.

Web parity uses actual W10 cookie transport, allowed Origin and `X-Requested-With: MyLife`; no native header or Bearer is mixed into browser cookies. Tests assert Web login does not return accessToken JSON, read an Expo-created member, edit it via Web-compatible HTTP, then verify authoritative Expo data and reciprocal relationships. This is HTTP parity, not a browser UI smoke claim.

Other USER profile/avatar GET/POST/DELETE are 404, foreign relation IDs fail, ADMIN Family access is 403 and anonymous private images are 401. Strict aggregate parsing rejects malformed/duplicate collections instead of displaying plausible fabricated data. Queries are account-local, coalesced and abort-guarded against stale responses.

Avatar service uses the real controller, validators, checksum logic, database and authenticated image delivery. A test-only .NET hosting startup installs an in-process named HttpClient provider adapter. It intercepts only the configured upload/delete contract and Google's image URL used by Backend. Unexpected destinations fail closed. No Backend source or production configuration changed, and no real Google credentials/network were used.

Evidence: `test-results/final-backend/{final-integration.json,m2-home.json,m3-integration.json,avatar-provider-events.ndjson,final-lifecycle.json}`. Native provider events are saved separately. Initial missing migration-history-table log occurs before automatic migration of the fresh database; the ready probe and complete integrations subsequently pass.
