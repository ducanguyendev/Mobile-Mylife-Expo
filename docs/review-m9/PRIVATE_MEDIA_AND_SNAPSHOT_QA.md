# Private media and snapshot QA

Native environment: MyLife_M9/API35 x86_64,720×1280,density320,font1.3,WHPX/SwiftShader. Repository context: [FULL_FEATURE_MATRIX.md](FULL_FEATURE_MATRIX.md).

M8's exposed private Recent Apps image is mitigated on the covered M9 Android build. SDK58 `expo-screen-capture58.0.6`, native startup `FLAG_SECURE` and serialized preparation protect authenticated identity before publication. Account/family/Admin content stays protected for the authenticated session. Public sign-in becomes capturable after logout. Profile discloses the screenshot/recording restriction.

Actual16-Nov APK `f61c3ad1…` evidence: private photo present in hierarchy; Activity and lightbox both SECURE; real Recent Apps card blank. See `test-results/native/photo-snapshot-proof.json`, `privacy-window.txt`, `113-private-lightbox.xml`, `recent-app-private-photo.png`. This is OS evidence, not an inference from JS clearing.

Background/foreground and unsecured emulator power cycle return to gallery. This does not prove credential-protected physical unlock. Font1.6→1.3 recreates Activity, preserves identity and returns Home, losing route position. Native protection reasserts on resume. M9 tests cover delayed old logout, failed preparation, startup release and iOS overlay sequencing.

iOS `enableAppSwitcherProtectionAsync(1)` is implemented but NOT EXECUTED. Browsers cannot promise OS screenshot protection. Physical Android, iOS, protected unlock, screen-reader traversal and forensic cache coverage remain NOT TESTED/HIGH. New17-Nov artifact replays are recorded separately; old captures must not be relabeled as new-build proof.

[Official SDK58 screen capture APIs](https://docs.expo.dev/versions/v58.0.0/sdk/screen-capture/) were reviewed. Documentation supports API selection, not this app's test outcome.

Final17-Nov APK `eda69836…` repeats the protection successfully:1536×2048 synthetic photo ImageView is present; both Activity/lightbox windows have SECURE; the actual Recent Apps screenshot was visually inspected and shows a black card. Resume returns to the120-photo gallery. Evidence: `native/final-photo-snapshot-proof.json`, `final-window-flags.txt`, `final-recent-apps.png`,1400–1402 XML. This supersedes the final-artifact coverage gap, while physical/iOS/forensic gates remain open.
