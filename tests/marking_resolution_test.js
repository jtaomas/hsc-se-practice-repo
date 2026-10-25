'use strict';
// Full canonical/API/cache/coach boundary, using synthetic provider responses only.
const assert = require('node:assert/strict');
const engine = require('../server/marking-engine');
const inputTools = require('../server/marking-input');
const { createHandler } = require('../api/mark');
const improvement = require('../server/improvement-input');
const { QUALITY_FACTORS, scoringModel, unavailableFeedback } = require('../server/feedback-policy');
const body = { bankId: '8', questionNumber: 21, partIndex: 0, answer: 'SAST scans source code without executing the program.' };
const prepared = inputTools.prepare(body), input = prepared.input;
const clone = value => JSON.parse(JSON.stringify(value));
function proposal(mark) {
  const band = (scoringModel(input).bands || []).find(b => mark >= b.minMarks && mark <= b.maxMarks);
  return { status: 'marked', mark, summary: 'You describe static source analysis.', strengths: mark ? ['You describe source analysis without executing the program.'] : [], improve: mark < input.maxMarks ? ['Describe dynamic testing and compare the techniques.'] : [], advice: [],
    criteria: input.criteria.map(c => ({ id: c.id, assessment: !mark ? 'not_met' : c.id === band.id ? 'met' : 'context', evidence: mark && c.id === band.id ? [input.answer] : [], basis: !mark ? 'No credit established.' : c.id === band.id ? 'One technique is described.' : 'Unselected whole-answer band.' })), uncertainties: [],
    losses: { allocation: 'holistic', totalLost: input.maxMarks - mark, items: mark === input.maxMarks ? [] : [{ category: 'missing_requirement', marksLost: null, criterionIds: [input.criteria[0].id], evidence: [], explanation: 'Dynamic testing and a comparison are absent.', action: 'Describe running the application with test inputs and compare this to source inspection.' }] },
    quality: QUALITY_FACTORS.map(id => ({ id, rating: null, evidence: [], feedback: 'Insufficient applicable evidence in this fixture.', action: 'Review an applicable extended response.' })) };
}
function approval(selectedFeedback = 0) { return { checks: Object.fromEntries(Object.keys(engine.AUDIT_CHECKS).map(k => [k, 'pass'])), issues: [], selectedFeedback }; }
function veto() { const a = approval(null); a.checks.rubricAlignment = 'uncertain'; a.issues = [{ checkId: 'rubricAlignment', detail: 'The supplied proposals cannot be resolved confidently.' }]; return a; }
function mockEngine(values) {
  let calls = 0;
  return { ...engine, count: () => calls, mark: (data, options) => engine.mark(data, { ...options, fetch: async () => {
    const v = values[calls++]; assert(v !== undefined, 'unexpected extra call');
    return new Response(JSON.stringify({ model: engine.MODEL, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(v) } }] }));
  } }) };
}
function context(marking) {
  const records = new Map(), events = [], env = { DEEPSEEK_API_KEY: 'mock-only' };
  const store = { authorize: async () => ({ id: 'a'.repeat(64) }), getCached: async (_, key) => records.get(key), getOrReserve: async (_, key) => records.has(key) ? { state: 'cached', result: records.get(key) } : { state: 'reserved', leaseId: 'mock' }, finish: async (_, key, lease, r) => { events.push('finish'); records.set(key, r); }, fail: async (_, key, lease, d) => { events.push('fail'); store.failure = d; } };
  const handler = createHandler({ engine: marking, store, env });
  async function invoke() { const res = { setHeader() {}, status(n) { this.code = n; return this; }, json(value) { this.value = value; } }; await handler({ method: 'POST', body, headers: {} }, res); return res; }
  return { records, events, env, store, invoke };
}
(async () => {
  for (const resolve of [true, false]) {
    const marking = mockEngine([proposal(1), proposal(2), resolve ? approval(0) : veto()]), c = context(marking);
    const r = await c.invoke(); assert.equal(r.code, 200); assert.equal(r.value.mark, 1);
    assert.equal(r.value.status, resolve ? 'marked' : 'provisional'); assert.equal(r.value.audit.checks.blindAgreement, false);
    assert.equal(marking.count(), 3); assert.deepEqual(c.events, ['finish']);
    assert.equal(resolve ? engine.confirmedProvenanceProblem(r.value) : engine.provisionalProvenanceProblem(r.value), null);
    const a = r.value.audit;
    assert.equal(improvement.cacheValid(r.value, prepared, a.inputDigest, a.answerDigest, engine), resolve);
    assert.equal(improvement.cacheValid(r.value, prepared, a.inputDigest, a.answerDigest, engine, { allowProvisional: true }), true);
    c.env.DEEPSEEK_API_KEY = ''; assert.equal((await c.invoke()).value.mark, 1); assert.equal(marking.count(), 3);
    if (!resolve) {
      assert.deepEqual(r.value.losses, unavailableFeedback().losses); assert.deepEqual(r.value.quality, []);
      assert(engine.confirmedProvenanceProblem(r.value));
      const saved = clone(r.value);
      for (const mutate of [v => { v.status = 'marked'; }, v => { v.mark = 2; }, v => { v.criteria[2].evidence = ['fabricated text']; }, v => { v.audit.proposalStages[0] = 'marker2'; }, v => { v.quality = [{ id: 'clarity', rating: 10 }]; }]) {
        const corrupt = clone(saved); mutate(corrupt); corrupt.audit.feedbackDigest = engine.selectedFeedbackDigest(corrupt); c.records.set(a.inputDigest, corrupt);
        const rejected = await c.invoke(); assert.equal(rejected.value.code, 'invalid_marking_cache'); assert.equal(marking.count(), 3);
      }
      c.records.set(a.inputDigest, saved);
      const bank = inputTools.loadBanks().find(b => b.id === '8');
      const answers = bank.qs.flatMap((q, qi) => q.it.map((it, i) => ({ questionNumber: qi + 1, partIndex: i, answer: qi + 1 === 21 && i === 0 ? body.answer : null })));
      const planInput = await improvement.prepare({ bankId: '8', answers }, { store: c.store, sessionId: 'a'.repeat(64), marker: engine });
      const part = planInput.parts.find(p => p.partId === '21.0');
      assert.equal(part.mark, null); assert.equal(part.status, 'unmarked'); assert.equal(part.feedback, ''); assert.deepEqual(part.quality, []);
    }
  }
  // A formatting failure of both original and replacement outputs is retryable,
  // consumes no fake zero and is not cached as a terminal review result.
  const malformed = proposal(1); malformed.criteria[2].basis = '';
  const marking = mockEngine([malformed, malformed, malformed, malformed]), c = context(marking);
  const r = await c.invoke(); assert.equal(r.code, 502); assert.equal(r.value.code, 'marking_unresolved'); assert(!('mark' in r.value));
  assert.deepEqual(c.events, ['fail']); assert.equal(c.records.size, 0); assert.equal(marking.count(), 4);
  assert.equal(c.store.failure.audit.calls[0].criterionDiagnostics.issues[0].code, 'basis_empty');
  console.log('Marking resolution integration OK: real canonical engine, audited adjudication, honest provisional cache, tamper refusal, coach exclusion and retryable no-score failure.');
})().catch(e => { console.error(e); process.exitCode = 1; });
