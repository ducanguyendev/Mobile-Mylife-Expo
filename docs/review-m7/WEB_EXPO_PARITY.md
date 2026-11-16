# Web–Expo parity evidence

PASS —21 M7 scenario groups on real disposable Kestrel/PostgreSQL, plus84 inherited M1–M6 groups,105 total. Storage is an in-process Apps Script HTTP contract adapter, NOT Google Drive.

`tests/real-backend.m7.cjs` exercises the production Expo TypeScript clients under the established native bridge adapters. Native requests use Bearer, X-Client-Platform mobile, credentials omit, and no response cookies. Web-compatible requests separately log in with cookies, allowed Origin and X-Requested-With MyLife. They do not reuse a mobile token as Web authorization.

Verified: native category create→Web read; Web rename→native slug preservation; album create/edit; two-file multipart upload; native/Web authenticated bytes and conditional304; native metadata edit→Web read; Web edit→native refetch preserving all fields; in-use409; foreign album/category/photo404; anonymous image401; invalid dates and upload limits400; checksum502 rollback with original records intact; delete-provider502 with retained metadata; photo deletion→Web count/image404; album/category deletion→Web/Home empty state; logout denial.

Evidence: `test-results/final-backend/m7-integration.json` records methods, paths, HTTP outcomes and transport, with no tokens/cookies/credentials. `m7-integration.log` lists groups. Inherited suites are not weakened. Their M6 JSON replay is copied into M7 evidence; the historical M6 report artifact is restored to its original Git bytes after harness execution.

Web browser UI, actual Google storage UI and production deployment were NOT TESTED. UI screenshots of adapter-backed Android cannot establish real-provider success.

The final two groups cover the account-wide mutation coordinator: a simulated lost acknowledgement after an actual201 album POST remains locked across route reopening, reconciles to exactly one album and then deletes it; an account transition rejects late HTTP preparation and stale focus activation before any POST. These are real Backend/DB requests with a deliberately simulated client acknowledgement loss, not an actual socket-drop or real-provider fault test.
