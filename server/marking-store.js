// Private marking results, distributed leases and daily paid-job reservations.
// A single daily ledger reserves account and site quotas in the same CAS write.
const crypto = require('crypto');
const { verifySession } = require('../api/auth');

const DEFAULT_LIMITS = Object.freeze({ perUser: 120, site: 600, leaseMs: 300000, resultBytes: 65536 });
const HASH = /^[a-f0-9]{64}$/;
const LEASE = /^[a-f0-9]{32}$/;
const STORAGE_TIMEOUT_MS = 5000;
const FAILURE_CODES = new Set(['marking_timeout', 'provider_response_too_large', 'provider_response_unreadable', 'provider_cancelled', 'provider_rate_limit', 'provider_auth', 'provider_balance', 'provider_error', 'provider_envelope', 'provider_unavailable', 'marking_request_too_large', 'invalid_result', 'no_key', 'marking_storage_unavailable', 'marking_storage_busy', 'marking_storage_timeout', 'marking_lease_lost', 'marking_unavailable']);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function error(status, code, message) { const e = new Error(message); e.status = status; e.code = code; return e; }
const conflict = e => e && (e.name === 'BlobPreconditionFailedError' || /precondition|already exists/i.test(String(e.message)));
async function privateBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw error(503, 'marking_storage_unavailable', 'Private marking storage is not configured.');
  return import('@vercel/blob');
}
function failureDiagnostics(value, kind) {
  const comparison = kind === 'comparison';
  const failureCodes = new Set(FAILURE_CODES);
  if (comparison) for (const code of ['comparison_timeout', 'comparison_call_budget', 'comparison_request_too_large', 'comparison_input_too_large', 'comparison_unavailable']) failureCodes.add(code);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const clean = { code: failureCodes.has(value.code) ? value.code : 'marking_unavailable' };
  const number = value => Number.isSafeInteger(value) && value >= 0 && value <= 10000000;
  const usage = source => {
    const out = {};
    if (source && typeof source === 'object') for (const key of ['prompt_tokens', 'completion_tokens', 'total_tokens', 'reasoning_tokens']) if (number(source[key])) out[key] = source[key];
    return out;
  };
  const model = value => value === 'deepseek-flash' ? value : value == null ? null : 'unexpected_model';
  const audit = value.audit;
  if (audit && typeof audit === 'object' && !Array.isArray(audit)) {
    clean.audit = { usage: usage(audit.usage), calls: [] };
    if (number(audit.durationMs)) clean.audit.durationMs = audit.durationMs;
    if (audit.requestedModel != null) clean.audit.requestedModel = model(audit.requestedModel);
    if (Array.isArray(audit.returnedModels)) clean.audit.returnedModels = audit.returnedModels.slice(0, comparison ? 10 : 3).map(model);
    if (Array.isArray(audit.calls)) for (const call of audit.calls.slice(0, comparison ? 10 : 3)) {
      // The coach shares marking jobs and quotas, so its two stage names must
      // survive the same bounded diagnostic projection as marker failures.
      if (!call || (comparison ? !/^(profile:p[1-8]|synthesis|auditor)$/.test(call.stage) : !['marker1', 'marker2', 'auditor', 'coach', 'coach_auditor'].includes(call.stage))) continue;
      const out = { stage: call.stage, usage: usage(call.usage) };
      if (['running', 'completed', 'failed'].includes(call.status)) out.status = call.status;
      if (number(call.durationMs)) out.durationMs = call.durationMs;
      if (call.requestedModel != null) out.requestedModel = model(call.requestedModel);
      if (call.returnedModel != null) out.returnedModel = model(call.returnedModel);
      if (failureCodes.has(call.errorCode)) out.errorCode = call.errorCode;
      if (['stop', 'length', 'tool_calls', 'function_call', 'content_filter'].includes(call.finishReason)) out.finishReason = call.finishReason;
      clean.audit.calls.push(out);
    }
  }
  // Explicit final bound, in addition to the much smaller fixed schema above.
  return Buffer.byteLength(JSON.stringify(clean)) <= 8192 ? clean : { code: clean.code };
}

async function authorize(headers) {
  const value = headers && headers.authorization;
  if (typeof value !== 'string' || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/i.test(value)) throw error(401, 'auth_required', 'Sign in to mark your answers.');
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw error(503, 'marking_storage_unavailable', 'Private marking storage is not configured.');
  let session;
  try { session = await verifySession(value.slice(7)); }
  catch (_) { throw error(503, 'marking_storage_unavailable', 'Sign-in verification is temporarily unavailable.'); }
  if (!session || !HASH.test(session.id)) throw error(401, 'auth_required', 'Your sign-in has expired. Sign in again.');
  return session;
}

function createStore(options) {
  options = options || {};
  const kind = options.kind || 'marking';
  if (!['marking', 'comparison'].includes(kind)) throw new Error('Invalid storage kind.');
  const completedState = kind === 'comparison' ? 'complete' : 'marked';
  const completedStates = [completedState, 'needs_review'];
  const states = ['pending', completedState, 'needs_review', 'failed'];
  const prefix = kind + '/v1/';
  const provider = options.blob || privateBlob;
  const now = options.now || Date.now;
  const operationMs = options.operationTimeoutMs == null ? STORAGE_TIMEOUT_MS : options.operationTimeoutMs;
  if (!Number.isSafeInteger(operationMs) || operationMs < 1 || operationMs > STORAGE_TIMEOUT_MS) throw new Error('Invalid storage deadline.');
  // Overrides are an internal test seam, never browser or request parameters.
  const limits = Object.assign({}, DEFAULT_LIMITS, options.limits || {});
  if (!Number.isSafeInteger(limits.perUser) || limits.perUser < 1 || limits.perUser > 120 || !Number.isSafeInteger(limits.site) || limits.site < 1 || limits.site > 600 || limits.leaseMs !== DEFAULT_LIMITS.leaseMs || limits.resultBytes !== DEFAULT_LIMITS.resultBytes) throw new Error('Invalid marking storage limits.');
  function identity(sessionId, digest) {
    if (typeof sessionId !== 'string' || !HASH.test(sessionId) || typeof digest !== 'string' || !HASH.test(digest)) throw error(400, 'invalid_marking_identity', 'Invalid marking identity.');
    const owner = sha(sessionId);
    return { owner, path: prefix + 'jobs/' + owner + '/' + digest + '.json' };
  }
  async function bounded(operation) {
    const controller = new AbortController();
    let timer;
    const expired = () => { if (controller.signal.aborted) throw error(503, 'marking_storage_timeout', 'Marking storage exceeded its time limit.'); };
    try {
      return await Promise.race([
        Promise.resolve().then(() => operation(controller.signal, expired)),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(error(503, 'marking_storage_timeout', 'Marking storage exceeded its time limit.')); }, operationMs); })
      ]);
    } finally { clearTimeout(timer); controller.abort(); }
  }
  async function read(path) {
    try {
      return await bounded(async (signal, expired) => {
        const { get } = await provider(); expired();
        const r = await get(path, { access: 'private', useCache: false, abortSignal: signal }); expired();
        if (!r || r.statusCode === 404) return null;
        if (r.statusCode !== 200 || !r.stream || !r.blob || !r.blob.etag) throw new Error('Missing versioned record');
        const chunks = []; let bytes = 0;
        for await (const chunk of r.stream) { expired(); const b = Buffer.from(chunk); bytes += b.length; if (bytes > 131072) throw new Error('Record too large'); chunks.push(b); }
        expired();
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid stored record');
        return { data, etag: r.blob.etag };
      });
    } catch (e) { if (e.code === 'marking_storage_timeout') throw e; throw error(503, 'marking_storage_unavailable', 'Marking storage is temporarily unavailable.'); }
  }
  async function write(path, data, old) {
    return bounded(async (signal, expired) => {
      const { put } = await provider(); expired();
      const settings = { access: 'private', addRandomSuffix: false, allowOverwrite: !!old, contentType: 'application/json', abortSignal: signal };
      if (old) settings.ifMatch = old.etag;
      const result = await put(path, JSON.stringify(data), settings); expired();
      return result;
    });
  }
  async function change(path, transform) {
    for (let attempt = 0; attempt < 40; attempt++) {
      const old = await read(path), next = transform(old && old.data);
      if (next.write === null) return next.value;
      try { await write(path, next.write, old); return next.value; }
      catch (e) { if (e.code === 'marking_storage_timeout') throw e; if (!conflict(e)) throw error(503, 'marking_storage_unavailable', 'Marking storage is temporarily unavailable.'); }
    }
    throw error(503, 'marking_storage_busy', 'Marking storage is busy. Try again in a moment.');
  }
  function checkJob(job, digest) {
    if (job && (job.version !== 1 || job.inputDigest !== digest || !states.includes(job.state))) throw error(503, 'marking_storage_invalid', 'The saved marking record cannot be verified.');
  }
  function checkQuota(old, date, owner) {
    const ledger = old || { version: 1, day: date, total: 0, users: {} };
    if (ledger.version !== 1 || ledger.day !== date || !Number.isSafeInteger(ledger.total) || ledger.total < 0 || ledger.total > DEFAULT_LIMITS.site || !ledger.users || typeof ledger.users !== 'object' || Array.isArray(ledger.users) || Object.keys(ledger.users).length > DEFAULT_LIMITS.site) throw error(503, 'marking_storage_invalid', 'The marking allowance cannot be verified.');
    const entries = Object.entries(ledger.users);
    if (entries.some(([key, count]) => !HASH.test(key) || !Number.isSafeInteger(count) || count < 1 || count > DEFAULT_LIMITS.perUser) || entries.reduce((sum, [, count]) => sum + count, 0) !== ledger.total) throw error(503, 'marking_storage_invalid', 'The marking allowance cannot be verified.');
    if ((ledger.users[owner] || 0) >= limits.perUser) throw error(429, 'quota_exceeded', kind === 'comparison' ? 'Your daily AI comparison allowance has been reached.' : 'Your daily AI marking allowance has been reached.');
    if (ledger.total >= limits.site) throw error(429, 'quota_exceeded', kind === 'comparison' ? 'The site daily AI comparison allowance has been reached.' : 'The site daily AI marking allowance has been reached.');
    return ledger;
  }
  async function reserveQuota(owner) {
    const date = new Date(now()).toISOString().slice(0, 10);
    return change(prefix + 'quota/' + date + '.json', old => {
      const ledger = checkQuota(old, date, owner);
      ledger.total++; ledger.users[owner] = (ledger.users[owner] || 0) + 1;
      return { write: ledger, value: null };
    });
  }
  async function fail(sessionId, digest, leaseId, diagnostics) {
    const { path } = identity(sessionId, digest);
    if (!LEASE.test(leaseId || '')) throw error(400, 'invalid_marking_lease', 'Invalid marking reservation.');
    return change(path, job => {
      checkJob(job, digest);
      if (!job || job.state !== 'pending' || job.leaseId !== leaseId) return { write: null, value: false };
      const failed = { version: 1, inputDigest: digest, state: 'failed', finishedAt: now() }, safe = failureDiagnostics(diagnostics, kind) || failureDiagnostics(job.diagnostics, kind);
      if (safe) failed.diagnostics = safe;
      return { write: failed, value: true };
    });
  }
  async function getCached(sessionId, digest) {
    const { path } = identity(sessionId, digest), record = await read(path), job = record && record.data;
    checkJob(job, digest);
    if (!job || !completedStates.includes(job.state)) return null;
    if (!job.result || job.result.status !== job.state) throw error(503, 'marking_storage_invalid', 'The saved marking result cannot be verified.');
    return job.result;
  }
  async function getOrReserve(sessionId, digest) {
    const { owner, path } = identity(sessionId, digest), leaseId = crypto.randomBytes(16).toString('hex');
    const probe = await read(path);
    checkJob(probe && probe.data, digest);
    if (!probe || probe.data.state === 'failed' || (probe.data.state === 'pending' && probe.data.leaseUntil <= now())) {
      // Avoid creating unlimited rejected-job records after a quota is exhausted.
      // The later CAS reservation remains authoritative for concurrent requests.
      const date = new Date(now()).toISOString().slice(0, 10), quota = await read(prefix + 'quota/' + date + '.json');
      checkQuota(quota && quota.data, date, owner);
    }
    const acquired = await change(path, job => {
      checkJob(job, digest);
      if (job && completedStates.includes(job.state)) {
        if (!job.result || job.result.status !== job.state) throw error(503, 'marking_storage_invalid', 'The saved marking result cannot be verified.');
        return { write: null, value: { state: 'cached', result: job.result } };
      }
      if (job && job.state === 'pending') {
        if (!LEASE.test(job.leaseId || '') || !Number.isSafeInteger(job.leaseUntil)) throw error(503, 'marking_storage_invalid', 'The marking reservation cannot be verified.');
        if (job.leaseUntil > now()) return { write: null, value: { state: 'busy', retryAfter: Math.max(1, Math.ceil((job.leaseUntil - now()) / 1000)) } };
      }
      const pending = { version: 1, inputDigest: digest, state: 'pending', leaseId, startedAt: now(), leaseUntil: now() + limits.leaseMs };
      if (job && job.diagnostics) pending.diagnostics = failureDiagnostics(job.diagnostics, kind);
      return { write: pending, value: { state: 'reserved', leaseId } };
    });
    if (acquired.state !== 'reserved') return acquired;
    try {
      await reserveQuota(owner);
      // Restore the full lease after quota contention, but never revive a lease
      // that another instance has already replaced or completed.
      await change(path, job => {
        checkJob(job, digest);
        if (!job || job.state !== 'pending' || job.leaseId !== leaseId || job.leaseUntil <= now()) throw error(409, 'marking_lease_lost', 'This marking reservation expired before starting.');
        job.leaseUntil = now() + limits.leaseMs;
        return { write: job, value: null };
      });
    }
    catch (e) { try { await fail(sessionId, digest, leaseId); } catch (_) {} throw e; }
    return acquired;
  }
  async function finish(sessionId, digest, leaseId, result) {
    const { path } = identity(sessionId, digest);
    if (!LEASE.test(leaseId || '') || !result || typeof result !== 'object' || Array.isArray(result) || !completedStates.includes(result.status)) throw error(500, 'invalid_marking_result', 'The marking result cannot be stored.');
    let copy;
    try { const text = JSON.stringify(result); if (Buffer.byteLength(text) > limits.resultBytes) throw new Error('Too large'); copy = JSON.parse(text); }
    catch (_) { throw error(500, 'invalid_marking_result', 'The marking result cannot be stored.'); }
    // Only validated response data belongs here, never the submitted input bundle.
    const keys = kind === 'comparison' ? ['status', 'summary', 'profiles', 'comparisons', 'statistics', 'audit'] : ['status', 'mark', 'summary', 'strengths', 'improve', 'advice', 'criteria', 'losses', 'quality', 'improvement', 'audit'];
    if (Object.keys(copy).some(key => !keys.includes(key))) throw error(500, 'invalid_marking_result', 'The marking result contains unexpected source data.');
    return change(path, job => {
      checkJob(job, digest);
      if (!job || job.state !== 'pending' || job.leaseId !== leaseId || job.leaseUntil <= now()) throw error(409, 'marking_lease_lost', 'This marking reservation expired. Its result was not saved.');
      const completed = { version: 1, inputDigest: digest, state: copy.status, finishedAt: now(), result: copy };
      if (job.diagnostics) completed.diagnostics = failureDiagnostics(job.diagnostics, kind);
      return { write: completed, value: copy };
    });
  }
  return { getCached, getOrReserve, finish, fail };
}

module.exports = Object.assign({ authorize, createStore, DEFAULT_LIMITS }, createStore());
