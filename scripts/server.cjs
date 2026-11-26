'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const PUBLIC = path.resolve(__dirname, '../public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8', '.sfz': 'text/plain; charset=utf-8', '.wav': 'audio/wav', '.flac': 'audio/flac', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };

function createAppServer({ root = PUBLIC } = {}) {
  root = path.resolve(root);
  return http.createServer(async (req, res) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'midi=(self)' };
    const reply = (code, text) => { res.writeHead(code, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : text); };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); reply(405, 'Method not allowed'); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { reply(400, 'Invalid URL'); return; }
    if (pathname === '/' || pathname === '/buku-drum-interaktif.html') pathname = '/index.html';
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root + path.sep) || pathname.includes('\0') || pathname.includes('\\')) { reply(404, 'Not found'); return; }
    try {
      const real = await fs.realpath(target);
      if (!real.startsWith(root + path.sep)) { reply(404, 'Not found'); return; }
      const data = await fs.readFile(real);
      res.writeHead(200, { ...headers, 'Content-Type': MIME[path.extname(real)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) { reply(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 500, 'File unavailable'); }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || process.argv[2] || 8765);
  if (!Number.isInteger(port) || port < 1 || port > 65535) { console.error('PORT harus berupa angka 1–65535.'); process.exitCode = 1; }
  else {
    const server = createAppServer();
    server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} sedang dipakai. Ubah PORT atau tutup server sebelumnya.` : error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Drum Companion: http://127.0.0.1:${port} (Ctrl+C untuk berhenti)`));
  }
}
module.exports = { createAppServer };
