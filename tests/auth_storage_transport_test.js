'use strict';
// Source runs in a VM with only its D1 adapter loader and deadline constants replaced.
// No HTTP, real account, credentials or model calls are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const source = fs.readFileSync(path.join(__dirname, '../api/auth.js'), 'utf8');
function replaceOnce(text, old, replacement) { assert.equal(text.split(old).length, 2); return text.replace(old, replacement); }
function load(provider, operation = 5000, update = 10000) {
  let script = replaceOnce(source, "async function blob() { return require('../server/d1-blob'); }", 'async function blob() { return testProvider(); }');
  script = replaceOnce(script, 'const STORAGE_TIMEOUT_MS = 5000;', 'const STORAGE_TIMEOUT_MS = ' + operation + ';');
  script = replaceOnce(script, 'const UPDATE_TIMEOUT_MS = 10000;', 'const UPDATE_TIMEOUT_MS = ' + update + ';');
  const context = { module: { exports: {} }, require, Buffer, AbortController, setTimeout, clearTimeout, process: { env: { CF_API_TOKEN: 'offline-only' } }, console, testProvider: provider };
  vm.runInNewContext(script + '\nmodule.exports.test = { readRecord, updateRecord, writeJSON, writeBackup, pruneBackups };', context, { filename: 'offline-auth.js' });
  return context.module.exports;
}
function conflict() { const e = new Error('Synthetic precondition failure'); e.name = 'BlobPreconditionFailedError'; return e; }
function transport() {
  const records = new Map(), reads = [], writes = []; let version = 0;
  const t = { records, reads, writes, seed(p, data) { records.set(p, { text: JSON.stringify(data), etag: '"opaque-' + (++version) + '-+/="' }); } };
  t.get = async (p, settings) => {
    reads.push({ p, settings }); if (t.beforeGet) return t.beforeGet(p, settings);
    const record = records.get(p); if (!record) return null;
    const identity = new Headers(settings.headers || {}).get('accept-encoding') === 'identity';
    return { statusCode: 200, stream: Readable.from([record.text]), blob: { etag: t.missingVersion ? undefined : (t.weak || !identity ? 'W/' : '') + record.etag } };
  };
  t.put = async (p, text, settings) => {
    if (t.beforePut) await t.beforePut(p, text, settings);
    const previous = records.get(p); writes.push({ p, text, settings, previousEtag: previous && previous.etag });
    if (previous && (!settings.allowOverwrite || settings.ifMatch !== previous.etag)) throw conflict();
    if (!previous && settings.ifMatch) throw conflict();
    t.seed(p, JSON.parse(text)); return { pathname: p, etag: records.get(p).etag };
  };
  t.list = async ({prefix}) => ({blobs:[...records.keys()].filter(p=>p.startsWith(prefix)).map(pathname=>({pathname}))});
  t.del = async paths => paths.forEach(p=>records.delete(p));
  t.configured = () => true;
  return t;
}
function call(handler, body, token) {
  return new Promise((resolve, reject) => {
    handler({ method: 'POST', body, headers: token ? { authorization: 'Bearer ' + token } : {} }, { setHeader() {}, status(status) { this.statusCode = status; return this; }, json(body) { resolve({ status: this.statusCode, body }); } }).catch(reject);
  });
}
function gate() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
const settle = () => new Promise(resolve => setTimeout(resolve, 10));
(async () => {
  const t = transport(), h = load(async () => t);
  const signup = await call(h, { action: 'signup', email: 'mini-sync@example.test', password: 'synthetic-only-value' });
  assert.equal(signup.status, 200); const token = signup.body.token;
  const save = (answer, revisions = {}) => call(h, { action: 'save', data: { u: { '10': { ans: { '1.0': answer } } } }, changes: ['10'], revisions }, token);
  const first = await save('First mini answer'); assert.equal(first.status, 200);
  const second = await save('Updated mini answer', first.body.revisions); assert.equal(second.status, 200);
  assert.notEqual(second.body.revisions['10'], first.body.revisions['10']);
  const stale = await save('Stale draft', first.body.revisions); assert.equal(stale.status, 409); assert.equal(stale.body.code, 'progress_conflict');
  assert(t.reads.every(r => r.settings.useCache === false && r.settings.headers['Accept-Encoding'] === 'identity'));
  assert(t.writes.filter(w => w.previousEtag).every(w => w.settings.ifMatch === w.previousEtag), 'quoted opaque versions changed');
  const progressPath = [...t.records.keys()].find(p => p.startsWith('progress/'));
  for (const mode of ['weak', 'missingVersion']) {
    const before = t.records.get(progressPath).text, writes = t.writes.length; t[mode] = true;
    const denied = await save('Must not overwrite', second.body.revisions);
    assert.equal(denied.status, 503); assert.equal(denied.body.code, 'account_storage_version');
    assert.equal(t.writes.length, writes); assert.equal(t.records.get(progressPath).text, before); t[mode] = false;
  }
  // A competing save on another paper forces a reread and preserves both edits.
  let raced = false;
  t.beforePut = (p) => { if (p === progressPath && !raced) { raced = true; const data = JSON.parse(t.records.get(p).text); data.u['1'] = { ans: { '1.0': 'other device' } }; data._revisions['1'] = 'concurrent'; t.seed(p, data); } };
  const merged = await save('Third mini answer', second.body.revisions); assert.equal(merged.status, 200);
  assert.equal(merged.body.data.u['1'].ans['1.0'], 'other device'); assert.equal(merged.body.data.u['10'].ans['1.0'], 'Third mini answer');

  for (const stage of ['provider', 'get', 'body']) {
    const blocked = gate(), late = transport(); let signal;
    if (stage !== 'provider') late.beforeGet = async (_p, settings) => {
      signal = settings.abortSignal;
      if (stage === 'get') return blocked.promise;
      return { statusCode: 200, blob: { etag: '"strong"' }, stream: { async *[Symbol.asyncIterator]() { await blocked.promise; yield Buffer.from('{}'); } } };
    };
    const limited = load(() => stage === 'provider' ? blocked.promise : Promise.resolve(late), 1000, 25);
    const started = performance.now();
    await assert.rejects(limited.test.updateRecord('progress/synthetic.json', () => ({ changed: true })), e => e.code === 'account_storage_busy');
    assert(performance.now() - started < 800); if (signal) assert(signal.aborted);
    blocked.resolve(stage === 'provider' ? late : stage === 'get' ? null : undefined); await settle();
    assert.equal(late.writes.length, 0, 'late ' + stage + ' resumed into a write');
  }
  const stalled = transport(), download = gate(); let readSignal;
  stalled.beforeGet = async (_p, settings) => { readSignal = settings.abortSignal; return download.promise; };
  await assert.rejects(load(async () => stalled, 25).test.readRecord('progress/synthetic.json'), e => e.code === 'account_storage_timeout');
  assert(readSignal.aborted); download.resolve(null); await settle();

  const write = gate(), latePut = transport(); let commits = 0, putSignal;
  latePut.put = async (_p, _text, settings) => { putSignal = settings.abortSignal; await write.promise; if (putSignal.aborted) throw new Error('Cancelled'); commits++; };
  await assert.rejects(load(async () => latePut, 1000, 25).test.updateRecord('progress/synthetic.json', () => ({ changed: true })), e => e.code === 'account_storage_busy');
  assert(putSignal.aborted); write.resolve(); await settle(); assert.equal(commits, 0);

  const oversized = transport(); oversized.seed('progress/synthetic.json', { text: 'x'.repeat(3500000) });
  await assert.rejects(load(async () => oversized).test.readRecord('progress/synthetic.json'), e => e.code === 'account_storage_unavailable');
  const conflicts = transport(); let attempts = 0;
  conflicts.beforePut = () => { attempts++; throw conflict(); };
  await assert.rejects(load(async () => conflicts, 1000, 40).test.updateRecord('progress/synthetic.json', () => ({})), e => e.code === 'account_storage_busy');
  assert(attempts >= 1 && attempts < 16, 'total deadline did not bound conflict retries');
  // Backups added with the D1 migration obey the same transport deadline.
  const listing=gate();let listSignal;
  t.list=async settings=>{listSignal=settings.abortSignal;return listing.promise};
  const listTimeout=await call(load(async()=>t,25),{action:'backups'},token);
  assert.equal(listTimeout.status,503);assert.equal(listTimeout.body.code,'account_storage_timeout');assert(listSignal.aborted);listing.resolve({blobs:[]});await settle();
  const backupWrite=gate(),backupTransport=transport();let backupSignal,backupCommits=0;
  backupTransport.put=async(_p,_text,settings)=>{backupSignal=settings.abortSignal;await backupWrite.promise;if(backupSignal.aborted)throw new Error('Cancelled');backupCommits++};
  await assert.rejects(load(async()=>backupTransport,25).test.writeBackup('synthetic','2026-10-25','{}'),e=>e.code==='account_storage_timeout');
  assert(backupSignal.aborted);backupWrite.resolve();await settle();assert.equal(backupCommits,0);
  const pruning=gate();let pruneSignal;backupTransport.del=async(_paths,settings)=>{pruneSignal=settings.abortSignal;await pruning.promise};
  const originalError=console.error;console.error=()=>{};
  try{await load(async()=>backupTransport,25).test.pruneBackups('synthetic')}finally{console.error=originalError}
  assert(pruneSignal.aborted);pruning.resolve();await settle();
  console.log('Auth storage transport OK: D1-compatible mini-paper saves, exact versions, weak/missing refusal, concurrent merge, bounded provider/read/body/write and late-operation safety. OFFLINE ONLY.');
})().catch(error => { console.error(error); process.exitCode = 1; });
