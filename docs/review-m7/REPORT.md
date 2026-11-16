# MyLife Expo M7 review

**Development verdict: PARTIAL PASS. Application release: NOT READY. M8 development continuation is feasible with the explicit carry-forward gates.**

Final review date:14 November2026 (Asia/Saigon). Initial audit/native evidence was recorded13 November; the final account-wide mutation hardening,88-case quality run and105-group integration replay are recorded separately.

M7 implements the real Family Library in Expo on `feature_minhduc`, starting at `62f72653c3bd4da66592686890957e8577a03814`. Backend `53e472513eec18bb26f0b33a866785c532bcdc85` and Web `144fc506c0ec7957d40a137351aeda296b8937b5` were audited as references. No Backend production, Web or Flutter source was changed; the existing untracked Backend M6 test file and Flutter changes were preserved. No commit, push, PR, merge, deploy or publish was performed.

Library now has authoritative overview/counts, album list/detail/create/rename/description/delete, category create/rename/delete and slug-based photo filters, Vietnamese accent-insensitive search, loading/empty/error/retry/refresh and a virtualized two-column photo grid. It uses the shared ivory/sage design system, semantic Light/Dark colors and VI/EN copy. Protected Expo Router screens preserve the originating Memories module when returning. Home refetches raw album summaries on focus and now links to Library and individual albums; no cover or uploaded preview is fabricated.

Native system picker supports single/multiple selection, preview/remove/cancel and maximum20. Each file is≤5MiB with compatible JPEG/PNG/WEBP/GIF filename/MIME/signature. Unsupported HEIC/HEIF is rejected clearly. Upload uses actual SDK58 File/FormData and repeated `files` plus all five metadata fields; metadata applies to the batch. The native QA found and fixed an incompatible Blob-slicing signature read, then verified two actual native uploads. There is no percentage progress or blind uncertain-POST retry. The global15s transport timeout, large-batch buffering, process-death picker recovery and original picker filename preservation remain limitations.

Private images are fetched only by numeric ID through the trusted Backend `/image` endpoint, never Photo.url, Drive preview or storage IDs. Binary response mode reuses native Bearer, single-flight refresh and logout/sessionVersion guards. Redirects are rejected. The account-local scheduler coalesces pending reads, limits concurrency to3 and clears on blur/background/unmount. expo-image receives ephemeral data URIs with disk caching disabled. Unit tests prove binary refresh and body-after-logout rejection; real HTTP proves foreign404, anonymous401, private/no-cache headers, ETag304 and nosniff. Native grid/lightbox renders the uploaded private images. Cache forensics, physical long-session profiling and cross-platform privacy gates remain open.

Photo viewer supports full-screen, previous/next, accessible button zoom/pan, metadata and edit/delete. Editing initializes all existing values, uses exact DD/MM/YYYY and real category slugs, and refetches authoritative state. Backend category-null semantics preserve an assigned category; clearing such an assignment is not offered. Album deletion confirmation reads the actual photo count and warns that photos/folder are removed. Native QA verified a1-photo consequence. Serial mutation gates, fresh comparisons, acknowledged read-back, Retry-After enforcement and uncertainty locks prevent duplicate local dispatch; no atomic conditional-write contract exists, so cross-client GET/write races remain open.

Local quality passes lint/typecheck/auth/foundation/M2/M3/M4/M5/M6/M7/contrast. Unique Expo JS cases are346 (258 inherited +88 M7); auth10 is included within foundation26. Contrast14 and Apps Script Library12 are separate. Full Backend203 and targeted preserved M6 anniversary9 pass with0 failures/skips in disposable PostgreSQL. Real Kestrel/PostgreSQL HTTP passes105 scenario groups:84 inherited +21 Library. Standard CI adds `test:m7` without real-provider secrets; actual M7 GitHub CI is NOT RUN until a later authorized push. Exact commands, exit codes and scope are in TEST_RESULTS and test-results.

Storage evidence is explicitly MOCK/ADAPTER. Production GoogleDriveLibraryStorageService runs against a test-only in-process Apps Script HTTP adapter for folder/upload/checksum/type/size/read/cache/delete/failure/compensation cases. Actual Google Drive remains **BLOCKED**: no authorized dedicated nonproduction folder/provider configuration was supplied. Real IDs/checksums/removal/quotas/DB consistency cannot be inferred from adapter tests or Android screenshots. Provider-success/DB-failure, incomplete rollback/deletion and orphan recovery remain release risks; the M3 avatar real-provider gate remains open too.

Android executed core CRUD, real system multi-picker, native multipart, private grid/lightbox, next/previous/zoom/Back, metadata/category filtering, destructive photo/album operations, category rename/delete and125-photo scrolling. Device is a dedicated Android15/API35 x86_64 MyLife_M7 AVD with the unchanged development APK SHA256 `e7a7d25991741489481c8546d091d0a2637ce28d563d04b0b7538918358d9540`;360dp/font130% Light/English and Dark/Vietnamese are covered. Native cold-reload FocusEvent ANRs remain OPEN. The initial invalid PNG seed and corrected valid gallery are separately documented. Physical Android/iOS, TalkBack/VoiceOver, native pinch/GIF/HEIC matrix and physical memory/FPS are not claimed.

Final native checks additionally pass actual tunnel-loss error/retry, Home125-photo refocus and album links, owner-session revocation while private images are visible, removal of protected UI, login to a different empty account,0/0 Library with no old media, foreign album/image404 and explicit logout. Map navigation/list fallback opens after Library, while actual tiles remain BLOCKED in this phase by the missing test tile key. Deferred route-load/transitional captures are excluded from settled-screen claims.

Final concurrency review moves mutation flags into a shared per-account coordinator, so overview/detail/reopened routes retain the same busy/uncertain-write barrier. Switching accounts fences old preparation even if a late focus callback tries to reactivate it. Only flags are retained, with no DTOs, images or credentials. Two new unit cases and two real-HTTP groups verify this hardening. The native matrix predates this final pure-TypeScript coordinator change; its route-retry behavior was not re-executed on Android after teardown.

Dependency audit remains14 Moderate,0 High/Critical, matching M6, with no dependency/lock/native/Metro config change. npm's suggested Expo52 downgrade is incompatible; follow-up candidates require Expo58 compatibility and native verification. M4 key restrictions/quotas/release setup, recreation warning, original M5 Map-first cause, physical graph performance, conditional writes, accessibility and provider operational availability remain in CARRY_FORWARD_RISKS.

Backend M6 sync: the nine-case `Tests/AnniversaryDateIntegrityTests.cs` existed locally untracked and was preserved. Targeted9/full203 pass. GitHub branch lookup succeeded but file fetch on `feature_minhduc` returned404. Remote synchronization is **NOT COMPLETE** and no push is claimed. The M4 validation fix remains preserved and its regression suite passes.

Exact changed files are inventoried in FILES_CHANGED.md and test-results/changed-files.json. Primary source paths are:

```text
src/api/apiClient.ts
src/app/_layout.tsx
src/app/(tabs)/index.tsx
src/app/library/_layout.tsx
src/app/library/index.tsx
src/app/library/[albumId].tsx
src/features/anniversaries/AnniversaryScreen.tsx
src/features/anniversaries/anniversary-strings.ts
src/features/timeline/TimelineScreen.tsx
src/localization/strings.ts
src/features/library/LibraryScreen.tsx
src/features/library/LibraryDialogs.tsx
src/features/library/PrivatePhoto.tsx
src/features/library/library-api.ts
src/features/library/library-data.ts
src/features/library/library-media.ts
src/features/library/library-upload.ts
src/features/library/library-strings.ts
```

Supporting changes are package scripts, workflow, fixture ignores, M7 tests/isolated storage host, reproducible QA/cleanup helpers and required reports/evidence. M1–M6 test sources are not weakened. M8 may build on these contracts, but feature completion and adapter success do not authorize a production release.
