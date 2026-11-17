# Android ANR and Fabric QA

Track separately: M7-13 FocusEvent input-dispatch ANR(HIGH), M5-07 first lazy Map ReactHost reload(MEDIUM), M8 Profile save/navigation Fabric mounting(HIGH). A successful individual replay does not close any root cause.

M8 mitigation preserves stable form containers and inline success rather than automatic stack dismissal. M9 requires repeated release saves plus separate Android Back and Backend read-back. On17-Nov the release APK reproduces stale accessibility busy after a successful save: `504-release-profile.xml` and `530-profile-inspection.xml` show enabled=true with `Save changes, busy`. Explicit `busy=false` is the narrow fix; a rebuilt embedded-JS APK and native replay are required.

The17-Nov emulator full boot took216035ms. System UI/phone/Google-service ANRs occurred before app QA. These remain environment failures, not attributed to MyLife. `test-results/native/resume-logcat-redacted.log` retains available timing/process evidence. Exclude emulator boot from app startup measurements.

Failed native harness attempts are retained separately: a scrolled-off Back control, then exact matching of the stale busy label. They do not count as completed save/Back cycles.

OPEN: physical main-thread traces, repeated first-Map initialization, longer release/navigation/save cycles, gallery memory pressure and configuration/process-death tests. No downgrade, dependency-source patch or broad renderer rewrite. Final artifact/replay scope is recorded in the native evidence and device matrix.

Final17-Nov APK `eda69836…` completes three Profile save/Android-Back cycles with authoritative matching names and no stale busy description in post-save captures554/560/566. Password change succeeds, new-password login succeeds and all3 native password fields are empty; logout/fresh login passes. Evidence: `native/release-profile.json`,550–606. This closes the reproduced busy-label defect on the tested emulator, without closing the historical Fabric root cause or physical-device stability gate.

A12s Perfetto graph interaction trace is collected on the final build with stable process18043,6,128,104bytes. See `performance/graph-trace.json` and `graph-release.perfetto-trace`. Main-thread/render analysis remains pending; the trace is for measured graph jank and is not falsely attributed to the historical FocusEvent ANR, first-Map reload or Fabric failure. The measured emulator frame/growth budget failures are separately OPEN/HIGH.
