# Dependency and security audit

Fresh17-Nov `npm audit --json`: exit1,14 Moderate,0 High/Critical. `npm audit --omit=dev --json`: exit1,9 Moderate,0 High/Critical. Evidence: `test-results/npm-audit-all.json`, `npm-audit-runtime.json`. Exit1 reports advisories, not a network failure. Source-pattern scan evidence: `source-secret-scan.json`.

Direct/transitive chains and fix metadata are retained in those JSON reports. The omit=dev subset includes Expo build tooling and does not prove on-device reachability. The internal APK uses its embedded bundle without exposing a development server. Glob/minimatch/brace-parser chains still warrant review for local/CI processing of untrusted paths/patterns. Moderate severity is not evidence of no exposure.

No `npm audit fix --force` or SDK downgrade applied. Suggested major moves, including an older Expo branch, do not establish SDK58/RN0.88.1/VietMap3 compatibility. Use a coordinated compatible update, review lockfile, install checks, rebuild and repeat affected native regressions.14 Moderate remain MEDIUM/OPEN.

CI adds independent `npm audit --audit-level=high` and source-pattern scan. That threshold permits Moderate findings. Pattern scans do not detect every secret or inspect pixels. Final evidence hygiene must compare actual temporary credential/token values without printing them, then inspect retained screenshots separately. No production credential/provider endpoint was authorized.
