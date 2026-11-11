# M3 initial audit — before application changes

Expo: clean `feature_minhduc`, HEAD `8b1a0b6b0e3cd2e9562240387202e74494d01e4e`. Web: clean reference `144fc506c0ec7957d40a137351aeda296b8937b5`. Backend: clean reference `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`. No reset. Flutter remains read-only.

Reviewed M1 API/data-integrity findings, M2 report/native results/M3 handoff, current Family routes/form/services/types, Web picker/sibling/relationship presentation and actual Backend controllers/DTOs/services. Baseline install, lint, typecheck, auth (10), foundation (26 including auth) and M2 (22) passed. Baseline contrast and isolated M1/M2 integration will be recorded under this M3 directory, preserving earlier evidence.

Initial gaps: Family has one list, simple lowercase search, static tree/map placeholders, basic member GET instead of aggregate profile, first-eight Alert selection, unbounded child chips, no horizontal editor and no managed avatar transport. Family UI/errors are Vietnamese only. Detail/edit loaders lack account-keyed cancellation and native mutation coordination.

Critical contracts:

- Scalar member PUT is replacement, not PATCH. Father/mother/spouse null clears; unchanged values must be preserved. childIds null/omitted preserves; a collection synchronizes all child links.
- horizontalRelations null/omitted preserves; [] clears. Web commonly uses sibling/cousin, but Backend accepts any non-empty trimmed type up to 50 characters. Existing other types must survive editing.
- Parent cycles/self/foreign IDs and occupied spouse are rejected by Backend. Child synchronization chooses mother for female/nữ and father otherwise. Gender aliases must display correctly without rewriting untouched values.
- Unchanged address preserves location metadata; changing normalized address intentionally clears coordinates in Backend. Avatar metadata uses dedicated endpoints and must never enter scalar payloads.
- Aggregate profile is `{member, relatives, timeline, anniversaries, libraryMemberLinkAvailable}` in the success/data envelope. Inferred shared-parent siblings must be labelled separately from explicit sibling/cousin records.
- Avatar multipart field is file; JPEG/PNG/WebP/GIF, 1 byte–5 MiB, signature checked server-side. Authenticated image endpoint returns bytes, private/no-cache, ETag and nosniff. Google upload verifies checksum/type/size/stable replacement ID; image download uses the server's Google CDN client.

Implementation direction: virtualized card/list and searchable confirm/cancel relationship modal; localized complete profile; fresh-read merge of intentional form edits with conflict detection, preserving unrelated/concurrent links; own-origin authenticated Expo Image with no disk cache; image picker/upload/replace/remove; native SVG graph with explicit directed parent edges, distinct spouse/horizontal edges, recorded-generation groups and pan/zoom/list alternative. No WebView or M4 map.

A test-only hosting startup/HTTP provider adapter can exercise the actual Backend avatar service/controllers against disposable PostgreSQL without Backend source changes or Google credentials. This must be reported as storage-contract verification, never real Google Drive verification. Real-provider access is not assumed authorized or available.
