'use strict';

const assert = require('node:assert/strict');
const harness = require('../scripts/evaluate-comparison-pipeline');
const fixture = require('./fixtures/comparison-short-answer.json');
const clone = value => JSON.parse(JSON.stringify(value));
const testCase = fixture.cases[0];
const tests = [];
const test = (name, execute) => tests.push({ name, execute });
const ENDPOINT = require('../server/ai-provider').current().endpoint;
let actualNetworkCalls = 0;
globalThis.fetch = async () => { actualNetworkCalls++; throw new Error('Actual network is forbidden.'); };

function partFor(person, question) { return testCase.input.participants.find(p => p.id === person).parts.find(p => p.id === question); }
function quote(person, question, criterion, source = 'feedback') {
  const part = partFor(person, question);
  return { participantId: person, questionId: question, criterionId: criterion, source,
    quote: source === 'answer' ? part.answer : part.feedback.criteria.find(c => c.id === criterion).basis };
}
function comparisonReport() {
  return { status: 'complete', summary: 'The three shared short answers show different gaps and demonstrated strengths.',
    profiles: [
      { participantId: 'p1', findings: [
        { id: 'context', kind: 'criterion_shortfall', category: 'context_application', errorType: 'stimulus_not_applied', scope: 'repeated',
          statement: 'Q1 and Q3 omit application to the stated scenario.', action: 'Apply Q1 reuse to a popular-title request and Q3 rejection to the stated age range.',
          evidence: [quote('p1', '1.0', 'c2'), quote('p1', '3.0', 'c2')] },
        { id: 'hashing', kind: 'strength', category: 'technical_accuracy', errorType: null, scope: 'single_response',
          statement: 'Q2 correctly explains one-way hashing.', action: '', evidence: [quote('p1', '2.0', 'c1', 'answer')] }
      ] },
      { participantId: 'p2', findings: [
        { id: 'hashing', kind: 'criterion_shortfall', category: 'technical_accuracy', errorType: 'conceptual_confusion', scope: 'single_response',
          statement: 'Q2 treats a one-way hash as reversible encryption.', action: 'Replace decryption with hashing the submitted password and comparing hashes.',
          evidence: [quote('p2', '2.0', 'c1'), quote('p2', '2.0', 'c2')] },
        { id: 'caching', kind: 'strength', category: 'reasoning_explanation', errorType: null, scope: 'single_response',
          statement: 'Q1 correctly explains cached reuse and faster responses.', action: '', evidence: [quote('p2', '1.0', 'c1', 'answer')] }
      ] }
    ],
    comparisons: [{ id: 'context', category: 'context_application', statement: 'p2 applies cache reuse to a popular title; p1 leaves Q1 generic.', action: '',
      evidence: [quote('p1', '1.0', 'c2'), quote('p2', '1.0', 'c2', 'answer')] }] };
}
function setup(overrides = {}) {
  const calls = [], saved = [];
  const options = {
    apiKey: 'mock-only-key',
    fetch: async (url, init) => { calls.push({ url, method: init.method }); return new Response('{}'); },
    write: bundle => saved.push(clone(bundle)),
    mark: async (input, opts) => {
      assert(!Object.prototype.hasOwnProperty.call(input, 'mark'));
      assert(!Object.prototype.hasOwnProperty.call(input, 'feedback'));
      for (let i = 0; i < 3; i++) await opts.fetch(ENDPOINT, { method: 'POST' });
      const part = testCase.input.participants.flatMap(p => p.parts).find(p => p.answer === input.answer);
      return Object.assign({ status: 'marked', mark: part.mark, audit: { calls: [] } }, clone(part.feedback));
    },
    compare: async (input, opts) => {
      for (let i = 0; i < 4; i++) await opts.fetch(ENDPOINT, { method: 'POST' });
      return comparisonReport();
    }
  };
  return { calls, saved, options: Object.assign(options, overrides) };
}

test('fixture has six original written answers, clear atomic marks and complementary equal totals', () => {
  assert.equal(harness.lint(fixture), fixture);
  for (const participant of testCase.input.participants) {
    assert.equal(participant.parts.reduce((sum, part) => sum + part.mark, 0), 4);
    assert(participant.parts.every(part => part.type === 'written response'));
  }
  const real = clone(fixture); real.provenance.realStudentData = true;
  assert.throws(() => harness.lint(real), /synthetic fixtures/);
  const code = clone(fixture); code.cases[0].input.participants.forEach(p => p.parts[0].type = 'Python program');
  assert.throws(() => harness.lint(code), /written short answers/);
  const incorrect = clone(fixture); incorrect.cases[0].input.participants[0].parts[0].mark = 2;
  assert.throws(() => harness.lint(incorrect), /number of met/);
});

test('live mode and repeat require explicit arguments and an output path', () => {
  assert.equal(harness.argumentsFor([]).live, false);
  assert.throws(() => harness.argumentsFor(['--live']), /output/);
  assert.throws(() => harness.argumentsFor(['--repeat', '2']), /only to --live/);
  assert.throws(() => harness.argumentsFor(['--live', '--repeat', '3', '--output', 'new.json']), /1 or 2/);
  assert.throws(() => harness.argumentsFor(['--live', '--reports', 'old.json', '--output', 'new.json']), /Choose/);
});

test('complete pipeline uses fresh marking feedback and preserves all predetermined calls/results', async () => {
  const state = setup();
  const bundle = await harness.run(fixture, state.options);
  assert.equal(bundle.providerCalls, 22); assert.equal(state.calls.length, 22);
  assert.equal(bundle.evaluation.passed, true);
  assert.equal(bundle.runs[0].marking.length, 6);
  assert.equal(bundle.runs[0].comparisonInput.participants[0].parts.length, 3);
  assert.deepEqual(bundle.runs[0].statistics.participants.map(p => p.earned), [4, 4]);
  assert.equal(bundle.runs[0].statistics.commonMaxMarks, 6);
  assert.deepEqual(state.saved[0].expectedBeforeCalls, harness.expectedMarks(testCase));
  assert.equal(state.saved[0].providerCalls, 0);
  assert(state.saved.some(saved => saved.runs[0] && saved.runs[0].marking.length === 1));
  assert(state.saved.every(saved => !JSON.stringify(saved).includes('mock-only-key')));
  const changed = clone(fixture); changed.id = 'other';
  assert.throws(() => harness.evaluateBundle(changed, bundle), /differs/);
});

test('fixed repeats run every job even after a failing first run, without a retry loop', async () => {
  const state = setup({ repeat: 2 });
  let markingJobs = 0;
  const original = state.options.mark;
  state.options.mark = async (input, opts) => {
    markingJobs++;
    const result = await original(input, opts);
    return markingJobs === 1 ? { status: 'needs_review', mark: null, audit: { reasons: ['criterion_disagreement'] } } : result;
  };
  const bundle = await harness.run(fixture, state.options);
  assert.equal(markingJobs, 12); assert.equal(bundle.providerCalls, 44);
  assert.equal(bundle.runs.length, 2);
  assert.equal(bundle.runs[0].evaluation.passed, false);
  assert.equal(bundle.runs[1].evaluation.passed, true);
  assert.equal(bundle.evaluation.passed, false);
  assert.equal(bundle.runs[0].exclusions[0].questionId, '1.0');
  assert.equal(bundle.runs[0].comparisonInput.participants[0].parts.length, 2);
  assert.equal(bundle.runs[0].comparisonInput.participants[1].coverage.includedParts, 3);
});

test('network guard refuses application endpoints and enforces the per-run provider cap', async () => {
  let calls = 0;
  const state = setup({ fetch: async () => { calls++; return new Response('{}'); },
    mark: async (input, opts) => { await opts.fetch('https://hsc-se-practice-repo.vercel.app/api/mark', { method: 'POST' }); } });
  const blocked = await harness.run(fixture, state.options);
  assert.equal(calls, 0); assert.equal(blocked.providerCalls, 0);
  assert.equal(blocked.runs[0].report.status, 'not_run');
  assert.equal(blocked.runs[0].marking.length, 6);
  state.options.mark = async (input, opts) => { for (let i = 0; i < 23; i++) await opts.fetch(ENDPOINT, { method: 'POST' }); };
  const capped = await harness.run(fixture, state.options);
  assert.equal(calls, 22); assert.equal(capped.providerCalls, 22);
  assert.equal(capped.evaluation.passed, false);
});

test('scorer detects changed marks, invented marking evidence and repeated diagnoses', async () => {
  const bundle = await harness.run(fixture, setup().options);
  let run = clone(bundle.runs[0]); run.marking[0].result.mark = 2;
  assert(harness.evaluateRun(testCase, run).failures.includes('unexpected_mark:p1:1.0'));
  run = clone(bundle.runs[0]); run.marking[0].result.criteria[0].evidence = ['Invented quotation'];
  assert(harness.evaluateRun(testCase, run).failures.includes('marking_evidence:p1:1.0:c1'));
  run = clone(bundle.runs[0]);
  const copy = clone(run.report.profiles[1].findings[0]); copy.id = 'repeated'; copy.action = 'A paraphrased repair.';
  run.report.profiles[1].findings.push(copy);
  assert(harness.evaluateRun(testCase, run).failures.some(f => f.startsWith('duplicate_declared_root_cause:p2:2.0:')));
  run = clone(bundle.runs[0]); run.report.comparisons = [];
  assert(harness.evaluateRun(testCase, run).failures.includes('missing_demonstrated_peer_contrast'));
});

(async () => {
  for (const item of tests) { await item.execute(); console.log('ok - ' + item.name); }
  assert.equal(actualNetworkCalls, 0);
  console.log(tests.length + ' synthetic pipeline evaluator tests passed; zero actual network calls.');
})().catch(error => { console.error(error); process.exitCode = 1; });
