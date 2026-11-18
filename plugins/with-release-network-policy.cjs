const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs'), path = require('node:path');
const resource = 'mylife_qa_network_security';
const developmentResource = 'mylife_dev_network_security';
function configureManifest(manifest, qa) {
  const application = manifest.application?.[0];
  if (!application) throw Error('Android application manifest missing.');
  application.$['android:usesCleartextTraffic'] = 'false';
  application.$['android:allowBackup'] = 'false';
  const previous = application.$['android:networkSecurityConfig'];
  if (qa) {
    if (previous && previous !== `@xml/${resource}`) throw Error('Review existing network security configuration before QA build.');
    application.$['android:networkSecurityConfig'] = `@xml/${resource}`;
  } else if (previous === `@xml/${resource}`) delete application.$['android:networkSecurityConfig'];
  return manifest;
}
function qaPolicy() {
  return '<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n  <base-config cleartextTrafficPermitted="false" />\n  <domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">127.0.0.1</domain></domain-config>\n</network-security-config>\n';
}
function developmentPolicy() {
  // Build-type resources keep these exceptions out of release APKs. Do not use
  // debug-overrides: Android only supports trust anchors there, not cleartext.
  return qaPolicy().replace('</domain-config>', '<domain includeSubdomains="false">10.0.2.2</domain></domain-config>');
}
function configureDebugManifest(manifest) {
  const application = manifest.application?.[0];
  if (!application) throw Error('Android debug application manifest missing.');
  const previous = application.$['android:networkSecurityConfig'];
  if (previous && ![`@xml/${resource}`, `@xml/${developmentResource}`].includes(previous)) throw Error('Review existing debug network security configuration.');
  manifest.$ ??= {};
  manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';
  // The XML grants host-specific HTTP access; keep the global flag disabled.
  application.$['android:usesCleartextTraffic'] = 'false';
  application.$['android:networkSecurityConfig'] = `@xml/${developmentResource}`;
  const replacements = new Set((application.$['tools:replace'] ?? '').split(',').map(value => value.trim()).filter(Boolean));
  replacements.add('android:usesCleartextTraffic');
  replacements.add('android:networkSecurityConfig');
  application.$['tools:replace'] = [...replacements].join(',');
  return manifest;
}
async function configureDevelopmentAndroid(androidRoot) {
  for (const variant of ['debug', 'debugOptimized']) {
    const manifestPath = path.join(androidRoot, 'app/src', variant, 'AndroidManifest.xml');
    if (!fs.existsSync(manifestPath)) continue;
    const document = await AndroidConfig.Manifest.readAndroidManifestAsync(manifestPath);
    document.manifest = configureDebugManifest(document.manifest);
    await AndroidConfig.Manifest.writeAndroidManifestAsync(manifestPath, document);
    const policyPath = path.join(androidRoot, 'app/src', variant, `res/xml/${developmentResource}.xml`);
    fs.mkdirSync(path.dirname(policyPath), { recursive: true });
    fs.writeFileSync(policyPath, developmentPolicy());
  }
}
module.exports = config => {
  const qa = process.env.MYLIFE_NATIVE_QA === '1';
  if (qa && !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.EXPO_PUBLIC_API_BASE_URL ?? '')) throw Error('Native QA requires an explicit loopback API origin.');
  config = withAndroidManifest(config, result => {
    result.modResults.manifest = configureManifest(result.modResults.manifest, qa); return result;
  });
  return withDangerousMod(config, ['android', async result => {
    const file = path.join(result.modRequest.platformProjectRoot, `app/src/main/res/xml/${resource}.xml`);
    if (qa) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, qaPolicy()); }
    else if (fs.existsSync(file)) fs.unlinkSync(file);
    await configureDevelopmentAndroid(result.modRequest.platformProjectRoot);
    return result;
  }]);
};
module.exports.configureManifest = configureManifest;
module.exports.qaPolicy = qaPolicy;
module.exports.developmentPolicy = developmentPolicy;
module.exports.configureDebugManifest = configureDebugManifest;
module.exports.configureDevelopmentAndroid = configureDevelopmentAndroid;
