import { Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { createScreenPrivacy } from './screen-privacy';

const privacy = createScreenPrivacy({
  prevent: key => ScreenCapture.preventScreenCaptureAsync(key),
  allow: key => ScreenCapture.allowScreenCaptureAsync(key),
  ...(Platform.OS === 'ios' ? {
    enableOverlay: () => ScreenCapture.enableAppSwitcherProtectionAsync(1),
    disableOverlay: () => ScreenCapture.disableAppSwitcherProtectionAsync(),
  } : {}),
});

// Browsers cannot promise OS capture protection. Native privacy is verified on
// its own platform matrix; Expo web is not a substitute for the existing Web app.
export const preparePrivateScreen = () => Platform.OS === 'web' ? Promise.resolve() : privacy.protect();
export const releasePrivateScreen = () => Platform.OS === 'web' ? Promise.resolve() : privacy.release();
