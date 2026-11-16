# Authentication and session review

Native uses SecureStore for one complete access/refresh pair, Bearer requests with X-Client-Platform mobile, omitted cookies, single-flight rotation and session-version fencing. Remembered email uses AsyncStorage. Passwords and refresh tokens never enter AsyncStorage, routes, URLs or application logs.

M8 fences AuthProvider profile/restore/login results by operation generation and latest profile request. Logout immediately removes protected identity, including when remembered-email storage fails. Conditional SecureStore writes serialize account transitions and remove stale bytes before a newer login can write. A stale minted login session is revoked through the existing logout endpoint. New tests exercise a write crossing an account transition and late Profile body after logout.

Authenticated foreground sessions refresh identity every30 seconds and on resume. Admin resources independently verify fresh role before every request, clear sensitive state on blur/background/error and poll while focused. A role change or lock revokes refresh tokens on Backend. Program.OnTokenValidated checks sid, active user and current exclusive DB role on every protected request. Stale native access and refresh are rejected in real HTTP.

Existing regressions cover login/logout, restoration, concurrent401, refresh rotation/replay, logout races, SecureStore failures, late previous-account responses and private binary bodies completing after logout. M7 HTTP replays owner/foreign/anonymous media isolation and account-wide mutation uncertainty across reopened routes. M8 adds password session behavior, role promotion/demotion, lock/unlock, stale-role requests and native-cookie/Web-CSRF separation.

No push-based role invalidation exists. A remote role/status change can leave previously rendered content visible until the next refresh or protected request, bounded by focused polling during foreground use. Network-offline visibility, task-switcher previews, device cache forensics and physical long-session behavior remain release risks. Admin resource state is cleared on background and focus loss. No confidential log DTOs or images are persisted by M8.
