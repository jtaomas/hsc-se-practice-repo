'use strict';
// In-memory transport regression only: no real Blob store, account or model calls.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Readable } = require('node:stream');
const { createStore } = require('../server/marking-store');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const user = hash('synthetic-three-question-user');
const digest = index => hash('synthetic-three-question-answer-' + index);
const day = Date.UTC(2026, 9, 24, 12);
const outcome = () => ({ status: 'marked', mark: 2, summary: 'Recorded synthetic result.', strengths: [], improve: [], advice: [], criteria: [], audit: {} });
const validatorError = () => new Error('Vercel Blob: Precondition failed: ETag mismatch.');

function transport(options = {}) {
  const records = new Map(), reads = [], writes = [];
  let version = 0;
  function seed(path, value) {
    const record = { text: JSON.stringify(value), etag: '"opaque-' + (++version) + '-+/="' };
    records.set(path, record); return record;
  }
  const api = {
    async get(path, settings = {}) {
      const identity = new Headers(settings.headers || {}).get('accept-encoding') === 'identity';
      reads.push({ path, identity });
      const record = records.get(path);
      if (!record) return null;
      // Models a representation whose transport encoding changes the validator.
      // The write endpoint accepts only the exact stored strong opaque ETag.
      return { statusCode: 200, stream: Readable.from([record.text]), blob: { etag: options.ignoreIdentity || !identity ? 'W/' + record.etag : record.etag } };
    },
    async put(path, text, settings = {}) {
      if (options.beforePut) await options.beforePut({ path, text, settings, records, seed });
      const old = records.get(path);
      const attempt = { path, settings: { ...settings }, text, previousEtag: old && old.etag, accepted: false };
      writes.push(attempt);
      if (old && (!settings.allowOverwrite || settings.ifMatch !== old.etag)) throw validatorError();
      if (!old && settings.ifMatch) throw validatorError();
      seed(path, JSON.parse(text)); attempt.accepted = true;
      return { pathname: path, etag: records.get(path).etag };
    }
  };
  return { api, records, reads, writes, seed };
}
function make(blob, overrides = {}) { return createStore({ blob: async () => blob.api, now: () => day, ...overrides }); }
function ledgers(blob) { return [...blob.records].filter(([path]) => path.includes('/quota/')).map(([, record]) => JSON.parse(record.text)); }
function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
async function warnings(run) {
  const original = console.warn, captured = [];
  console.warn = (...args) => captured.push(args);
  try { await run(); return captured; } finally { console.warn = original; }
}
function safeLog(entries, expected) {
  assert.equal(entries.length, 1);
  assert.equal(entries[0][0], 'marking_storage');
  assert.deepEqual(Object.keys(entries[0][1]).sort(), Object.keys(expected).sort());
  for (const [key, value] of Object.entries(expected)) if (value !== undefined) assert.equal(entries[0][1][key], value);
  assert(!JSON.stringify(entries).includes('PRIVATE'), 'raw transport diagnostics must not escape');
  assert(!JSON.stringify(entries).includes(user));
  assert(!JSON.stringify(entries).includes('/jobs/'));
  assert(!JSON.stringify(entries).includes('/quota/'));
}

(async () => {
  const blob = transport(), a = make(blob), b = make(blob);
  const reservations = await Promise.allSettled([a.getOrReserve(user, digest(1)), b.getOrReserve(user, digest(2)), a.getOrReserve(user, digest(3))]);
  assert.equal(reservations.filter(r => r.status === 'rejected').length, 0, 'all three distinct answers must reserve instead of exhausting CAS retries');
  assert(reservations.every(r => r.value.state === 'reserved'));
  assert.equal(ledgers(blob).length, 1); assert.equal(ledgers(blob)[0].total, 3);
  assert.equal(Object.values(ledgers(blob)[0].users).reduce((sum, n) => sum + n, 0), 3);
  await Promise.all(reservations.map((r, i) => (i % 2 ? a : b).finish(user, digest(i + 1), r.value.leaseId, outcome())));
  for (let i = 1; i <= 3; i++) {
    assert.deepEqual(await a.getCached(user, digest(i)), outcome());
    assert.deepEqual(await b.getOrReserve(user, digest(i)), { state: 'cached', result: outcome() });
  }
  assert.equal(ledgers(blob)[0].total, 3, 'cached retry must not charge another quota unit');
  assert(blob.reads.every(read => read.identity), 'all private reads must request the identity representation');
  assert(blob.writes.filter(w => w.previousEtag && w.accepted).every(w => w.settings.ifMatch === w.previousEtag), 'strong validators must retain their exact quotes and opaque bytes');

  // An origin that still supplies a weak validator must fail closed, never
  // strip W/, fall back to an unconditional overwrite, or charge a new job.
  const weak = transport({ ignoreIdentity: true });
  const quotaPath = 'marking/v1/quota/2026-10-24.json';
  weak.seed(quotaPath, { version: 1, day: '2026-10-24', total: 1, users: { [hash(user)]: 1 } });
  const before = [...weak.records].map(([path, record]) => [path, record.text, record.etag]);
  const weakLogs = await warnings(() => assert.rejects(make(weak).getOrReserve(user, digest('weak')), error => error.status === 503 && error.code === 'marking_storage_version'));
  safeLog(weakLogs, { code: 'marking_storage_version', store: 'marking', record: 'quota', reason: 'weak_etag' });
  assert.deepEqual([...weak.records].map(([path, record]) => [path, record.text, record.etag]), before);
  assert.equal(weak.writes.length, 0, 'an unusable validator must be rejected before any mutation');
  assert(weak.reads.every(read => read.identity));

  // A genuine concurrent ledger write must trigger a fresh read and merge,
  // preserving the other user's allowance as well as the new reservation.
  const otherOwner = hash(hash('another-synthetic-user')), priorOwner = hash(hash('prior-synthetic-user'));
  let injected = false;
  const raced = transport({ beforePut({ path, records, seed }) {
    if (!injected && path === quotaPath) {
      injected = true;
      const concurrent = JSON.parse(records.get(path).text);
      concurrent.total++; concurrent.users[otherOwner] = 1; seed(path, concurrent);
    }
  } });
  raced.seed(quotaPath, { version: 1, day: '2026-10-24', total: 1, users: { [priorOwner]: 1 } });
  const reserved = await make(raced).getOrReserve(user, digest('merge'));
  assert.equal(reserved.state, 'reserved');
  const ledger = ledgers(raced)[0];
  assert.equal(ledger.total, 3); assert.equal(ledger.users[priorOwner], 1); assert.equal(ledger.users[otherOwner], 1); assert.equal(ledger.users[hash(user)], 1);
  assert(raced.reads.filter(r => r.path === quotaPath).length >= 3, 'a failed conditional write must refresh the ledger');
  assert.equal(raced.writes.filter(w => w.path === quotaPath).length, 2);
  // A result based on an old lease cannot overwrite a replacement lease even
  // when replacement happens between the finish read and conditional write.
  let replaceLease = false;
  const replaced = transport({ beforePut({ path, text, records, seed }) {
    if (replaceLease && JSON.parse(text).state === 'marked') {
      replaceLease = false;
      const newer = JSON.parse(records.get(path).text); newer.leaseId = 'b'.repeat(32); seed(path, newer);
    }
  } });
  const leaseStore = make(replaced), firstLease = await leaseStore.getOrReserve(user, digest('replaced-lease'));
  replaceLease = true;
  await assert.rejects(leaseStore.finish(user, digest('replaced-lease'), firstLease.leaseId, outcome()), e => e.code === 'marking_lease_lost');
  const replacement = JSON.parse([...replaced.records].find(([path]) => path.includes('/jobs/'))[1].text);
  assert.equal(replacement.state, 'pending'); assert.equal(replacement.leaseId, 'b'.repeat(32));
  assert.equal(ledgers(replaced)[0].total, 1);
  assert(!replaced.writes.some(w => w.accepted && JSON.parse(w.text).state === 'marked'));

  // A short total CAS budget must constrain a pending operation, rather than
  // waiting for its longer per-operation timer or starting a late write.
  for (const where of ['provider', 'get', 'body']) {
    const gate = deferred(), late = transport();
    let providers = 0, gets = 0, signal;
    const normalGet = late.api.get;
    late.api.get = async (path, settings) => {
      gets++;
      if (where !== 'provider' && gets === 3) {
        signal = settings.abortSignal;
        if (where === 'get') return gate.promise;
        const failed = { version: 1, inputDigest: digest('late-' + where), state: 'failed' };
        return { statusCode: 200, blob: { etag: '"PRIVATE-LATE-TAG"' }, stream: { async *[Symbol.asyncIterator]() { await gate.promise; yield Buffer.from(JSON.stringify(failed)); } } };
      }
      return normalGet(path, settings);
    };
    const store = make(late, { operationTimeoutMs: 1000, changeTimeoutMs: 20, blob: async () => {
      providers++;
      if (where === 'provider' && providers === 3) return gate.promise;
      return late.api;
    } });
    const began = performance.now();
    const logs = await warnings(() => assert.rejects(store.getOrReserve(user, digest('late-' + where)), e => e.code === 'marking_storage_busy'));
    assert(performance.now() - began < 800, 'the total CAS deadline must beat the longer operation deadline');
    if (signal) assert(signal.aborted);
    gate.resolve(where === 'provider' ? late.api : where === 'get' ? null : undefined);
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(late.writes.length, 0, 'a late read/provider/body cannot resume into a mutation');
    safeLog(logs, { code: 'marking_storage_busy', store: 'marking', record: 'job', attempts: 1, unchangedVersionRetries: 0 });
  }
  const writeGate = deferred(), lateWrite = transport(); let writeSignal, commits = 0, calls = 0;
  lateWrite.api.put = async (_path, _text, settings) => {
    calls++; writeSignal = settings.abortSignal; await writeGate.promise;
    if (writeSignal.aborted) throw new Error('PRIVATE cancelled transport');
    commits++;
  };
  const lateWriteLogs = await warnings(() => assert.rejects(make(lateWrite, { operationTimeoutMs: 1000, changeTimeoutMs: 20 }).getOrReserve(user, digest('late-put')), e => e.code === 'marking_storage_busy'));
  assert(writeSignal.aborted); writeGate.resolve(); await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(calls, 1); assert.equal(commits, 0, 'cooperatively aborted writes must not commit after the CAS budget');
  assert.equal(ledgers(lateWrite).length, 0, 'a timed-out pending-job write must not advance to quota reservation');
  safeLog(lateWriteLogs, { code: 'marking_storage_busy', store: 'marking', record: 'job', attempts: 1, unchangedVersionRetries: 0 });

  // A persistently stale but syntactically strong validator must stop at the
  // fixed attempt cap. Metadata classifies the stall without leaking the tag,
  // source body, account/digest path, provider message, or attached headers.
  let conflicts = 0;
  const persistent = transport({ beforePut() {
    conflicts++;
    const error = validatorError(); error.headers = { authorization: 'PRIVATE SECRET' }; error.body = 'PRIVATE ANSWER';
    throw error;
  } });
  const persistentPath = 'marking/v1/jobs/' + hash(user) + '/' + digest('persistent') + '.json';
  const old = persistent.seed(persistentPath, { version: 1, inputDigest: digest('persistent'), state: 'failed' });
  old.etag = '"PRIVATE-OPAQUE-ETAG"';
  const beforePersistent = JSON.stringify([...persistent.records]);
  const random = Math.random; let conflictLogs;
  try {
    Math.random = () => 0;
    conflictLogs = await warnings(() => assert.rejects(make(persistent).getOrReserve(user, digest('persistent')), e => e.code === 'marking_storage_busy'));
  } finally { Math.random = random; }
  assert.equal(conflicts, 16, 'persistent conditional conflicts are capped independently of the total deadline');
  assert.equal(JSON.stringify([...persistent.records]), beforePersistent, 'conflicts never become unconditional overwrites');
  assert.equal(ledgers(persistent).length, 0);
  safeLog(conflictLogs, { code: 'marking_storage_busy', store: 'marking', record: 'job', attempts: 16, unchangedVersionRetries: 15 });
  const short = transport({ beforePut() { throw validatorError(); } });
  const shortLogs = await warnings(() => assert.rejects(make(short, { changeTimeoutMs: 40 }).getOrReserve(user, digest('short-contention')), e => e.code === 'marking_storage_busy'));
  assert(shortLogs[0][1].attempts >= 1 && shortLogs[0][1].attempts < 16, 'a short total deadline also bounds retry sleeps');
  assert.equal(ledgers(short).length, 0);
  for (const changeTimeoutMs of [0, -1, 10001, 1.5, NaN]) assert.throws(() => make(transport(), { changeTimeoutMs }), /Invalid storage change deadline/);
  console.log('Marking storage transport OK: identity reads, exact strong ETags, three simultaneous jobs, cached quota stability, weak-validator refusal, concurrent-ledger merge, total deadlines, late-operation aborts, conflict cap and diagnostic privacy. IN MEMORY ONLY.');
})().catch(error => { console.error(error); process.exitCode = 1; });
