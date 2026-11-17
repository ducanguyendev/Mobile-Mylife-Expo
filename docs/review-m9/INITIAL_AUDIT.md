# M9 initial audit

16 November 2026, Asia/Saigon. Primary branch feature_minhduc. Local and GitHub heads agree: Expo 1e64130e898cdeb5f30b0ac6dd07a28d7ab9a8c1, Backend ca20ba52635a026b32449f919e60410ff880c829, Web 144fc506c0ec7957d40a137351aeda296b8937b5. Expo and Web start clean. Backend starts with the three preserved M8 modifications. Flutter is read-only and receives no writes. Read repository AGENTS.md and the requested M8/M7 reports before changes.

GitHub Expo quality run43824725574 is completed/success for exact M8 SHA1e64130e. This supersedes historical M8 statements that its own CI was not yet run. Evidence: test-results/github-evidence.json. M9 CI requires a future separately authorized pushed commit and is NOT RUN.

Baseline local quality passes all required commands,407 unique JS cases plus14 contrast checks. Backend targeted profile/Admin9 and full208 pass. A fresh inherited M1–M8 real HTTP replay passes134 scenario groups. The baseline wrapper places some early evidence in baseline-http/final-backend and later files in baseline-http; these are one run, not two suites. Native bridge/storage adapters are explicitly distinguished from Android and real Drive.

## Product decisions

The user explicitly accepts account-avatar public lookup/provider redirect and retaining existing sessions after password changes. Preserve both existing Backend/Web contracts, verify them in HTTP, and document discoverability and current-session logout honestly. These are accepted policies rather than unresolved product blockers. Real Drive authorization is a separate missing dependency and remains BLOCKED.

## Initial release risks

M8 private Library content is visible in Android recent-app snapshots. Implement a scoped native policy before displaying authenticated account/family/Admin content, retaining capturable public sign-in. M7 FocusEvent ANR, M5 first lazy Map reload and M8 Profile Fabric failure remain three distinct risks. Cross-client atomic versions and idempotency are absent. Physical Android inventory is empty; Windows has no local Xcode/iOS execution environment. No real provider configuration is authorized.

SDK58 ScreenCapture and local development/release documentation are reviewed before native changes. Add only the SDK-compatible expo-screen-capture58.0.6. Preserve SDK58/RN0.88.1/VietMap3 and existing compatibility mapping. Review generated native source after clean prebuild and verify both privacy and one-shot POST policy in the built artifact.

## Environment failures retained separately

The initial release build fails on Windows Ninja path lengths. A lower object-path threshold alone does not resolve it. A short CMake staging directory addresses that limit. A subsequent native compilation and disposable PostgreSQL startup encounter a full50GiB D drive. This is diagnosed as disk exhaustion, not app stability. Stop the task-owned build, remove verified stopped M9 clusters and regenerable CMake caches, relocate only generated Android build outputs to a dedicated C temporary directory, then repeat. No source/dependency patch or SDK downgrade is used for these environment issues.

The first new M9 harness uses a storage-adapter URL different from its explicitly allowed contract URL; it fails closed with502. Correct the fixture URL. A later new journey initially uses a non-Gmail synthetic account, correctly rejected by Backend. Correct that fixture to Gmail. Failed attempts do not count as passing evidence.

[SDK58 ScreenCapture](https://docs.expo.dev/versions/v58.0.0/sdk/screen-capture/) · [Local builds](https://docs.expo.dev/guides/local-app-development/) · [Production signing](https://docs.expo.dev/guides/local-app-production/)
