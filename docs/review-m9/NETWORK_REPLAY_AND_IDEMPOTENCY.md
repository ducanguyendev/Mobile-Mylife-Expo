# Network replay and idempotency

Context: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md). The config plugin installs one OkHttp interceptor before React in generated MainApplication. Only POST bodies report `isOneShot=true`; safe-read recovery remains enabled. Clean-prebuild/build inspection and tests verify installation is not duplicated.

M8 original APK duplicated an album after a committed201 acknowledgment was lost. Rebuilt development APK `ec9103b7` mitigated that covered path. M9 release evidence must be assessed under its own exact artifact identity in `test-results/native/fixed-uncertainty.json` and release fault records; historical M8 results are not new M9 executions.

| Fault | Required interpretation |
| --- | --- |
| Committed response lost | Server read-back/count plus native uncertainty/reopen/reconcile |
| Pre-dispatch/body loss | Proxy forwarding evidence and explicit server count |
|401/429/502/503 | Refresh/read recovery versus no silent write retry |
| Background/route reopen | Account-wide barrier and discarded stale results |
| Process death | In-memory barrier loss remains; fresh authoritative read required |
| Double tap / interrupted photo, album, Admin | Record actual dispatch/count and confirmation state |

Inherited JS/HTTP cover single-flight refresh, uncertainty barriers, late results, multipart/provider failures and Admin boundaries. Native cases are separately marked executed or NOT TESTED in the final matrix. Do not infer native body/retry behavior from a host Node adapter.

One-shot transport is not exactly-once intent processing. Independent album POSTs still create distinct rows; see `final-http/concurrency-limitations.json`. Process death loses in-memory barriers. Durable idempotency requires actor/route/payload binding, stored outcomes and expiry. No broad unsupported Backend migration was introduced.

## Final Android release replay

17-Nov final APK `eda69836…`: lost committed201 PASS, exactly one album, disabled creation across route reopen and explicit reconciliation (`native/fixed-uncertainty.json`). Native album pre-dispatch loss,46-byte body disconnect,429,502 and503 PASS with fresh matching proxy events and no Backend row (`native/release-faults.json`, evidence720–764). An early attempt incorrectly reused older events for two cases; those are marked NOT PROVEN in the retained attempt. The successful rerun requires event-count delta/type/status and checks the typed fixture before submitting.

Background and process death while a committed response is held15s, and double tap while held5s, each leave exactly one album and one successful forwarded create (`native/release-write-lifecycle.json`,780–803). These prove only their covered native paths. A process restart still loses the JS barrier; no durable deduplication is claimed.

Final-APK interrupted photo upload is NOT TESTED: the dedicated emulator system picker has no media and shell/MediaStore fixture provisioning did not yield a selectable image. HTTP multipart/provider-failure tests remain separate. Native Admin mutation/read evidence is recorded separately; no unexecuted case is inferred from these album results.

Final Admin lock with a dropped200 acknowledgment demonstrates **two native PUT requests**, both200, for `/api/admin/users/3/status`. The fixed body sets `isActive=false`; authoritative state is locked and the synthetic target is restored via a supported Admin API. This is a state-idempotent covered operation, not once-only dispatch or a general guarantee for PUT side effects. See `native/release-admin.json`. The native plugin intentionally scopes one-shot bodies to POST; Backend durable idempotency/version contracts remain HIGH/OPEN.
