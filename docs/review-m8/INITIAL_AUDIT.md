# M8 initial audit

16 November 2026, Asia/Saigon. Expo, Backend and Web were clean on `feature_minhduc` before changes. Verified HEADs are `c55a476f01c14cb0cd24428deb17e4d1af9d85c9`, `ca20ba52635a026b32449f919e60410ff880c829` and `144fc506c0ec7957d40a137351aeda296b8937b5` respectively. Flutter receives no writes.

Read M7 REPORT, M8_HANDOFF, CARRY_FORWARD_RISKS, PRIVATE_IMAGE_SECURITY, NATIVE_SMOKE_RESULTS, GOOGLE_DRIVE_PROVIDER_QA and TEST_RESULTS. Baseline passes lint, typecheck, auth, foundation, M2–M7 and contrast. There are 346 unique JS cases. Auth’s 10 cases are included in foundation’s 26. Command evidence is in `test-results/baseline-quality.json`.

GitHub independently confirms M7 Expo quality run 43792501120 completed successfully on the exact M7 SHA. The remote Backend anniversary file resolves at ca20ba52 and contains the nine deterministic cases. These observations supersede M7’s historical pending CI and remote-file-404 statements. Production deployment remains unverified.

[M7 Actions run](https://github.com/ducanguyendev/Mobile-Mylife-Expo/actions/runs/43792501120) · [Backend anniversary tests](https://github.com/ducanguyendev/Backend-MyLife/blob/ca20ba52635a026b32449f919e60410ff880c829/Tests/AnniversaryDateIntegrityTests.cs)

## Contract matrix

| Capability | Backend contract | Web W10 | Expo M7 starting state | M8 implementation |
| --- | --- | --- | --- | --- |
| Account identity | GET /api/me, raw user DTO | authService.getUserInfo, UserProfileModal | Shared user with settings-only Profile | Profile details and focus refresh |
| Profile update | PUT /api/me/profile, four mutable fields | Display-name normalization, Vietnamese phone, exact DOB, Nam/Nữ/Khác | Placeholder | Dedicated fresh-data form and read-back |
| Account avatar | POST /api/avatar/upload, singular file; DELETE /api/avatar | Upload/delete and provider URL | Existing generic avatar display | Picker, preview, verified SDK58 File transport |
| Avatar read | Anonymous GET /api/avatar/{email}, 302 HTTP(S) provider redirect | Account display | URL display | Public visibility disclosed and audited |
| Password | POST /api/auth/change-password | Provider-aware form and strength criteria | Placeholder | Authoritative local-provider form, 8 characters/72 UTF-8 bytes |
| Session behavior | sid-bound access, rotating refresh, role/status DB validation | HttpOnly cookie with Origin/CSRF | Native Bearer/SecureStore/single-flight/fences | Regression preservation and profile-result fencing |
| Dashboard | GET /api/admin/stats, raw six counts | AdminOverview | No console | Native cards and active/locked counts |
| Users | GET /api/admin/users?search= | AdminUsers with client filters/sort | No console | Virtualized users, email/role/status filters and sort |
| Role | PUT /api/admin/users/{id}/role, USER/ADMIN | Explicit confirmation and self protection | Absent | Confirm, authoritative preflight, shared mutation gate |
| Status | PUT /api/admin/users/{id}/status, isActive | Admin accounts protected | Absent | Confirm lock/unlock and read-back |
| Delete | DELETE /api/admin/users/{id}, success/deletedId | Admin protected, family409 | Absent | Email-identifying confirmation, no cascade shortcut |
| Logs | GET /api/admin/logs, latest 50 | AdminLoginLogs | Absent | Virtualized recent logs, email/status/time controls |
| Unsupported account services | No MFA/session-list/self-delete/reset/linking contract | No contract added | Absent | Future requirements recorded in M9 handoff |

Backend audit covers AccountController, UpdateProfileViewModel, ChangePasswordViewModel, AvatarController, TokenService, AppRoles, AuthTransportPolicy, Program.OnTokenValidated and related contract/session/administrator tests. Web audit covers authService, UserProfileModal, adminConsoleService, AdminOverview, AdminUsers, AdminLoginLogs and useAdminConsole. Expo audit covers root/tab layouts, auth, apiClient, member-avatar and Library transport, preferences, themes and design components.

Two narrow Backend defects were identified. Profile’s model accepted unsupported phone/gender and future dates. Status and deletion read administrator protection before synchronization with concurrent role changes. M8 adds validation and shares the existing PostgreSQL administrator advisory transaction lock across these operations. No storage visibility change is included.

SDK58 documentation was checked before native/API work. Existing dependencies are retained.

[SDK58 reference](https://docs.expo.dev/versions/v58.0.0/) · [ImagePicker](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/) · [FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/) · [Protected routes](https://docs.expo.dev/router/advanced/protected/) · [NativeTabs](https://docs.expo.dev/router/advanced/native-tabs/)
