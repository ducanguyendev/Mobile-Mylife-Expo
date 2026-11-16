# Android stability investigation

M7-13 FocusEvent input-dispatch ANR remains OPEN. M5-07 first lazy Map ReactHost reload remains a separate OPEN issue. Neither is closed by a successful restart or a later usable screen.

M8 uses a dedicated MyLife_M8 Android15/API35 x86_64 AVD,360dp and130% font, WHPX/SwiftShader and private ADB5041. Initial feature QA reuses the M4/M7 SDK58 development APK with SHA256 e7a7d25991741489481c8546d091d0a2637ce28d563d04b0b7538918358d9540. Later native transport changes require a rebuilt APK and separate evidence. Physical Android, iOS and release-like execution remain NOT TESTED.

## Reproduction and measurements

Start the disposable M8 Kestrel/PostgreSQL harness and Metro with an explicit loopback test API. Cold-launch the development client using am force-stop followed by the dev-client URL. Observe an actual login form or authoritative Home/Admin data before recording readiness. Warm launch returns from Android Home. A transient old screen, blank hierarchy or activity launch time alone does not establish readiness.

The first canonical native Metro bundle takes29,967ms for1747 modules. After native rebuilding, a canonical client request takes3971ms for1747 modules. A separate host-side bundle probe uses a different route context and is excluded from direct performance comparison. `readiness.json` records the final measured cold/warm screen observations, including hierarchy polling overhead. `logcat-measurement.log`, `last-anr-redacted.txt`, `metro-redacted.log` and `memory-emulator.txt` retain available diagnostics.

Concurrent native compilation produced host resource pressure. The emulator was explicitly stopped during compilation, then relaunched. Metro’s status endpoint later stopped responding. Restarting the task-owned server exposed a corrupt Metro cache and a full crawl. The rebuilt client initially showed a blank surface/EOF while that server recovered. A verified HTTP200 bundle and explicit development-server selection restored the app. Those environment/reload attempts are excluded from successful startup claims.

Logcat reports skipped main-thread frames during module initialization. The available evidence does not attribute M7-13 to one native module. Main-thread tracing, physical devices and a release-like artifact remain required. No SDK, React Native or VietMap downgrade was used.

## Profile mounting failure

Profile save originally commits successfully in PostgreSQL, then produces Fabric addViewAt failures with a child already attached to a parent. Evidence20,27 and31 captures repeated failures, including a clean process with no intervening Fast Refresh. This is distinct from the historical input-dispatch ANR.

M8 stabilizes native form containers and keeps successful saves on the form with inline feedback. Android Back is performed separately. Evidence35–37 shows saved feedback, successful Back and Home using the changed displayName. The precise renderer cause remains unproven. Broader save/back/device and release-build coverage stays OPEN. An automated wiring regression prevents reintroducing automatic stack dismissal inside the save operation.

## Native transport replay discovery

A loopback proxy drops one completed Backend201 album-create acknowledgment. The original APK persists two albums with the same synthetic name, before the JavaScript mutation coordinator can observe failure. `uncertain-albums-api.json` and `proxy-events.json` retain that failure. The first proxy attempt dropped401 and is separately retained in `proxy-first-attempt.json`. It establishes an uncertain network result and does not prove a committed write.

Installed SDK58 sources show expo/fetch builds its Android client through OkHttpClientProvider. A broad trial disabling connection recovery also exposes safe-read connection failures. The final config plugin wraps POST bodies as one-shot and retains safe-read recovery. It is installed before React loads through the generated MainApplication, preserving cookie configuration, current dependencies and VietMap setup. The final native replay verdict is recorded in `fixed-uncertainty.json`. A JavaScript-only reload cannot apply this native policy.

Backend idempotency remains an OPEN cross-platform dependency. The native policy addresses transport replay after a POST body is sent. It does not make storage and PostgreSQL commits atomic or deduplicate independent cross-client submissions.

The final rebuilt development APK ec9103b7 passes the dropped committed201 replay: one matching album, a retained route-reopen barrier and explicit reconciliation. Final cold/warm first-screen observations are23,424/10,439ms with hierarchy-dump polling overhead. These measurements establish development observations, without closing either historical ANR/reload issue.

[SDK58 fetch behavior](https://docs.expo.dev/versions/v58.0.0/sdk/expo/) · [Expo config plugin mods](https://docs.expo.dev/config-plugins/mods/)

## Gallery, Map and remaining diagnosis

Code inspection finds private image queues and decoding created by a mounted LibraryExplorer. The login screen performs no private photo fetch. Library code can contribute to Metro bundling, but no per-module startup trace attributes the historical ANR to M7. Full-resolution-only media and Blob/base64 copying remain memory/performance risks.

Native smoke revisits Graph, Map/list fallback, Timeline, Calendar and Library where separately recorded. Missing test tile credentials block map-tile verification. Map entry, native startup, deferred route loading and source reload are recorded as separate observations. Release readiness requires repeated controlled startup/reload tests, physical main-thread/memory traces and a compatible release-like build.
