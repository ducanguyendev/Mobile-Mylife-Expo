# Family graph QA

Verdict: **PARTIAL PASS**: structure, layout algorithms and tested native controls pass; physical two-finger gesture/performance coverage remains incomplete.

Graph groups recorded generation values, compacting gaps without rewriting labels. Reciprocal same-generation spouses are placed together. Parent positions guide child ordering. Directed edges come only from fatherId/motherId, spouse edges are undirected and deduplicated, and horizontal edges retain their recorded type with a separate dashed style. There is no guessed shared-null-parent sibling clique and no inferred biological parentage. Backend supports one spouse link, not a marriage history; UI respects that model.

Missing/self references are omitted with warnings. Inconsistent generation/spouse data and parent cycles warn while staying renderable; cycle detection is iterative. Long names are limited visually on graph nodes with full accessibility labels and complete profile/list alternatives. Directory/picker lists virtualize; graph culls offscreen native nodes and requests images only at readable zoom. All recorded edges remain SVG paths, so dense families can still have overlapping curves.

Automated: actual parent/spouse/horizontal graph from real API records; reciprocal dedup; malformed cycle/missing references; generation gaps; 500-member layout at 130% text; culling; fit; fixed-anchor zoom; pan/pinch controller and finger-count transitions. The 500-node test completes below a generous 2-second guard on this host; this is a JS algorithm smoke check, **not** a device FPS/latency benchmark.

Android: 112 members / 3 generations, native pan, zoom buttons, reset, fit and profile tap; light/EN and dark/VI screenshots. Compact 360dp/130% text testing found the initial help/toolbar consumed the viewport. The final design uses horizontally scrollable controls, compact help access and a flexible graph stage. Generation labels stay anchored to the visible left edge when panning. Large viewport coverage and final captures are listed in native results.

Unverified: injected two-finger touch on an actual device, physical-device frame timing, thousands of nodes, comprehensive genealogy-layout quality, TalkBack graph navigation and iOS. Lists/cards remain the full screen-reader alternative. No animation or WebView dependency. SVG `15.16.0` was installed with SDK58 Expo resolution.
