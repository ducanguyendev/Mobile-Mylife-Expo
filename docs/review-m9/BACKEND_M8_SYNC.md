# Backend M8 synchronization

Local patch PRESENT and preserved. Remote synchronization NOT COMPLETE. Both local HEAD and GitHub feature_minhduc still resolve to ca20ba52635a026b32449f919e60410ff880c829. The remote UpdateProfileViewModel.cs does not implement IValidatableObject; local does. Because the remote branch equals the local base, the local diff precisely describes the absent patch. No restoration or overwrite is needed.

Preserved files:

- Features/Auth/Controllers/AccountController.cs: role/status/delete share advisory transaction lock741003002, read target protection after locking, and revalidate current active exclusive ADMIN role plus sid-bound unrevoked/unexpired session after acquiring the lock.
- Features/User/Models/UpdateProfileViewModel.cs: supported Vietnam mobile prefix, Nam/Nữ/Khác and future DOB validation.
- Tests/ProfileUpdateContractTests.cs: five invalid phone/gender/future-date theory cases.

The exact initial patch is test-results/backend-preserved-m8.patch. Repository/remote evidence is in repository-audit.json and github-evidence.json. Initial targeted9 and full208 Backend tests pass against isolated PostgreSQL18, and inherited HTTP134 passes. M9 adds AdminMutationSerializationTests.cs to prove queued role/status/delete operations reject a caller revoked after authentication but before the advisory lock is acquired. It uses an EF command observer and held PostgreSQL lock, without timing sleeps. Final targeted/full results belong to END_TO_END_TEST_RESULTS.md.

Web W10 remains unchanged. Profile validation follows its documented accepted values. No fields, routes or response shapes are removed. Existing cookies/Origin/CSRF and native Bearer contracts remain intact. Compatibility is verified by Web-compatible HTTP, without claiming browser UI execution.

This delivery does not commit or push. A reviewer must separately commit/push the preserved M8 patch and M9 regression tests, verify the exact remote commit and run the full Backend/Expo HTTP matrix before release. A local passing test does not close remote synchronization or establish deployment.
