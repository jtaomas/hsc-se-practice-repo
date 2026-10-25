const assert = require('node:assert/strict');
const { createHandler } = require('../api/mark');
const realEngine = require('../server/marking-engine');
const inputs = require('../server/marking-input');
const { QUALITY_FACTORS } = require('../server/feedback-policy');
const { markerAudit } = require('./improvement_fixtures');
const body = { bankId: '1', questionNumber: 18, partIndex: 0, answer: 'Hashing is one way.' };
function context() {
  const calls = [], records = new Map(); let failure = null;
  const result = { status: 'marked', mark: 1, summary: 'One idea credited.', strengths: ['Hashing'], improve: ['Explain salting.'], advice: [],
    criteria: inputs.prepare(body).input.criteria.map((c, i) => ({ id: c.id, assessment: i === 2 ? 'met' : 'context', evidence: i === 2 ? [body.answer] : [], basis: i === 2 ? 'One idea is identified.' : 'This higher band is not selected.' })),
    losses: { allocation: 'holistic', totalLost: 2, items: [{ category: 'insufficient_explanation', marksLost: null, criterionIds: ['c1', 'c2'], evidence: [], explanation: 'The role of salt is not explained.', action: 'Explain how unique salts affect precomputed lookups.' }] },
    quality: QUALITY_FACTORS.map(id => ({ id, rating: id === 'technical_accuracy' ? 8 : null, evidence: id === 'technical_accuracy' ? [body.answer] : [], feedback: id === 'technical_accuracy' ? 'The one-way property is correctly identified.' : 'There is insufficient applicable evidence.', action: 'Explain the role of salts.' })), audit: {} };
  const storage = {
    async authorize(headers) { calls.push('authorize'); if (headers.authorization !== 'Bearer mock') throw Object.assign(new Error('Sign in.'), { status: 401, code: 'auth_required' }); return { id: 'a'.repeat(64) }; },
    async getCached(id, digest) { calls.push('cache'); return records.get(digest) || null; },
    async getOrReserve(id, digest, options) { calls.push('reserve'); storage.lastReserve = { digest, options }; if (options && options.replace) return { state: 'reserved', leaseId: 'lease' }; if (failure === 'quota') throw Object.assign(new Error('Allowance reached.'), { status: 429, code: 'quota_exceeded' }); if (failure === 'busy') return { state: 'busy' }; return records.has(digest) ? { state: 'cached', result: records.get(digest) } : { state: 'reserved', leaseId: 'lease' }; },
    async finish(id, digest, lease, output) { calls.push('finish'); if (failure === 'persist') throw new Error('PRIVATE STORAGE DETAIL'); records.set(digest, output); },
    async fail(id, digest, lease, diagnostic) { calls.push('fail'); storage.lastFailure = diagnostic; }
  };
  const engine = { ...realEngine, async mark(input) {
    calls.push(['mark', input]);
    if (failure === 'provider') throw Object.assign(new Error('Provider unavailable.'), { status: 502, code: 'provider_error', audit: { calls: [{ stage: 'marker1', status: 'failed', errorCode: 'provider_error' }] } });
    const output = JSON.parse(JSON.stringify(result));
    if (output.status === 'marked') {
      output.criteria.forEach(c => { if (c.evidence.length) c.evidence = [input.answer]; });
      output.quality.forEach(q => { if (q.evidence.length) q.evidence = [input.answer]; });
      output.audit = markerAudit(output);
    } else output.audit = { harnessVersion: realEngine.HARNESS_VERSION, requestedModel: realEngine.MODEL, reasons: ['auditor_veto'], checks: { auditorApproved: false }, calls: [] };
    return output;
  } };
  const env = { DEEPSEEK_API_KEY: 'mock-only' };
  return { storage, engine, env, calls, records, result, setFailure: x => { failure = x; } };
}
async function invoke(handler, input = body, auth = 'Bearer mock') {
  const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(value) { this.value = value; return this; } };
  await handler({ method: 'POST', body: input, headers: { authorization: auth } }, response);
  return response;
}
(async () => {
  const c = context(), handler = createHandler({ store: c.storage, engine: c.engine, env: c.env });
  assert.equal((await invoke(handler, body, '')).code, 401);
  assert(!c.calls.includes('reserve'));
  assert.equal((await invoke(handler, { ...body, sample: 'Attacker answer' })).code, 400);
  const first = await invoke(handler);
  assert.equal(first.code, 200); assert.equal(first.value.mark, 1);
  assert.match(first.value.audit.inputDigest, /^[a-f0-9]{64}$/);
  assert.match(first.value.audit.answerDigest, /^[a-f0-9]{64}$/);
  const input = c.calls.find(x => Array.isArray(x))[1];
  assert.match(input.question, /hashing and salting/); assert.equal(input.maxMarks, 3); assert(!('tests' in input));
  assert.equal(c.calls.at(-1), 'finish');
  await invoke(handler); assert.equal(c.calls.filter(Array.isArray).length, 1, 'cached decisions must not call provider again');
  // An explicit re-mark asks the store to replace the saved decision and calls the provider again, with the
  // same input digest; anything but a boolean is rejected before any spend.
  const cachedDigest = c.storage.lastReserve.digest;
  assert.equal(c.storage.lastReserve.options, undefined);
  const remarked = await invoke(handler, { ...body, remark: true });
  assert.equal(remarked.code, 200); assert.deepEqual(c.storage.lastReserve, { digest: cachedDigest, options: { replace: true } });
  assert.equal(c.calls.filter(Array.isArray).length, 2, 'a re-mark calls the provider again');
  assert.equal((await invoke(handler, { ...body, remark: false })).code, 200); assert.equal(c.storage.lastReserve.options, undefined);
  assert.equal(c.calls.filter(Array.isArray).length, 2);
  const reservesBefore = c.calls.filter(x => x === 'reserve').length;
  assert.equal((await invoke(handler, { ...body, remark: 'yes' })).code, 400);
  assert.equal(c.calls.filter(x => x === 'reserve').length, reservesBefore);
  c.env.DEEPSEEK_API_KEY = '';
  assert.equal((await invoke(handler)).value.mark, 1);
  assert.equal((await invoke(handler, { ...body, answer: 'uncached' })).value.code, 'no_key');
  c.env.DEEPSEEK_API_KEY = 'mock-only';
  const empty = await invoke(handler, { ...body, answer: '' }); assert.equal(empty.value.mark, 0);
  assert.equal(empty.value.losses.items[0].category, 'no_response');
  assert.equal(empty.value.losses.totalLost, 3);assert(empty.value.quality.every(f => f.rating === null));
  const before = c.calls.filter(Array.isArray).length;
  const diagram = await invoke(handler, { bankId: '1', questionNumber: 22, partIndex: 0, answer: { elements: [{ id: 'r', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }] } });
  assert.equal(diagram.value.status, 'needs_review'); assert.equal(diagram.value.mark, null); assert.equal(c.calls.filter(Array.isArray).length, before);
  for (const [kind, code] of [['quota', 429], ['busy', 409], ['provider', 502], ['persist', 503]]) {
    c.setFailure(kind); const r = await invoke(handler, { ...body, answer: kind }); assert.equal(r.code, code); assert(!JSON.stringify(r.value).includes('PRIVATE'));
    if (kind === 'provider') { assert.equal(c.storage.lastFailure.code, 'provider_error'); assert.equal(c.storage.lastFailure.audit.calls[0].stage, 'marker1'); assert(!('audit' in r.value)); }
  }
  assert(c.calls.includes('fail'));
  // Full API -> canonical bank -> real engine -> persistence, with ONLY fake provider Responses.
  for (const recoverConnection of [false, true]) {
  const e = context(); let requests = 0, completedRequests = 0;
  e.engine = { ...realEngine, mark: (input, options) => realEngine.mark(input, { ...options, fetch: async (_url, request) => {
    requests++;
    if (recoverConnection && requests === 1) throw Object.assign(new TypeError('Synthetic connection failure'), { cause: { code: 'EAI_AGAIN' } });
    completedRequests++; const p = JSON.parse(request.body); assert.equal(p.model, require('../server/ai-provider').current().model); assert.equal(p.reasoning_effort, completedRequests <= 2 ? 'high' : 'low');
    let output;
    if (completedRequests <= 2) output = { status: 'marked', mark: 1, summary: 'You identify one-way hashing.', strengths: ['One-way hashing'], improve: ['Explain how a unique random salt protects passwords.'], advice: [], criteria: input.criteria.map((c, i) => ({ id: c.id, assessment: i === 2 ? 'met' : 'context', evidence: i === 2 ? ['Hashing is one way.'] : [], basis: i === 2 ? 'One idea identified.' : 'A higher band requires more detail.' })), uncertainties: [] };
    else output = { checks: Object.fromEntries(Object.keys(realEngine.AUDIT_CHECKS).map(id => [id, 'pass'])), issues: [], selectedFeedback: 0 };
    if(completedRequests<=2){
      output.losses={allocation:'holistic',totalLost:2,items:[{category:'insufficient_explanation',marksLost:null,criterionIds:[input.criteria[0].id,input.criteria[1].id],evidence:[],explanation:'The answer identifies hashing but does not explain salt or protection.',action:'Explain the effect of a unique salt on precomputed lookups.'}]};
      output.quality=require('../server/feedback-policy').QUALITY_FACTORS.map(id=>({id,rating:id==='technical_accuracy'?8:null,evidence:id==='technical_accuracy'?['Hashing is one way.']:[],feedback:id==='technical_accuracy'?'The explicit one-way claim is accurate.':'The brief response gives too little evidence, or this factor is inapplicable.',action:'Explain how hashing and salting work together.'}));
    }
    return new Response(JSON.stringify({ model: require('../server/ai-provider').current().model, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }], usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } }), { status: 200 });
  } }) };
  const integrated = await invoke(createHandler({ store: e.storage, engine: e.engine, env: e.env }));
  assert.equal(integrated.code, 200); assert.equal(integrated.value.status, 'marked'); assert.equal(requests, recoverConnection ? 4 : 3); assert.equal(e.records.size, 1);
  assert.equal(integrated.value.audit.networkAttempts, requests);
  assert.equal(integrated.value.audit.calls.length, 3);
  e.env.DEEPSEEK_API_KEY = '';
  assert.equal((await invoke(createHandler({ store: e.storage, engine: e.engine, env: e.env }))).value.mark, 1, 'a recovered confirmed result remains verifiable from cache without another provider call');
  assert.equal(requests, recoverConnection ? 4 : 3);
  }

  // Exercise BOTH direct reads without a key and cached reservation responses.
  // Re-sealing selected corruptions proves canonical/schema checks are needed
  // in addition to the checksum; this is not a public signing capability.
  const mutations = [
    ['input hash', r => { r.audit.inputDigest = 'f'.repeat(64); }],
    ['answer hash', r => { r.audit.answerDigest = 'f'.repeat(64); }],
    ['question hash', r => { r.audit.questionVersion = 'f'.repeat(64); }],
    ['rubric hash', r => { r.audit.rubricVersion = 'f'.repeat(64); }],
    ['harness', r => { r.audit.harnessVersion = 'old-version'; }],
    ['model', r => { r.audit.requestedModel = 'wrong-model'; }],
    ['approval', r => { r.audit.checks.auditorApproved = false; }],
    ['positive auditor', r => { r.audit.auditor.checks.qualityGrounding = 'fail'; r.audit.auditor.issueCount = 1; }],
    ['completed calls', r => { r.audit.calls[2].status = 'failed'; }],
    ['blind agreement', r => { r.audit.proposals[1].mark = 2; }],
    ['feedback selection', r => { r.audit.selectedFeedback = 1; }],
    ['feedback eligibility', r => { r.audit.feedbackCandidates[0].eligible = false; r.audit.feedbackCandidates[0].problem = 'quality_schema'; }],
    ['changed summary', r => { r.summary += ' An unaudited statement.'; }],
    ['changed factor', r => { r.quality[0].rating = 1; }],
    ['fabricated criterion quote', r => { r.criteria[2].evidence = ['Never submitted.']; }, true],
    ['unknown criterion', r => { r.criteria[2].id = 'invented'; }, true],
    ['duplicate criterion', r => { r.criteria[2].id = r.criteria[1].id; }, true],
    ['fabricated factor quote', r => { r.quality[2].evidence = ['Never submitted.']; }, true],
    ['loss arithmetic', r => { r.losses.totalLost = 1; }, true],
    ['oversized summary', r => { r.summary = 'x'.repeat(601); }, true],
    ['oversized criterion basis', r => { r.criteria[0].basis = 'x'.repeat(601); }, true],
    ['extra criterion field', r => { r.criteria[0].unapproved = 'extra'; }, true],
    ['extra public field', r => { r.unapproved = 'extra'; }, true],
    ['missing scored feedback', r => { r.improve = []; }, true],
    ['missing credited strength', r => { r.strengths = []; }, true]
  ];
  for (const withKey of [false, true]) for (const [name, mutate, reseal] of mutations) {
    const c = context(), h = createHandler({ store: c.storage, engine: c.engine, env: c.env });
    assert.equal((await invoke(h)).code, 200);
    const saved = [...c.records.values()][0]; mutate(saved);
    if (reseal) saved.audit = { ...saved.audit, ...markerAudit(saved) };
    const before = JSON.stringify(saved); c.calls.length = 0;
    c.env.DEEPSEEK_API_KEY = withKey ? 'mock-only' : '';
    const rejected = await invoke(h);
    assert.equal(rejected.code, 503, name + ':' + withKey);
    assert.equal(rejected.value.code, 'invalid_marking_cache', name);
    assert.equal(rejected.value.mark, undefined); assert.equal(rejected.value.audit, undefined);
    assert(!c.calls.some(Array.isArray)); assert(!c.calls.includes('finish')); assert(!c.calls.includes('fail'));
    assert.equal(c.calls.includes('reserve'), withKey);
    assert.equal(JSON.stringify(saved), before, 'invalid records are not repaired, overwritten or rerolled');
  }

  // Confirmed abstentions are valid cached decisions, but rejected diagnostics
  // or a numeric grade must never be returned with a review status.
  for (const withKey of [false, true]) {
    const c = context(); Object.assign(c.result, { status: 'needs_review', mark: null, summary: 'The marking checks require review.',
      strengths: [], improve: [], advice: [], criteria: [], losses: { allocation: 'unavailable', totalLost: null, items: [] }, quality: [] });
    const h = createHandler({ store: c.storage, engine: c.engine, env: c.env });
    assert.equal((await invoke(h)).value.status, 'needs_review');
    c.env.DEEPSEEK_API_KEY = withKey ? 'mock-only' : ''; c.calls.length = 0;
    const accepted = await invoke(h); assert.equal(accepted.code, 200); assert.equal(accepted.value.mark, null); assert(!c.calls.some(Array.isArray));
    const saved = [...c.records.values()][0], baseline = JSON.parse(JSON.stringify(saved));
    for (const mutate of [r => { r.mark = 1; }, r => { r.strengths = ['Unapproved feedback']; }, r => { r.criteria = [{ id: 'c1' }]; },
      r => { r.quality = [{ id: 'clarity', rating: 8 }]; }, r => { r.losses.totalLost = 0; }, r => { r.audit.reasons = []; }]) {
      Object.assign(saved, JSON.parse(JSON.stringify(baseline))); mutate(saved);
      const rejected = await invoke(h); assert.equal(rejected.code, 503); assert.equal(rejected.value.code, 'invalid_marking_cache');
    }
  }

  for (const mutate of [r => { r.summary = 'x'.repeat(601); }, r => { r.losses.totalLost = 1; }, r => { r.criteria[0].id = 'unknown'; }]) {
    const c = context(); mutate(c.result);
    const rejected = await invoke(createHandler({ store: c.storage, engine: c.engine, env: c.env }));
    assert.equal(rejected.code, 502); assert.equal(rejected.value.code, 'invalid_result');
    assert.equal(c.records.size, 0); assert(!c.calls.includes('finish')); assert(c.calls.includes('fail'));
  }
  // Deterministic empty/unsupported answers bypass provider, cache and quota,
  // including when the provider key is absent.
  const deterministic = context(); deterministic.env.DEEPSEEK_API_KEY = '';
  const dh = createHandler({ store: deterministic.storage, engine: deterministic.engine, env: deterministic.env });
  assert.equal((await invoke(dh, { ...body, answer: '' })).value.mark, 0);
  assert.equal((await invoke(dh, { bankId: '1', questionNumber: 22, partIndex: 0, answer: { elements: [{ id: 'r', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }] } })).value.status, 'needs_review');
  assert.deepEqual(deterministic.calls, ['authorize', 'authorize']);
  console.log('Marking API OK: auth/input before spend, strict canonical cached/fresh decisions, no reroll, deterministic outcomes, persistence and complete three-call workflow');
})().catch(e => { console.error(e); process.exitCode = 1; });
