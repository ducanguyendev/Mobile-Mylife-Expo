# Profile API contract

GET `/api/me` returns a raw account DTO with identity, original fullName, displayName/name, phone, gender, date-only DOB, role/roles, provider flags, avatar URL, activation and timestamps. Identity, email, original fullName, role, providers and activation remain read-only in Expo. Unknown or malformed role/provider/activation responses fail validation.

PUT `/api/me/profile` sends exactly displayName, phoneNumber, gender and dateOfBirth. Expo normalizes display-name whitespace, requires 1–100 UTF-16 characters, strips phone whitespace and accepts Vietnamese 03/05/07/08/09 ten-digit prefixes. It accepts Nam, Nữ and Khác. A narrow Backend model fix enforces phone format, those genders and nonfuture DOB. Backend validation remains authoritative.

DOB uses DD/MM/YYYY input and exact yyyy-MM-dd serialization through the existing calendar validator. UTC calendar components validate day/month/year. No local-midnight conversion is used. Comparison uses the Backend’s UTC date convention. Profile updates have no registration age restriction.

Forms initialize from a fresh GET. Saving compares user ID, updatedAt and all editable fields against another GET, then PUTs and refetches. AuthProvider refetch updates Home, Profile and avatar/name consumers. Original fullName is preserved. Pending and uncertain writes share per-session/account flags across reopened routes. Lost acknowledgments require explicit authoritative reload before another write.

Concurrent cross-client GET/write races remain OPEN because the API has no ETag/If-Match or row-version precondition. Fresh comparison narrows stale-edit exposure. It cannot make the GET and PUT atomic. Reload/discard confirmation, duplicate prevention, abort on leave, session-version guards and account-keyed route trees protect local form/session transitions.

HTTP evidence covers own read, update, Web-cookie read-back, invalid inputs, immutable-field overposting and stale comparison. See `test-results/final-backend/m8-integration.json`.
