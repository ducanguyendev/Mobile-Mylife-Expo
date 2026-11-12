# Timeline API contract

Source of truth: Backend FamilyTimelineDto/FamilyTimelineService/controller at c1b43b1. No new endpoint/database and no client-derived events.

| Method / path | Result |
| --- | --- |
| GET /api/family-tree/timeline | success/data array of custom and derived events; ascending chronology |
| GET /api/family-tree/{memberId}/timeline | Same DTO; primary OR related member filter; foreign member404 |
| POST /api/family-tree/timeline |201 success/data event |
| PUT /api/family-tree/timeline/{id} |200 success/data event or404 |
| DELETE /api/family-tree/timeline/{id} |204 or404 |

All require USER; ADMIN403, anonymous401. Expo retains existing Bearer, X-Client-Platform mobile, credentials omit, SecureStore, single-flight refresh/logout protections. Web-compatible tests use separate cookies, allowed Origin and X-Requested-With; login exposes no token JSON. HTTP parity is not browser UI QA.

DTO fields: id/sourceId are JSON long values (safe integer required by JavaScript; larger values fail closed), memberId/relatedMemberId nullable positive int32; memberName/description/location/sourceType nullable strings; eventType one of BIRTH, DEATH, MARRIAGE, CHILD_BIRTH, ADDRESS_CHANGE, ANNIVERSARY, MEMORY, CUSTOM; title nonempty string; eventDate nullable DateOnly ISO YYYY-MM-DD; eventYear nullable1–9999; isApproximate/isDerived booleans; latitude/longitude nullable paired finite doubles within±90/±180. Missing/malformed fields, duplicate identities, mismatched date/year, unknown enum, bad IDs or invalid coordinate pairs reject the whole response rather than dropping rows silently. Null/unknown dates remain defensively displayable; writes require date or year.

Derived FAMILY_MEMBER birth=-memberId*2, death=-memberId*2-1; sourceId=memberId. ANNIVERSARY=-anniversaryId, original solar date, sourceId=anniversaryId. Different sources may share numeric negative IDs; identities use source/type/reference. Persisted custom IDs are positive and keyed independently of changing type. Derived flag/source/type consistency is validated. Positive legacy BIRTH/DEATH rows are also read-only per Web. Normal creation exposes only CUSTOM/MEMORY/ADDRESS_CHANGE/MARRIAGE; an existing writable legacy CHILD_BIRTH/ANNIVERSARY type may be retained on edit, not freely selected for new events.

Backend trims title2–200; description<=2000, location<=500; validates date/year, paired coordinates, current-tree primary/related membership. Exact date determines stored eventYear. No per-event GET endpoint: stale comparison uses full authoritative Timeline GET; member directory loads once, avoiding per-event profile requests. Create/update responses can have memberName=null until list refetch. Source metadata is not a write DTO field and remains server-owned.

Web ascending-year meaning is retained. Pure numeric calendar sorting avoids Date.UTC's year0–99 coercion; ISO parts are validated by Gregorian month/leap rules. Year-only sorting is anchored numerically before known dates in the same year without creating/storing January1. Display preserves exact date versus year-only and approximate indicators; no UTC/local Date conversion.
