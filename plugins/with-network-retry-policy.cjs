const { withMainApplication } = require('expo/config-plugins');

function configureMainApplication(source) {
  if (source.includes('// MyLife one-shot POST bodies')) return source;
  // Replace the first QA build's broader connection-retry setting on re-prebuild.
  source = source.replace(/    \/\/ MyLife explicit network retries[\s\S]*?    }\r?\n/, '');
  if (!source.includes('super.onCreate()') || !source.includes('import android.app.Application')) throw Error('Review the MainApplication template before applying MyLife network policy.');
  if (!source.includes('import com.facebook.react.modules.network.OkHttpClientProvider')) {
    source = source.replace('import android.app.Application', 'import com.facebook.react.modules.network.OkHttpClientProvider\nimport android.app.Application');
  }
  return source.replace('super.onCreate()', `super.onCreate()
    // MyLife one-shot POST bodies
    // A lost POST acknowledgement must reach the account mutation coordinator.
    // Preserve safe-read recovery while preventing replay after a POST body is sent.
    OkHttpClientProvider.setOkHttpClientFactory {
      OkHttpClientProvider.createClientBuilder(this)
        .addInterceptor { chain ->
          val request = chain.request()
          val body = request.body
          if (request.method != "POST" || body == null) {
            chain.proceed(request)
          } else {
            val oneShot = object : okhttp3.RequestBody() {
              override fun contentType() = body.contentType()
              override fun contentLength() = body.contentLength()
              override fun isOneShot() = true
              override fun writeTo(sink: okio.BufferedSink) = body.writeTo(sink)
            }
            chain.proceed(request.newBuilder().method(request.method, oneShot).build())
          }
        }
        .build()
    }`);
}

module.exports = config => withMainApplication(config, result => {
  if (result.modResults.language !== 'kt') throw Error('MyLife network policy requires the current Kotlin application template.');
  result.modResults.contents = configureMainApplication(result.modResults.contents);
  return result;
});
module.exports.configureMainApplication = configureMainApplication;
