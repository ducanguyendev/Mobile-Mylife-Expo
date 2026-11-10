# Expo M1 feature parity against Web W10

Snapshot: 10 November 2026. Reference commits: Web `144fc506c0ec7957d40a137351aeda296b8937b5`, Backend `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`. Expo starts at `7fa31245bc2bcfc6a58a28879bba9df028f13e45`.

COMPLETE means API-backed and verified for the whole named feature. PARTIAL means some real functionality, MOCK means illustrative content, MISSING means no implementation, and BLOCKED means a required configuration/service is unavailable. API-source verification with a native bridge adapter is distinguished from a native UI/device test.

| Feature | Classification | Current Expo behavior and evidence | Gap to Web W10 / next package |
|---|---|---|---|
| Home | MOCK | Static greeting/date/name, 12-member count, anniversary and album illustrations in `(tabs)/index.tsx`. | No real summaries/personalized data. M2 must remove unsupported claims rather than invent new Backend metrics. |
| Authentication | PARTIAL | Registration/login, server `/me`, bearer transport, restore/rotation/logout pass actual Expo source → real Kestrel/PostgreSQL checks. Ten original auth tests and eleven new native-session unit tests pass. | SecureStore hardware persistence, cold start, background/foreground and device UX are not tested. Google not enabled. |
| Google sign-in | BLOCKED | No implemented native OAuth launch flow; public platform IDs/configuration are prerequisites. | Dedicated OAuth test project/accounts and platform redirect flow; keep secrets server-side. |
| Profile | PARTIAL | Real authenticated name/email/role/provider/avatar URI; logout works; System/Light/Dark selection works in memory. | Profile/security/language rows have no action. No edit/password/avatar upload API path. M8. |
| Family Tree module | PARTIAL | Real list/detail/create/edit/delete services, text search and generation summary; USER-only direct forms; relation preservation and ownership verified by real HTTP. | Actual graph/tree interaction is absent; search is name-only and forms/pickers remain limited. M3. |
| Family graph renderer | MISSING | Tree tab is an explicit future-feature placeholder. | Mobile graph/layout/navigation without cloning the Web desktop canvas. M3. |
| Family Map | MISSING | Map tab is an explicit placeholder. M1 types now include read-only location metadata. | No map/geocoding/manual-location UI or marker rendering. M4; provider credentials/build compatibility need separate verification. |
| Timeline | MOCK | Memory preview is static illustration/text; changing tab does not fetch events. | Event/member API, CRUD, chronology, year-only dates, loading/error states. M5. |
| Anniversaries | MOCK | Calendar tab is an illustrative date/event card, not a lunar calendar. | Real events, authoritative lunar/solar validation and next occurrence. M6. |
| Library | MOCK | Album/photo illustration and static counts; no media selection/upload/viewing pipeline. | Album/photo CRUD, multipart upload, private image permissions and Drive boundary. M7. |
| Admin | MISSING | ADMIN can authenticate and sees a denial message in Family. No Admin dashboard or management routes. | Native metrics/user/log management with ADMIN guards; preserve USER-only family semantics. M8. |
| Avatar display/upload | PARTIAL | Avatar component accepts a URI and initials fallback; response includes managed metadata. | No native private-image header/URL adaptation or managed upload lifecycle verification. M3/M8. |
| Navigation | PARTIAL | Four native tabs and nested family stack retained; root guards cover auth status and USER family routes. Layout policy tests and Android export pass. | Actual deep links/back stack/device transitions need Android/iOS testing. |
| Design system | PARTIAL | Shared palettes, spacing/type/radius, inputs/buttons/cards/feedback, native icons and font scaling. | Contrast/touch-target gaps, persistence and accessibility checks remain; see design audit. |

No whole Web-equivalent module is labelled COMPLETE merely because a fixture test or illustrative screen exists. No M2–M9 features were implemented in M1.
