# Exact modified-file inventory

All current changed/new paths are enumerated in [test-results/files-changed.json](test-results/files-changed.json). Ignored native/build/runtime outputs are excluded. No commit/push/PR/deployment/publication. Initial Backend M8 work is preserved.

## Expo

Base 1e64130e898cdeb5f30b0ac6dd07a28d7ab9a8c1.

- M: .github/workflows/expo-quality.yml
- M: app.json
- M: package-lock.json
- M: package.json
- M: src/app/_layout.tsx
- M: src/config/env.ts
- M: src/design-system/components/buttons.tsx
- M: src/features/auth/context/auth-provider.tsx
- M: src/features/family/data/family-errors.ts
- M: src/features/profile/ProfileDetails.tsx
- M: tests/foundation-safety.test.cjs
- ??: .github/workflows/m9-backend-integration.yml
- ??: docs/review-m9/ACCESSIBILITY_UX_AUDIT.md
- ??: docs/review-m9/ANDROID_ANR_AND_FABRIC_QA.md
- ??: docs/review-m9/BACKEND_M8_SYNC.md
- ??: docs/review-m9/CARRY_FORWARD_RISKS.md
- ??: docs/review-m9/CONCURRENT_WRITE_AUDIT.md
- ??: docs/review-m9/DEPENDENCY_SECURITY_AUDIT.md
- ??: docs/review-m9/DEPLOYMENT_READINESS_CHECKLIST.md
- ??: docs/review-m9/DEVICE_TEST_MATRIX.md
- ??: docs/review-m9/END_TO_END_TEST_RESULTS.md
- ??: docs/review-m9/FILES_CHANGED.md
- ??: docs/review-m9/FULL_FEATURE_MATRIX.md
- ??: docs/review-m9/GOOGLE_DRIVE_PROVIDER_QA.md
- ??: docs/review-m9/INITIAL_AUDIT.md
- ??: docs/review-m9/NETWORK_REPLAY_AND_IDEMPOTENCY.md
- ??: docs/review-m9/PAUSED_STATE.md
- ??: docs/review-m9/PERFORMANCE_REPORT.md
- ??: docs/review-m9/POST_M9_REMEDIATION_PLAN.md
- ??: docs/review-m9/PRIVATE_MEDIA_AND_SNAPSHOT_QA.md
- ??: docs/review-m9/RELEASE_BUILD_VALIDATION.md
- ??: docs/review-m9/RELEASE_GO_NO_GO.md
- ??: docs/review-m9/REPORT.md
- ??: docs/review-m9/SECURITY_AND_RBAC_AUDIT.md
- ??: docs/review-m9/VIETMAP_RELEASE_AUDIT.md
- ??: docs/review-m9/WEB_EXPO_BACKEND_PARITY.md
- ??: plugins/with-private-window.cjs
- ??: plugins/with-release-network-policy.cjs
- ??: scripts/android-windows-paths.gradle
- ??: scripts/audit-m9-secrets.cjs
- ??: scripts/finish-m9-native.cjs
- ??: scripts/m9-native-proxy.cjs
- ??: scripts/m9-native.cjs
- ??: scripts/m9-performance.cjs
- ??: scripts/m9-release-regression.cjs
- ??: scripts/m9-trace-graph.cjs
- ??: scripts/prepare-m9-build-space.cjs
- ??: scripts/run-isolated-m9.cjs
- ??: scripts/run-m9-backend.cjs
- ??: scripts/run-m9-baseline-http.cjs
- ??: scripts/run-m9-quality.cjs
- ??: src/features/family/map/VietMapSurface.web.tsx
- ??: src/features/privacy/native-screen-privacy.ts
- ??: src/features/privacy/screen-privacy.ts
- ??: tests/m9-release-safety.test.cjs
- ??: tests/real-backend.m9.cjs

Evidence files: 605; exact paths in the JSON inventory.

## Backend

Base ca20ba52635a026b32449f919e60410ff880c829.

- M: Features/Auth/Controllers/AccountController.cs
- M: Features/User/Models/UpdateProfileViewModel.cs
- M: Program.cs
- M: Tests/ProfileUpdateContractTests.cs
- ??: Shared/Data/DatabaseConflict.cs
- ??: Tests/AdminMutationSerializationTests.cs
- ??: Tests/DatabaseConflictTests.cs

## Web

Base 144fc506c0ec7957d40a137351aeda296b8937b5.


## Scope

Expo: native screen protection/identity sequencing, release network/permissions, API-origin validation, web Map bundling fallback,409 localization, explicit button busy reset, regression/QA/cleanup tools, CI and22 required reports.

Backend: preserve AccountController/UpdateProfileViewModel/ProfileUpdateContractTests from M8. Program uses DatabaseConflict; add that helper/tests and deterministic AdminMutationSerializationTests.

Web:0 changes. Flutter: no task source edit; pre-existing unrelated changes are preserved.
