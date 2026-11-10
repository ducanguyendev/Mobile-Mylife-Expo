# M2 Home data audit

Starting Expo commit: `4cfc4c941eebbbfce8ed2b16671b136aabadd313`, branch `feature_minhduc`. Web reference `144fc506c0ec7957d40a137351aeda296b8937b5`; Backend `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`. Reference trees remain unchanged.

| Information | Contract used | Behavior |
| --- | --- | --- |
| Greeting/name/role | Existing AuthProvider, `GET /api/me` | Actual displayName/fullName/name. Device-local hour and localized device-local date. No guessed personal name. |
| Members | `GET /api/family-tree`, `{success,data:[]}` | Actual record count; distinct positive recorded generations; first three real member previews. Working family list and member-detail routes. |
| Upcoming dates | `GET /api/family-tree/anniversaries`, `{success,data:[]}` | Backend `nextSolarDate` is authoritative. Sort by that date; exclude occurrences now before the Vietnam calendar day. No client lunar arithmetic or per-event conversion calls. |
| Recent memories | `GET /api/library/albums`, raw array | Recent album metadata sorted by updatedAt/createdAt; actual photoCount including zero. Neutral cover treatment; no external/private cover URL downloads. |

Backend inspection: `FamilyAnniversaryService.Map` calculates lunar recurrence and yearly solar FAMILY_EVENT recurrence using `GetVietnamToday`; solar leap-day clamping is server-owned. Library album summaries filter `CreatedByUserId`; family/anniversary services filter the authenticated user's tree. All three endpoints require USER. ADMIN Home shows an honest unavailable explanation and mounts no Home data hook.

Removed from Home: the fixed May 18 heading, Minh greeting, 12-member count, sample member names/avatars, three-generation claim, grandmother May 20 event and illustrative personal memory/album. The existing unfinished Memories tab is outside M2; Home does not link its album metadata into that mock workflow. Anniversary/album management is described as coming later, without active-looking buttons.

Each account gets a separate resource, keyed by authenticated id and role. No personal-data disk cache or module-level dashboard cache. Focus starts one request per section; concurrent refreshes coalesce. Blur/background aborts requests; a late response from an aborted operation cannot publish. A new account starts empty synchronously. Foreground/refocus reloads, pull-to-refresh reloads all three, and retry reloads only its section. Errors hide arbitrary server/transport details. Skeletons, empty results and independent errors are supported.

M1 API transport/session guards remain intact. The sole transport change bridges the caller's AbortSignal to the existing 15-second controller, removing the listener in finally. Native bearer, mobile header, credential omission, refresh single-flight, rotation/logout race protections and SecureStore serialization remain covered by unchanged M1 tests.

Real integration evidence: `test-results/final-backend/m2-home.json`. Synthetic members/anniversary are created through actual HTTP. Because Drive is deliberately disabled, an empty album metadata fixture is inserted directly into the disposable PostgreSQL database, then read through the actual owner-scoped HTTP endpoint. This verifies metadata reads, not cloud album creation, upload or private image delivery. No production DB, real account, Google credential or fake fetch response is used for this integration.

Limits: Home fetches the current lightweight list contracts; large-family pagination/summaries need future API support. Album opening/private native image transport belongs to Library work. Cached same-account data may remain visible while refreshing; a failed section changes to an explicit error. There is no advertised offline cache.
