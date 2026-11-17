# Security and RBAC audit

Context and source/API matrix: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md). Covered automated boundaries PASS; overall security release gate remains partial.

Real HTTP: anonymous protected401, USER Admin403, ADMIN family-only403, foreign media/member404, forged unsigned JWT401, expired raw access rejection and single-flight refresh recovery. Refresh replay, cookie injection, Origin/CSRF and logout/late-result isolation remain in inherited suites. Evidence: `test-results/final-http/final-integration.json`, `m3–m9-integration.json`; JS `tests/native-session.test.cjs`.

Root `Stack.Protected` guards authenticated account, USER family/library and ADMIN routes separately. Account/role navigation keys unmount old state. Admin APIs read fresh `/api/me`; Backend validates current sid/role/status. M8's shared advisory lock741003002 is preserved. M9 deterministic queued role/status/delete tests revoke the actor while it waits, then verify fresh authorization after acquiring the lock. Targeted18 Backend cases are a subset of217.

`DatabaseConflict` recognizes nested PostgreSQL40001/40P01, preserving409 instead of accidental500. Family localizes409; no automatic mutation retry is introduced.

Private images use authenticated Backend routes, trusted-origin validation, redirect rejection and session fences around binary reads. No tokens in URLs/route params. Admin state clears on blur/background/error. Resume checks and polling do not instantly remove pixels already displayed after remote revocation.

Accepted product policies: account-avatar lookup by email intentionally redirects publicly; password changes intentionally retain existing sessions. Current-session sign-out exists; MFA/global logout/device management are not claimed.

OPEN/HIGH: cross-client lost writes, physical/iOS isolation/privacy and cache forensics. Real Drive is BLOCKED/Critical. Pattern scanning is evidence hygiene, not exhaustive penetration testing.

17-Nov final release `eda69836…` adds actual native USER→ADMIN→USER transitions: old sessions expire on resume, fresh ADMIN lacks Family and fresh USER restores it (`native/release-roles.json`,900–913). Admin Overview/Users/Logs and family deep-link denial pass; injected stats503 hides counts until explicit retry. Confirmed synthetic lock survives a dropped response and is restored. The native PUT is observed twice, so only its fixed target-state outcome is claimed (`native/release-admin.json`,1000–1015).
