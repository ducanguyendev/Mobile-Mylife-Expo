// Loopback-only fault injection for the dedicated disposable native harness.
const http = require('node:http'), fs = require('node:fs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m3-runtime.json', 'utf8'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable M8 runtime required');
const output = 'docs/review-m8/test-results/native/proxy-events.json';
const events = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : [];
http.createServer((request, response) => {
  const flags = JSON.parse(fs.readFileSync('.tmp/m8-proxy-control.json', 'utf8'));
  if (flags.offlineNetwork === true) { response.destroy(); return; }
  const upstream = http.request(runtime.api + request.url, { method: request.method, headers: request.headers }, result => {
    const control = JSON.parse(fs.readFileSync('.tmp/m8-proxy-control.json', 'utf8'));
    const drop = control.dropAlbumAcknowledgement === true && request.method === 'POST' && request.url === '/api/library/albums' && result.statusCode >= 200 && result.statusCode < 300;
    if (drop) {
      fs.writeFileSync('.tmp/m8-proxy-control.json', '{}'); result.resume();
      result.on('end', () => { events.push({ path: '/api/library/albums', method: 'POST', backendStatus: result.statusCode, acknowledgementDropped: true }); fs.writeFileSync(output, JSON.stringify(events, null, 2)); response.destroy(); });
    } else { response.writeHead(result.statusCode, result.headers); result.pipe(response); }
  });
  upstream.on('error', () => { response.writeHead(502); response.end(); });
  request.pipe(upstream);
}).listen(5090, '127.0.0.1', () => console.log('M8 loopback fault proxy ready on5090. No request bodies or credentials logged.'));
