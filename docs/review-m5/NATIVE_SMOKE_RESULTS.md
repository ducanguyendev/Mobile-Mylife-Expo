# M5 Android native smoke results

**PARTIAL PASS overall. PASS for the executed Android scenarios below; application release NOT READY.** Evidence is in test-results/native (PNG, fresh UI hierarchy XML/JSON, independent HTTP assertions). Unit tests and HTTP tests are reported separately in TEST_RESULTS.md.

Environment: Windows host, dedicated headless MyLife_M4 AVD, emulator-5584, Android15/API35 x86_64, SwiftShader/WHPX. Existing SDK58/RN0.88.1 custom development APK was reused, not Expo Go and not a fresh M5 native build. Installed/local SHA256 both e7a7d25991741489481c8546d091d0a2637ce28d563d04b0b7538918358d9540 (native/apk-reuse.json). No native package/config/resolver change. Metro served the M5 source; final navigation change was checked after restarting Metro and cold-starting the app.

Only a random disposable PostgreSQL18 database and loopback Kestrel API were used. Dedicated synthetic user,125 members/three generations,520 custom events plus two derived births and one original-date anniversary:523 total. Native create briefly produced524, edit kept524, delete restored523. No production/user accounts or private provider credentials. Authorized existing public VIETMAP key was injected into the Metro process, never written to artifacts.

| Scenario | Outcome | Evidence |
| --- | --- | --- |
| Real login,125-member Home, complete Timeline523 | PASS |11-login-result,13-timeline-loaded |
| Derived original anniversary and birth read-only; profile/member Timeline/Back | PASS |14–21; no active Edit/Delete; member endpoint API separately tested |
|125-member picker normalized search, last member, cancel without commit, confirm primary/related | PASS |28–40;32 reopens unchanged selection after Back cancel |
| Create approximate year-only1899 event | PASS |23–42; native-crud-created.json independently asserts null date/year1899, approximate, both member links and Web cookie read |
| Edit same event to exact leap date1996-02-29 | PASS |43–49; native-crud-edited.json asserts date/year/approximate/member preservation and Web parity |
| Delete confirmation cancel then explicit delete | PASS |50–58; native-crud-deleted.json confirms authoritative absence/523 total/derived rows preserved |
| Unsaved form Back warning/discard | PASS |60–64; native-crud-discarded.json confirms draft was never stored |
| Calendar/Library honest future scope | PASS |65–67 and final114/115; management remains unimplemented |
| Accent-insensitive Vietnamese search, long complete title/detail text | PASS |68–70 and compact81–86; card title wraps, description preview has full detail view |
| Light/English and Dark/Vietnamese | PASS for observed screens |13–70 Light/EN,74–86 Dark/VI |
| Large and compact/font130% safe-area/scroll/keyboard/Back | PASS for observed screens |1200x1920/density240 (800dp) then720x1280/density320 (360dp), font_scale1.3;77 cold-restored auth/preferences,78–86 wrapping controls/full text |
| Offline refresh gives localized error, restore recovers data | PASS |88–93;90 has load error,92 recovers without logout |
| Graph fit/one-pointer pan after Timeline navigation | PASS for fit/pan only |94–97, graph-pan-verification.json; physical pinch/FPS NOT TESTED |
| VIETMAP actual tiles/three manual locations coexist with Timeline | PASS after cold recovery |104–106 and final110/117 show real dark tiles and three markers; provider accuracy/release setup not certified |
| Map→Family-stack Timeline→one Back/visible Close→Map | PASS after fix |111/112 and113/116; prior107/108 incorrectly went Home and prompted the same-stack route fix |
| Real refresh-session revocation→native login | PASS |session-revocation.json;119 retained authenticated screen before refresh,120 transitional refresh,121-expiry-result shows login and no Timeline rows. Transient expiry toast not captured |

Failures/limits are retained rather than counted as PASS: early startup actions occurred before the bundle was ready; one initial Map entry caused a ReactHost reload/navigation reset (98–100 and redacted diagnostic logs). Attempt101 failed because Home was already shown;102 is the Android launcher, not navigation success. Cold retry104–106 rendered Map successfully. The separate cross-tab Back defect107/108 was corrected and rechecked111–117. One hierarchy dump119 initially could not obtain idle state; a new fresh dump succeeded as119-expiry-ready. No stale hierarchy was reused.

First lazy Map reload remains OPEN (M5-07), distinct from inherited mounted density/font recreation warning M4-02. Root cause and release-build impact are unverified. This QA does not establish crash-free long sessions, physical gestures/FPS/memory, TalkBack speech/focus, hardware keyboard, native reduced-motion focus, physical Android, iOS or VoiceOver. These are NOT TESTED. Actual Google Drive lifecycle remains BLOCKED by the inherited disposable-provider setup gate. Complete M1–M4 HTTP replay is separate evidence, not native provider verification.

Reproduce with the isolated M5 harness and seed/helper scripts only; never copy its hosting fixtures into a release. Native helpers require the held loopback runtime, synthetic account and MyLife_M4 AVD/serial5584. APK reuse, structured results and teardown records are adjacent to the screenshots. No release artifact, commit/push, publish or deployment was generated.
