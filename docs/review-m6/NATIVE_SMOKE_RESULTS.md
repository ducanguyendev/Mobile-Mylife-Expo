# M6 Android native smoke results

**Overall PARTIAL PASS. Executed cases below PASS. Application release readiness NOT READY.** Physical Android, iOS, TalkBack/VoiceOver, external-keyboard traversal and physical memory/FPS profiling remain NOT TESTED. Actual Google Drive integration remains BLOCKED by the inherited environment dependency.

QA used the dedicated MyLife_M4 Android15/API35 x86_64 emulator, synthetic125-member family,130 anniversaries,247 Timeline events and three manual Map locations. The unchanged custom M4 development APK was reused with matching installed/local SHA256 e7a7d25991741489481c8546d091d0a2637ce28d563d04b0b7538918358d9540. No fresh native build was generated. Metro served the final M6 source with the existing SDK58/RN0.88/VIETMAP3 resolver. The user-authorized public tile key stayed in process memory. No production account or data was used.

Executed viewport combinations were800dp/font100% Dark Vietnamese,800dp/font100% Light English and360dp/font130% Light English. Viewport changes surrounded cold launches. Screenshots and fresh UI hierarchies are in test-results/native. Secure field text is redacted and screenshots mask passwords. device.json and results.json provide machine-readable scope.

| Case | Verdict | Evidence under test-results/native |
| --- | --- | --- |
| Login, family and Memories Timeline247 → Calendar130 | PASS | 06-login-result,20–22 captures |
| Previous/next month, Today, month/year jump to February2027 | PASS | 23–30 captures |
| Chronological list, type10/130, accent-insensitive search1/130, long details | PASS | 31–37 captures |
| Related member profile and member Calendar | PASS | 38–41 captures |
| Selected date with nine provided memorial occurrences | PASS | 44-selected-multiple-day and corresponding fresh hierarchy |
|125-member picker, final candidate, Back cancels draft selection | PASS | 51–58 captures,55-family-picker-reopened |
| Create solar Family event with original leap day and all optional fields | PASS | 59–64 captures, native-crud-family-created.json |
|105 eligible deceased candidates, last eligible selected | PASS | 75–78 captures |
| Invalid lunar leap month shows localized Backend error | PASS | 83–84,84-invalid-leap-result |
| Valid leap lunar1/2/2023 → original22/03/2023 → next22/03/2042 | PASS | 85–94,92-leap-preview-scrolled, native-crud-death-created.json |
| Edit original date to today, Home visibly reflects event | PASS | 95–105,native-crud-family-today.json |
| Edit title/date, preserve member/place/host/notes | PASS | 106–113,native-crud-edited.json |
| Title-specific delete cancellation and explicit death/family deletion | PASS | 114–129,native-crud-death-deleted.json,native-crud-all-deleted.json |
| Unsaved draft warning/discard leaves130 records | PASS | 130–135,native-crud-discarded.json |
| Derived historical Timeline read-only details → manage original anniversary | PASS | 136–143 captures |
| Graph Fit and one-pointer pan after Calendar/Timeline | PASS | 144–147,graph-pan-verification.json,113 visible cards moved |
| Map after Calendar/Timeline/Graph renders real tiles and3/125 markers | PASS | 148–149,map-after-calendar-timeline-graph-diagnostic.json |
| Map → Timeline → one Back restores Map, then Family | PASS | 150-map-timeline-current,151-timeline-back-map,152-map-back-verified,153-map-back-family |
| Light/English and compact cold restoration | PASS | 154–159,161-compact-restored-home,166-final-compact-home |
|360dp/font130% month grid, Today event, long title/details/notes | PASS | 165,169–174,171-compact-selected-day-event |
| Selected date plus unmatched search shows filter-specific empty message | PASS | 175–179,179-correct-filtered-empty-state |
| Real API disconnect gives retryable error, restore/retry reloads130 | PASS | 189–193,191-offline-error-visible,193-offline-recovered |
| Real refresh-session revocation removes protected UI and shows expiry login | PASS | session-revocation.json,194-session-expired |
| Reauthentication and explicit sign-out return to login | PASS | 199-relogin-submit,200–202,202-explicit-signout |

Seven native CRUD phases were independently checked through native Bearer and Web-compatible cookie HTTP, including every20-field DTO, Home collection counts, member source and derived Timeline identity. Counts progressed130→131→132→132→132→131→130→130. These parity records supplement the native screenshots. Web browser UI was outside the executed scope.

The first Map capture was followed by a failed settled UI dump. The same process's subsequent Map capture rendered real tiles with zero reload/fatal lines. The failed dump contributes no settled-screen PASS. A later shared ADB stall required private server5038 and loopback transport127.0.0.1:5585 to the same emulator. Other device sessions were preserved.

A developer reload occurred during physical-key automation inside an unsaved anniversary Modal. Controlled rapid RR injection reproduced15 ReactHost reload log lines with the same PID and no fatal exception, returning to Home. The field had been verified focused. RN0.88's200ms double-R recognizer checks Activity.currentFocus. The QA helper now verifies focus and spaces injected R keys300ms apart. The full death CRUD subsequently completed without additional reload. See controlled-rr-verification.json. This confirms a QA trigger outside Map. M5-07's original first-Map initiating cause and release impact remain OPEN.

Retained unsuccessful/transitional captures include09/13/14 after the connectivity pause,45 outside-scroll action, the initial58 label attempt,67–68 developer reload,150 busy dump,160 cold null root and the first compact password fill. Fresh states were inspected before retries. They contribute no successful-case claims. Cold restoration uses161/166. Final selected-date empty-state proof uses179 after the final-source Metro restart.

Cleanup of the owned Backend/database/PostgreSQL, Metro, emulator and private ADB server is recorded in cleanup.json and final-backend/final-lifecycle.json. The shared ADB server is outside the owned cleanup scope.
