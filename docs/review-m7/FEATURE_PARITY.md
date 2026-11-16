# Web–Expo feature parity

| Feature | Before M7 | After M7 source / automated scope |
| --- | --- | --- |
| Library overview | Future panel | Implemented, authoritative counts and empty/loading/error/retry |
| Album list/detail | Absent | Two-column virtualized gallery and protected Router stack |
| Album CRUD | Absent | Implemented; fresh count/name/consequence confirmation |
| Categories | Absent | Create/rename/delete, default protection, immutable-slug filtering |
| Photo search/filter | Absent | Accent-insensitive title/caption/author/name/date; category slug |
| Multi-upload/review/remove/cancel | Absent | Native picker, maximum20, File/FormData, shared batch metadata |
| Private media | Absent | Authenticated binary reader, no remote DTO URL, no disk image cache |
| Lightbox | Absent | Full-screen modal, bounded previous/next, metadata, button zoom/pan |
| Photo edit/delete | Absent | Full metadata initialization, server update/delete, reconciliation |
| Home | Raw album summaries | Existing authoritative focus refresh preserved and HTTP verified |
| Memories | Timeline/Calendar | Real Library push from both; Back preserves originating module |
| VI/EN, light/dark | Shared system | Library uses both dictionaries and semantic shared components |
| Android pinch | Absent | Button zoom available; actual gesture coverage remains a device gate |
| Web browser UI parity | Reference only | HTTP cookie/Bearer parity tested; browser UI NOT TESTED |

Functional implementation is not production acceptance. Native coverage, physical/iOS, screen readers, memory/FPS and real Drive are separately reported. No sample family content appears in production screens. Synthetic seeding is restricted to the disposable test harness.
