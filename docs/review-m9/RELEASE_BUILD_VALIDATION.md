# Release build validation

Repositories/branch: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md). Internal Android release build PASS; distribution readiness NO-GO.

16-Nov artifact `f61c3ad175b615e22ca2513aa3a67d36577b3def130d4d1377980a1f35c0fc85` is49,972,186bytes. Final17-Nov busy-state fix rebuild succeeds in2m10s, exit0,896 tasks/25 executed. New artifact `eda698362b3e082c4215e252239338002d2484dcade3792b122f5337ae91f957`,49,972,158bytes. Both embed Hermes JS/R8, use existing debug certificate for internal QA, package `com.anonymous.mylifemobile`, version1.0.0/code1, x86_64. See `test-results/native/build.json` and `build-resume.json`.

Exact build command, from Expo root:

```powershell
$env:JAVA_HOME='E:/AndroidStudio/jbr'
$env:ANDROID_HOME='C:/Users/admin/AppData/Local/Android/Sdk'
$env:EXPO_NO_DOTENV='1'
$env:MYLIFE_NATIVE_QA='1'
$env:EXPO_PUBLIC_API_BASE_URL='http://127.0.0.1:5088'
./android/gradlew.bat -p android -I ../scripts/android-windows-paths.gradle app:assembleRelease -PreactNativeArchitectures=x86_64 --no-daemon --max-workers=2
```

Logs retained locally: `.tmp/m9-release-confirmed.log`, `.tmp/m9-resume-release-build.log`. Sanitized identity is in evidence. minSdk24/compileSdk37/targetSdk36, Kotlin2.2.10, NDK27.1.12297006. SDK58/RN0.88.1/VietMap3 preserved. Native execution uses the embedded bundle without Metro.

Release configuration denies cleartext/backup; QA permits numeric127.0.0.1 only. Unused media/overlay/location permissions are blocked. Existing icon/splash assets are present, without a branding approval claim. `expo-dev-client` remains installed; debug dependencies/runtime tooling need final distribution audit.

Actual initial failures: Windows Ninja path limit, full D drive and native VietMap import in web/server manifest. Short CMake staging, verified generated-output relocation and platform web fallback resolved them. Nine generated-output junctions point to task-owned C temporary storage; preserve `.tmp/m9-build-space.json`. No user data was removed.

NOT STORE READY: placeholder package, QA certificate, loopback API exception, x86_64-only test scope, no production provider/key/domain/signing, no verified universal/app links or production crash/source-map workflow. No signing credential generated/committed, no EAS upload or store submission. Windows has no local Xcode/iOS execution.

[Official local release guidance](https://docs.expo.dev/guides/local-app-production/) distinguishes production signing/distribution from this internal QA APK.
