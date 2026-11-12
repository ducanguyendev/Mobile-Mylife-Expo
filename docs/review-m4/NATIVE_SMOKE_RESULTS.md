# M4 Android native smoke

**Development APK build and native VIETMAP initialization: PASS. Actual authenticated dark and light tiles: PASS on the emulator below. Overall device/platform gate: PARTIAL PASS.** HTTP style checks and JavaScript tests do not substitute for tile screenshots.

## Build and environment

Expo58.0.22, RN0.88.1, React19.3.0, exact VIETMAP3.0.0, SDK58 dev client, Fabric/New Architecture. Generated compile/targetAPI37; runtime Android15/API35, sdk_gphone64_x86_64, WHPX/SwiftShader. Disposable AVD MyLife_M4, serial emulator-5584. This is a custom development APK, not Expo Go or a physical device. The user's emulator-5554 was untouched.

[test-results/android-build-recovered.log](test-results/android-build-recovered.log): BUILD SUCCESSFUL, 523 tasks. [native/build.json](test-results/native/build.json) records x86_64 debug APK SHA256 and 117,994,424-byte size. Actual APK permissions in native/apk-permissions.txt exclude fine/coarse GPS. No GPS/UserLocation was used.

Resolved build attempts remain in logs: invalid JAVA_HOME (used Android Studio's E:/AndroidStudio/jbr); Windows Ninja MAX_PATH (scoped scripts/android-short-paths.gradle, object-path limit240 and short app staging); disk full (moved only our own AVD to Windows temporary storage); damaged cache lock (stopped only the verified QA Gradle daemon and rebuilt with no daemon). No generated Android source was hand edited. Final AVD storage is C:/Users/admin/AppData/Local/Temp/mylife-m4-native/avds.

Runtime initially exposed a VIETMAP3 published-ESM packaging defect: NativeProps types were stripped from JS specs and RN0.88 codegen rejected PointAnnotation. metro.config.js maps only the VIETMAP package entry to its shipped TypeScript sources, matching native codegen inputs; other modules retain Expo's resolver. Native MapView/Camera/PointAnnotation then initialized. M4 regression uses the actual TS parser and reproduces the published-JS failure. No node_modules patch, SDK downgrade or alternate provider was substituted. VIETMAP's MLRN internals emit a MapLibre accessibility string; the installed package/logo/provider remain VIETMAP.

## Provider authorization

An initial synthetic invalid key exercised failure UI. An existing Web public tile key was identified without exposing its value. Automatic review initially blocked egress; the user explicitly authorized that key for synthetic Android QA. Afterwards both intended light/dark VIETMAP style endpoints returned200 (native/authorized-style-check.json). Metro received the public key in process memory, not source/config/report files. This QA approval does not establish release key restrictions/quota readiness. Private service/geocoding credentials were never used.

[74-authorized-map-settled.png](test-results/native/74-authorized-map-settled.png) visually shows actual dark tiles, geographic labels, logo/attribution and Backend group markers. Marker tap77 selects group3 with its exact two members. Picker79/80 shows pan, real tiles and a distinct unsaved point; Cancel81 does not confirm it.

## Executed matrix

Evidence is under test-results/native; PNG/XML/full JSON share stems. Numbers below refer to their numeric filename prefixes. Loading/transitional frames are retained, not counted as final renders.

| Check | Result and evidence |
| --- | --- |
| Launch and restore | PASS: actual custom APK login/Home;16-restored-session,50-compact-ready and57-large-cold-restore restore session/preferences without reentering credentials. |
| Dataset | First disposable session112 synthetic members/3 generations,6 located/3 groups; native save changes this to7 located/4 groups,105 unlocated. Resumed session reseeds a new database at6/3; it does not preserve old records. |
| Search / long name | PASS:22–24 full accent-insensitive Vietnamese name match among112; no result truncation. |
| Native tiles / group selection | PASS on emulator:74 actual dark tiles/count markers;75 list selection;76 Fit;77 tap northern native marker selects matching Backend group3/members. No geocoding accuracy claim. |
| Camera / gestures | PASS for emulator Fit, zoom-button invocation and horizontal one-pointer picker pan (63/64/76/79). Physical two-finger pinch, FPS and responsiveness NOT TESTED. |
| Draft / Back / cancel | PASS:25–30 map tap→draft→Android Back→reopen empty; cancel-verification.json confirms no persisted coordinate.78–81 repeat tile-backed draft/cancel with saved point/source shown separately. |
| Explicit save / parity | PASS:31–34 numeric10.5/106.5, native explicit confirm, real dedicated PUT/reconciliation. save-web-parity.json separately reads Bearer and cookie/Origin/X-Requested-With paths: identical MANUAL pin and7/112,4 groups. HTTP parity, not browser UI. |
| Profile / avatar / graph | PASS for navigation35–42: selected member→existing profile/avatar UI→Back retaining search/selection; graph opens, Fit and one-pointer pan change node bounds. No real Drive lifecycle or physical graph pinch claim. |
| Dark / VI / persistence | PASS:43–47 existing preferences Dark/VI; cold50/57 restore. |
| Viewports / scaling | PASS for observed layouts:1080×2340/density440/font1 (~393dp); compact720×1280/density320/font1.3 (360dp),50–56; large1200×1920/density240/font1 (800dp),57–64/74. Full rows remain scroll reachable. |
| Retry counts | PASS:56 real queued2/skippedManual7/skippedLocated0/noAddress103, with queue≠success explanation. |
| API offline / recovery | PASS: removed only reverse7904 and reconnected transport;61 localized request failure. Restore route + Refresh62 restores7/112,4 groups; Metro8088 separate. |
| Provider failure / recovery | PASS: deliberately invalid key63/64 shows failure and list/numeric alternative. Authorized configuration later renders real tiles74/94. Explicit Reload95 returns to fully rendered tiles96. Reload82 is only a transitional frame, not proof of its eventual outcome. |
| Session expiration | PASS: revoked only synthetic user's refresh sessions in disposable PostgreSQL;5-second access token expires;65-session-expired shows localized expiry/login and no protected map rows. session-revocation.json records no tokens. |
| Light / EN / resumed recovery | PASS:88/89 existing preferences switch Light/EN;94-light-en-tiles shows actual light tiles and English controls.95/96 explicit tile reload recovers. Cold compact session/preferences restore99/100 and final101 show real tiles and fully reachable wrapping camera controls at font130%. |
| TalkBack / external keyboard / reduced-motion native traversal | NOT TESTED. Contrast and handler tests do not certify spoken focus/device accessibility. |
| iOS / VoiceOver / physical devices | NOT TESTED: Windows host, no connected physical QA device. |

## Limits and reproduction

Rapid live density/font changes while the dev client was mounted caused an Expo Router duplicate-linking/root warning. Cold launch after changing viewport recovered; instantaneous configuration recreation is not certified.49-compact-cold-restore had a null UiAutomator root and stale hierarchy from the old helper: exclude its XML/JSON from valid UI evidence. Helper now deletes the old dump and requires a fresh hierarchy;50 onward are fresh. Failing intermediate build/import/startup artifacts remain visible.

Final native source iteration adjusts only camera-control wrapping/spacing;101-final-compact-controls verifies it with real light tiles and130% text. Native module/config dependencies are unchanged from the successful APK. Lint/typecheck and all39 M4 tests were rerun after this change. Native results are summarized in native/results.json, not an assertion that every intermediate screenshot is a successful final state.

Run the disposable harness with MYLIFE_M3_NATIVE_HOLD=1 and PG_BIN=E:/PostgreSQL/18/bin, seed with scripts/seed-isolated-m4-native.cjs and use scripts/m4-native-ui.cjs only with its guarded AVD/random loopback database. Use only an authorized public tile key, never Backend keys. The initial runtime automatically cleaned up at its three-hour limit; lifecycle-first-session.json proves database dropped/PostgreSQL stopped. Final lifecycle must prove the resumed runtime cleanup too. Stop only dedicated QA Metro/emulator. No production/personal data, commit, push, deployment or publication.

Final cleanup verified: resumed final-backend/final-lifecycle.json has databaseDropped=true, postgresStopped=true and all command exit codes0. native/cleanup.json records QA Metro/emulator stopped; the user's emulator5554 remained untouched. public-key-artifact-scan.json records zero public-key value hits in delivered source/evidence. Remote GitHub CI remains NOT RUN.
