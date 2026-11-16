# Private media security

Automated contract verdict PASS. Release verdict PARTIAL PASS pending native/device/provider gates.

`library-media.ts` constructs `/api/library/photos/{safeIntegerId}/image` only. `trustedImageUrl` validates the configured origin: HTTP(S), no credentials/query/hash/subpath. The image reader never uses Photo.url, driveFileId, Google preview or public sharing. Redirect mode `error` prevents credential forwarding to a storage origin. No token is embedded in URLs, UI, analytics, logs or AsyncStorage.

`apiClient.ts` adds an explicit successful-response `blob` mode; failed responses still use the normal ApiError contract. Native Bearer, single-flight refresh, rotated SecureStore tokens, logout/sessionVersion checks surround both requests and binary body reads. Tests verify refresh of private-image401 and rejection of a body that finishes after logout. JSON consumers retain the default behavior; M1–M6 regressions pass.

The media scheduler is per mounted account/screen, coalesces pending reads, limits active downloads to3, and clears queued/inflight work on background, blur and unmount. Stale generations are ignored. PrivatePhoto state is tagged by pool/photo/attempt to avoid displaying a recycled source. Only ephemeral data URIs reach expo-image, with `cachePolicy="none"`, transition0 and a single user retry. No persistent image-byte cache exists. Background removes the gallery/lightbox; account-keyed root and protected navigation unmount previous-account state.

Backend checks ownership before storage/cache access. Real HTTP proves native/Web bytes match, private/no-cache policy, ETag304 and nosniff, foreign404 and anonymous401. Expo intentionally does not retain an HTTP cache/ETag: each new image request revalidates ownership with a fresh200. A conditional client304 is not requested and not parsed as JSON image data.

Remaining gates: device cache forensics, screenshot/task-switcher privacy, actual long-session account switching, redirect rejection on every native platform, GIF animation, physical/iOS and large-image memory. Base64/native Blob copies add transient overhead; three downloads and a small virtualized window bound concurrent work, but physical profiling is still required. No claim that clearing references securely erases device RAM.

Final native scope adds actual owner-session revocation while private images are visible, return to login, and sign-in to a separate empty account. The second account's Library visibly shows0/0 with no old media; separate real-Backend checks return404 for the owner's album/image. Evidence159/165/168 and switched-account-api.json supports covered native isolation; it does not close forensic or long-session gates.
