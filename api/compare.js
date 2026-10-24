'use strict';
const input = require('../server/comparison-input');
const sharing = require('../server/comparison-sharing');
const engine = require('../server/comparison-engine');
const markingStore = require('../server/marking-store');
const { digest } = require('../server/marking-input');
const jobs = markingStore.createStore({ kind: 'comparison', limits: { perUser: 12, site: 40 } });
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
      if (request.action !== 'compare' || Object.keys(request).some(k => !['action', 'exports'].includes(k)) || !Array.isArray(request.exports) || request.exports.length < 2 || request.exports.length > 8) throw input.error(400, 'invalid_comparison', 'Import evidence files from 2 to 8 individuals.');
      // Verify signatures and expiry before cache access. A cache never bypasses sharing checks.
      const snapshots = await Promise.all(request.exports.map(value => evidence.verify(value)));
      const prepared = input.cohort(snapshots);
      inputDigest = digest({ input: prepared, model: compareEngine.MODEL, harness: compareEngine.HARNESS_VERSION });
      // Identical evidence may be exported again without another paid analysis.
      // Refresh sharing provenance while retaining the original analysis timestamp.
      const withSharingDates = value => Object.assign({}, value, { audit: Object.assign({}, value.audit, {
        evidenceCreatedAt: snapshots.map(s => s.createdAt), evidenceExpiresAt: Math.min(...snapshots.map(s => s.expiresAt))
      }) });
      const cached = await store.getCached(session.id, inputDigest);
      if (cached) return res.status(200).json(withSharingDates(cached));
      if (!env.DEEPSEEK_API_KEY) throw input.error(503, 'no_key', 'AI comparison is not configured. Your evidence files remain available.');
      // Input-size rejection happens before a paid reservation, never by truncating answers.
      compareEngine.canonicalData(prepared);
      const reservation = await store.getOrReserve(session.id, inputDigest);
      if (reservation.state === 'cached') return res.status(200).json(withSharingDates(reservation.result));
      if (reservation.state === 'busy') { res.setHeader('Retry-After', '15'); return res.status(409).json({ code: 'comparison_busy', error: 'This comparison is already running. Try again shortly to retrieve its result.' }); }
      lease = reservation.leaseId;
      const result = await compareEngine.compare(prepared, { apiKey: env.DEEPSEEK_API_KEY });
      result.statistics = prepared.statistics;
      result.audit = Object.assign({}, result.audit, { inputDigest, questionSetVersion: prepared.questionSetVersion, evidenceCreatedAt: snapshots.map(s => s.createdAt), evidenceExpiresAt: Math.min(...snapshots.map(s => s.expiresAt)), analysisCompletedAt: Date.now(), harnessVersion: compareEngine.HARNESS_VERSION, requestedModel: compareEngine.MODEL });
      if (Buffer.byteLength(JSON.stringify(result)) > 64000) throw input.error(502, 'invalid_result', 'The comparison report exceeded its storage limit.');
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
