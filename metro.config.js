const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// VIETMAP 3's published ESM specs have lost the NativeProps types needed by
// RN 0.88's Babel codegen. Its shipped TS sources match the native codegen input.
// Scope this compatibility mapping to VIETMAP; keep Expo's resolver for others.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@vietmap/vietmap-gl-react-native') {
    return {
      type: 'sourceFile',
      filePath: path.join(path.dirname(require.resolve('@vietmap/vietmap-gl-react-native/package.json')), 'src/index.ts'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
