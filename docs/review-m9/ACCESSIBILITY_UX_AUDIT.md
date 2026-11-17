# Accessibility and UX audit

Automated contrast14/14 PASS; minimum48dp button targets, names and error semantics retained. VI/EN, Light/Dark/System and reduced-motion navigation remain shared. Native compact360dp/font1.3 exercised. Font1.6→1.3 Activity recreation preserves identity but loses route position and returns Home.

Actual release regression: after loading, omission of `busy` did not clear Android's busy accessibility description. AppButton now provides `busy:Boolean(loading)` and stable title label; test:m9 checks both states. Source-prop assertion alone is insufficient: final rebuilt APK replay determines native closure. Old symptom evidence: `504-release-profile.xml`, `530-profile-inspection.xml`. [React Native accessibilityState](https://reactnative.dev/docs/accessibility#accessibilitystate) specifies a boolean busy state.

Keyboard avoidance, scrollable forms, discard/destructive confirmations and truthful loading/empty/error states remain. Harness scrolls beside fields and rejects tiny clipped controls. Filled fields and email/IP screenshots are omitted; XML is redacted. Protected screenshots may be blank by policy.

PARTIAL: TalkBack speech/focus, VoiceOver, external keyboard, exhaustive long names/dates, reduced-motion traversal and supported-device breadth NOT TESTED. App is portrait by configuration; no landscape support claimed. Contrast and hierarchy checks do not establish full accessibility compliance.

Final17-Nov sampled preferences pass: selected Dark/Light states verified, actual VI/EN labels change, font1.6 then1.3 retains the100-member account. Activity recreation returns Home rather than preserving route position. English/Light/font1.3 restored. Evidence `native/final-preferences.json`,1500–1505 XML. Protected screenshots prevent a native pixel-compliance claim; this is selected-state/hierarchy proof, with contrast checked independently.
