# Library API contract

PASS — audited against Backend source and real disposable PostgreSQL/Kestrel HTTP.

| Resource | Requests | Success body |
| --- | --- | --- |
| Categories | GET/POST `/api/library/categories`; PUT/DELETE `categories/{id}` | raw array / raw category /204 |
| Albums | GET/POST `/api/library/albums`; GET/PUT/DELETE `albums/{id}` | raw summaries / raw album / raw detail /204 |
| Overview | GET `/api/library/overview` | raw `{categories,albums}` with details/photos |
| Upload | POST `albums/{id}/photos` |201 raw photo array |
| Photo metadata | PUT `photos/{id}` | raw photo |
| Photo deletion | DELETE `photos/{id}` |204 |
| Private image | GET `photos/{id}/image` |200 bytes /304 conditional; error JSON on failure |

All paths start `/api/library`. USER ownership applies. Successful Library data is never envelope-unwrapped. Runtime readers validate required fields, safe integer IDs, duplicate IDs/slugs, counts, real calendar dates, nullable cover/date/metadata, MIME and size. Detail counts and cover membership must agree. Storage metadata `url`/`driveFileId` is retained as data but never fetched or shown.

Album writes: name required≤150, description≤2000. Category writes send only name≤100. Slug/isDefault/owner are server-controlled. Reserved `all` and internal `__album__` are excluded from category management. Default categories have no edit/delete actions.409 is shown for in-use deletion; rename preserves slug.

Photo writes: title≤200, description≤2000, author≤200, category is an existing slug or null, displayDate is exact valid past/present `DD/MM/YYYY`. Description maps to caption. All existing metadata is initialized when editing. An assigned category cannot be cleared by sending null: Backend preserves it. The editor therefore offers album-only only for initially album-only photos and new uploads.

Multipart sends repeated `files` plus `title`, `category`, `displayDate`, `description`, `author`.1–20 files,1 byte–5MiB each; JPEG/PNG/WEBP/GIF matching filenames/MIME/signatures. Native File transport supplies the boundary. No JSON conversion or manual multipart Content-Type.

Errors preserve HTTP status, code and Retry-After through ApiError. UI distinguishes401/403/404/409/429/502/503. Storage messages are shown without reporting success or successful cleanup. Writes do not automatically retry after network/5xx uncertainty.401 refresh uses the existing session boundary; a retried401 invalidates it.

No conditional-write/version endpoint, thumbnails, pagination, photo/member relation, photo→Timeline event or richer category association endpoint exists. Fresh comparisons reduce stale writes but do not close atomic GET/write races.
