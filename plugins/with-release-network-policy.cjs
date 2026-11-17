const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs'), path = require('node:path');
const resource = 'mylife_qa_network_security';
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
    return result;
  }]);
};
module.exports.configureManifest = configureManifest;
module.exports.qaPolicy = qaPolicy;
