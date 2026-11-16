# Google Drive provider QA

REAL GOOGLE DRIVE PROVIDER: **BLOCKED**. No explicitly authorized disposable nonproduction folder and configured test-provider credentials were supplied. No real Apps Script endpoint, production Drive folder or real family photo was used. Existing configuration was not treated as authorization to modify production storage.

Phase A: PASS, MOCK/ADAPTER ONLY. Full Backend203 includes GoogleDriveLibraryStorageServiceTests and LibraryFlowsTests: folder identity, safe unique filename, MD5/MIME/size checks, image read/corruption/negative cache, explicit delete acknowledgment, ownership, failed-write compensation and DB failure scenarios. `apps-script-library.test.cjs` is separately runnable for script behavior. M7 HTTP fixture composes the unchanged avatar/map/clock fixtures with LibraryProvider, intercepting the production named HTTP client and blocking fallback external network.

M7 real-Backend HTTP verifies two-file upload, bytes/ETag, checksum failure502 and cleanup without extra DB records, delete-photo/delete-folder502 with DB records retained, and acknowledged deletion. The adapter stores bytes/folders in memory only. It does not prove actual Google file IDs, Apps Script deployment, real checksums on Google, removal from trash, provider quotas or real folder/file consistency.

Phase B: BLOCKED. Required future evidence: dedicated authorized test folder; server-side test Apps Script/credential configuration; create album and verify real folder; two synthetic uploads with real IDs/checksums; owner bytes and foreign denial; metadata edit; photo deletion and actual removal; album deletion and actual folder/remaining-file removal; PostgreSQL/provider reconciliation and cleanup. Never enable public sharing or embed provider credentials in Expo.

Unresolved: provider-success/DB-failure orphan/stale-row risk, failed cleanup operational recovery, provider throttling, unavailable credentials/deployment, partial upstream outcomes. Backend compensation is preserved. Neither tests nor UI claim that real rollback/removal succeeded. M3 avatar real-provider gate remains BLOCKED for the same missing authorization/environment.
