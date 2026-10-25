// Run with run_marking_store_test.sh: every Blob operation stays in memory.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const auth = require('../api/auth');
const { authorize, createStore, DEFAULT_LIMITS } = require('../server/marking-store');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const user = n => sha('synthetic-user-' + n);
const digest = n => sha('synthetic-input-' + n);
const result = status => ({ status: status || 'marked', mark: status === 'needs_review' ? null : 2, summary: 'Synthetic result.', strengths: [], improve: [], advice: [], criteria: [], audit: { requestedModel: 'deepseek-flash', returnedModels: ['deepseek-flash'], calls: 3 } });
let clock = Date.UTC(2026, 9, 24, 12);
const provider = async () => require('../server/d1-blob');
const make = limits => createStore({ blob: provider, now: () => clock, limits });
const code = wanted => e => e.code === wanted;
function reset() { for (const path of globalThis.__M.keys()) if (path.startsWith('marking/')) globalThis.__M.delete(path); }
function ledger() { const entries = [...globalThis.__M.entries()].filter(([path]) => path.startsWith('marking/v1/quota/')); return entries.map(([, value]) => JSON.parse(value)); }
function call(body) { return new Promise((resolve, reject) => { const res = { setHeader() {}, status(c) { this.c = c; return this; }, json(j) { resolve({ status: this.c, body: j }); } }; Promise.resolve(auth({ method: 'POST', body, headers: {} }, res)).catch(reject); }); }

(async () => {
  await provider();
  process.env.CF_API_TOKEN = 'synthetic-storage-test-token';
  const created = await call({ action: 'signup', email: 'marking@example.test', password: 'synthetic-password-only' });
  assert.equal(created.status, 200);
  const token = created.body.token;
  assert.equal((await authorize({ authorization: 'Bearer ' + token })).id, sha('marking@example.test'));
  for (const value of [undefined, '', token, 'Bearer ' + token + '.extra', 'Bearer ' + token + ' ', ['Bearer ' + token], 'Basic ' + token]) await assert.rejects(authorize({ authorization: value }), code('auth_required'));
  for (const value of [null, {}, token + '.extra', token.slice(0, -1), token + '\n']) assert.equal(await auth.verifySession(value), null);
  const secret = Buffer.from(JSON.parse(globalThis.__M.get('system/secret.json')).k, 'hex');
  function signed(payload) { const body = Buffer.from(JSON.stringify(payload)).toString('base64url'); return body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url'); }
  for (const payload of [{ id: '../other', exp: Date.now() + 10000 }, { id: user(1), exp: '9999999999999' }, { id: user(1), exp: Date.now() - 1 }, { id: { path: 'x' }, exp: Date.now() + 10000 }]) assert.equal(await auth.verifySession(signed(payload)), null);
  delete process.env.CF_API_TOKEN;
  await assert.rejects(authorize({ authorization: 'Bearer ' + token }), code('marking_storage_unavailable'));
  process.env.CF_API_TOKEN = 'synthetic-storage-test-token';

  // Different store instances share durable state, not an in-memory lock.
  const a = make(), b = make();
  const beforeCacheRead = globalThis.__M.size;
  assert.equal(await a.getCached(user(1), digest(1)), null);
  assert.equal(globalThis.__M.size, beforeCacheRead, 'cache-only lookup must never reserve a job or allowance');
  const same = await Promise.all(Array.from({ length: 24 }, (_, i) => (i % 2 ? a : b).getOrReserve(user(1), digest(1))));
  assert.equal(same.filter(r => r.state === 'reserved').length, 1);
  assert.equal(same.filter(r => r.state === 'busy').length, 23);
  assert.equal(ledger()[0].total, 1);
  const lease = same.find(r => r.state === 'reserved').leaseId;
  assert.equal(await b.getCached(user(1), digest(1)), null, 'pending jobs are not cached results');
  await a.finish(user(1), digest(1), lease, result());
  assert.deepEqual(await b.getCached(user(1), digest(1)), result());
  assert.deepEqual(await b.getOrReserve(user(1), digest(1)), { state: 'cached', result: result() });
  assert.equal(ledger()[0].total, 1, 'cached reads must not spend allowance');
  assert.equal((await b.getOrReserve(user(2), digest(1))).state, 'reserved', 'another user must not read the first user result');
  assert.equal(ledger()[0].total, 2);
  await assert.rejects(a.finish(user(1), digest(1), lease, result()), code('marking_lease_lost'));

  reset();
  const review = await a.getOrReserve(user(1), digest(2));
  await a.finish(user(1), digest(2), review.leaseId, result('needs_review'));
  clock += 86400000;
  assert.equal((await b.getOrReserve(user(1), digest(2))).state, 'cached', 'needs_review is terminal even on another day');
  assert.equal(ledger().length, 1);
  reset();

  // Failed or abandoned paid attempts remain counted. Old owners cannot finish
  // or clear a newer lease after a transport failure or lease expiry.
  let job = await a.getOrReserve(user(1), digest(3));
  assert.equal(await a.fail(user(1), digest(3), job.leaseId), true);
  const retry = await b.getOrReserve(user(1), digest(3));
  assert.equal(await a.fail(user(1), digest(3), job.leaseId), false);
  await assert.rejects(a.finish(user(1), digest(3), job.leaseId, result()), code('marking_lease_lost'));
  assert.equal(ledger()[0].total, 2);
  clock += DEFAULT_LIMITS.leaseMs + 1;
  const staleRetry = await a.getOrReserve(user(1), digest(3));
  assert.equal(staleRetry.state, 'reserved');
  assert.notEqual(staleRetry.leaseId, retry.leaseId);
  assert.equal(await b.fail(user(1), digest(3), retry.leaseId), false);
  await assert.rejects(b.finish(user(1), digest(3), retry.leaseId, result()), code('marking_lease_lost'));
  assert.equal(ledger()[0].total, 3);
  await a.finish(user(1), digest(3), staleRetry.leaseId, result());
  reset();

  // Transport diagnostics retain only bounded allowlisted metadata. The most
  // recent failure survives an explicit retry, but is never a cached grade.
  job = await a.getOrReserve(user(1), digest('diagnostic'));
  const diagnostic = { code: 'marking_timeout', message: 'PRIVATE RAW ERROR', answer: 'PRIVATE ANSWER', audit: {
    requestedModel: 'deepseek-flash', returnedModels: ['deepseek-flash', 'PRIVATE UNKNOWN MODEL'], durationMs: 120000,
    usage: { prompt_tokens: 200, completion_tokens: 2000, total_tokens: 2200, reasoning_tokens: 1000, private: 'PRIVATE USAGE' },
    proposals: [{ answer: 'PRIVATE PROPOSAL' }], reasoning_content: 'PRIVATE REASONING', calls: Array.from({ length: 20 }, () => ({
      stage: 'marker1', status: 'failed', requestedModel: 'deepseek-flash', returnedModel: 'deepseek-flash', durationMs: 120000, errorCode: 'marking_timeout',
      finishReason: 'length', usage: { completion_tokens: 2000 }, content: 'PRIVATE CONTENT', message: 'PRIVATE MESSAGE'
    }))
  } };
  await a.fail(user(1), digest('diagnostic'), job.leaseId, diagnostic);
  const diagnosticPath = [...globalThis.__M.keys()].find(p => p.includes('/jobs/'));
  let captured = JSON.parse(globalThis.__M.get(diagnosticPath)).diagnostics;
  assert.equal(captured.code, 'marking_timeout'); assert.equal(captured.audit.durationMs, 120000); assert.equal(captured.audit.calls.length, 3);
  assert.equal(captured.audit.usage.reasoning_tokens, 1000); assert.equal(captured.audit.returnedModels[1], 'unexpected_model');
  assert(Buffer.byteLength(JSON.stringify(captured)) <= 8192); assert(!JSON.stringify(captured).includes('PRIVATE'));
  assert.equal(await a.getCached(user(1), digest('diagnostic')), null);
  const afterFailure = await b.getOrReserve(user(1), digest('diagnostic'));
  assert.equal(afterFailure.state, 'reserved');
  assert.deepEqual(JSON.parse(globalThis.__M.get(diagnosticPath)).diagnostics, captured);
  await b.finish(user(1), digest('diagnostic'), afterFailure.leaseId, result());
  assert.deepEqual(JSON.parse(globalThis.__M.get(diagnosticPath)).diagnostics, captured);
  assert.equal((await a.getCached(user(1), digest('diagnostic'))).diagnostics, undefined);
  reset();

  // Transport recovery records physical attempts without preserving arbitrary
  // provider errors, hostnames, addresses, headers or source content.
  job = await a.getOrReserve(user(1), digest('transport-diagnostic'));
  await a.fail(user(1), digest('transport-diagnostic'), job.leaseId, { code: 'provider_unavailable', audit: {
    networkAttempts: 4, calls: [
      { stage: 'marker1', status: 'completed', attemptCount: 2, retryCause: 'EAI_AGAIN', responseStatus: 200, cause: { hostname: 'PRIVATE HOST' }, message: 'PRIVATE MESSAGE' },
      { stage: 'marker2', status: 'failed', attemptCount: 1, transportCode: 'UND_ERR_SOCKET', transportPhase: 'body', responseStatus: 200, errorCode: 'provider_unavailable', headers: { authorization: 'PRIVATE TOKEN' } },
      { stage: 'auditor', status: 'failed', attemptCount: 3, retryCause: 'ECONNRESET', transportCode: 'PRIVATE CODE', transportPhase: 'PRIVATE PHASE', responseStatus: 999 }
    ]
  } });
  const transportPath = [...globalThis.__M.keys()].find(p => p.includes('/jobs/'));
  const transportDiagnostic = JSON.parse(globalThis.__M.get(transportPath)).diagnostics;
  assert.equal(transportDiagnostic.audit.networkAttempts, 4);
  assert.deepEqual(transportDiagnostic.audit.calls, [
    { stage: 'marker1', usage: {}, status: 'completed', attemptCount: 2, retryCause: 'EAI_AGAIN', responseStatus: 200 },
    { stage: 'marker2', usage: {}, status: 'failed', errorCode: 'provider_unavailable', attemptCount: 1, transportCode: 'UND_ERR_SOCKET', transportPhase: 'body', responseStatus: 200 },
    { stage: 'auditor', usage: {}, status: 'failed' }
  ]);
  assert(!JSON.stringify(transportDiagnostic).includes('PRIVATE'));
  job = await a.getOrReserve(user(1), digest('transport-diagnostic'));
  await a.fail(user(1), digest('transport-diagnostic'), job.leaseId, { code: 'provider_unavailable', audit: { networkAttempts: 5, calls: [] } });
  assert.equal(JSON.parse(globalThis.__M.get(transportPath)).diagnostics.audit.networkAttempts, undefined);
  reset();

  // Coaching shares this store. Its completed draft and failed audit retain
  // only the established bounded telemetry, never candidate/provider text.
  job = await a.getOrReserve(user(1), digest('coach-diagnostic'));
  await a.fail(user(1), digest('coach-diagnostic'), job.leaseId, { code: 'marking_timeout', message: 'PRIVATE TRANSPORT', audit: {
    requestedModel: 'deepseek-flash', returnedModels: ['deepseek-flash'], durationMs: 180000, reasoning_content: 'PRIVATE REASONING',
    calls: [
      { stage: 'coach', status: 'completed', requestedModel: 'deepseek-flash', returnedModel: 'deepseek-flash', durationMs: 75000, finishReason: 'stop',
        usage: { prompt_tokens: 1000, completion_tokens: 12000, total_tokens: 13000, reasoning_tokens: 8000, raw: 'PRIVATE USAGE' },
        maxTokens: 24576, content: 'PRIVATE CANDIDATE', headers: { authorization: 'PRIVATE KEY' } },
      { stage: 'coach_auditor', status: 'failed', requestedModel: 'deepseek-flash', returnedModel: 'PRIVATE MODEL', durationMs: 105000,
        errorCode: 'marking_timeout', finishReason: 'PRIVATE FINISH', usage: { prompt_tokens: -1, completion_tokens: 10000001 }, message: 'PRIVATE ERROR' },
      { stage: 'PRIVATE UNKNOWN STAGE', status: 'failed', errorCode: 'provider_error' }
    ]
  } });
  const coachPath = [...globalThis.__M.keys()].find(p => p.includes('/jobs/'));
  const coachDiagnostic = JSON.parse(globalThis.__M.get(coachPath)).diagnostics;
  assert.deepEqual(coachDiagnostic.audit.calls, [
    { stage: 'coach', status: 'completed', requestedModel: 'deepseek-flash', returnedModel: 'deepseek-flash', durationMs: 75000, finishReason: 'stop',
      usage: { prompt_tokens: 1000, completion_tokens: 12000, total_tokens: 13000, reasoning_tokens: 8000 } },
    { stage: 'coach_auditor', status: 'failed', requestedModel: 'deepseek-flash', returnedModel: 'unexpected_model', durationMs: 105000,
      errorCode: 'marking_timeout', usage: {} }
  ]);
  assert(!JSON.stringify(coachDiagnostic).includes('PRIVATE')); assert(Buffer.byteLength(JSON.stringify(coachDiagnostic)) <= 8192);
  assert.equal(await a.getCached(user(1), digest('coach-diagnostic')), null);
  const coachRetry = await b.getOrReserve(user(1), digest('coach-diagnostic'));
  assert.deepEqual(JSON.parse(globalThis.__M.get(coachPath)).diagnostics, coachDiagnostic);
  await b.finish(user(1), digest('coach-diagnostic'), coachRetry.leaseId, result());
  assert.deepEqual(JSON.parse(globalThis.__M.get(coachPath)).diagnostics, coachDiagnostic);
  assert.equal((await a.getCached(user(1), digest('coach-diagnostic'))).diagnostics, undefined);
  reset();

  const limitedA = make({ perUser: 2, site: 5 }), limitedB = make({ perUser: 2, site: 5 });
  const account = await Promise.allSettled(Array.from({ length: 10 }, (_, i) => (i % 2 ? limitedA : limitedB).getOrReserve(user(1), digest(i))));
  assert.equal(account.filter(r => r.status === 'fulfilled' && r.value.state === 'reserved').length, 2);
  assert.equal(account.filter(r => r.status === 'rejected' && r.reason.code === 'quota_exceeded').length, 8);
  assert.equal(ledger()[0].total, 2);
  assert.equal(Object.values(ledger()[0].users).reduce((x, y) => x + y, 0), 2);
  reset();
  const site = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => (i % 2 ? limitedA : limitedB).getOrReserve(user(i), digest(i))));
  assert.equal(site.filter(r => r.status === 'fulfilled' && r.value.state === 'reserved').length, 5);
  assert.equal(site.filter(r => r.status === 'rejected' && r.reason.code === 'quota_exceeded').length, 7);
  assert.equal(ledger()[0].total, 5);
  assert.equal(Object.values(ledger()[0].users).reduce((x, y) => x + y, 0), 5);
  assert.equal([...globalThis.__M.entries()].filter(([p, v]) => p.includes('/jobs/') && JSON.parse(v).state === 'pending').length, 5, 'quota rejection must release its own job lease');
  const recordsAtLimit = globalThis.__M.size;
  await assert.rejects(limitedA.getOrReserve(user(100), digest(100)), code('quota_exceeded'));
  assert.equal(globalThis.__M.size, recordsAtLimit, 'exhausted quota must not create another rejected-job record');
  clock += 86400000;
  assert.equal((await limitedA.getOrReserve(user(99), digest(99))).state, 'reserved', 'a new UTC day gets a new allowance');
  reset();

  job = await a.getOrReserve(user(1), digest(4));
  await assert.rejects(a.finish(user(1), digest(4), job.leaseId, { ...result(), answer: 'Never store the submitted input' }), code('invalid_marking_result'));
  await assert.rejects(a.finish(user(1), digest(4), job.leaseId, { ...result(), summary: 'x'.repeat(65537) }), code('invalid_marking_result'));
  await assert.rejects(a.finish(user(1), digest(4), job.leaseId, { status: 'failed' }), code('invalid_marking_result'));
  await assert.rejects(a.getOrReserve('../unsafe', digest(4)), code('invalid_marking_identity'));
  assert(![...globalThis.__M.values()].join('').includes('Never store the submitted input'));

  // Storage outages fail closed, including missing ETags on existing records.
  globalThis.__blobFailWrites = true;
  await assert.rejects(a.getOrReserve(user(8), digest(8)), code('marking_storage_unavailable'));
  globalThis.__blobFailWrites = false;
  const missingVersion = createStore({ blob: async () => ({ get: async () => ({ statusCode: 200, stream: [], blob: {} }) }) });
  await assert.rejects(missingVersion.getOrReserve(user(1), digest(1)), code('marking_storage_unavailable'));
  const unavailable = createStore({ blob: async () => { throw new Error('offline'); } });
  await assert.rejects(unavailable.getOrReserve(user(1), digest(1)), code('marking_storage_unavailable'));
  // Deadlines cover provider loading, the get call and its streamed body. Late
  // resolutions cannot continue into a quota/job write after the caller failed.
  function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
  for (const where of ['provider', 'get', 'body']) {
    const gate = deferred(); let writes = 0, signal;
    const sdk = { get: async (p, options) => {
      signal = options.abortSignal;
      if (where === 'get') return gate.promise;
      return { statusCode: 200, blob: { etag: 'v1' }, stream: { async *[Symbol.asyncIterator]() { await gate.promise; yield Buffer.from('{}'); } } };
    }, put: async () => { writes++; } };
    const hanging = createStore({ operationTimeoutMs: 10, blob: async () => where === 'provider' ? gate.promise : sdk });
    await assert.rejects(hanging.getOrReserve(user(50), digest(where)), code('marking_storage_timeout'));
    if (signal) assert.equal(signal.aborted, true);
    gate.resolve(where === 'provider' ? sdk : where === 'get' ? null : undefined);
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.equal(writes, 0, 'expired reads must not advance to a write');
  }
  const putGate = deferred(); let putSignal, mutations = 0;
  const hangingWrite = createStore({ operationTimeoutMs: 10, blob: async () => ({ get: async () => null, put: async (p, value, options) => {
    putSignal = options.abortSignal; await putGate.promise;
    if (putSignal.aborted) throw new Error('aborted'); mutations++;
  } }) });
  await assert.rejects(hangingWrite.getOrReserve(user(51), digest('put')), code('marking_storage_timeout'));
  assert.equal(putSignal.aborted, true); putGate.resolve();
  await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(mutations, 0, 'a cooperatively aborted write must not commit late');
  reset();
  const blob = await provider(), day = new Date(clock).toISOString().slice(0, 10);
  const feedbackJob = await a.getOrReserve(user(1), digest('rich-feedback'));
  const richResult = { ...result(), losses: { allocation: 'holistic', totalLost: 1, items: [] }, quality: [{ id: 'clarity', rating: 8 }] };
  await a.finish(user(1), digest('rich-feedback'), feedbackJob.leaseId, richResult);
  assert.deepEqual(await a.getCached(user(1), digest('rich-feedback')), richResult);
  const coachJob = await a.getOrReserve(user(1), digest('coach-domain'));
  const coachResult = { status: 'marked', mark: null, improvement: { status: 'ready', plan: [{ title: 'Practice a mechanism' }] }, audit: { harnessVersion: 'coach-v1' } };
  await a.finish(user(1), digest('coach-domain'), coachJob.leaseId, coachResult);
  assert.deepEqual(await a.getCached(user(1), digest('coach-domain')), coachResult);
  assert.equal(await a.getCached(user(2), digest('coach-domain')), null, 'coaching records must remain private to the account');
  reset();
  await blob.put('marking/v1/quota/' + day + '.json', JSON.stringify({ version: 1, day, total: 0, users: { [sha(user(1))]: 120 } }), { access: 'private', allowOverwrite: false });
  await assert.rejects(a.getOrReserve(user(2), digest(5)), code('marking_storage_invalid'), 'inconsistent quota counters must fail closed');
  console.log('marking store OK: shared sessions, durable deduplication, UTC quotas, concurrent reservations, terminal cache, stale leases, bounded results and storage failure safety');
})().catch(e => { console.error('FAIL', e); process.exit(1); });
