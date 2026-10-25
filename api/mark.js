// Bounded blind assessments, format recovery and independent rubric/evidence resolution.
const inputTools = require('../server/marking-input');
const engine = require('../server/marking-engine');
const store = require('../server/marking-store');
const feedback = require('../server/feedback-policy');
const { cacheValid } = require('../server/improvement-input');
// The key for whichever AI service is configured (OpenCode Go or DeepSeek). See server/ai-provider.js.
const aiKey = env => require('../server/ai-provider').current(env).key();

function verifiedDecision(result, prepared, inputDigest, answerDigest, marking) {
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function keys(value, expected) { return object(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)); }
  function text(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
  function strings(value, count, max) { return Array.isArray(value) && value.length <= count && value.every(item => text(item, max)); }
  try {
    if (!keys(result, ['status', 'mark', 'summary', 'strengths', 'improve', 'advice', 'criteria', 'losses', 'quality', 'audit']) ||
        Buffer.byteLength(JSON.stringify(result)) > 64000 || !text(result.summary, 600) || !strings(result.strengths, 6, 300) ||
        !strings(result.improve, 6, 300) || !strings(result.advice, 4, 300) || !Array.isArray(result.criteria) ||
        !object(result.audit) || result.audit.answerDigest !== answerDigest ||
        !cacheValid(result, prepared, inputDigest, answerDigest, marking, { allowProvisional: true })) return false;
    if (result.status === 'needs_review') {
      return result.mark === null && !result.strengths.length && !result.improve.length && !result.advice.length && !result.criteria.length &&
        strings(result.audit.reasons, 8, 80) && result.audit.reasons.length > 0 && !feedback.feedbackProblem(result, prepared.input);
    }
    if (result.criteria.some(criterion => !keys(criterion, ['id', 'assessment', 'evidence', 'basis']) ||
        !strings(criterion.evidence, 6, 400) || !text(criterion.basis, 600))) return false;
    if (result.status === 'provisional') return !result.strengths.length && !result.improve.length && !result.advice.length && !feedback.feedbackProblem(result, prepared.input);
    if (result.mark === 0 && (result.strengths.length || result.criteria.some(criterion => criterion.assessment === 'met')) ||
        result.mark > 0 && !result.strengths.length || result.mark === prepared.input.maxMarks && result.improve.length ||
        result.mark < prepared.input.maxMarks && !result.improve.length) return false;
    return true;
  } catch (_) { return false; }
}

function createHandler(deps = {}) {
  const marking = deps.engine || engine, storage = deps.store || store, env = deps.env || process.env;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return res.status(200).json({ ok: true, serverKey: !!aiKey(env), model: marking.MODEL, harnessVersion: marking.HARNESS_VERSION, requiresSignIn: true });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    let session, prepared, lease, inputDigest;
    try {
      session = await storage.authorize(req.headers || {});
      prepared = inputTools.prepare(req.body);
      inputDigest = inputTools.digest({ input: prepared.input, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: marking.MODEL, harness: marking.HARNESS_VERSION });
      const answerDigest = inputTools.digest({ input: Object.assign({}, prepared.input, { diagramPng: null }), questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: marking.MODEL, harness: marking.HARNESS_VERSION });
      const provenance = { inputDigest, answerDigest, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, harnessVersion: marking.HARNESS_VERSION, requestedModel: marking.MODEL };
      function verifiedCached(result) {
        if (!verifiedDecision(result, prepared, inputDigest, answerDigest, marking)) throw Object.assign(new Error('The saved marking result cannot be verified. Your answer remains saved.'), { status: 503, code: 'invalid_marking_cache' });
        return result;
      }
      if (prepared.blank || prepared.reviewReason) {
        return res.status(200).json(Object.assign({ status: prepared.reviewReason ? 'needs_review' : 'marked', mark: prepared.reviewReason ? null : 0,
          summary: prepared.reviewReason || 'No answer was given for this part.', strengths: [], improve: [], advice: [], criteria: [],
          audit: Object.assign(provenance, { calls: [], checks: [prepared.reviewReason ? 'evidence_requires_review' : 'blank_answer'], returnedModels: [] }) }, prepared.reviewReason ? feedback.unavailableFeedback() : feedback.blankFeedback(prepared.input)));
      }
      // Cached decisions remain available when the provider key is temporarily absent.
      if (!aiKey(env)) {
        if (storage.getCached) {
          const cached = await storage.getCached(session.id, inputDigest);
          if (cached) return res.status(200).json(verifiedCached(cached));
        }
        return res.status(503).json({ code: 'no_key', error: 'AI marking is not configured. Your answer remains saved.' });
      }
      // An explicit re-mark replaces the saved decision; the store restores it if the fresh attempt fails.
      const reservation = await storage.getOrReserve(session.id, inputDigest, prepared.remark ? { replace: true } : undefined);
      if (reservation.state === 'cached') return res.status(200).json(verifiedCached(reservation.result));
      if (reservation.state === 'busy') { res.setHeader('Retry-After', '15'); return res.status(409).json({ code: 'marking_busy', error: 'This answer is already being marked. Try again shortly to retrieve the result.' }); }
      lease = reservation.leaseId;
      const result = await marking.mark(prepared.input, { apiKey: aiKey(env) });
      result.audit = Object.assign({}, result.audit, provenance);
      // No supported proposal is a retryable failure, never a cached zero or a
      // terminal review that would retrieve the same failed attempt forever.
      if (result.status === 'needs_review' && result.audit.resolution === 'no_valid_score') {
        throw Object.assign(new Error('No valid marking score could be recovered. Your answer remains saved. Try again.'), { status: 502, code: 'marking_unresolved', audit: result.audit });
      }
      if (!verifiedDecision(result, prepared, inputDigest, answerDigest, marking)) throw Object.assign(new Error('The marking result could not be verified before saving.'), { status: 502, code: 'invalid_result' });
      // Do not show an unpersisted result: subsequent reads must see the same decision.
      await storage.finish(session.id, inputDigest, lease, result);
      lease = null;
      return res.status(200).json(result);
    } catch (e) {
      if (lease) { try { await storage.fail(session.id, inputDigest, lease, { code: e.code, audit: e.audit }); } catch (_) {} }
      const status = [400, 401, 403, 409, 413, 429, 502, 503, 504].includes(e.status) ? e.status : 503;
      const code = typeof e.code === 'string' && /^[a-z_]+$/.test(e.code) ? e.code : 'marking_unavailable';
      if (status === 429) res.setHeader('Retry-After', code === 'provider_rate_limit' ? '20' : '3600');
      const safe = e.status && e.code ? e.message : 'AI marking is temporarily unavailable. Your answer remains saved.';
      return res.status(status).json({ code, error: safe });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
