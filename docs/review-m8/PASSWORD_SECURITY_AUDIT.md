# Password security audit

POST `/api/auth/change-password` accepts currentPassword, newPassword and confirmPassword. Fresh `/api/me` loginProviders.local must be true before Expo dispatches. Google-only accounts receive explanatory copy. Unsupported MFA, password-reset and provider-linking controls are absent.

Validation requires current password, at least eight new-password characters, at most 72 UTF-8 bytes, a different current/new value and matching confirmation. The Web four-criterion strength feedback covers length, uppercase, number and symbol. Extra composition criteria remain guidance because Backend change-password accepts eight-character strings without registration composition rules.

Fields use secure text entry with labeled show/hide actions, disabled autofill/correction and no logging or persistent storage. Password strings are cleared after success, after errors, on blur/unmount and on background. Account-keyed navigation unmounts old forms. Tests and evidence contain no entered password values.

Real HTTP verifies wrong current password400, mismatch400, UTF-8 overflow400, Google-only400, successful change200, old-password login401 and new-password login200. Both existing access sessions remain valid and a second session’s refresh succeeds after password change. Therefore existing sessions remain active. Expo explicitly communicates this behavior and offers current-session logout. No global revocation or device-management capability is claimed.

Native execution and its current limitations are recorded in NATIVE_SMOKE_RESULTS. Password security’s automated/HTTP coverage is independent of the native matrix.
