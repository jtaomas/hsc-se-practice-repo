'use strict';
const assert = require('node:assert/strict');
const { createHandler } = require('../api/improve');
const real = require('../server/improvement-engine');
const canonical = require('../server/marking-input');
const fixture = require('./improvement_fixtures');
const clone = value => JSON.parse(JSON.stringify(value));
function context() {
  const calls = [], records = new Map(); let failure = null;
  const storage = {
    async authorize(headers) { calls.push('authorize'); if (headers.authorization !== 'Bearer mock') throw Object.assign(new Error('Sign in.'), { status: 401, code: 'auth_required' }); return { id: 'a'.repeat(64) }; },
    async getCached(_id, digest) { calls.push('cache'); return records.get(digest) || null; },
    async getOrReserve(_id, digest) { calls.push('reserve'); if (failure === 'quota') throw Object.assign(new Error('Daily allowance reached.'), { status: 429, code: 'quota_exceeded' }); if (failure === 'busy') return { state: 'busy' }; return records.has(digest) ? { state: 'cached', result: records.get(digest) } : { state: 'reserved', leaseId: 'mock-lease' }; },
    async finish(_id, digest, _lease, result) { calls.push('finish'); if (failure === 'persist') throw new Error('PRIVATE STORAGE DETAIL'); records.set(digest, clone(result)); },
    async fail() { calls.push('fail'); }
  };
  const input = fixture.input();
  const engine = { MODEL: real.MODEL, HARNESS_VERSION: real.HARNESS_VERSION, async improve(prepared) { calls.push('coach'); if (failure === 'provider') throw Object.assign(new Error('Provider unavailable.'), { status: 502, code: 'provider_error' }); const proposal = fixture.proposal(prepared), base = real.review(prepared, 'fixture'); return { ...base, ...proposal, status: 'ready', quality: prepared.quality.map(q => ({ ...q, ...proposal.quality.find(p => p.id === q.id) })), limitations: [...base.limitations, ...proposal.limitations], audit: fixture.coachAudit() }; } };
  const deps = { engine, store: storage, input: { prepare: async (_body, options) => { calls.push('input'); assert.equal(options.sessionId, 'a'.repeat(64)); return input; } }, env: { DEEPSEEK_API_KEY: 'mock' } };
  return { deps, calls, records, input, setFailure(value) { failure = value; } };
}
async function invoke(handler, body = {}, auth = 'Bearer mock', method = 'POST') {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; } };
  await handler({ body, method, headers: { authorization: auth } }, res); return res;
}
(async () => {
  const c = context(), handler = createHandler(c.deps);
  assert.equal((await invoke(handler, {}, '')).code, 401); assert(!c.calls.includes('input')); assert(!c.calls.includes('reserve'));
  const first = await invoke(handler); assert.equal(first.code, 200); assert.equal(first.value.status, 'ready'); assert.match(first.value.audit.inputDigest, /^[a-f0-9]{64}$/); assert.equal(c.calls.at(-1), 'finish');
  const stored = [...c.records.values()][0]; assert.equal(stored.mark, null); assert.equal(stored.status, 'marked'); assert.equal(stored.improvement.status, 'ready');
  c.deps.env.DEEPSEEK_API_KEY = ''; assert.equal((await invoke(handler)).value.status, 'ready'); assert.equal(c.calls.filter(v => v === 'coach').length, 1);
  const cacheKey = [...c.records.keys()][0], validCache = clone(c.records.get(cacheKey));
  for (const mutate of [r => { r.improvement.coverage.pendingMaxMarks = 0; }, r => { r.improvement.quality[0].rating = 10; }, r => { r.improvement.plan[0].evidencePartIds = ['99.0']; }, r => { r.improvement.audit.inputDigest = 'f'.repeat(64); }, r => { r.improvement.audit.checks.auditorApproved = false; }, r => { r.improvement.audit.auditor.checks.technicalCorrectness = 'fail'; }, r => { r.improvement.summary += ' An unaudited statement.'; }, r => { r.improvement.plan[0].exercise += ' An unaudited exercise.'; }, r => { r.improvement.quality[0].feedback += ' An unaudited explanation.'; }, r => { r.status = 'needs_review'; }, r => { r.improvement.audit.calls = []; }, r => { r.improvement.audit.returnedModels[1] = 'wrong-model'; }]) {
    const corrupt = clone(validCache); mutate(corrupt); c.records.set(cacheKey, corrupt); const rejected = await invoke(handler); assert.equal(rejected.code, 503); assert.equal(rejected.value.code, 'invalid_improvement_cache');
  }
  c.records.set(cacheKey, validCache); assert.equal((await invoke(handler)).value.status, 'ready'); assert.equal(c.calls.filter(v => v === 'coach').length, 1);
  c.input.parts[0].markingDigest = 'changed'; assert.equal((await invoke(handler)).value.code, 'no_key'); c.deps.env.DEEPSEEK_API_KEY = 'mock';
  for (const [kind, code] of [['quota', 429], ['busy', 409], ['provider', 502], ['persist', 503]]) {
    c.setFailure(kind); c.input.parts[0].markingDigest = kind;
    const response = await invoke(handler); assert.equal(response.code, code); assert(!JSON.stringify(response.value).includes('PRIVATE')); if (kind === 'quota') assert.equal(response.headers['Retry-After'], '3600');
  }
  assert(c.calls.includes('fail')); assert.equal((await invoke(handler, {}, '', 'PUT')).code, 405);
  const invalidFresh = context(), normalImprove = invalidFresh.deps.engine.improve; invalidFresh.deps.engine.improve = async prepared => { const result = await normalImprove(prepared); result.audit.calls = []; return result; };
  const invalidResponse = await invoke(createHandler(invalidFresh.deps)); assert.equal(invalidResponse.code, 502); assert.equal(invalidResponse.value.code, 'invalid_result'); assert(!invalidFresh.calls.includes('finish')); assert(invalidFresh.calls.includes('fail'));
  const insufficient = context(); insufficient.input.parts.forEach(p => { p.blank = true; p.mark = 0; });
  const noEvidence = await invoke(createHandler(insufficient.deps)); assert.equal(noEvidence.value.status, 'needs_review'); assert(!insufficient.calls.includes('reserve'));
  // Complete canonical bank -> real evidence preparation -> real two-call coach
  // -> persistence, with fake provider Responses and an in-memory private store.
  const integration = context(); delete integration.deps.input; let requests = 0;
  integration.deps.engine = { ...real, improve: (data, options) => real.improve(data, { ...options, fetch: async (_url, config) => {
    requests++; const request = JSON.parse(config.body); assert(!request.tools);
    let output;
    if (requests === 1) {
      const part = data.parts.find(p => !p.blank && p.mark !== null);
      output = { summary: 'One objective selection is confirmed. More written response evidence is needed before identifying writing or explanation patterns.', strengths: [{ title: 'Correct objective selection', detail: 'This selection matches the canonical answer.', evidence: [{ partId: part.partId, source: 'objective', quote: part.objective.slice(0, 350) }] }], knowledgeGaps: [], writingPatterns: [], quality: data.quality.map(q => ({ id: q.id, feedback: 'No applicable confirmed written evidence is available for this factor.', action: 'Complete and mark an applicable response before judging this factor.', evidencePartIds: [] })), plan: [{ priority: 1, title: 'Optional: Explain the selected answer', why: 'The objective choice is correct but does not show the reasoning behind it.', evidencePartIds: [part.partId], steps: ['State the selected answer in a sentence.', 'Explain why one alternative does not satisfy the question.'], exercise: 'Write a short explanation of the selected answer using the question context.', successCheck: 'The explanation includes one accurate reason supporting the choice and one accurate reason rejecting an alternative.', schedule: 'Next practice session.' }], limitations: ['Closed selections cannot establish prose style.'] };
    } else output = fixture.coachApproval();
    return new Response(JSON.stringify({ model: real.MODEL, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }] }));
  } }) };
  const bank = canonical.loadBanks().find(b => b.id === '1'), payload = { bankId: '1', answers: bank.qs.flatMap((q, qi) => q.it.map((it, i) => ({ questionNumber: qi + 1, partIndex: i, answer: null }))) };
  const blankMappings = clone(payload), blankContext = context(); delete blankContext.deps.input;
  for (const entry of blankMappings.answers) {
    const item = bank.qs[entry.questionNumber - 1].it[entry.partIndex];
    if (['dd', 'mt', 'dm', 'od'].includes(item.t)) entry.answer = { '0': null };
    if (item.t === 'gd') { let key; item.r.some((row, ri) => row.some((cell, ci) => { if (typeof cell !== 'string') { key = ri + ',' + ci; return true; } return false; })); entry.answer = { [key]: null }; }
  }
  const blankResponse = await invoke(createHandler(blankContext.deps), blankMappings);
  assert.equal(blankResponse.code, 200); assert.equal(blankResponse.value.status, 'needs_review'); assert.equal(blankResponse.value.coverage.blankParts, blankMappings.answers.length); assert(!blankContext.calls.includes('reserve')); assert(!blankContext.calls.includes('coach'));
  payload.answers[0].answer = bank.qs[0].it[0].a;
  const integrated = await invoke(createHandler(integration.deps), payload);
  assert.equal(integrated.code, 200); assert.equal(integrated.value.status, 'ready'); assert.equal(requests, 2); assert.equal(integrated.value.coverage.knownMark, 1); assert.equal(integration.records.size, 1);
  const tampered = { ...payload, feedback: 'Invented feedback' }; const before = requests;
  assert.equal((await invoke(createHandler(integration.deps), tampered)).code, 400); assert.equal(requests, before);
  console.log('Improvement API OK: auth before evidence/spend, shared cache/quota, immutable mark wrapper, cache invalidation, failure persistence, no-evidence fallback and canonical two-call integration. MOCKS ONLY.');
})().catch(e => { console.error(e); process.exitCode = 1; });
