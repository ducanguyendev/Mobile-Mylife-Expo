# Map API and Web–Expo parity

Production routes used:

| Endpoint | Behavior |
| --- | --- |
| GET `/api/family-tree/map` | Strict success/data envelope; authoritative groups, members and counts |
| GET `/api/family-tree/{id}` | Fresh ownership/member editor baseline and post-save reconciliation |
| PUT `/api/family-tree/{id}/location` | Only finite/ranged latitude, longitude and optional name<=500 |
| POST `/api/family-tree/map/retry-geocoding` | Actual queued/skippedManual/skippedLocated/noAddress counts |

No new retry/geocoding endpoint or database. DTO parser rejects duplicate/malformed IDs, unknown statuses/sources, bad coordinates, duplicate groups/membership, mismatched totals, inconsistent names/generations and members in a group whose status is not LOCATED. Zero is valid. Stale numeric metadata on an unlocated status is never a marker. Group keys, averages, count and members come from Backend; Mobile does not regroup or reverse-geocode addresses. Backend uses rounding away from zero to five decimals.

`tests/real-backend.m4.cjs` exercises real loopback Kestrel/PostgreSQL. Native source runs with adapted SecureStore/React bridges and actual Bearer API client; asserts credentials omit, mobile header, no response cookies. Web-compatible source uses separate cookie jar, allowed Origin and X-Requested-With, with neither Bearer nor mobile header; login returns no accessToken JSON. Test reads Expo-created location/groups/counts through Web HTTP, updates location through Web HTTP and reads it in Expo, changes address through Web HTTP and verifies invalidation/conflict in Expo. This is **HTTP business parity, not browser UI parity**.

Other-account location PUT404; ADMIN map/retry/PUT403; anonymous map/retry/PUT401; account-local map empty for a second USER. Existing M1/M3 isolation/security suites replay unchanged. Map route lives in the existing USER-only protected family stack, with an additional local auth gate. Account switch unmounts keyed UI, aborts queries/editor/retry and suppresses late results.

Evidence and exact executed scenario results: `test-results/final-backend/m4-integration.json`, `m4-final-map-synthetic.json`, request method/path/status traces, M1/M2/M3 replay JSON and cleanup lifecycle. All addresses/coordinates in evidence are synthetic; no tokens/cookies are recorded. Real provider tiles and browser UI remain separately gated.
