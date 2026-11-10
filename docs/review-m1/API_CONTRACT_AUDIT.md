# M1 API and data integrity audit

Backend reference: W10 `c1b43b1f83e17f9546edc9bb314b8345b8d947ad`. No Backend source or relationship semantics were modified in M1.

## Native authentication

Actual `apiClient.ts` sends `X-Client-Platform: mobile`, Bearer access tokens for authenticated requests, and `credentials: omit` on native platforms. The real HTTP checks assert no Cookie header and no Set-Cookie response. Web-preview behavior is a separate branch and is not the native authentication model.

| Endpoint | Contract / result |
|---|---|
| `POST /api/auth/register` | Full name, phone, gender, date-only DOB, Gmail/password/confirmation; synthetic registration passes. |
| `POST /api/login` | Native token pair + expiry metadata + authoritative user role. Pair serialized in one SecureStore value. |
| `GET /api/me` | Authoritative identity and current role/account availability; restoration passes using a new runtime with persisted serialized pair. |
| `POST /api/refresh-token` | Native access/refresh body; real rotation persists the pair. Six concurrent expired-access requests share one POST. Old access `sid` is rejected by W10. |
| `POST /api/logout` | Native refresh body, no cookie requirement. Copied access/refresh are rejected immediately after logout. A rotated session arriving during logout is also revoked. |

SecureStore uses the SDK 58 read/write/delete API; no fallback to insecure token storage was added. Remembered email remains in AsyncStorage and passwords are not persisted. The test adapter verifies serialization and control flow, **not** physical Keychain/Keystore encryption or persistence. See [SDK 58 SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/).

M1 preserves the existing auth architecture. It adds an in-flight refresh/logout boundary and session version to prevent old operations from restoring/clearing a newer session. Failed retries invalidate unusable sessions; logout still attempts server revocation when local storage clearing fails and reports failure to the existing warning UI.

## Family request/response comparison

| Area | Backend semantics | Expo M1 finding/action |
|---|---|---|
| Member list/detail | `success/data` envelope; caller-owned family only. | Existing services match; actual source/HTTP tested. Foreign IDs reject. |
| Member creation | Required name ≤100, positive generation; nullable scalar fields and relationship inputs. | Converter trims name, converts IDs/dates and keeps supported scalar fields. Backend remains authoritative. |
| Generations | Read-only `id`, `name`, nullable `title`, `description`. | Type matches DTO; existing form uses generation metadata but enters a number. No generation editor added. |
| Full member update | Scalar fields are replacement values, not PATCH. Father/mother/spouse null may clear them. | Shared `memberToFormValues` preserves every supported editable field/ID. Form initializes from it once and is keyed by member ID. |
| Children | A non-null collection synchronizes children; an empty collection clears links. | Form supports children, initializes existing IDs and sends their complete edited collection. Roundtrip regression covers IDs. |
| Spouse/parents | Reciprocal spouse synchronization and validated same-tree references. | Existing values are preserved on unrelated edits; no Backend rule weakened. Picker UX remains a documented M3 gap. |
| Horizontal relations | `null`/omitted leaves them unchanged; `[]` clears them. | **Critical fix:** `toFamilyInput` omits the field because M1 has no editor. Input type now permits omission/null. Real DB reproduction showed original loss in both directions; final phone edit preserves both directions. |
| Life status/date fields | `LIVING`/`DECEASED`, date-only `YYYY-MM-DD`; deceased requires a valid nonfuture date, not before birth. | Validation remains in place and tested. Living payload clears deathDate as intended. No timezone conversion of date-only values. |
| Gender | DTO is nullable string with length cap; Backend relationship code recognizes historical English/Vietnamese aliases. | Existing form chips use English aliases, while Web can return Vietnamese values. Unchanged values roundtrip without erasure, but selected-chip normalization remains a M3 UX item. |
| Location metadata | Latitude/longitude/display/source/status are read-only in member DTO; location writes use dedicated endpoint/address rules. | Missing response fields added to Expo type. Converter does not invent coordinate writes or clear read-only location fields. |
| Avatar metadata | `avatarUrl`, `hasManagedAvatar`, timestamps; managed media use dedicated endpoints. | Missing managed flag/timestamps added to response type; not sent as scalar updates. Actual upload/private-image handling remains unimplemented/unverified. |
| Profile aggregate | `/api/family-tree/{id}/profile` includes member/relatives/timeline/anniversaries. | Expo detail currently calls member GET, not the aggregate. No aggregate service/type falsely claimed; implement in M3 when consumed. |
| Delete | Backend member DELETE returns a success message object. | Existing service discards the response with a void consumer; no data loss or envelope assumption. Live create/update/refetch and ownership were tested; native deletion UI still needs device QA. |

## Reproduction of horizontal relation loss

The baseline runner loads the original converter/client/provider from pinned commit `7fa3124` in memory; it does not reset or overwrite the worktree. It creates two synthetic members in its own disposable PostgreSQL database, establishes an explicit sibling relation, then sends the original Expo phone-edit payload. Refetch confirms the relation is gone in both directions. Final source omits the unsupported field; refetch confirms the phone changed while both relation directions survive.

Payload-level checks also verify preservation of existing father/mother/spouse/children, biography, social URLs, dates and role. Backend validation and synchronization code are untouched.

## M3 searchable picker contract

Current `MemberForm.choose` takes `candidates.slice(0, 8)` and creates an Alert with clear/candidate/close buttons. This excludes later candidates; moreover Android Alert supports at most three buttons, so this is not a suitable cross-platform selector. This was documented rather than redesigned in M1. [React Native Alert](https://reactnative.dev/docs/alert).

Use a native sheet/full-screen selector with the existing design tokens, explicit label, search field and virtualized rows. Search the complete loaded candidate set (accent-insensitive name, generation/role where available), keep the selected member visible even outside current results, and expose clear/cancel/confirm separately. Respect same-tree/self/spouse/parent rules but keep Backend validation authoritative. Show loading/empty/error/retry; preserve selection on cancel or request failure. Test >8 and >100 candidates, long names, screen-reader labels, keyboard dismissal and Android/iOS behavior. Do not fetch or render a Web desktop form inside the picker.
