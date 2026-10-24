'use strict';
const input = require('../server/comparison-input');
const sharing = require('../server/comparison-sharing');
const engine = require('../server/comparison-engine');
const markingStore = require('../server/marking-store');
const { digest } = require('../server/marking-input');
const { canonicalDigest } = require('../server/feedback-integrity');
const jobs = markingStore.createStore({ kind: 'comparison', limits: { perUser: 12, site: 40 } });
function reportDigest(result) {
  return canonicalDigest({ status: result.status, summary: result.summary, profiles: result.profiles, comparisons: result.comparisons, statistics: result.statistics });
}
function verifiedReport(result, prepared, canonical, inputDigest, compareEngine) {
  function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function keys(value, expected) { return object(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)); }
  try {
    if (!keys(result, ['status', 'summary', 'profiles', 'comparisons', 'statistics', 'audit']) || Buffer.byteLength(JSON.stringify(result)) > 64000 ||
        !['complete', 'needs_review'].includes(result.status) || typeof result.summary !== 'string' || !result.summary.trim() || result.summary.length > 700 ||
        !Array.isArray(result.profiles) || !Array.isArray(result.comparisons) || !object(result.audit)) return false;
    const audit = result.audit;
    if (audit.inputDigest !== inputDigest || audit.questionSetVersion !== prepared.questionSetVersion ||
        audit.harnessVersion !== compareEngine.HARNESS_VERSION || audit.requestedModel !== compareEngine.MODEL ||
        !Number.isSafeInteger(audit.analysisCompletedAt) || audit.analysisCompletedAt < 1 ||
        !/^[a-f0-9]{64}$/.test(audit.resultDigest || '') || reportDigest(result) !== audit.resultDigest ||
        canonicalDigest(result.statistics) !== canonicalDigest(prepared.statistics) || !Array.isArray(audit.reasons)) return false;
    if (result.status === 'needs_review') return !result.profiles.length && !result.comparisons.length && audit.reasons.length > 0 &&
      audit.reasons.length <= 8 && audit.reasons.every(reason => typeof reason === 'string' && /^[a-z_]{1,80}$/.test(reason));
    const stages = canonical.participants.map(participant => 'profile:' + participant.id).concat(['synthesis', 'auditor']);
    if (audit.reasons.length || !object(audit.checks) ||
        !['completed', 'modelMatch', 'outputSchema', 'evidenceSupported', 'blindProfiles', 'auditorApproved'].every(key => audit.checks[key] === true) ||
        !Array.isArray(audit.calls) || audit.calls.length !== stages.length || audit.calls.some((call, index) => !object(call) || call.stage !== stages[index] ||
          call.status !== 'completed' || call.finishReason !== 'stop' || call.requestedModel !== compareEngine.MODEL || call.returnedModel !== compareEngine.MODEL || call.errorCode != null) ||
        !Array.isArray(audit.returnedModels) || audit.returnedModels.length !== stages.length || audit.returnedModels.some(model => model !== compareEngine.MODEL) ||
        !keys(audit.auditor, ['checks', 'issueCount']) || audit.auditor.issueCount !== 0 || engine.auditProblem({ checks: audit.auditor.checks, issues: [] })) return false;
    if (result.profiles.length !== canonical.participants.length) return false;
    const remaining = new Map(canonical.participants.map(participant => [participant.id, participant]));
    for (const profile of result.profiles) {
      if (!keys(profile, ['participantId', 'findings']) || !remaining.has(profile.participantId) ||
          engine.profileProblem({ status: 'complete', participantId: profile.participantId, findings: profile.findings, uncertainties: [] }, remaining.get(profile.participantId))) return false;
      remaining.delete(profile.participantId);
    }
    return !engine.synthesisProblem({ status: 'complete', summary: result.summary, comparisons: result.comparisons, uncertainties: [] }, canonical.participants, result.profiles);
  } catch (_) { return false; }
}
function createHandler(deps = {}) {
  const evidence = deps.sharing || sharing, markerStore = deps.markingStore || markingStore;
  const store = deps.store || jobs, compareEngine = deps.engine || engine, env = deps.env || process.env;
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET') return res.status(200).json({ ok: true, serverKey: !!env.DEEPSEEK_API_KEY, model: compareEngine.MODEL, harnessVersion: compareEngine.HARNESS_VERSION, requiresSignIn: true, maxParticipants: 8 });
    if (req.method !== 'POST') return res.status(405).json({ code: 'method', error: 'Use POST.' });
    let session, lease, inputDigest;
    try {
      session = await markerStore.authorize(req.headers || {});
      const request = input.body(req.body);
      if (request.action === 'export') {
        input.bankFor(request.bankId);
        const paper = await evidence.loadPaper(session.id, request.bankId);
        const snapshot = await input.prepareExport(request, paper, value => markerStore.getCached(session.id, value));
        return res.status(200).json({ export: await evidence.sign(snapshot, session.id) });
      }
      if (request.action === 'class_publish') {
        if (!evidence.publishToClass) throw input.error(501, 'not_implemented', 'Class sharing is not supported by this storage provider.');
        input.bankFor(request.bankId);
        let exportPkg = request.export;
        if (!exportPkg) {
          const paper = await evidence.loadPaper(session.id, request.bankId);
          const snapshot = await input.prepareExport(request, paper, value => markerStore.getCached(session.id, value));
          exportPkg = await evidence.sign(snapshot, session.id);
        }
        await evidence.publishToClass(request.classCode, request.bankId, session.id, exportPkg);
        return res.status(200).json({ ok: true, classCode: request.classCode.toUpperCase().trim(), bankId: request.bankId });
      }
      if (request.action === 'class_list') {
        if (!evidence.listClassExports) return res.status(200).json({ ok: true, classmates: [] });
        input.bankFor(request.bankId);
        const classmates = await evidence.listClassExports(request.classCode, request.bankId);
        return res.status(200).json({ ok: true, classCode: request.classCode.toUpperCase().trim(), bankId: request.bankId, classmates });
      }
      if (request.action !== 'compare' || Object.keys(request).some(k => !['action', 'exports'].includes(k)) || !Array.isArray(request.exports) || request.exports.length < 2 || request.exports.length > 8) throw input.error(400, 'invalid_comparison', 'Import evidence files from 2 to 8 individuals.');
      // Verify signatures and expiry before cache access. A cache never bypasses sharing checks.
      const snapshots = await Promise.all(request.exports.map(value => evidence.verify(value)));
      const prepared = input.cohort(snapshots);
      inputDigest = digest({ input: prepared, model: compareEngine.MODEL, harness: compareEngine.HARNESS_VERSION });
      // Validate the exact signed evidence before trusting any derived cache.
      const canonical = compareEngine.canonicalData(prepared);
      // Identical evidence may be exported again without another paid analysis.
      // Refresh sharing provenance while retaining the original analysis timestamp.
      const withSharingDates = value => {
        if (!verifiedReport(value, prepared, canonical, inputDigest, compareEngine)) throw input.error(503, 'invalid_comparison_cache', 'The saved comparison cannot be verified. Your evidence files remain available.');
        return Object.assign({}, value, { statistics: prepared.statistics, audit: Object.assign({}, value.audit, {
          evidenceCreatedAt: snapshots.map(s => s.createdAt), evidenceExpiresAt: Math.min(...snapshots.map(s => s.expiresAt))
        }) });
      };
      const cached = await store.getCached(session.id, inputDigest);
      if (cached) return res.status(200).json(withSharingDates(cached));
      if (!env.DEEPSEEK_API_KEY) throw input.error(503, 'no_key', 'AI comparison is not configured. Your evidence files remain available.');
      const reservation = await store.getOrReserve(session.id, inputDigest);
      if (reservation.state === 'cached') return res.status(200).json(withSharingDates(reservation.result));
      if (reservation.state === 'busy') { res.setHeader('Retry-After', '15'); return res.status(409).json({ code: 'comparison_busy', error: 'This comparison is already running. Try again shortly to retrieve its result.' }); }
      lease = reservation.leaseId;
      const result = await compareEngine.compare(prepared, { apiKey: env.DEEPSEEK_API_KEY });
      result.statistics = prepared.statistics;
      result.audit = Object.assign({}, result.audit, { inputDigest, questionSetVersion: prepared.questionSetVersion, evidenceCreatedAt: snapshots.map(s => s.createdAt), evidenceExpiresAt: Math.min(...snapshots.map(s => s.expiresAt)), analysisCompletedAt: Date.now(), harnessVersion: compareEngine.HARNESS_VERSION, requestedModel: compareEngine.MODEL });
      result.audit.resultDigest = reportDigest(result);
      if (!verifiedReport(result, prepared, canonical, inputDigest, compareEngine)) throw input.error(502, 'invalid_result', 'The comparison report could not be verified before saving.');
      await store.finish(session.id, inputDigest, lease, result);
      lease = null;
      return res.status(200).json(result);
    } catch (e) {
      if (lease) { try { await store.fail(session.id, inputDigest, lease, { code: e.code, audit: e.audit }); } catch (_) {} }
      const status = [400,401,403,409,413,429,502,503,504].includes(e.status) ? e.status : 503;
      const code = e.status && typeof e.code === 'string' && /^[a-z_]+$/.test(e.code) ? e.code : 'comparison_unavailable';
      if (status === 429) res.setHeader('Retry-After', '3600');
      const safe = e.status && e.code ? e.message : 'Comparison is temporarily unavailable. Your evidence files remain available.';
      return res.status(status).json({ code, error: safe });
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
