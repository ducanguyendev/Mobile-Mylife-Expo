# Avatar QA

Verdict: **PARTIAL PASS**. Actual Android + Backend contracts pass; actual Google Drive provider and iOS are NOT TESTED.

Backend constraints: multipart field `file`; JPEG/PNG/WebP/GIF with validated signatures; positive size at most 5 MiB. Upload verifies returned MD5, content type, byte count and stable provider file identity on replacement. The image endpoint returns actual private/no-cache bytes, ETag, 304 and nosniff. Other-user/anonymous checks pass.

Native implementation uses SDK58 `expo-image-picker`, `expo-file-system` File and Expo Image. The default SDK58 expo/fetch does **not** accept legacy RN `{uri,type,name}` multipart parts. The initial Android upload exposed that failure; it was corrected to an actual File/Blob part, with a regression that checks readable byte content and an actual local-file size check when picker size is unavailable. No global fetch switch or auth workaround was introduced. Official contract: [SDK58 FileSystem FormData uploads](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/#uploading-files-using-expofetch).

| Check | Result |
| --- | --- |
| Android system picker / preview / upload | PASS with repository-owned PNGs |
| Private authenticated native image / full viewer / Back | PASS, screenshots 11–12 |
| Replace / new image bytes / stable file identity | PASS, real Backend and native screenshots |
| Provider failure / retained preview / retry | PASS, isolated injected storage failure, screenshots 13–14 |
| Remove / explicit confirmation / initials | PASS, screenshots 15–16, authoritative native data verification |
| Invalid MIME, empty, >5MiB, upload/delete failure, foreign IDs | PASS, real Backend tests |
| File validation / permission error / picker cancel / stale target recovery | PASS at native-bridge adapter level |
| Actual OS permission denial | NOT TESTED: Android35 system picker only grants selected photos; no broad permission prompt was requested |
| Android process-kill pending-result recovery | Adapter regression PASS; native process-kill picker recovery NOT TESTED |
| Google Drive real upload/download/delete/credentials | NOT TESTED; contract adapter only |

Authenticated sources are constructed solely from configured API origin and numeric member ID. Arbitrary legacy avatarUrl values are never used with Bearer. Cache keys include account/member/revision, exclude credentials, and Expo Image uses `cachePolicy="none"` to avoid private disk-cache persistence. No image data or token enters AsyncStorage; only temporary picker target/time/nonce is stored. A serialized conditional cleanup prevents an old picker from deleting a newer account's context.

Failure text does not promise the old provider image survives: a real overwrite/delete may have succeeded before a network failure. Reload/check/retry is explicit. Physical devices, provider-side uncertain-write compensation and image cache forensic inspection remain outside tested coverage.
