# M7 Android native smoke results

Overall **PARTIAL PASS**. Executed core cases below PASS after the documented fixes. Native cold-start ANR remains OPEN. Real Google Drive BLOCKED. Physical Android/iOS/TalkBack/VoiceOver/external keyboard/physical FPS are NOT TESTED.

Device: newly created disposable MyLife_M7 AVD, Android15/API35 x86_64, WHPX/SwiftShader, private ADB5039, transport127.0.0.1:5587. Existing M4 development APK reused; SHA256 `e7a7d25991741489481c8546d091d0a2637ce28d563d04b0b7538918358d9540`. No Expo Go, new native build or release artifact. Final Library source is served by Metro on8089 against disposable loopback Kestrel/PostgreSQL and in-process storage HTTP adapter. The old M4 AVD disk had been cleaned up; new AVD attempts on D failed due disk space, so the task-only AVD uses Windows TEMP on C. No personal/physical device was touched.

Synthetic data:125 family members,130 anniversaries,247 Timeline events, two initial albums and125 photos. Native CRUD temporarily added one album/category and two generated striped PNGs. Counts progressed125→127→126→125, with the native album/category deleted and seed data preserved until final DB teardown. API snapshots independently verify native persistence and metadata. No real family images or Google account were used.

| Native scenario | Verdict | Evidence under test-results/native |
| --- | --- | --- |
| Login and authoritative125-member Home | PASS |18-after-login,52-cold-wait,58-cached-ready |
| Memories→Timeline247→real Library | PASS |20–22,59–60,121 |
| Album creation with description and empty album | PASS |23–28,34–36;api-album-created.json |
| Native category create/rename/immutable slug/delete unused | PASS |29–31,103–107;api-category-created/renamed/deleted.json |
| System picker multi-select two local synthetic PNGs | PASS |38–41,66–70; no broad media permission requested |
| Review selected images, no automatic upload on picker return | PASS |41–48;api-picker-not-uploaded.json |
| Background/foreground picker return preserves editor | PASS |38→41,66→70 |
| Native multipart upload with corrected FileHandle signature read | PASS |73–76;api-fixed-upload-result.json, count127 |
| Private authenticated images in gallery and full-screen viewer | PASS |76–77; visible sage/ivory striped fixtures |
| Lightbox next/previous, button zoom and Android Back | PASS |78–83 |
| Photo metadata title/description/date edit, category retained | PASS |84–93;api-metadata-saved.json |
| Photo-specific destructive confirmation and deletion | PASS |95–96;api-photo-deleted.json, count126 |
| Category filter empty state and clear | PASS |97–98 |
| Album deletion names album, actual remaining1 photo and folder consequence | PASS |99–101;api-album-deleted.json, count125 |
|125-photo virtualized grid scrolling, valid fixtures | PASS for smoke scope |124–126; physical memory/FPS NOT TESTED |
| Long Vietnamese album name,360dp/font130% | PASS covered screens |34,108,123 |
| Light/English and Dark/Vietnamese | PASS covered screens |76,117–126;device.json |
| Actual native OS permission denial | NOT TESTED | Android35 system picker grants only chosen photos; no broad-permission dialog |
| Picker process-kill recovery, GIF, HEIC on iOS, native pinch | NOT TESTED | Button zoom tested; process-death requires reselect |
| Physical/iOS/accessibility focus/speech/performance | NOT TESTED | No physical or iOS device used |

Initial native upload failed before persistence because File.slice tried to create a React Native Blob from typed arrays. It was replaced by File.open(ReadOnly)→readBytes(12)→finally close; a regression adapter now throws on native slice. No failed POST was blindly repeated: API confirmed the album remained empty, selections were explicitly chosen again, and the corrected native submission persisted exactly two images. Browser File retains its own slice path.

Initial125-photo seed used a PNG with an invalid IDAT CRC; Backend signature/checksum transport accepted the bytes, and the native decoder correctly displayed image-unavailable states. A CRC check identified the test-fixture defect. Only the disposable seed gallery was replaced with valid generated `tests/fixtures/library-sage.png`;124–126 prove rendered images. Earlier failure screenshots110–111 remain evidence of that unsuccessful attempt and do not count as image-render PASS.

Cold source reload produced repeated Android ANR dialogs: Input dispatching timed out waiting5073ms for FocusEvent(hasFocus=true). Captures51/53/56 and last-anr-redacted.txt retain this finding. Wait recovered visible UI; force-stop/cached relaunch then allowed the full corrected CRUD. Cause and release impact remain OPEN; this does not close or explain M4 recreation or original M5 first-Map issue. Metro also reports React Native Blob/base64 copying overhead; physical memory profiling remains required.

Initial login failed after an ADB reverse rule disappeared; it recovered after verified restoration of the disposable API tunnel. A password focus attempt hit the keyboard overlay and was reobserved before typing. Invalid/ambiguous labels and transitional null-root captures are excluded from successful-case claims. Secure UI hierarchy text is redacted; no password/token appears in evidence.

Final-source addendum:133-home-library-summary proves authoritative125 photos, the empty second album, new Library copy and direct album/global Library links.134–135 exercise Home→album→Back.137/139/144 show the M6 Calendar still available with the plain Library label.141–143 exercise Map navigation/list fallback after Library; actual tiles are BLOCKED in this phase because EXPO_PUBLIC_VIETMAP_TILE_KEY is absent. This does not establish a VIETMAP production/release PASS.

The generic Metro probe initially omitted application modules because it lacked the `src/app` transform root. It was not evidence of stale Home copy. `final-bundle-check.json` uses the correct root and confirms the final Home copy and absence of the old Calendar Library label. A subsequent lazy-route bundle took25.7s; transitional old-screen captures must not be treated as settled navigation proof.145's PNG was interrupted and has zero bytes; its JSON/PNG are excluded from successful-case claims.146 is a fresh actual Library observation. These are development performance findings, not a proven cause of the historical M5 reset.

No browser UI, real Drive folder or real provider deletion was tested. Final cleanup must verify DB drop, Kestrel/PostgreSQL stop and termination of only task-owned Metro/emulator/private ADB processes. Final offline/session-isolation checks are recorded below when executed.

Final security checks PASS for executed scope:147–148 contain the localized real offline error after the task-only API reverse tunnel was absent; restoring the tunnel and explicit retry149–150 returns2 albums/125 photos. The attempted remove reported the listener already missing, so this is actual tunnel-loss/recovery evidence, not a claim that that remove command caused the loss. The intermittent ADB transport remains an environment finding.

158 shows owner private images immediately before deliberate refresh-session revocation. session-revocation.json confirms the SQL change targeted only the disposable owner and the harness's5-second access lifetime.159 shows the protected gallery replaced by login.160–165 then sign in as a different generated account;168 shows0 albums/0 photos and no prior owner's media. switched-account-api.json independently verifies owner album read/delete and owner private image requests return404 for the second account. This supplements, rather than replaces, the real native UI isolation observation. Long-session cache forensics and physical platforms remain open.

Calendar push/back captures138/139/153 include transitional old screens during deferred route loading and do not alone prove a settled Library destination. The later actual gallery/security captures156–159 prove the protected Library is reachable from that final flow. Calendar itself and the plain Library action remain visible in137/139/144. Preserve this distinction when reviewing navigation performance; do not turn a capture timing issue into an unsupported reset diagnosis.

Native explicit logout PASS:169–174 return from the second account's empty Library through existing preferences and sign out;174 displays login. Profile/Admin/Security business features were not added. Final account2 state is empty, while separate HTTP checks deny owner IDs. The final task-owned DB/storage/server/emulator teardown is recorded in backend-cleanup.json and the top-level cleanup.json.

Scope boundary for14 November delivery: after the native matrix and teardown, final review upgraded the pure-TypeScript mutation coordinator from per-screen flags to shared account flags.88 unit cases and105 total HTTP groups pass, including route-reopen uncertainty and stale-account activation. This final coordinator-only change was not re-executed on Android; all native media transport, picker, UI and auth findings above refer to the executed matrix. APK/native dependencies remain unchanged. Carry its route-retry smoke into the next development-build QA.
