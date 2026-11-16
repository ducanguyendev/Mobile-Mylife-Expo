# Admin RBAC audit

Root Stack.Protected guards `/admin` with authenticated ADMIN and `/family` plus `/library` with authenticated USER. Shared account routes require authentication. The ordinary NativeTabs layout redirects ADMIN to the Admin Console before rendering USER tabs. ADMIN receives its own NativeTabs with Overview, Users, logs and Profile. Family and Memories entry components retain existing role checks. Route trees are keyed by account ID and role.

Each Admin API request reads fresh `/api/me` and verifies active ADMIN before dispatching sensitive-data reads. Mutations also verify the actor ID. Backend role attributes and sid/current-DB-role validation enforce the server boundary. Hiding navigation alone grants no authority.

Real HTTP asserts USER Admin403, ADMIN Family/Timeline/Anniversaries/Library403, anonymous protected401 and stale-role session401. Role changes revoke both old access and refresh sessions. Promotion and demotion require fresh login before using the new authority. JS tests verify guards, actor mismatch and rejection before sensitive-data fetch.

Admin state is transient. Resource hooks clear on blur/background/error, abort in-flight work and fence sequence/session versions. Profile/password forms are scoped by the root account/role key. Remote-role detection uses requests/resume and30-second polling, leaving the visibility interval documented in AUTH_SESSION_REVIEW.

Native deep-link and actual role-transition results are reported separately in NATIVE_SMOKE_RESULTS. Physical/iOS and release-build RBAC remain explicit verification gates.
