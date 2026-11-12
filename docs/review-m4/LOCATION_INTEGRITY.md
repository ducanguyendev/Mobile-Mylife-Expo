# Location integrity and concurrent edits

Manual edits never use scalar member PUT. Open reads the authoritative member. Map taps/numeric fields create an unsaved draft; Cancel/Android Back unmounts it and aborts its work, with no write before explicit confirmation. Empty numeric strings, NaN, Infinity, out-of-range values and oversized names cannot save. Zero and inclusive boundaries are valid. Saved/pending coordinates and source are shown separately. Numeric entry explains that a place cannot be visually verified without tiles.

Confirm rereads the same own-account member, compares ID/name/address/location coordinates/name/source/status, checks active account/request cancellation, then sends dedicated location PUT. Changed relevant data blocks with a localized instruction to reopen and review; no override button silently overwrites the newer location. Unrelated phone/relationships can change without blocking because dedicated location PUT leaves them alone. Successful save awaits authoritative member GET and map GET before success feedback. Query refresh errors are not represented as save success.

**Residual race:** GET/check/PUT is not transactional. Backend has no conditional version/ETag write. Another location writer between fresh GET and PUT can still win/lose; RISK-03 remains open. Cancel after an explicitly confirmed network write cannot roll back a request already applied by Backend; reopening/refetching reconciles uncertain outcomes.

Real Kestrel/PostgreSQL scenarios and evidence are in `test-results/final-backend/m4-integration.*`:

| Required guarantee | Verification |
| --- | --- |
| Phone-only preserves manual coordinates | Actual scalar edit after manual pin |
| Relationship-only preserves location | Actual horizontal edit; child/spouse remain |
| Avatar upload/replacement preserves location | Real controller/database, test-only storage HTTP adapter |
| Manual location preserves spouse/children/sibling | Dedicated PUT, refetched reciprocal/own metadata |
| Address change invalidates old pin | Web scalar PUT, Expo reads null coordinates/source; stale editor blocked |
| Old background geocode cannot overwrite newer manual pin | Controlled in-process HTTP response held across real manual save, then released through actual queue |
| Repeated map refresh adds no client writes | Method trace and unchanged manual member updatedAt; Backend may intentionally enqueue pending work on GET |
| Foreign/ADMIN/anonymous updates fail | Actual404/403/401 |
| Invalid inputs rejected | Client tests plus actual HTTP400 and DTO unit tests |
| Draft disappears after cancel | Actual component handlers plus native Android Back/cancel/reopen and independent authoritative GET in native/cancel-verification.json |
| Web and Expo final coordinates match | Separate cookie and Bearer reads/writes |

Confirmed Backend defect: `[Range(-90,90)]` selected RangeAttribute's int conversion; JSON string `"NaN"` bound to double and overflowed before service validation, producing500. Narrow fix: `Range(-90d,90d)` and `Range(-180d,180d)` in `UpdateFamilyMemberLocationDto.cs`. No service/auth/ownership/geocoding behavior changed. Added `FamilyLocationInputValidationTests.cs`: nine invalid (NaN/infinities/MaxValue/fractional limits), three valid zero/boundary cases; twelve pass. Initial failing HTTP/stack evidence retained in `attempt2-*`; final API400 must pass rather than weakening its assertion. The service already rejects nonfinite/out-of-range values independently.

Geocoder/avatar fixtures only run with explicit disposable harness opt-in. The initial geocoder DI override was superseded by app registration; the corrected named HTTP adapter intercepts the real fallback client and rejects unexpected destinations. No production provider credential is needed for queue precedence testing. This does not validate real geocoding accuracy or Google Drive.

Actual Android evidence adds explicit numeric save10.5/106.5 and post-save Bearer/Web-compatible reads in `native/save-web-parity.json`: identical MANUAL source and7/112 located,4 groups. A later real tile-backed picker displays saved and unsaved points separately; cancel does not invoke confirmation. No real personal address was entered. The first disposable native database was deleted at the harness deadline; resumed QA uses a newly seeded account/database rather than silently reusing that state.
