# Backend M4 fix status

**Local patch exists and tests pass. Still uncommitted and not present on the verified remote feature branch. No commit/push performed.**

Starting Backend HEAD c1b43b1f83e17f9546edc9bb314b8345b8d947ad, feature_minhduc. Preexisting working changes: Features/FamilyTree/DTOs/UpdateFamilyMemberLocationDto.cs uses Range(-90d,90d), Range(-180d,180d); Tests/FamilyLocationInputValidationTests.cs contains12 cases. Both were preserved; M5 made no Backend source edits. Remote feature_minhduc file fetched through GitHub still uses integer bounds (blob96e2217aa22d9e42910f3948a56b85d0a929cd27). Do not infer pushed state from local working files.

Targeted regression12/12, skipped0. Full Backend suite194/194, skipped0, in a fresh random PostgreSQL cluster/database; TRX under test-results/backend-unit, full command log under backend-suite. Existing M4 real Kestrel suite replay verifies malformed nonfinite location requests return400 rather than500. Backend suite cleanup dropped its random DB/stopped PostgreSQL.

Initial full run140/194 (54 failed) used the documented default loopback test database127.0.0.1:55439, which was unavailable; it never connected to production. A first disposable run189/194 failed five geocoding cases because the wrapper disabled the queue expected by the existing in-process TestGeocodingService. Corrected test environment to enable that stubbed queue, with provider keys empty, and reran unchanged assertions:194/194. Failure evidence retained. No Backend service/test assertion refactor.

Integration/deployment dependency: user must eventually save/commit/push these two proven Backend files to the appropriate branch. Local M5 QA uses the patched Backend; remote consumers can still encounter the original malformed-location validation defect until that coordination occurs.
