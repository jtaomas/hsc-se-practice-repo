// Three bounded DeepSeek calls: two blind assessments, then a rubric/evidence audit.
const inputTools = require('../server/marking-input');
const engine = require('../server/marking-engine');
const store = require('../server/marking-store');

function createHandler(deps = {}) {
  const marking = deps.engine || engine, storage = deps.store || store, env = deps.env || process.env;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return res.status(200).json({ ok: true, serverKey: !!env.DEEPSEEK_API_KEY, model: marking.MODEL, harnessVersion: marking.HARNESS_VERSION, requiresSignIn: true });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    let session, prepared, lease, inputDigest;
    try {
      session = await storage.authorize(req.headers || {});
      prepared = inputTools.prepare(req.body);
      inputDigest = inputTools.digest({ input: prepared.input, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: marking.MODEL, harness: marking.HARNESS_VERSION });
      const provenance = { inputDigest, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, harnessVersion: marking.HARNESS_VERSION, requestedModel: marking.MODEL };
      if (prepared.blank || prepared.reviewReason) {
        return res.status(200).json({ status: prepared.reviewReason ? 'needs_review' : 'marked', mark: prepared.reviewReason ? null : 0,
          summary: prepared.reviewReason || 'No answer was given for this part.', strengths: [], improve: [], advice: [], criteria: [],
          audit: Object.assign(provenance, { calls: [], checks: [prepared.reviewReason ? 'evidence_requires_review' : 'blank_answer'], returnedModels: [] }) });
      }
      // Cached decisions remain available when the provider key is temporarily absent.
      if (!env.DEEPSEEK_API_KEY) {
        if (storage.getCached) {
          const cached = await storage.getCached(session.id, inputDigest);
          if (cached) return res.status(200).json(cached);
        }
        return res.status(503).json({ code: 'no_key', error: 'AI marking is not configured. Your answer remains saved.' });
      }
      const reservation = await storage.getOrReserve(session.id, inputDigest);
      if (reservation.state === 'cached') return res.status(200).json(reservation.result);
      if (reservation.state === 'busy') { res.setHeader('Retry-After', '15'); return res.status(409).json({ code: 'marking_busy', error: 'This answer is already being marked. Try again shortly to retrieve the result.' }); }
      lease = reservation.leaseId;
      const result = await marking.mark(prepared.input, { apiKey: env.DEEPSEEK_API_KEY });
      result.audit = Object.assign({}, result.audit, provenance);
      if (Buffer.byteLength(JSON.stringify(result)) > 64000) throw Object.assign(new Error('The marking result exceeded the storage limit.'), { status: 502, code: 'invalid_result' });
      // Do not show an unpersisted result: subsequent reads must see the same decision.
      await storage.finish(session.id, inputDigest, lease, result);
      lease = null;
      return res.status(200).json(result);
    } catch (e) {
      if (lease) { try { await storage.fail(session.id, inputDigest, lease, { code: e.code, audit: e.audit }); } catch (_) {} }
      const status = [400, 401, 403, 409, 413, 429, 502, 503, 504].includes(e.status) ? e.status : 503;
      const code = typeof e.code === 'string' && /^[a-z_]+$/.test(e.code) ? e.code : 'marking_unavailable';
      if (status === 429) res.setHeader('Retry-After', '3600');
      const safe = e.status && e.code ? e.message : 'AI marking is temporarily unavailable. Your answer remains saved.';
      return res.status(status).json({ code, error: safe });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
