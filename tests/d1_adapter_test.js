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
  const many = await s.getMany(['backup/u1/2026-10-02.json', 'missing.json', 'backup/u1/2026-10-01.json']);
  assert.equal(many.size, 2);
  assert.equal(many.get('backup/u1/2026-10-02.json').body.toString('utf8'), '{}');
  assert.equal(many.get('missing.json'), undefined);
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

  // Lost write acknowledgements are not CAS conflicts. Confirm this exact
  // operation by its new random ETag and compressed bytes, without replaying it.
  for (const mode of ['create', 'cas', 'overwrite']) for (const failure of ['network', 'body', 'http500', 'invalidResult', 'missingSuccess', 'invalidSuccess']) {
    const path = 'lost-' + mode + '-' + failure + '.json';
    const prior = mode === 'create' ? null : await s.put(path, 'old', {});
    let writes = 0;
    const lost = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => {
      const statement = JSON.parse(init.body).sql, response = await fakeFetch(url, init);
      if (/^(INSERT|UPDATE)/.test(statement)) {
        writes++;
        if (failure === 'network') throw new Error('PRIVATE lost connection');
        if (failure === 'body') return { ok: true, status: 200, json: async () => { throw new Error('PRIVATE unreadable acknowledgement'); } };
        if (failure === 'http500') return { ok: false, status: 500, json: async () => ({ success: false }) };
        if (failure === 'missingSuccess') return { ok: true, status: 200, json: async () => ({}) };
        if (failure === 'invalidSuccess') return { ok: true, status: 200, json: async () => ({ success: 'unknown' }) };
        return { ok: true, status: 200, json: async () => ({ success: true, result: [] }) };
      }
      return response;
    } });
    const options = mode === 'cas' ? { ifMatch: prior.etag, allowOverwrite: true } : { allowOverwrite: mode === 'overwrite' };
    const completed = await lost.put(path, 'new', options);
    assert.equal(writes, 1, 'never replay a possibly committed mutation');
    const saved = await s.get(path); assert.equal(saved.blob.etag, completed.etag); assert.equal(await read(saved), 'new');
  }

  // A different writer, different bytes, or unavailable confirmation cannot
  // turn an uncertain operation into success or authorise a second mutation.
  for (const mode of ['concurrent', 'changedBytes', 'readbackFailure']) {
    const path = 'unconfirmed-' + mode + '.json'; const old = await s.put(path, 'old', {});
    let writes = 0, confirmationReads = 0;
    const uncertain = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => {
      const { sql: statement } = JSON.parse(init.body);
      if (/^SELECT/.test(statement) && writes) {
        confirmationReads++;
        if (mode === 'readbackFailure') throw new Error('PRIVATE readback unavailable');
      }
      const response = await fakeFetch(url, init);
      if (/^UPDATE/.test(statement)) {
        writes++;
        if (mode !== 'readbackFailure') {
          const otherBody = require('node:zlib').gzipSync(Buffer.from('newer writer')).toString('base64');
          db.prepare(mode === 'concurrent' ? 'UPDATE blobs SET body = ?, etag = \'concurrent-version\' WHERE path = ?' : 'UPDATE blobs SET body = ? WHERE path = ?').run(otherBody, path);
        }
        throw new Error('PRIVATE acknowledgement lost');
      }
      return response;
    } });
    await assert.rejects(uncertain.put(path, 'our write', { ifMatch: old.etag, allowOverwrite: true }), error => error.uncertainMutation === true && error.name !== 'BlobPreconditionFailedError' && !error.message.includes('PRIVATE'));
    assert.equal(writes, 1); assert.equal(confirmationReads, mode === 'readbackFailure' ? 3 : 1);
    assert.equal(await read(await s.get(path)), mode === 'readbackFailure' ? 'our write' : 'newer writer');
  }

  // A query-level failure must not look like a missing record or zero-row CAS.
  let malformed = false;
  const invalid = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => malformed ?
    { ok: true, status: 200, json: async () => ({ success: true, result: [{ success: false, results: [], meta: { changes: 0 } }] }) } : fakeFetch(url, init) });
  await invalid.get('a.json'); malformed = true;
  await assert.rejects(invalid.get('a.json'), /Storage request failed/);
  for (const failure of [{ success: false }, { success: true, result: [{ success: false, results: [], meta: { changes: 0 } }] }]) {
    let failureReads = 0, failureWrites = 0;
    const rejected = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => {
      const statement = JSON.parse(init.body).sql;
      if (/^(INSERT|UPDATE)/.test(statement)) { failureWrites++; return { ok: true, status: 200, json: async () => failure }; }
      if (/^SELECT/.test(statement)) failureReads++;
      return fakeFetch(url, init);
    } });
    await assert.rejects(rejected.put('explicit-query-failure', 'new', {}), error => error.name === 'StorageError' && !error.uncertainMutation);
    assert.equal(failureWrites, 1); assert.equal(failureReads, 0, 'explicit failure must not be reinterpreted as a lost acknowledgement');
  }

  // Every surface propagates abortSignal. Retry delays and late init completions
  // may not send further queries after the caller's deadline has expired.
  const cancelled = new AbortController(); cancelled.abort();
  let cancelledFetches = 0;
  const cancelledStore = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async () => { cancelledFetches++; throw Error('must not fetch'); } });
  for (const call of [() => cancelledStore.get('x', { abortSignal: cancelled.signal }), () => cancelledStore.put('x', 'v', { abortSignal: cancelled.signal }),
    () => cancelledStore.list({ prefix: 'x', abortSignal: cancelled.signal }), () => cancelledStore.del(['x'], { abortSignal: cancelled.signal })]) await assert.rejects(call(), error => error.name === 'AbortError');
  assert.equal(cancelledFetches, 0);
  const retryAbort = new AbortController(); let retriedReads = 0;
  const retrying = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => {
    assert.equal(init.signal, retryAbort.signal);
    if (/^SELECT/.test(JSON.parse(init.body).sql)) {
      retriedReads++; setTimeout(() => retryAbort.abort(), 5);
      return { ok: false, status: 429, json: async () => ({ success: false }) };
    }
    return fakeFetch(url, init);
  } });
  await assert.rejects(retrying.list({ prefix: 'backup/', abortSignal: retryAbort.signal }), error => error.name === 'AbortError');
  await new Promise(resolve => setTimeout(resolve, 160)); assert.equal(retriedReads, 1);
  const deleteAbort = new AbortController(); let deletes = 0;
  const deleting = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => {
    assert.equal(init.signal, deleteAbort.signal);
    const response = await fakeFetch(url, init);
    if (/^DELETE/.test(JSON.parse(init.body).sql)) { deletes++; deleteAbort.abort(); }
    return response;
  } });
  await assert.rejects(deleting.del(Array.from({ length: 100 }, (_, i) => 'cancelled-delete-' + i), { abortSignal: deleteAbort.signal }), error => error.name === 'AbortError');
  assert.equal(deletes, 1, 'abort must prevent the next deletion batch');
  const lateAbort = new AbortController(); let releaseInit, lateCalls = 0;
  const initGate = new Promise(resolve => { releaseInit = resolve; });
  const late = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => { lateCalls++; await initGate; return fakeFetch(url, init); } });
  const latePut = late.put('late-mutation.json', 'must not write', { abortSignal: lateAbort.signal });
  lateAbort.abort(); releaseInit(); await assert.rejects(latePut, error => error.name === 'AbortError');
  assert.equal(lateCalls, 1); assert.equal(await s.get('late-mutation.json'), null);

  // The actual marking store can recover lost lease/quota/result acknowledgements
  // through D1 without stranding its lease or charging its allowance twice.
  const { createStore } = require('../server/marking-store'), hash = value => require('node:crypto').createHash('sha256').update(value).digest('hex');
  let markingWrites = 0;
  const markingD1 = create({ accountId: 'acct', databaseId: 'dbid', apiToken: 'tok', fetch: async (url, init) => {
    const response = await fakeFetch(url, init);
    if (/^(INSERT|UPDATE)/.test(JSON.parse(init.body).sql)) { markingWrites++; throw new Error('Synthetic lost write acknowledgement'); }
    return response;
  } });
  const marking = createStore({ blob: async () => markingD1, now: () => Date.UTC(2026, 9, 25) });
  const owner = hash('synthetic-owner'), inputDigest = hash('synthetic-input');
  const reservation = await marking.getOrReserve(owner, inputDigest); assert.equal(reservation.state, 'reserved');
  const decision = { status: 'marked', mark: 5, summary: 'Synthetic decision.' };
  await marking.finish(owner, inputDigest, reservation.leaseId, decision);
  assert.deepEqual(await marking.getCached(owner, inputDigest), decision);
  assert.deepEqual(await marking.getOrReserve(owner, inputDigest), { state: 'cached', result: decision });
  const ledger = JSON.parse(await read(await s.get('marking/v1/quota/2026-10-25.json')));
  assert.equal(ledger.total, 1); assert.equal(ledger.users[hash(owner)], 1); assert.equal(markingWrites, 4);
  console.log('d1 adapter OK: CAS/races, lost-acknowledgement reconciliation, uncertain/concurrent writes, bounded cancellation, marking quota/cache, records and list/delete');
})().catch(e => { console.error(e); process.exit(1); });
