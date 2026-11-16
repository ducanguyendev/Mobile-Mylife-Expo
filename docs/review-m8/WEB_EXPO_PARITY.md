# Web–Expo parity

Profile uses the same four editable fields, whitespace normalization, Vietnamese phone prefixes, genders and date-only DOB. Original fullName and identity remain read-only. Expo adds fresh comparison and per-account uncertainty gates. Web HTTP reads are tested against the same disposable PostgreSQL updates.

Password uses authoritative provider flags and Web-compatible strength guidance. Expo enforces Backend’s72-byte UTF-8 cap. Backend’s change-password contract supplies the final acceptance rules and preserves existing sessions. Profile’s registration-only strength requirements are kept as guidance in this screen.

Account avatar uses Web’s singular-file upload/delete endpoints and stable provider URL lifecycle. Native requires verified file bytes and rejects unsupported HEIC. Public email-based avatar resolution remains a product privacy dependency shared with Web.

Admin statistics, user filters/sorts, self/Admin safeguards, role/status/delete operations and recent log controls follow W10 business semantics. Native uses mobile cards, scrollable filters and virtualized lists. Native HTTP uses SecureStore/Bearer. Web HTTP retains HttpOnly cookies, Origin and CSRF protections.

No Web source changes or deployment occur in M8. Backend changes are limited to confirmed Profile validation and synchronization of concurrent administrator protections. Flutter remains read-only.
