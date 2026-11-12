# M5 dependency audit

Fresh M5 baseline:14 moderate,0 high/critical, matching M4. No new package/native dependency, lockfile or map SDK change is required for Timeline. Final audit and exact vulnerable-node payloads are in test-results/audit-before.json and audit-after.json. Scripts/workflow changes do not change the installed dependency graph.

Inherited advisory chains are Expo build/dev tooling (glob/minimatch/node-forge) and TypeScript ESLint. Runtime classification alone does not demonstrate device reachability or complete security. Native Maven/CocoaPods are outside npm audit. M4's compatible Expo58 patch candidates require coordinated platform validation; no force fix, broad overrides, SDK downgrade or unrelated dependency churn was applied during Timeline work.

VIETMAP remains exact3.0.0 with its scoped Metro TypeScript resolver and existing custom development APK. QA public tile key is process-memory only under the existing explicit user authorization; private geocoding keys remain Backend-only. Public-key artifact scan and unchanged dependency/native files are checked at delivery.
