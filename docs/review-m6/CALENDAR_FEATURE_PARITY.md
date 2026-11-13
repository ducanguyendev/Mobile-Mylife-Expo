# Calendar parity recorded before implementation

| Capability | Backend/Web behavior | Expo target |
| --- | --- | --- |
| Auth and API | Seven USER-only endpoints, native Bearer and Web cookie transports | Existing native API client and strict DTO validation |
| Death anniversary | Vietnam UTC+7 lunar recurrence, historical conversion, valid deceased member | Debounced/cancelable Backend previews and explicit matching validation |
| Family event | Solar original date, February29 clamp | Solar form with lunar draft cleared on type switch |
| Legacy family event | Nullable original date and retained lunar recurrence | Read complete legacy data, require explicit original date when saving |
| Calendar | Monday-first month/day selection and per-type indicators | Bounded responsive month grid, Today/jump/month navigation and selected-date list |
| Upcoming | Authoritative nextSolarDate/daysUntil, stable ID tie-break | Virtualized list, accent search/type/date filters, counts, refresh |
| Browsing | Only one next occurrence returned | Place only returned dates and explain available coverage |
| Editing | All optional fields, own related member | Authoritative GET, draft/cancel member picker, unsaved warning, stale comparison |
| Delete | Delete anniversary source record | Title-specific confirmation, serial mutation, authoritative absence, uncertain-outcome lock |
| Historical Timeline | Derived source-qualified originalSolarDate | Navigate to original management and retain read-only historical row |
| Home/profile | Refetch authoritative upcoming/member data | Refocus reload and contextual Calendar/profile links |
| Native | Existing theme/language/safe-area/reduced-motion foundation | VI/EN, Light/Dark,360dp/font130%, accessible list alternative and large-family selection |

Final results and deviations will be recorded after implementation and QA.

## Final implementation

All planned features were implemented through the existing seven endpoints. The mobile form defaults to FAMILY_EVENT, with DEATH_ANNIVERSARY explicitly selectable. Both retain Backend business rules. ISO date-only text input follows the existing M5 form pattern. The initial month is the current Vietnam month, as required for M6. Can Chi follows Web while nextLunarYear follows Backend nullability.

Unit83, full Backend203 and real HTTP84 scenario groups pass. Native CRUD phases independently verify Web-compatible fields, historical Timeline sources, member profiles and Home collection. Native Home refocus visibly displayed a newly edited today event. The valid leap-month flow converted22/03/2023 and displayed22/03/2042 as the next occurrence. The native evidence report records viewport/theme/navigation/error outcomes and device exclusions.
