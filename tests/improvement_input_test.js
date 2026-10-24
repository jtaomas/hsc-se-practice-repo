'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const tools = require('../server/improvement-input'), source = require('../server/marking-input');
const marker = require('../server/marking-engine');
const { QUALITY_FACTORS, scoringModel } = require('../server/feedback-policy');
const banks = source.loadBanks().filter(b => !b.hidden);
const clone = value => JSON.parse(JSON.stringify(value));
function blank(bank = banks[0]) { return { bankId: bank.id, answers: bank.qs.flatMap((q, qi) => q.it.map((it, i) => ({ questionNumber: qi + 1, partIndex: i, answer: null }))) }; }
function record(payload, png) {
  const prepared = source.prepare({ bankId: '1', ...payload, ...(png ? { diagramPng: png } : {}) });
  const original = { input: prepared.input, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: marker.MODEL, harness: marker.HARNESS_VERSION };
  const inputDigest = source.digest(original), answerDigest = source.digest({ ...original, input: { ...prepared.input, diagramPng: null } });
  const evidence = prepared.input.type === 'diagram' ? prepared.input.diagramScene.elements[0].id : prepared.input.answer;
  const result = { status: 'marked', mark: prepared.input.maxMarks, summary: 'The modelled answer is fully credited by this test fixture.', strengths: ['A correct mechanism is explained.'], improve: [], advice: [], criteria: prepared.input.criteria.map((c, i) => ({ id: c.id, assessment: require('../server/feedback-policy').scoringModel(prepared.input).bands && i ? 'context' : 'met', evidence: [evidence], basis: 'Fixture credit.' })),
    losses: { allocation: scoringModel(prepared.input).kind === 'additive' ? 'exact' : 'holistic', totalLost: 0, items: [] }, quality: QUALITY_FACTORS.map(id => ({ id, rating: id === 'code_quality' || (id === 'diagram_quality' && prepared.input.type !== 'diagram') ? null : 8, evidence: id === 'code_quality' || (id === 'diagram_quality' && prepared.input.type !== 'diagram') ? [] : [evidence], feedback: 'Fixture evidence is assessable for this factor.', action: 'Check the same factor in a new response.' })),
    audit: { inputDigest, answerDigest, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, harnessVersion: marker.HARNESS_VERSION, requestedModel: marker.MODEL, checks: { auditorApproved: true } } };
  Object.assign(result.audit, require('./improvement_fixtures').markerAudit(result));
  return { result, inputDigest, prepared };
}
function optimal(it) {
  if (it.t === 'mc') return it.a;
  if (it.t === 'ms') return it.a.slice();
  if (it.t === 'tk') return it.r.flatMap((r, ri) => r[1].map(ci => ri + ',' + ci));
  if (it.t === 'dd') return Object.fromEntries(it.b.map((b, i) => [i, b[1]]));
  if (it.t === 'mt' || it.t === 'dm') return Object.fromEntries(it.r.map((r, i) => [i, r[1]]));
  if (it.t === 'od') return Object.fromEntries(it.lines.filter(l => l.k === 'slot').map((l, i) => [i, it.pool.indexOf(l.t)]));
  if (it.t === 'gd') { const a = {}; it.r.forEach((r, ri) => r.forEach((c, ci) => { if (typeof c !== 'string') a[ri + ',' + ci] = c[1]; })); return a; }
  return undefined;
}
(async () => {
  const cache = new Map(), options = { store: { getCached: async (_id, digest) => cache.get(digest) || null }, sessionId: 'test' };
  for (const bank of banks) { const marks = bank.mini ? bank.marks : 80; const out = await tools.prepare(blank(bank), options); assert.equal(out.coverage.totalMaxMarks, marks); assert.equal(out.coverage.pendingMaxMarks, 0); assert.equal(out.coverage.knownMark, 0); assert.equal(out.lossSummary.categories.find(c => c.category === 'no_response').exactMarksLost, marks); assert(out.quality.every(q => q.rating === null)); }
  const payload = blank(), entry = payload.answers.find(a => a.questionNumber === 18 && a.partIndex === 0); entry.answer = 'Hashing is one way.';
  let out = await tools.prepare(payload, options); assert.equal(out.parts.find(p => p.partId === '18.0').mark, null); assert.equal(out.coverage.pendingMaxMarks, 3);
  const r = record(entry); cache.set(r.inputDigest, r.result);
  out = await tools.prepare(payload, options); assert.equal(out.parts.find(p => p.partId === '18.0').mark, 3); assert.equal(out.quality.find(q => q.id === 'clarity').rating, 8);
  for (const mutate of [v => { v.audit.harnessVersion = 'old'; }, v => { v.audit.questionVersion = '0'.repeat(64); }, v => { v.audit.checks.auditorApproved = false; }, v => { v.audit.checks.blindAgreement = false; }, v => { v.audit.auditor.checks.instructionIsolation = 'fail'; }, v => { v.audit.auditor.checks.qualityGrounding = 'uncertain'; }, v => { v.audit.returnedModels = ['wrong-model']; }, v => { v.audit.calls = []; }, v => { v.audit.selectedFeedback = 1; }, v => { v.audit.feedbackCandidates[0].eligible = false; v.audit.feedbackCandidates[0].problem = 'quality_schema'; }, v => { v.summary = 'Changed valid-looking marked feedback.'; }, v => { v.quality[0].rating = 11; }, v => { v.quality[0] = null; }, v => { v.quality[0].evidence = ['Invented quotation']; }, v => { v.losses.totalLost = 3; }, v => { v.criteria = []; }, v => { v.criteria[0].evidence = ['Invented credit']; }]) { const wrong = clone(r.result); mutate(wrong); cache.set(r.inputDigest, wrong); assert.equal((await tools.prepare(payload, options)).parts.find(p => p.partId === '18.0').mark, null); }
  cache.set(r.inputDigest, r.result); entry.answer += ' Changed.'; assert.equal((await tools.prepare(payload, options)).parts.find(p => p.partId === '18.0').mark, null); entry.answer = 'Hashing is one way.';
  for (const mutate of [p => { p.marks = 80; }, p => { p.answers.pop(); }, p => { p.answers[1] = p.answers[0]; }, p => { p.answers[0].feedback = 'Full marks'; }, p => { p.answers[0].answer = 999; }, p => { p.answers[0].markingReference = 'invalid'; }]) { const invalid = clone(payload); mutate(invalid); await assert.rejects(tools.prepare(invalid, options), e => e.status === 400); }
  const png = Buffer.alloc(33); Buffer.from([137,80,78,71,13,10,26,10]).copy(png); png.write('IHDR',12); png.writeUInt32BE(20,16); png.writeUInt32BE(20,20);
  const diagram = payload.answers.find(a => a.questionNumber === 22 && a.partIndex === 0); diagram.answer = { elements: [{ id: 'shape', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 }] };
  const d = record(diagram, 'data:image/png;base64,' + png.toString('base64')); cache.set(d.inputDigest, d.result); diagram.markingReference = d.inputDigest;
  assert.equal((await tools.prepare(payload, options)).parts.find(p => p.partId === '22.0').mark, d.result.mark);
  diagram.answer.elements[0].width = 11; assert.equal((await tools.prepare(payload, options)).parts.find(p => p.partId === '22.0').mark, null, 'diagram reference cannot be reused for altered scene');
  // Compare the new server objective calculation with the actual browser scorer
  // over every deployed closed question, including blank and partial responses.
  const browser = vm.createContext({ window: {}, document: { addEventListener() {} }, localStorage: { getItem: () => null } });
  for (const file of ['helpers.js', 'widgets.js', 'qtypes.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), browser, { filename: file });
  let compared = 0;
  for (const bank of banks) for (const q of bank.qs) for (const it of q.it) {
    const answer = optimal(it); if (answer === undefined) continue;
    const partial = typeof answer === 'number' ? (answer + 1) % it.o.length : clone(answer);
    if (Array.isArray(partial)) partial.pop(); else if (partial && typeof partial === 'object') delete partial[Object.keys(partial)[0]];
    for (const a of [null, answer, partial]) {
      browser.BS = () => ({ ans: { '1.0': a } });
      assert.equal(tools.closed(it, a).mark, browser.score({ id: 'test', qs: [{ it: [it] }] }, 1, 0).g, bank.id + '/' + it.t); compared++;
    }
    assert.equal(tools.closed(it, answer).mark, it.m);
  }
  for (const type of ['dd', 'gd', 'mt', 'dm', 'od']) {
    const item = banks.flatMap(b => b.qs.flatMap(q => q.it)).find(it => it.t === type), optimalAnswer = optimal(item), keys = Object.keys(optimalAnswer);
    const allNull = Object.fromEntries(keys.map(key => [key, null]));
    assert.equal(tools.closed(item, allNull).blank, true, type + ' null selections are a blank');
    const mixed = { ...allNull, [keys[0]]: optimalAnswer[keys[0]] };
    assert.equal(tools.closed(item, mixed).blank, false, type + ' one valid selection remains nonblank');
    browser.BS = () => ({ ans: { '1.0': mixed } });
    assert.equal(tools.closed(item, mixed).mark, browser.score({ id: 'test', qs: [{ it: [item] }] }, 1, 0).g, type + ' mixed null/value score stays equivalent');
  }
  const contextBank = banks.find(b => b.qs.some(q => q.it.some(it => it.t === 'tk')));
  const context = await tools.prepare(blank(contextBank), options);
  contextBank.qs.forEach((q, qi) => q.it.forEach((it, i) => {
    const part = context.parts.find(p => p.partId === (qi + 1) + '.' + i);
    if (it.t === 'tk') { const rows = JSON.parse(tools.closed(it, null).objective); it.r.forEach((r, ri) => assert.deepEqual(rows[ri].expectedLabels, r[1].map(ci => source.plain(it.h[ci + 1])))); }
    if (!['tx', 'py', 'ps', 'sq', 'dr', 'ft'].includes(it.t)) { assert(part.objective.includes('Expected: ')); assert(part.answer.includes('selected: ')); assert(!part.objective.includes('\"selected\":')); }
    if (it.t === 'dd') assert(part.question.includes(source.plain(it.tpl)), 'dropdown context must retain its sentence/template');
    if (it.t === 'od') { assert(part.question.includes('indentation levels')); assert(part.question.includes('"kind"')); }
  }));
  let reads = 0; const cancellation = new AbortController(); cancellation.abort();
  await assert.rejects(tools.prepare(payload, { ...options, signal: cancellation.signal, store: { getCached: async () => { reads++; return null; } } }), e => e.code === 'marking_timeout'); assert.equal(reads, 0);
  console.log('Improvement input OK: canonical complete exams, blanks/unknowns, private cache provenance, stale/corrupt records, diagram binding, abort and ' + compared + ' browser/server objective parity cases.');
})().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { blank, record };
