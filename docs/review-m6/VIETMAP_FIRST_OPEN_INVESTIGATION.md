# VIETMAP first-open investigation

M5-07 remains OPEN. M6 actively reproduced clean-cold and subsequent-open paths and collected native lifecycle/Metro evidence. The exact installed development APK is the existing M4 build, verified by matching local/installed SHA256. A new native development build was unnecessary for the unchanged native dependency graph and was not generated. Release-build behavior is still unverified.

The first M6 cold process signed in to the synthetic family, entered Map before Calendar, and retained process3577. The first-entry capture showed the Map route. The attempted settled hierarchy dump returned a null UI root, so it is excluded from settled-screen PASS evidence. Redacted first-open Logcat retained183 relevant lines, with0 ReactHost reload lines and0 fatal exceptions. Back returned to Family. The second Map entry retained the same PID, rendered real dark VIETMAP tiles and three manual-location markers, and retained203 relevant log lines with0 reload/fatal counts. See map-first-open/second-open diagnostic JSON and logs,08/10/11/12 screenshots.

The lazy VietMapSurface bundle was produced successfully by Metro, with no NativeProps/codegen exception. The scoped resolver still selects the package's shipped TypeScript. Actual native MapView/Camera/annotations and tiles initialize on the reused Fabric APK. Router Back and same-stack Map→Timeline navigation are recorded in the final native matrix. Later cold and after-Calendar/Timeline paths have separate evidence entries.

The retained M5 log shows ReactHost.getOrCreateReloadTask and a subsequent soft exception while the React instance was null. That establishes an earlier reload, but its initiating reason is absent from the retained fragment. M6 first/subsequent opens did not reproduce that reset. The current evidence does not isolate lazy import, Router, resolver or Fabric as the cause. No SDK/resolver change or speculative native workaround was applied.

A shared ADB connection later stalled during an explicit task-owned app restart. The stalled task command was terminated and a dedicated ADB server5038 connected directly to the same emulator's loopback5585 transport. The shared server and other applications were preserved. This affected QA automation and caused an extended pause. It is recorded separately from ReactHost reload. After the pause, the short-lived synthetic session required sign-in again. Subsequent captures use the private ADB connection and a fresh finalized Metro source bundle.

M4-02 rapid mounted density/font recreation is a distinct open issue. Viewport/font changes in M6 are performed around a force-stopped/cold-started app. M5-07 release impact remains unknown until a reproducible cause and release-build validation exist. Actual after-Calendar outcomes and cleanup are included in the native results.

## Controlled developer-key reproduction

During the later Calendar form flow, process4541 reloaded while automated physical text entry typed the death-anniversary title. That produced15 ReactHost reload lines and returned to Home before the next Map entry. Focus-verified entry with300ms spacing around R keys then completed the same title and full lunar CRUD with no additional reload lines. After Calendar, Timeline and Graph, Map rendered real tiles and3/125 markers, and Map→Timeline→Back restored Map. Its reload count remained15, giving a zero delta during this Map path.

A separate compact cold process13537 started with zero reload lines. The controlled test verified an unsaved Modal EditText focused, injected rapid physical rr, observed15 new ReactHost reload lines, the same PID, zero fatal exceptions and a return to Home. controlled-rr-verification.json and map-before-fast-rr/map-after-fast-rr diagnostics retain the comparison. No record was saved during the probe.

Local RN0.88 ReactDelegate.kt around403 invokes DoubleTapReloadRecognizer with activity.currentFocus under developer support. DoubleTapReloadRecognizer.kt recognizes two KEYCODE_R events within200ms when that view is outside its EditText check. A focused Modal's physical-key path reproduces this developer shortcut. The M6 QA helper corrects its own injection by verifying requested field focus and spacing R keys300ms apart. Application/native SDK code was unchanged.

This controlled reproduction establishes one automation-triggered developer reload outside Map. The M5 fragment does not retain the initiating input/event, so M5-07 remains OPEN. Release-mode impact and the original Map-first occurrence remain unverified. No production Map fix is claimed.
