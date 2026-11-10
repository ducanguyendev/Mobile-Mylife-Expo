# Expo M1 design-system audit

Scope: source/contract review plus Metro Android export. No Android/iOS simulator or physical-device rendering was performed. The existing mobile design system was preserved; no Web desktop composition, theme replacement or new component framework was introduced.

## What exists

| Area | Current implementation | M1 assessment |
|---|---|---|
| Semantic colors | Separate light/dark palettes; background/surface/elevation/text/border plus family/timeline/anniversary/library/map/status accents. | Same product family as Web W10, with intentionally mobile token values. Do not copy Web CSS pixel-for-pixel. |
| Spacing/radius | 4–48 spacing scale; 15px input, 20px card, 24px large card, 30px hero/sheet radii. | Consistent shared foundation. No M1 changes. |
| Typography | Native Text, 34/30 display/screen headings, 20/17 section/card, 15 body, 12/13 caption/label; `allowFontScaling`. | Clear native hierarchy; large text/line wrapping still needs device inspection. |
| Controls | Shared text/password/search/select/date fields, 50px input shells, validation/helper text, loading/disabled buttons. | Reused rather than reimplemented for M1. Family form uses existing fields/chips. |
| Cards/feedback | Surface/AppCard/InfoCard/ActionRow, skeleton/loading/empty/error/offline components, toast provider. | Family uses real loading/error/empty paths; Home/Memories static screens do not prove API-state coverage. |
| Icons/images | Expo Symbols and Expo Image; initials avatar fallback. | Native module/device behavior and private image headers were not tested. |
| Themes | System/Light/Dark via `useColorScheme` and in-memory context. | No persistence across app restart. Root navigator consumes the current palette. |
| Layout | Safe-area wrappers, keyboard-aware scroll, content width cap 620; responsive helper distinguishes <360, 360–599 and ≥600. | Useful mobile/tablet primitives; not every screen uses the responsive helper. No actual compact/tablet/device coverage claimed. |
| Navigation | Four NativeTabs plus nested family routes and existing root protected groups. | Retained; M1 adds missing USER family guard. No desktop sidebar introduced. |

## Confirmed contrast risks (unchanged in M1)

The source palette audit measures 14 foreground/background pairs using 4.5 for normal text and 3 for a required control boundary. Nine pairs meet the chosen threshold; five are below it. These are token measurements, not a complete rendered accessibility certification. [Machine-readable measurements](test-results/contrast-audit.json).

| Theme | Pair | Ratio | Risk |
|---|---|---:|---|
| Light | textTertiary / surface | 3.223 | Small tertiary labels/placeholders need a stronger text token. |
| Light | onAccentMuted / accentFamily | 4.137 | Hero subtitle/caption text falls below the text threshold. |
| Dark | onAccentMuted / accentFamily | 1.689 | Pale subtitle on pale accent hero has poor separation. |
| Light | border / surfaceElevated | 1.309 | Risk where this border is the sole required control boundary. |
| Dark | border / surfaceElevated | 1.281 | Same control-boundary risk. |

Schedule targeted semantic-token corrections and rendered verification in M2. M1 does not silently replace the accepted palette or change all decorative borders. Decorative dividers and required interactive boundaries should not be conflated.

## Accessibility and localization gaps

- Primary buttons/icon buttons are 48px; compact buttons are 40px. Password/search trailing controls are smaller but have hitSlop. Verify actual targets, spacing and focus/screen-reader behavior on device rather than inferring universal compliance from the token name.
- Shared fields expose accessibility labels; not every helper/error is linked/announced. Some cards/settings rows look actionable but have no handler. Test VoiceOver/TalkBack, error announcements, disabled/busy semantics, modal focus and Back behavior in subsequent packages.
- `AppText` permits font scaling. Test long names/email, 200% text, small screens, landscape/tablets where supported, keyboard insets and bottom safe area outside the tabs. Portrait is configured currently.
- Auth strings have VI/EN variants selected from device locale. Most tabs, family, profile, validation and feedback are hardcoded Vietnamese. The language settings row is inert; there is no app-wide locale preference.
- Theme preference lasts only for the running app session. Reduced-motion behavior has not been validated throughout the app. Native transitions should remain native and respect platform settings.
- Home contains an unqualified fabricated name/date/count. Memories labels its content illustrative. M2 must make Home similarly honest until API-backed content exists.
- Family relation Alert is capped to eight candidates and conflicts with Android's three-button Alert limit. Its searchable native replacement is specified in [API audit](API_CONTRACT_AUDIT.md), for M3.

## Verification boundary

Android JS/Hermes export succeeds, which verifies bundling/module compatibility for the current source. It is not an APK build, installation, screenshot test, navigation test on device, or proof of SecureStore encryption. Expo SDK 58 documentation and installed Router types were consulted before changing routing/focus behavior: [SDK reference](https://docs.expo.dev/versions/v58.0.0/), [protected routes](https://docs.expo.dev/router/advanced/protected/), [Router hooks](https://docs.expo.dev/versions/v58.0.0/sdk/router/).
