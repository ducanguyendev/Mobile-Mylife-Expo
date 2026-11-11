# Design and native UX

Verdict: **PARTIAL PASS**, based on rendered Android plus automated checks; no claim of complete accessibility certification.

M3 reuses M2 ivory/sage semantic palettes, typography, spacing, cards, buttons, fields and feedback states. New application-owned strings have matching VI/EN keys and persist through the existing theme/language preferences. Server generation titles, custom relation types, event titles and personal content remain authoritative data rather than being mistranslated.

Directory uses virtualized cards/compact rows, full names, actual generation/life/birth information and initials when no managed avatar is available. Combined name/generation/life/gender filters are explicit and clearable. Native QA found and fixed an offscreen Clear filters action; actions can wrap vertically. Horizontal chip rows intentionally scroll.

Profile separates identity, avatar, edit/delete, contact, bio, relationship groups and supplied timeline/anniversary summaries. Relative links reuse existing routes. Edit saves dismiss to an existing profile rather than stacking duplicate copies. Delete has a separate irreversible-consequence dialog and an atomic pending guard. Forms use keyboard-aware scrolling, date-only validation and complete relationship controls. Unsaved changes require a discard choice; unknown create outcomes prevent blind resubmission.

Relationship selector is a full-screen native Modal with a virtualized list, search, visible selected summary, separate cancel/confirm, explicit removal confirmation, native Back and keyboard dismissal. Long names wrap; selection is never silently truncated. Existing missing IDs remain visible until deliberately removed.

Graph has its own pan/zoom viewport and accessible card/list alternatives. Compact screens move verbose instructions into a labelled help action. Controls can be reached by horizontal scrolling instead of shrinking text/touch targets.

Evidence: `test-results/native/*.png` and corresponding UI-node JSON. Native viewports: standard ~393dp, compact 360dp at 130% font and large ~800dp. Palette audit replays the unchanged M2 command with output redirected into M3: 14 tested semantic pairs pass. Identical colors/ratios alone do not establish screen-reader, focus-order or full contrast compliance.

Limits: full TalkBack spoken traversal, external keyboard/focus, extreme text sizes, physical-device motor/vision usability, iOS keyboard/Back behavior and real-provider permission behavior remain NOT TESTED. Expo Go's floating developer-tools control is visible in screenshots and is not app production UI.
