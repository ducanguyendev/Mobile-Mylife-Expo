const { withMainActivity } = require('expo/config-plugins');
function configureMainActivity(source) {
  if (source.includes('// MyLife secure startup window')) return source;
  if (!source.includes('super.onCreate(null)')) throw Error('Review the MainActivity template before applying startup privacy.');
  return source.replace('super.onCreate(null)', `// MyLife secure startup window
    // Protect restored content and activity recreation before JavaScript runs.
    // Public sign-in releases this flag after authentication bootstrap completes.
    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
    super.onCreate(null)`);
}
module.exports = config => withMainActivity(config, result => {
  if (result.modResults.language !== 'kt') throw Error('Startup privacy requires the current Kotlin activity template.');
  result.modResults.contents = configureMainActivity(result.modResults.contents);
  return result;
});
module.exports.configureMainActivity = configureMainActivity;
