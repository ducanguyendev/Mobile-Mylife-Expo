# M2 shared design and native UX

Ivory surfaces, sage family cards, muted module colors, existing radii/spacing/typography and native Expo Router tabs/stacks are preserved. Web W10 `src/design-system/tokens/tokens.css` was used as a product reference; CSS dimensions were not copied into native components. No visual package was added.

## Contrast

Measured sRGB relative-luminance evidence: `test-results/contrast.json`; reproduce with `npm run audit:contrast:m2`. All 14 representative semantic pairs pass their chosen thresholds after the change. Thresholds are applied without rounding internally.

| Previously failing role | Before | After | Threshold |
| --- | ---: | ---: | ---: |
| Light tertiary text / surface | 3.223 | 5.202 | 4.5 |
| Light muted on-accent text / family accent | 4.137 | 4.689 | 4.5 |
| Dark muted on-accent text / family accent | 1.689 | 6.635 | 4.5 |
| Light essential control boundary / elevated surface | 1.309 | 3.599 | 3 |
| Dark essential control boundary / elevated surface | 1.281 | 4.357 | 3 |

`border` remains the decorative card/divider token (1.309 light, 1.281 dark against elevated surfaces). New `controlBorder` identifies inputs/search/select/date controls, secondary buttons, unselected chips, selected segmented controls and the auth checkbox. Selected segment boundaries are explicit rather than relying on a subtle white-on-muted fill. Light tertiary and both onAccentMuted values are corrected; the rest of the brand palette stays intact. Badge text uses primary ink on its tinted surface: the old light accent badge text measured about 4.282 on its tint, so simply passing accent/surface would have missed that actual usage.

The numerical checks follow [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [essential non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). These representative calculations are not a claim of complete WCAG conformance.

## Shared changes

- Buttons/compact buttons, segmented options, filter choices and password/search actions have at least 48dp targets. Auth remember-email row is 48dp. Existing icon buttons retain 48dp.
- Segmented labels wrap and scale naturally; forced single-line shrinking is removed. Button height can grow with text. Profile uses a vertical identity block for long names/emails, with selectable email.
- Native resize/font testing exposed clipped intrinsic short titles/button labels. Section headers now use the available width and button labels grow/shrink within the control. Final native captures `24`/`25` verify the correction; intermediate captures are retained for the earlier auth/data/settings observations.
- Inputs preserve labels/focus/error/disabled states, expose helper/error hints and polite validation announcements. Loading exposes busy/progress semantics, errors offer translated retry, skeletons are hidden from accessibility, and toast messages have a polite live region.
- Avatar only attempts HTTPS, falls back to initials after image error and retries when the URI changes. No bearer is attached to external image URLs. Home does not attempt member/private album images.
- Decorative icon glyphs are hidden from accessibility by default. Action rows keep existing layout; unfinished Profile actions are enabled=false with clear coming-soon detail and no chevrons/handlers.
- Offline copy no longer promises an unimplemented disk cache. Home errors are independent, recovery is actionable, and refresh preserves only the same account's current content while loading.
- Root and nested family Stack transitions respect the OS reduced-motion signal. Skeletons are static; no new decorative motion was introduced.

## Native evidence and limits

See `NATIVE_SMOKE_RESULTS.md` and `test-results/native/`. English/light and Vietnamese/dark Home, Profile, member navigation, real empty/loaded/error/retry states and preference/session restoration were inspected on an Android 15 AVD with actual Expo Go SDK 58. A compact 360x640dp viewport at 130% font scale and a larger viewport are emulated on that same AVD, not separate physical-device coverage. Native tabs and scrolling stay reachable; below-fold content must be scrolled.

Expo Go's floating Tools control is a developer overlay visible in some screenshots and can overlap the heading; it is not shipped app chrome. Screenshots are development runtime evidence, not a release-splash or release-build certification. TalkBack speech/focus traversal, VoiceOver, physical devices, maximum OS font scale and exhaustive keyboard/safe-area/transition combinations remain unverified. Registration input focus/keyboard scrolling and Android Back were exercised, but this does not imply every unfinished Family form is audited.
