# VietMap release audit

SDK58/RN0.88.1/VietMap3 remain unchanged. Native VietMap is linked in the release QA APK. Device location permissions are blocked because the application manages manual coordinates. Coordinate lists and unavailable-map fallback remain truthful without authorized tiles/key.

M4 JS39/real HTTP17 PASS: zero coordinates, grouping, manual-location retention through unrelated edits/avatar/relationships, ownership and unavailable-provider states. These establish data/API behavior, not actual tiles. `VietMapSurface.web.tsx` fixes the demonstrated release Router web/server-manifest failure by excluding native codegen from web.

OPEN/HIGH: restricted production key, signing/package binding, quota/billing, real tiles/first interaction on supported devices. M5-07 first lazy Map ReactHost reload remains separate from FocusEvent ANR/Fabric. Capture original initiating event, PID, main-thread/native logs and release impact before closure. No key was invented and no production provider was accessed.

Artifact/device context: [RELEASE_BUILD_VALIDATION.md](RELEASE_BUILD_VALIDATION.md), [DEVICE_TEST_MATRIX.md](DEVICE_TEST_MATRIX.md).
