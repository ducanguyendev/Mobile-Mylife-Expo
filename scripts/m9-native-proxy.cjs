const http = require('node:http'), fs = require('node:fs');
const runtime = JSON.parse(fs.readFileSync('.tmp/m9-runtime.json'));
if (!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database) || new URL(runtime.api).hostname !== '127.0.0.1') throw Error('Disposable M9 runtime required.');
const control = '.tmp/m9-proxy-control.json', output = 'docs/review-m9/test-results/native/proxy-events.json';
fs.mkdirSync('docs/review-m9/test-results/native', { recursive: true }); if (!fs.existsSync(control)) fs.writeFileSync(control, '{}');
const events = []; const record = entry => { events.push(entry); fs.writeFileSync(output, JSON.stringify(events, null, 2)); };
function read() { return JSON.parse(fs.readFileSync(control)); }
function consume() { fs.writeFileSync(control, '{}'); }
http.createServer((request, response) => {
  const flags = read(), pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const match = (!flags.path || flags.path === pathname) && (!flags.method || flags.method === request.method);
  const base = { path: pathname, method: request.method };
  if (flags.offlineNetwork === true) { record({ ...base, fault: 'offline', forwarded: false }); response.destroy(); return; }
  if (match && flags.failBeforeBackend) { consume(); record({ ...base, fault: 'before-backend', forwarded: false }); request.resume(); response.destroy(); return; }
  if (match && flags.failStatus) {
    consume(); record({ ...base, fault: 'injected-status', status: flags.failStatus, forwarded: false }); request.resume();
    response.writeHead(flags.failStatus, { 'Content-Type': 'application/json', ...(flags.failStatus === 429 ? { 'Retry-After': '30' } : {}) }); response.end(JSON.stringify({ message: 'Synthetic QA fault' })); return;
  }
  if (match && flags.cutBody) {
    consume(); request.once('data', chunk => { record({ ...base, fault: 'body-disconnect', receivedBodyBytes: chunk.length, forwarded: false }); request.destroy(); response.destroy(); }); return;
  }
  const upstream = http.request(runtime.api + request.url, { method: request.method, headers: request.headers }, result => {
    const current = read();
    const success = result.statusCode >= 200 && result.statusCode < 300;
    const albumDrop = current.dropAlbumAcknowledgement && request.method === 'POST' && pathname === '/api/library/albums';
    const dropped = success && (albumDrop || match && flags.dropAcknowledgement);
    if (dropped) {
      consume(); result.resume(); result.on('end', () => { record({ ...base, backendStatus: result.statusCode, acknowledgementDropped: true }); response.destroy(); }); return;
    }
    if (match && flags.holdAcknowledgementMs && success) {
      consume(); const chunks = []; result.on('data', chunk => chunks.push(chunk));
      result.on('end', () => {
        record({ ...base, backendStatus: result.statusCode, acknowledgementHeldMs: flags.holdAcknowledgementMs });
        setTimeout(() => { if (!response.destroyed) { response.writeHead(result.statusCode, result.headers); response.end(Buffer.concat(chunks)); } }, flags.holdAcknowledgementMs);
      }); return;
    }
    if (request.method !== 'GET' && !/^\/api\/(login|logout|refresh-token)$/.test(pathname) || match && flags.observeReads) record({ ...base, backendStatus: result.statusCode });
    response.writeHead(result.statusCode, result.headers); result.pipe(response);
  });
  upstream.on('error', () => { if (!response.destroyed) { response.writeHead(502); response.end(); } }); request.pipe(upstream);
}).listen(5091, '127.0.0.1', () => console.log('M9 loopback fault proxy ready. Bodies, headers and credentials are never logged.'));
