# Concurrent write audit

M9 uses two real clients and overlapping/stale entities. Exact results: `test-results/final-http/concurrency-limitations.json`. Repository/environment: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md).

| Operation | Observed result | Release impact |
| --- | --- | --- |
| Profile | Both stale clients succeed; one displayName wins | HIGH lost-update risk |
| Member / relationship | Overlap rejects one409 in this run; sequential stale writes lack versions | HIGH, transaction invariants do not prevent all stale writes |
| Coordinates | Both stale writes200 | HIGH |
| Timeline / anniversary | Both stale writes200 | HIGH, source/date-safe preconditions needed |
| Album / photo metadata | Both stale writes200 | HIGH |
| Independent repeated album POST | Distinct rows | HIGH, no durable idempotency |
| Admin role/status/delete | Shared lock and fresh caller/session check reject queued revoked actor | Mitigated covered race; broader target versions remain open |

Local gates/fresh reads cannot atomically prevent check-to-write races. `DatabaseConflict` preserves known serialization/deadlock409, localizes Family conflicts and does not blindly replay writes. Existing response shapes/Web compatibility are retained.

Closure requires compatible version/ETag/If-Match and idempotency contracts, deterministic stale-client/process-restart tests and explicit conflict UX. Production remains NO-GO; passing a characterization test does not close its demonstrated limitation.
