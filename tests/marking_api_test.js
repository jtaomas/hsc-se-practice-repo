const assert = require('node:assert/strict');
const { createHandler } = require('../api/mark');
const realEngine = require('../server/marking-engine');
const body = { bankId: '1', questionNumber: 18, partIndex: 0, answer: 'Hashing is one way.' };
function context() {
  const calls = [], records = new Map(); let failure = null;
  const result = { status: 'marked', mark: 1, summary: 'One idea credited.', strengths: ['Hashing'], improve: ['Explain salting.'], advice: [], criteria: [], audit: {} };
  const storage = {
    async authorize(headers) { calls.push('authorize'); if (headers.authorization !== 'Bearer mock') throw Object.assign(new Error('Sign in.'), { status: 401, code: 'auth_required' }); return { id: 'a'.repeat(64) }; },
    async getCached(id, digest) { calls.push('cache'); return records.get(digest) || null; },
    async getOrReserve(id, digest) { calls.push('reserve'); if (failure === 'quota') throw Object.assign(new Error('Allowance reached.'), { status: 429, code: 'quota_exceeded' }); if (failure === 'busy') return { state: 'busy' }; return records.has(digest) ? { state: 'cached', result: records.get(digest) } : { state: 'reserved', leaseId: 'lease' }; },
    async finish(id, digest, lease, output) { calls.push('finish'); if (failure === 'persist') throw new Error('PRIVATE STORAGE DETAIL'); records.set(digest, output); },
    async fail(id, digest, lease, diagnostic) { calls.push('fail'); storage.lastFailure = diagnostic; }
  };
  const engine = { MODEL: 'deepseek-flash', HARNESS_VERSION: 'test-v1', async mark(input) { calls.push(['mark', input]); if (failure === 'provider') throw Object.assign(new Error('Provider unavailable.'), { status: 502, code: 'provider_error', audit: { calls: [{ stage: 'marker1', status: 'failed', errorCode: 'provider_error' }] } }); return JSON.parse(JSON.stringify(result)); } };
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
  const input = c.calls.find(x => Array.isArray(x))[1];
  assert.match(input.question, /hashing and salting/); assert.equal(input.maxMarks, 3); assert(!('tests' in input));
  assert.equal(c.calls.at(-1), 'finish');
  await invoke(handler); assert.equal(c.calls.filter(Array.isArray).length, 1, 'cached decisions must not call provider again');
  c.env.DEEPSEEK_API_KEY = '';
  assert.equal((await invoke(handler)).value.mark, 1);
  assert.equal((await invoke(handler, { ...body, answer: 'uncached' })).value.code, 'no_key');
  c.env.DEEPSEEK_API_KEY = 'mock-only';
  const empty = await invoke(handler, { ...body, answer: '' }); assert.equal(empty.value.mark, 0);
  const before = c.calls.filter(Array.isArray).length;
  const diagram = await invoke(handler, { bankId: '1', questionNumber: 22, partIndex: 0, answer: { elements: [{ id: 'r', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }] } });
  assert.equal(diagram.value.status, 'needs_review'); assert.equal(diagram.value.mark, null); assert.equal(c.calls.filter(Array.isArray).length, before);
  for (const [kind, code] of [['quota', 429], ['busy', 409], ['provider', 502], ['persist', 503]]) {
    c.setFailure(kind); const r = await invoke(handler, { ...body, answer: kind }); assert.equal(r.code, code); assert(!JSON.stringify(r.value).includes('PRIVATE'));
    if (kind === 'provider') { assert.equal(c.storage.lastFailure.code, 'provider_error'); assert.equal(c.storage.lastFailure.audit.calls[0].stage, 'marker1'); assert(!('audit' in r.value)); }
  }
  assert(c.calls.includes('fail'));
  // Full API -> canonical bank -> real engine -> persistence, with ONLY fake provider Responses.
  const e = context(); let requests = 0;
  e.engine = { ...realEngine, mark: (input, options) => realEngine.mark(input, { ...options, fetch: async (_url, request) => {
    requests++; const p = JSON.parse(request.body); assert.equal(p.model, 'deepseek-flash'); assert.equal(p.reasoning_effort, 'high');
    let output;
    if (requests <= 2) output = { status: 'marked', mark: 1, summary: 'You identify one-way hashing.', strengths: ['One-way hashing'], improve: ['Explain how a unique random salt protects passwords.'], advice: [], criteria: input.criteria.map((c, i) => ({ id: c.id, assessment: i === 2 ? 'met' : 'not_met', evidence: i === 2 ? ['Hashing is one way.'] : [], basis: i === 2 ? 'One idea identified.' : 'More detail is required.' })), uncertainties: [] };
    else output = { confirm: true, rubricFaithful: true, evidenceSupported: true, alternativesConsidered: true, noDoubleCounting: true, noInstructionFollowing: true, feedbackGrounded: true, adviceSeparated: true, reason: 'One mark is supported by the answer and rubric.', uncertainties: [] };
    return new Response(JSON.stringify({ model: 'deepseek-flash', choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }], usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 } }), { status: 200 });
  } }) };
  const integrated = await invoke(createHandler({ store: e.storage, engine: e.engine, env: e.env }));
  assert.equal(integrated.code, 200); assert.equal(integrated.value.status, 'marked'); assert.equal(requests, 3); assert.equal(e.records.size, 1);
  console.log('Marking API OK: auth/input before spend, canonical evidence, cache, persistence, failures and complete three-call workflow');
})().catch(e => { console.error(e); process.exitCode = 1; });
