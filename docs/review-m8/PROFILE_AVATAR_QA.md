# Account avatar QA

POST `/api/avatar/upload` uses one multipart `file`. DELETE `/api/avatar` clears the account avatar after storage acknowledgment. These routes are distinct from member avatars and private Library photos.

Expo provides single-image selection, preview, explicit submit/cancel, loading without percentages, remove confirmation, initials fallback and failure/reload feedback. It reuses M7’s SDK58 File.open(ReadOnly)/readBytes/finally-close validation. Size is at most 5 MiB. Filename, MIME and signature must agree for JPEG, PNG, WebP or GIF. HEIC bytes are rejected. Native transport constructs FormData without a manual Content-Type boundary. Sensitive bytes are held transiently, with expo-image disk caching disabled. UpdatedAt refreshes the stable provider URL across Home and Profile.

Unit tests validate the singular multipart field and native FileHandle byte path. Real Backend HTTP adapter upload/delete and a failed-delete503 with retained DB avatar pass. The test-only named HTTP client blocks external network fallback. This evidence proves adapter behavior.

Android API35 additionally executes the real system picker, explicit preview, SDK58 singular-file multipart upload, confirmation and deletion. Native evidence38–43 and independent avatar-upload-api/password-avatar-api confirm DB state. The provider URL uses a synthetic adapter ID, so remote provider rendering falls back to initials. The selected local preview renders. This establishes native transport and account lifecycle with adapter storage.

GET `/api/avatar/{email}` has no Authorize attribute. An anonymous request can resolve an email to a302 HTTP(S) provider URL, with no-store on the redirect. M8 HTTP verifies that behavior. Product privacy acceptance remains OPEN. Email-based public discovery and provider-hosted visibility require review before release. The route must never be described as private authenticated media. Backend visibility and storage semantics remain unchanged.

Real Google Drive account-avatar lifecycle remains BLOCKED because no dedicated authorized disposable provider was supplied. Member-avatar and Library real-provider gates remain BLOCKED too. Actual Google IDs/checksums/removal, quotas and DB/provider consistency still require M9 verification.
