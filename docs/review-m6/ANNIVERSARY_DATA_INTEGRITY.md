# Anniversary data integrity

Read validation covers all20 actual fields and nullable nextLunarYear, finite/safe IDs, complete envelopes, date-only Gregorian values, paired lunar fields, linked metadata and duplicate IDs. Legacy death/family records with missing original dates remain readable when Backend supplies their next recurrence. A saved form requires an explicit valid original date.

Normal FAMILY_EVENT mode clears lunar day/month/year/leap draft values. Death mode requires a matching Backend conversion and eligible deceased member with a recorded matching death date. The reused virtualized member picker confirms a private draft, and Cancel leaves the previous selection intact. Switching modes clears ineligible links. Form cancel warns about unsaved changes. Place/host/notes and original dates populate from authoritative GET details.

Account-local serialized mutations compare a fresh record including write fields and updatedAt before update/delete. Computed next occurrence fields are excluded from stale comparison because recurrence may advance with business time. Completed writes require authoritative collection reconciliation with matching canonical fields or confirmed absence. Already-deleted sources are safe. Uncertain dispatched operations lock new writes until explicit refresh reconciliation.

Fresh GET and PUT/DELETE are separate requests. Another writer can still race in between. Cancellation cannot undo a server write already applied. The absence of conditional versions remains an open contract risk.

Definitive rejected-write4xx responses preserve their localized validation/permission feedback. Network/5xx/malformed-success outcomes remain uncertain. Once a write has been acknowledged, any failed authoritative reconciliation retains the lock even if that later read returns4xx. Two regression cases cover this distinction.

Protected USER routes, existing native SecureStore/Bearer lifecycle, account/member keyed state, focus/background cancellation and late-response guards preserve account boundaries. All seven endpoints returned403 for ADMIN and401 for anonymous callers. Foreign record GET/PUT/DELETE and related-member assignments returned404. Web cookie mutations retain trusted Origin/X-Requested-With protections.

Real HTTP tests verify linked deceased/missing-death-date/living/date-mismatch cases, invalid fields400, source deletion, Home/Profile/Timeline refetch, preserved member relations/avatar/manual location, and the committed M4 malformed-coordinate400 regression. Evidence uses synthetic accounts and loopback databases. Native CRUD parity is recorded independently in native/native-crud-*.json after actual UI operations.
