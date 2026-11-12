# M5 initial audit — 12 November 2026

Expo branch feature_minhduc, clean starting tree, HEAD b18acdb98d6184d91ed5d1d88f003d96d5b10479. Web clean144fc506c0ec7957d40a137351aeda296b8937b5. Backend branch feature_minhduc HEAD c1b43b1f83e17f9546edc9bb314b8345b8d947ad, preexisting uncommitted M4 location DTO and untracked12-case test; preserve both. Flutter is read-only. No commit/push/PR/deploy authorized.

Read required M4 reports/handoff/risks/integrity/native/tests, Expo AGENTS, Timeline DTO/service/controller/interface, Web page/modal/filter/grouping/presentation/service, Expo Memories, query/auth/profile/picker/design foundations. Baseline commands and initial test-environment failures are retained under test-results. Source implementation begins only after the parity matrix was written.

Important contract findings: derived birth ID=-memberId*2, death=-memberId*2-1, anniversary=-anniversaryId. Different sources can collide numerically; key by source+sourceId+type+id. DTO has nullable dates/year/member/source/coordinates and boolean derived/approximate. GET member Timeline includes primary OR related member. Create/update responses may have memberName=null because navigation is not loaded; use the once-fetched member directory for display and reconcile from GET. No event GET-by-ID endpoint exists. Backend stores custom event source metadata and no universal version token.

Read current Expo58 reference, llms index, Router documentation before new native API work. Keep VIETMAP3, dev-client and scoped Metro resolver unchanged; no native dependency needed for explicit date/year text input or virtualized Timeline.

Verified GitHub M4 push CI success: https://github.com/ducanguyendev/Mobile-Mylife-Expo/actions/runs/43173508106, exact starting SHA, quality job131032150900 with npm ci/lint/typecheck/M1–M4/contrast success. PR-only workflow lookup returned none; push collection and job steps independently verified success. M5 CI is not run until a future authorized push.
