# Android native smoke — 10 November 2026

Verdict: **PARTIAL PASS**. All executed final scenarios pass; untested platforms/provider/gestures are explicitly excluded.

Actual device: workspace-local `MyLife_M3`, serial emulator-5582, Android35 Google APIs Play Store x86_64, WHPX, cached Expo Go58.0.5. No personal AVD was used. API/Metro were reachable only through local adb reverse to a disposable Kestrel/PostgreSQL instance. UI was operated through adb input/UIAutomator and screenshots, not a simulated React render. A separate synthetic native USER with 112 API-created members supplied scale/relationship data.

| Scenario | Result | Evidence in `test-results/native/` |
| --- | --- | --- |
| Cards ↔ compact list; actual 112 count | PASS | 01–02, 27, 34 |
| Accent-insensitive search / long name / empty filter / clear | PASS | 03–04 |
| Aggregate profile and related-member navigation | PASS | 08, 21–23 |
| Native create/edit/delete with explicit delete dialog | PASS | 17, 21, 24–27; `native-created-deleted.json` |
| Picker all 111 non-self candidates / search / selected summary | PASS | 18–20 |
| Android Back cancels picker draft, confirm changes form | PASS | 19–20; post-save authoritative API verification |
| Phone and selected child persist; reciprocal parent and unrelated sibling/spouse retained | PASS | `saved-data-verification.json`, 22 |
| Pick/preview/upload/view/replace/remove | PASS with storage contract adapter | 09–16; `avatar-provider-events.ndjson` |
| Storage fault retains preview; retry succeeds | PASS | 13–14, actual 502 `FAMILY_AVATAR_STORAGE_FAILED` |
| Graph pan/buttons/reset/fit/tap | PASS | 05–07, 29, 33, 35 |
| Light/EN, Dark/VI; preference/session restore after force-stop | PASS | 01–08 vs 28–38, clean final bundle |
| Compact 360dp at 130% text | PASS after fix | Initial 32 had insufficient graph viewport; final 33 shows readable nodes |
| Large 800dp viewport | PASS | 34–35 |
| Actual API offline/error/retry | PASS | 36–37: API reverse removed, connection reset, routing restored |
| Session invalidation during Family reload | PASS | 38; `session-revocation.json` targets only disposable USER |
| Actual two-finger native pinch | NOT TESTED | Controller behavior is automated; no physical gesture claim |
| Actual OS permission denial / process-killed picker recovery | NOT TESTED | Bridge-adapter errors/recovery tested; modern system picker did not show broad permission prompt |
| TalkBack speech/focus, physical hardware, iOS | NOT TESTED | Windows emulator-only coverage |

Viewports: 1080×2340/density440 (~393dp), 720×1280/density320 (360dp, font1.3), 1200×1920/density240 (~800dp, font1). Configuration changes recreate the activity; stored theme/language/session restored. Keyboard typing/hide/scroll, Modal Back and viewer Back were exercised. No exhaustive keyboard/focus or all-font-size certification.

QA found two functional defects and corrected them: SDK58 default expo/fetch rejects legacy URI multipart parts (replaced with File), and compact graph instructions consumed most viewport (scrollable controls + compact help). Filter Clear was also made reachable. A transient Metro Fast Refresh module-graph error after adding a source file was resolved by restarting Metro with `--clear`; final clean bundle built 1686 modules and was used for final compact/large/offline/session checks. Earlier screenshots preserve the discovery history; they are not all final-layout approval screenshots.

Machine-readable results: `test-results/native/results.json`; each numbered screenshot has UI-node JSON. Provider event bytes are contract-fixture evidence, not Google Drive proof. Final lifecycle records database dropped/PostgreSQL stopped. The M3 emulator and Metro were stopped after evidence collection.
