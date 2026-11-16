# Album, category and photo integrity

PASS for covered automated/HTTP cases; concurrent atomic updates remain OPEN.

All overview/detail routes share a per-account serial gate, including after route reopening. Only busy/uncertainty/rate flags are retained; no DTOs, images or credentials. An explicit current-account predicate rejects even a late stale focus activation. Immediate refs prevent duplicate submit/picker actions before React rerenders. Album edits/deletes compare a fresh detail snapshot, including photo count and updatedAt. Photo/category changes compare fresh overview metadata. Names, optional fields and actual category slugs are preserved. No optimistic deletion is used.

Delete confirmation includes the authoritative album name/count and permanent photo/folder consequence. Storage502 leaves database-backed UI records present after refetch. The adapter test proves failed photo and folder deletion retains DB metadata. Successful204 is followed by authoritative reads. An acknowledged write whose read-back fails is still uncertain.

Network/aborted/5xx writes lock subsequent mutations. Explicit refresh reads overview before unlocking; it does not prove an interrupted provider operation has settled. The upload selection is cleared after a failed submission, with instructions to check existing photos before reselecting. No automatic POST replay or fabricated local rows exist.429 Retry-After is retained and enforced by the mutation gate before another dispatch.

Category rename preserves server slug and therefore active filters. Default category actions are hidden. In-use category delete409 is shown. Album-only internal values are represented as a label, never a user-created category. Backend null category preserves existing photo assignment; clearing an assigned category is not offered.

Backend transactions/row locks, checksum/type/size verification and compensation remain unchanged. Its upload rollback and delete DB-failure cases are included in the203 full Backend tests. Drive and DB are not one atomic transaction: successful provider deletion followed by failed DB commit can leave stale DB rows; incomplete compensation can leave orphan files/folders. No mobile code claims those risks are closed.
