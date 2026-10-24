// Exercises the real server/d1-blob.js against a fake Cloudflare D1 REST endpoint backed by SQLite.
// No network, no account. Needs Node 22+ (node:sqlite).
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { create } = require('../server/d1-blob');

const db = new DatabaseSync(':memory:');
let calls = 0, failNext = [];
async function fakeFetch(url, init) {
  calls++;
  assert.match(url, /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/acct\/d1\/database\/dbid\/query$/);
  assert.equal(init.headers.authorization, 'Bearer tok');
  if (failNext.length) { const s = failNext.shift(); return { ok: false, status: s, json: async () => ({ success: false, errors: [{ message: 'x' }] }) }; }
  const { sql, params } = JSON.parse(init.body);
  assert.ok(Buffer.byteLength(sql) < 100000);
  const st = db.prepare(sql);
  if (/^\s*select/i.test(sql)) return { ok: true, status: 200, json: async () => ({ success: true, result: [{ success: true, results: st.all(...params), meta: { changes: 0 } }] }) };
  const r = st.run(...params);
  return { ok: true, status: 200, json: async () => ({ success: true, result: [{ success: true, results: [], meta: { changes: Number(r.changes) } }] }) };
}
const read = async r => { const c = []; for await (const x of r.stream) c.push(Buffer.from(x)); return Buffer.concat(c).toString('utf8'); };

(async () => {
  const s = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: fakeFetch });
  assert.equal(s.configured(), true);
  assert.equal(create({ fetch: fakeFetch }).configured(), process.env.CF_API_TOKEN ? s.configured() : false);
  assert.equal(await s.get('a.json'), null);

  const first = await s.put('a.json', '{"n":1}', { allowOverwrite: false });
  assert.equal(typeof first.etag, 'string');
  await assert.rejects(s.put('a.json', '{"n":2}', { allowOverwrite: false }), /already exists/);
  const r1 = await s.get('a.json');
  assert.equal(r1.statusCode, 200); assert.equal(r1.blob.etag, first.etag); assert.equal(await read(r1), '{"n":1}');

  const second = await s.put('a.json', '{"n":2}', { allowOverwrite: true, ifMatch: first.etag });
  assert.notEqual(second.etag, first.etag);
  await assert.rejects(s.put('a.json', '{"n":3}', { allowOverwrite: true, ifMatch: first.etag }), e => e.name === 'BlobPreconditionFailedError');
  await assert.rejects(s.put('missing.json', 'x', { allowOverwrite: true, ifMatch: 'nope' }), e => e.name === 'BlobPreconditionFailedError');
  assert.equal(await read(await s.get('a.json')), '{"n":2}');
  await s.put('a.json', '{"n":4}', { allowOverwrite: true });
  assert.equal(await read(await s.get('a.json')), '{"n":4}');

  // Compare-and-swap race: only one of many writers holding the same etag wins.
  const base = (await s.get('race.json')) || (await s.put('race.json', '0', {}), await s.get('race.json'));
  const results = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => s.put('race.json', String(i), { allowOverwrite: true, ifMatch: base.blob.etag })));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);

  // Large record: 3.5 MB of text still fits a D1 row after gzip, and unicode round-trips.
  const big = JSON.stringify({ text: 'Naïve résumé ✓ '.repeat(220000) });
  assert.ok(big.length > 3000000);
  await s.put('big.json', big, { allowOverwrite: true });
  assert.equal(await read(await s.get('big.json')), big);
  const row = db.prepare('SELECT length(body) AS n FROM blobs WHERE path = ?').get('big.json');
  assert.ok(row.n < 2000000, 'stored row must stay under the D1 2 MB limit');
  let noise = require('node:crypto').randomBytes(2000000).toString('base64');
  await assert.rejects(s.put('noise.json', noise.repeat(5), { allowOverwrite: true }), /too large/);

  // list and del
  for (const p of ['backup/u1/2026-10-01.json', 'backup/u1/2026-10-02.json', 'backup/u10/2026-10-01.json', 'backup/u2/2026-10-01.json']) await s.put(p, '{}', {});
  const l = await s.list({ prefix: 'backup/u1/' });
  assert.deepEqual(l.blobs.map(b => b.pathname), ['backup/u1/2026-10-01.json', 'backup/u1/2026-10-02.json']);
  await s.del(['backup/u1/2026-10-01.json', 'backup/u1/never-existed.json']);
  assert.equal((await s.list({ prefix: 'backup/u1/' })).blobs.length, 1);
  await s.del([]);
  const weird = "weird'; DROP TABLE blobs;--/%_.json";
  await s.put(weird, 'ok', {});
  assert.equal(await read(await s.get(weird)), 'ok');
  assert.deepEqual((await s.list({ prefix: 'backup/%' })).blobs, []);

  // Retries on 429 / 5xx; surfaces auth errors without retrying.
  failNext = [429, 502];
  assert.equal(await read(await s.get(weird)), 'ok');
  failNext = [403];
  const before = calls;
  await assert.rejects(s.get(weird), e => e.name === 'StorageAuthError');
  assert.equal(calls - before, 1);
  const t = create({ accountId: 'a', databaseId: 'b', fetch: fakeFetch });
  await assert.rejects(t.get('x'), e => e.name === 'StorageNotConfigured');
  console.log('d1 adapter OK: conditional writes, races, large records, list/delete, retries');
})().catch(e => { console.error(e); process.exit(1); });
