# Timeline parity plan (recorded before feature implementation)

References: Web W10 144fc506, Backend c1b43b1; Expo starts at b18acdb98d6184d91ed5d1d88f003d96d5b10479. Final execution evidence is separate from this initial plan.

| Capability | Web / Backend convention | Expo M5 implementation target |
| --- | --- | --- |
| Data / CRUD | Existing timeline list/member list/POST/PUT/DELETE | Same contracts via existing native Bearer transport |
| Date chronology | Web ascending years, unknown last; Backend ascending with year-only chronological placement | Ascending numeric years1–9999, exact days sorted numerically; year-only retains null date; no Date.UTC0–99 bug |
| Filters | ALL; BIRTH includes BIRTH/DEATH; MARRIAGE; FAMILY includes CUSTOM/CHILD_BIRTH; LOCATION=ADDRESS_CHANGE; MEMORY includes MEMORY/ANNIVERSARY; OTHER=fallback | Preserve these exact meanings, plus accent-insensitive title/member/location search and visible/total count |
| Creation | CUSTOM/MEMORY/ADDRESS_CHANGE/MARRIAGE only; BIRTH/OTHER filter has no default create action | Same normal creation options, primary/related member draft pickers |
| Derived | Birth/death from FAMILY_MEMBER, anniversary from original solar date; negative IDs; sourceType/sourceId | Source-qualified keys (IDs can collide across sources), read-only; localize derived birth/death titles only |
| Legacy persisted types | Positive custom rows of other enum types may exist; Web blocks birth/death editing | Preserve legacy non-birth/death type on edit; never offer internal types for new events; no active edit/delete for derived or birth/death |
| Details / profiles | Member links and related member context | Native details; full member Timeline route; fetch members once, no per-event profile fan-out |
| Dates / form | Trimmed title2–200; description2000/location500; date or year; paired finite coordinates | Exact ISO date / year-only modes; approximate toggle; retain unrelated optional fields; no timezone coercion |
| Integrity | Server authoritative, no conditional-write version | Fresh full-list comparison before edit/delete, serialized mutation, authoritative refetch, uncertain writes require reconciliation, residual race explicit |
| Large collection | Desktop year rail | Virtualized SectionList with year headings, no truncation/nested unbounded scroll |
| Memories scope | Timeline now; anniversary/library future phases | Remove fictional content; explicit disabled coming-soon Calendar/Library structure |
| Mobile quality | Existing theme/language/auth/Family/Map | Reuse preferences, safe-area modal, keyboard/Back,48px controls; actual development APK QA |

Final coverage and any deviations are appended after implementation/QA; this plan is not a PASS claim.

## Final executed parity

All implementation targets above were completed. Final60 M5 unit cases and21 real Backend/PostgreSQL scenario groups pass, alongside unchanged M1–M4 replay. Native Android checks pass for real523-event rendering, filters/search, derived read-only details, profile/member navigation, picker125-member draft cancel/confirm, year-only create, exact leap-date edit, explicit delete/cancel, unsaved discard, VI/EN/theme/compact font130%, offline recovery and session expiry. Independent native Bearer plus Web cookie reads verify each native CRUD phase. This is HTTP Web parity, not browser UI automation.

Desktop year-rail navigation becomes sticky year sections on mobile. Exact dates use labeled ISO input and year-only mode instead of adding a date-picker dependency. Details provide complete text beyond the card preview. A native navigation defect discovered during QA was corrected: Map now opens Timeline in the same Family stack and one Back/Close returns to Map. Calendar/Library expose future scope only. No fictional personal memories or M6/M7 management exists.

Overall development remains PARTIAL PASS because physical/iOS/accessibility/performance/provider/release gates remain open. Native first lazy Map reload is an observed unresolved risk, despite successful cold recovery/real tiles. Backend conditional-write atomicity is absent upstream; stale checks and reconciliation mitigate but cannot eliminate the GET/write race. See NATIVE_SMOKE_RESULTS and CARRY_FORWARD_RISKS.
