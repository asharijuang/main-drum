const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createAppServer } = require('../scripts/server.cjs');

test('server serves the app, supports HEAD and rejects private files and writes', async t => {
  const server = createAppServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const home = await fetch(base); assert.equal(home.status, 200); assert.match(await home.text(), /assets\/rhythm-core\.js/);
  assert.equal(home.headers.get('permissions-policy'), 'midi=(self)');
  for (const file of ['app.js', 'styles.css', 'rhythm-core.js']) assert.equal((await fetch(`${base}/assets/${file}`)).status, 200);
  const head = await fetch(base, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.equal((await fetch(base + '/buku-drum-interaktif.html')).status, 200);
  assert.equal((await fetch(base + '/package.json')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e%2fpackage.json')).status, 404);
  assert.equal((await fetch(base + '/%ZZ')).status, 400);
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});
