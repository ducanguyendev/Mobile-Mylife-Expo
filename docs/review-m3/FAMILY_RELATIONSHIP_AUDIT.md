# Relationship integrity

Verdict: **PASS for implemented/automated contracts**. Backend remains the authority.

`UpdateFamilyMemberDto` is a scalar replacement PUT. Father/mother/spouse null clears. Children and horizontal relations have special collection semantics: omitted/null preserves, explicit [] clears, populated collections synchronize. Managed avatar/location metadata do not belong to this DTO.

The form reads the latest member before saving. `buildMemberUpdate` starts from that fresh editable snapshot and overlays intentional changes. An unchanged children/horizontal collection is omitted. Intentional selection changes are merged as additions/removals against the fresh collection, retaining unseen concurrent additions and custom relation types. Competing scalar or same-target horizontal edits raise an explicit conflict. The UI offers a confirmed reload, rather than silently discarding local changes.

| Scenario | Result | Evidence |
| --- | --- | --- |
| Phone edit preserves explicit sibling/custom relations in both directions | PASS | M1 real integration; M3 real integration + unit |
| Spouse change preserves unrelated horizontal links and clears former reciprocal spouse | PASS | `final-backend/m3-integration.json` |
| Child addition retains existing children and sets reciprocal parent | PASS | Same integration + delta merge unit tests |
| Native phone + child edit retains spouse/sibling | PASS | `native/saved-data-verification.json`, screenshots 20–23 |
| Self, cycle, foreign parent/spouse/horizontal IDs | PASS: Backend rejects | Real Kestrel/PostgreSQL |
| Missing selected candidate | PASS: retains ID and labels missing record | Picker adapter regression |
| Cancel/Android Back | PASS: form unchanged | Native picker plus component adapter |
| Remove selected link | PASS: separate confirmation, then save | Component adapter; real explicit [] removal both directions |
| Unrelated edit preserves avatar/manual location | PASS | Real multipart upload + manual coordinates + scalar PUT |

Backend accepts trimmed nonempty horizontal types of 1–50 characters. UI shortcuts use the Web's sibling/cousin values and retain/edit other actual types. Inferred siblings require a shared known parent; two null parent IDs never imply a relationship. Inferred groups are read-only and labelled separately.

Child assignment follows actual raw Backend gender semantics: female/nữ assigns mother; otherwise father. Untouched raw aliases are preserved. Selecting a child can replace its existing corresponding parent; the form explains this before selection.

Limit: fresh GET + PUT is not a transaction. Backend has no conditional ETag/version write or idempotency key. Another writer between GET/PUT can still race scalar fields. Unknown network outcome after create blocks blind duplicate submission and sends the user to inspect the family list. Address changes intentionally clear location metadata according to Backend rules; unchanged addresses preserve it.
