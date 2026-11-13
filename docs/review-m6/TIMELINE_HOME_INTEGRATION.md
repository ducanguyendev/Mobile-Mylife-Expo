# Timeline, Home and Profile integration

Memories now enables Calendar while preserving the M5 Timeline. Calendar links back to Timeline within Memories. Protected Family anniversary routes accept memberId or anniversaryId for contextual navigation. Profile exposes member anniversaries, details link to the member profile, and derived Timeline anniversary details link to the original anniversary management route. Map keeps the M5 same-stack Timeline route.

Calendar and upcoming cards use the authoritative nextSolarDate and daysUntil. Timeline continues to receive historical originalSolarDate through Backend derivation. Source type/ID and negative derived identity remain unchanged. Source management is reached through a separate Anniversary action. Timeline CRUD continues to reject derived writes.

After Save/Delete, the anniversary query reloads authoritative collection/member data. On return, existing Home, Profile and Timeline focus hooks reload their respective endpoints. Home now offers Calendar navigation and its prior future-management notice reflects M6 availability. Member/profile/Home contracts remain the existing Backend contracts.

Real integration verifies Expo create, Web cookie read/update, Expo refetch/delete, Home collection, related profile and Timeline source rows. Source deletion removes its corresponding historical row and upcoming/profile references while preserving another anniversary and member data. Native parity helper checks these same endpoints after actual UI mutations.

The list contains one provided next occurrence per anniversary. Month browsing and selected-day panels display those available dates. A visible coverage message explains why later months can be empty. Calendar filtering and client presentation never synthesize additional recurrence rows.
