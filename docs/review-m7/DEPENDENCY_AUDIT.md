# Dependency audit

Fresh final-review `npm audit --json` on14 November2026: exit1 because14 Moderate vulnerabilities are present;0 Low/High/Critical. This matches M6 and the initial M7 audit, with no newly added dependency and unchanged package-lock/app/native/Metro configuration. `test-results/npm-audit.json` is the final UTF-8 report, npm-audit-baseline.json preserves the earlier result and npm-audit-command.json records the command/exit code.

Affected dependency paths include Expo CLI/config/config-plugins/fingerprint/metro-config, TypeScript ESLint dependencies, glob/minimatch and node-forge. These are advisory paths, not14 independently exploited application defects. npm reports some fixes as available, but several resolutions propose Expo52.0.49, an incompatible SDK downgrade for this Expo58/RN0.88/VIETMAP3 app. No forced audit fix or unsupported override was applied.

Safe follow-up options: review patched transitive node-forge and TypeScript ESLint versions within the existing dependency ranges; check the current Expo58 patch compatibility matrix through `expo install --check`; coordinate any Expo/Metro/config changes with a fresh development-client and Map regression. A claimed fix requires a new lockfile audit and native verification. Do not interpret npm's fixAvailable flag as proof an SDK-compatible remedy has been validated.

Dependency security remains OPEN before release. Standard CI adds only test:m7 and requires no real-provider secret. No credentials are written into workflow logs.
