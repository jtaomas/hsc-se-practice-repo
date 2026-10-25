'use strict';

const inputTools = require('../server/improvement-input');
const { digest } = require('../server/marking-input');
const engine = require('../server/improvement-engine');
const store = require('../server/marking-store');
// The key for whichever AI service is configured (OpenCode Go or DeepSeek). See server/ai-provider.js.
const aiKey = env => require('../server/ai-provider').current(env).key();

function createHandler(deps = {}) {
  const coaching = deps.engine || engine, storage = deps.store || store, inputs = deps.input || inputTools, env = deps.env || process.env;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return res.status(200).json({ ok: true, serverKey: !!aiKey(env), model: coaching.MODEL, harnessVersion: coaching.HARNESS_VERSION, requiresSignIn: true });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    let session, lease, inputDigest, timer, prepared;
    function cached(record) {
      if (!record || record.mark !== null || !record.improvement || record.status !== (record.improvement.status === 'ready' ? 'marked' : 'needs_review') || !record.audit || record.audit.inputDigest !== inputDigest || record.audit.harnessVersion !== coaching.HARNESS_VERSION || record.audit.requestedModel !== coaching.MODEL || engine.resultProblem(record.improvement, prepared, record.audit)) throw Object.assign(new Error('The saved improvement plan cannot be verified.'), { status: 503, code: 'invalid_improvement_cache' });
      return record.improvement;
    }
    try {
      session = await storage.authorize(req.headers || {});
      const preparing = new AbortController();
      try {
        prepared = await Promise.race([inputs.prepare(req.body, { store: storage, sessionId: session.id, signal: preparing.signal }), new Promise((_, reject) => { timer = setTimeout(() => { preparing.abort(); reject(Object.assign(new Error('Loading the confirmed marking evidence exceeded its time limit.'), { status: 504, code: 'marking_timeout' })); }, 45000); })]);
      } finally { clearTimeout(timer); preparing.abort(); }
      // Domain-separated from marking jobs; quotas and distributed leases remain
      // shared so a second endpoint cannot bypass the paid-call allowance.
      inputDigest = digest({ namespace: 'post-exam-improvement', evidence: prepared, model: coaching.MODEL, harness: coaching.HARNESS_VERSION });
      const provenance = { inputDigest, harnessVersion: coaching.HARNESS_VERSION, requestedModel: coaching.MODEL };
      const old = await storage.getCached(session.id, inputDigest);
      if (old) return res.status(200).json(cached(old));
      if (!prepared.parts.some(part => part.mark !== null && !part.blank)) {
        const result = engine.review(prepared, 'insufficient_confirmed_evidence', provenance);
        result.summary = 'There is no confirmed nonblank response evidence for a personalised improvement plan yet. Complete and mark some answers, then try again.';
        return res.status(200).json(result);
      }
      if (!aiKey(env)) return res.status(503).json({ code: 'no_key', error: 'AI improvement planning is not configured. Your answers and marks remain saved.' });
      const reservation = await storage.getOrReserve(session.id, inputDigest);
      if (reservation.state === 'cached') return res.status(200).json(cached(reservation.result));
      if (reservation.state === 'busy') { res.setHeader('Retry-After', '15'); return res.status(409).json({ code: 'improvement_busy', error: 'This paper already has an improvement plan being prepared. Try again shortly.' }); }
      lease = reservation.leaseId;
      const result = await coaching.improve(prepared, { apiKey: aiKey(env) });
      result.audit = { ...result.audit, ...provenance };
      if (result.status === 'ready') {
        result.audit.resultDigest = engine.publicResultDigest(result);
        if (!result.audit.resultDigest) throw Object.assign(new Error('The improvement plan could not be checksummed.'), { status: 502, code: 'invalid_result' });
      }
      if (engine.resultProblem(result, prepared, provenance)) throw Object.assign(new Error('The improvement plan could not be verified before saving.'), { status: 502, code: 'invalid_result' });
      const wrapper = { status: result.status === 'ready' ? 'marked' : 'needs_review', mark: null, improvement: result, audit: provenance };
      if (Buffer.byteLength(JSON.stringify(wrapper)) > 64000) throw Object.assign(new Error('The improvement plan exceeded the storage limit.'), { status: 502, code: 'invalid_result' });
      await storage.finish(session.id, inputDigest, lease, wrapper);
      lease = null;
      return res.status(200).json(result);
    } catch (e) {
      if (lease) { try { await storage.fail(session.id, inputDigest, lease, { code: e.code, audit: e.audit }); } catch (_) {} }
      const status = [400, 401, 403, 409, 413, 429, 502, 503, 504].includes(e.status) ? e.status : 503;
      const code = typeof e.code === 'string' && /^[a-z_]+$/.test(e.code) ? e.code : 'improvement_unavailable';
      if (status === 429) res.setHeader('Retry-After', '3600');
      return res.status(status).json({ code, error: e.status && e.code ? e.message : 'AI improvement planning is temporarily unavailable. Your answers and marks remain saved.' });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
