# Exact changed files

Starting Expo HEAD: `62f72653c3bd4da66592686890957e8577a03814`. No commit/push.

Application source (18 paths):

```text
src/api/apiClient.ts
src/app/(tabs)/index.tsx
src/app/_layout.tsx
src/app/library/[albumId].tsx
src/app/library/_layout.tsx
src/app/library/index.tsx
src/features/anniversaries/AnniversaryScreen.tsx
src/features/anniversaries/anniversary-strings.ts
src/features/library/LibraryDialogs.tsx
src/features/library/LibraryScreen.tsx
src/features/library/PrivatePhoto.tsx
src/features/library/library-api.ts
src/features/library/library-data.ts
src/features/library/library-media.ts
src/features/library/library-strings.ts
src/features/library/library-upload.ts
src/features/timeline/TimelineScreen.tsx
src/localization/strings.ts
```

Supporting config/tests/scripts:

```text
.github/workflows/expo-quality.yml
.gitignore
package.json
scripts/check-isolated-m7-native.cjs
scripts/check-isolated-m7-switch.cjs
scripts/check-m7-cleanup.cjs
scripts/create-isolated-m7-switch-user.cjs
scripts/finalize-m7-review.cjs
scripts/m7-native-ui.cjs
scripts/m7-synthetic-images.cjs
scripts/reseed-isolated-m7-gallery.cjs
scripts/revoke-isolated-m7-native.cjs
scripts/run-backend-suite-m7.cjs
scripts/run-isolated-m7.cjs
scripts/run-m7-quality.cjs
scripts/seed-isolated-m7-native.cjs
tests/fixtures/library-host/LibraryContractHost.csproj
tests/fixtures/library-host/LibraryProvider.cs
tests/fixtures/library-sage.png
tests/m7-library.test.cjs
tests/real-backend.m7.cjs
```

All required reports and every individual evidence artifact are enumerated in [changed-files.json](test-results/changed-files.json). Backend retains only its preexisting untracked AnniversaryDateIntegrityTests.cs; Web/Flutter source is unchanged by M7.
