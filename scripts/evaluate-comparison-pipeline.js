#!/usr/bin/env node
'use strict';

// Synthetic written answers -> real marking engine -> real comparison engine.
// Offline by default. No application endpoints, accounts, exports or storage.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const evaluator = require('./evaluate-comparison');
const { parse } = require('../server/marking-json');
const marker = require('../server/marking-engine');
const comparator = require('../server/comparison-engine');
const DEFAULT_FIXTURE = path.join(__dirname, '../tests/fixtures/comparison-short-answer.json');
const ENDPOINT = require('../server/ai-provider').current().endpoint;
const MAX_CALLS_PER_RUN = 22; // Six marks at three calls, then two profiles + synthesis + audit.
const clone = value => JSON.parse(JSON.stringify(value));

function argumentsFor(argv) {
  const result = { fixture: DEFAULT_FIXTURE, live: false, repeat: 1 };
  const names = { '--fixture': 'fixture', '--output': 'output', '--reports': 'reports', '--repeat': 'repeat' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') { result.live = true; continue; }
    if (arg === '--help') { result.help = true; continue; }
    assert(names[arg] && argv[i + 1] && !argv[i + 1].startsWith('--'), 'Unknown option or missing value. Use --help.');
    result[names[arg]] = argv[++i];
  }
  result.repeat = Number(result.repeat);
  assert(Number.isInteger(result.repeat) && result.repeat >= 1 && result.repeat <= 2, '--repeat must be 1 or 2.');
  assert(!(result.live && result.reports), 'Choose --live or --reports.');
  assert(result.live || result.repeat === 1, '--repeat applies only to --live.');
  assert(!result.live || result.output, '--live requires a new --output file.');
  return result;
}
function readJson(file) {
  assert(fs.statSync(file).size <= 10 * 1024 * 1024, 'Input file exceeds 10 MiB.');
  return parse(fs.readFileSync(file, 'utf8'));
}
function digest(dataset) { return crypto.createHash('sha256').update(JSON.stringify(dataset)).digest('hex'); }
function lint(dataset) {
  evaluator.lint(dataset, comparator);
  assert.equal(dataset.cases.length, 1, 'This bounded pipeline accepts exactly one synthetic cohort.');
  const test = dataset.cases[0];
  assert.equal(test.input.participants.length, 2, 'The pipeline requires exactly two fictional participants.');
  for (const person of test.input.participants) {
    assert.equal(person.parts.length, 3, 'The pipeline requires exactly three shared written questions.');
    assert(person.parts.every(part => part.type === 'written response' && part.source === 'agentic'), 'Only synthetic written short answers are accepted.');
    assert(person.parts.every(part => part.criteria.length === 2 && part.maxMarks === 2), 'Use two explicit one-mark criteria per question.');
    assert(person.parts.every(part => part.feedback.criteria.every(c => ['met', 'not_met'].includes(c.assessment))), 'Predeclared atomic expectations must be met or not_met.');
    assert(person.parts.every(part => part.mark === part.feedback.criteria.filter(c => c.assessment === 'met').length), 'Expected mark must equal the number of met atomic criteria.');
  }
  assert.equal(test.expected.status, 'complete', 'The complete written pipeline expects a released comparison.');
  return dataset;
}
function expectedMarks(test) {
  return test.input.participants.flatMap(person => person.parts.map(part => ({ participantId: person.id,
    questionId: part.id, mark: part.mark, criteria: part.feedback.criteria.map(c => ({ id: c.id, assessment: c.assessment })) })));
}
function safeFailure(error) {
  return { status: 'transport_error', errorCode: error && typeof error.code === 'string' && /^[a-z_]{1,80}$/.test(error.code) ? error.code : 'provider_unavailable',
    audit: error && error.audit || null };
}
function comparisonInput(test, marking) {
  const participants = test.input.participants.map(person => ({ id: person.id, parts: [], coverage: clone(person.coverage) }));
  const exclusions = [];
  for (const part of test.input.participants[0].parts) {
    const jobs = participants.map(person => marking.find(job => job.participantId === person.id && job.questionId === part.id));
    if (jobs.some(job => !job || job.result.status !== 'marked')) {
      exclusions.push({ questionId: part.id, reason: 'At least one participant has no confirmed mark.',
        statuses: participants.map((person, index) => ({ participantId: person.id, status: jobs[index] ? jobs[index].result.status : 'missing' })) });
      continue;
    }
    participants.forEach((person, index) => {
      const original = test.input.participants.find(p => p.id === person.id).parts.find(p => p.id === part.id), result = jobs[index].result;
      person.parts.push(Object.assign({}, clone(original), { mark: result.mark, feedback: {
        summary: result.summary, strengths: result.strengths, improve: result.improve, advice: result.advice, criteria: result.criteria
      } }));
    });
  }
  // Export coverage describes each participant's own confirmed marks; comparison
  // parts then contain only the shared subset, just like production cohort().
  participants.forEach(person => {
    person.coverage.includedParts = marking.filter(job => job.participantId === person.id && job.result.status === 'marked').length;
    person.coverage.excludedParts = person.coverage.totalParts - person.coverage.includedParts;
  });
  return { exclusions, input: participants[0].parts.length ? { bankId: test.input.bankId, questionSetVersion: test.input.questionSetVersion, participants } : null };
}
function statistics(input) {
  if (!input) return null;
  const commonPartIds = input.participants[0].parts.map(part => part.id);
  const maximum = input.participants[0].parts.reduce((sum, part) => sum + part.maxMarks, 0);
  return { scope: 'common_verified_parts', commonPartIds, commonMaxMarks: maximum,
    participants: input.participants.map(person => {
      const earned = person.parts.reduce((sum, part) => sum + part.mark, 0);
      return Object.assign({ participantId: person.id, earned, maxMarks: maximum, percentage: Math.round(earned * 1000 / maximum) / 10 }, person.coverage);
    }),
    byTopic: [...new Set(input.participants[0].parts.map(part => part.topic))].map(topic => ({ topic,
      maxMarks: input.participants[0].parts.filter(part => part.topic === topic).reduce((sum, part) => sum + part.maxMarks, 0),
      scores: input.participants.map(person => ({ participantId: person.id, earned: person.parts.filter(part => part.topic === topic).reduce((sum, part) => sum + part.mark, 0) })) })),
    limitations: ['Synthetic development responses, not student records or a teacher-adjudicated benchmark.',
      'Totals cover only commonly confirmed parts; excluded questions cannot establish strengths or weaknesses.',
      'These selected questions do not establish overall ability, an HSC band or a predicted exam result.'] };
}
function evaluateRun(test, run) {
  const failures = [];
  const expected = expectedMarks(test);
  for (const item of expected) {
    const jobs = run.marking.filter(job => job.participantId === item.participantId && job.questionId === item.questionId);
    const label = item.participantId + ':' + item.questionId;
    if (jobs.length !== 1) { failures.push('marking_job_count:' + label); continue; }
    const result = jobs[0].result;
    if (result.status !== 'marked') { failures.push('unconfirmed_mark:' + label); continue; }
    if (result.mark !== item.mark) failures.push('unexpected_mark:' + label);
    const source = test.input.participants.find(person => person.id === item.participantId).parts.find(part => part.id === item.questionId);
    if (!Array.isArray(result.criteria) || result.criteria.length !== item.criteria.length) failures.push('marking_criteria_coverage:' + label);
    for (const criterion of item.criteria) {
      const actual = (result.criteria || []).filter(c => c.id === criterion.id);
      if (actual.length !== 1 || actual[0].assessment !== criterion.assessment) failures.push('criterion_assessment:' + label + ':' + criterion.id);
      if (actual.length === 1 && (!Array.isArray(actual[0].evidence) || actual[0].evidence.some(quote => typeof quote !== 'string' || !source.answer.includes(quote)) ||
          (actual[0].assessment === 'met' && !actual[0].evidence.length))) failures.push('marking_evidence:' + label + ':' + criterion.id);
    }
  }
  if (run.marking.length !== expected.length) failures.push('marking_coverage');
  if (run.exclusions.length || !run.comparisonInput || run.comparisonInput.participants.some(p => p.parts.length !== 3)) failures.push('shared_coverage');
  let comparison = null;
  if (run.comparisonInput) {
    comparison = evaluator.score(Object.assign({}, test, { input: run.comparisonInput }), run.report, comparator);
    if (!comparison.passed) failures.push(...comparison.failures.map(f => 'comparison:' + f));
    if (run.report.status === 'complete' && (!Array.isArray(run.report.comparisons) || !run.report.comparisons.length)) failures.push('missing_demonstrated_peer_contrast');
    for (const person of test.input.participants) {
      const profile = (run.report.profiles || []).find(p => p.participantId === person.id);
      if (!profile || !(profile.findings || []).some(f => f.kind === 'strength')) failures.push('missing_demonstrated_strength:' + person.id);
    }
    // Independent mistakes on a question are allowed in general. This fixed
    // fixture declares one cause for each expected error/question tuple.
    const seen = new Set();
    for (const profile of run.report.profiles || []) for (const finding of profile.findings || []) {
      if (finding.kind !== 'criterion_shortfall') continue;
      for (const id of new Set((finding.evidence || []).map(ref => ref.questionId))) {
        const key = profile.participantId + ':' + id + ':' + finding.errorType;
        if (seen.has(key)) failures.push('duplicate_declared_root_cause:' + key);
        seen.add(key);
      }
      for (const ref of finding.evidence || []) {
        const source = test.input.participants.find(p => p.id === profile.participantId).parts.find(p => p.id === ref.questionId);
        if (source && source.mark === source.maxMarks) failures.push('full_mark_shortfall:' + profile.participantId + ':' + ref.questionId);
      }
    }
    const actions = new Set();
    for (const profile of run.report.profiles || []) for (const finding of profile.findings || []) {
      if (!finding.action) continue;
      const normalized = finding.action.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const key = profile.participantId + ':' + normalized;
      if (actions.has(key)) failures.push('duplicate_action_text:' + profile.participantId);
      actions.add(key);
    }
  } else failures.push('comparison_not_run');
  return { passed: failures.length === 0, failures: [...new Set(failures)], markingConfirmed: run.marking.filter(job => job.result.status === 'marked').length,
    commonParts: run.comparisonInput ? run.comparisonInput.participants[0].parts.length : 0, comparison,
    manualReviewRequired: test.expected.semanticChecks,
    notice: 'Categorical/structural checks cannot establish semantic equivalence, detect every paraphrased duplicate or prove teaching usefulness. Review all actions and original evidence.' };
}
function evaluateBundle(dataset, bundle) {
  assert.equal(bundle.schemaVersion, 1);
  assert.equal(bundle.fixtureDigest, digest(dataset), 'Saved run fixture differs from the expectations being evaluated.');
  assert(Array.isArray(bundle.runs) && bundle.runs.length === bundle.repeat && bundle.runs.length >= 1 && bundle.runs.length <= 2, 'Missing predetermined runs.');
  assert.equal(new Set(bundle.runs.map(run => run.run)).size, bundle.repeat, 'Duplicate run identifier.');
  const results = bundle.runs.map(run => ({ run: run.run, ...evaluateRun(dataset.cases[0], run) }));
  return { passed: results.every(result => result.passed), dataset: dataset.id, teacherReviewed: dataset.provenance.teacherReviewed,
    providerCalls: bundle.providerCalls, plannedMaximumCalls: bundle.plannedMaximumCalls, runs: results };
}
async function run(dataset, options) {
  lint(dataset);
  assert(options && typeof options.apiKey === 'string' && options.apiKey.trim(), 'A provider API key is required.');
  const repeat = options.repeat == null ? 1 : options.repeat;
  assert(Number.isInteger(repeat) && repeat >= 1 && repeat <= 2, 'Repeat must be 1 or 2.');
  const now = options.now || Date.now, write = options.write || (() => {}), progress = options.progress || (() => {});
  const fetcher = options.fetch || globalThis.fetch;
  const mark = options.mark || marker.mark, compare = options.compare || comparator.compare;
  const test = dataset.cases[0];
  const bundle = { schemaVersion: 1, dataset: dataset.id, fixtureDigest: digest(dataset), fixture: clone(dataset),
    realStudentData: false, teacherReviewed: dataset.provenance.teacherReviewed,
    scope: 'Fresh synthetic written answers -> actual marking engine -> actual comparison engine. No application endpoints, accounts, signed exports or production storage.',
    model: comparator.MODEL, markingHarness: marker.HARNESS_VERSION, comparisonHarness: comparator.HARNESS_VERSION,
    repeat, plannedMaximumCalls: MAX_CALLS_PER_RUN * repeat, providerCalls: 0,
    expectedBeforeCalls: expectedMarks(test), startedAt: new Date(now()).toISOString(), completedAt: null, runs: [] };
  const save = () => write(bundle);
  async function guardedFetch(url, init) {
    assert.equal(url, ENDPOINT, 'Unexpected network destination.');
    assert(init && init.method === 'POST', 'Unexpected network method.');
    assert(bundle.providerCalls < bundle.plannedMaximumCalls, 'Provider call budget exceeded.');
    bundle.providerCalls++; save();
    return fetcher(url, init);
  }
  save();
  for (let number = 1; number <= repeat; number++) {
    const started = now();
    const entry = { run: number, startedAt: new Date(started).toISOString(), marking: [], exclusions: [], comparisonInput: null, report: null, statistics: null, evaluation: null };
    bundle.runs.push(entry); save();
    for (const person of test.input.participants) for (const part of person.parts) {
      const began = now();
      const input = { bankId: test.input.bankId, questionNumber: part.questionNumber, partIndex: part.partIndex, type: part.type,
        maxMarks: part.maxMarks, stimulus: part.stimulus, question: part.question, criteria: clone(part.criteria), sample: part.sample, answer: part.answer };
      let result;
      try { result = await mark(input, { apiKey: options.apiKey, fetch: guardedFetch }); } catch (error) { result = safeFailure(error); }
      entry.marking.push({ participantId: person.id, questionId: part.id, expectedMark: part.mark, durationMs: now() - began, result });
      save(); progress({ run: number, stage: 'marking', participantId: person.id, questionId: part.id, status: result.status,
        mark: result.mark == null ? null : result.mark, expectedMark: part.mark, reasons: result.audit && result.audit.reasons, errorCode: result.errorCode });
    }
    const prepared = comparisonInput(test, entry.marking);
    entry.comparisonInput = prepared.input; entry.exclusions = prepared.exclusions; entry.statistics = statistics(prepared.input); save();
    if (prepared.input) {
      try { entry.report = await compare(prepared.input, { apiKey: options.apiKey, fetch: guardedFetch }); } catch (error) { entry.report = safeFailure(error); }
    } else entry.report = { status: 'not_run', profiles: [], comparisons: [], reason: 'No mutually confirmed question parts.' };
    entry.evaluation = evaluateRun(test, entry); entry.durationMs = now() - started; entry.completedAt = new Date(now()).toISOString();
    save(); progress({ run: number, stage: 'comparison', status: entry.report.status, commonParts: prepared.input ? prepared.input.participants[0].parts.length : 0,
      reasons: entry.report.audit && entry.report.audit.reasons, passed: entry.evaluation.passed, failures: entry.evaluation.failures });
  }
  bundle.completedAt = new Date(now()).toISOString(); bundle.evaluation = evaluateBundle(dataset, bundle); save();
  return bundle;
}
async function main(argv) {
  const options = argumentsFor(argv);
  if (options.help) {
    console.log('Offline: node scripts/evaluate-comparison-pipeline.js\nSaved runs: node scripts/evaluate-comparison-pipeline.js --reports bundle.json\nPaid synthetic run: node scripts/evaluate-comparison-pipeline.js --live --repeat 2 --output new-bundle.json\nOptional --fixture path. Two fictional participants, three written questions; at most22 calls/run. DEEPSEEK_API_KEY must be supplied securely. No live student application endpoints.');
    return;
  }
  if (!options.live) globalThis.fetch = async () => { throw new Error('Network disabled for offline evaluation.'); };
  const dataset = lint(readJson(options.fixture));
  if (options.reports) {
    const result = evaluateBundle(dataset, readJson(options.reports));
    console.log(JSON.stringify(result, null, 2)); if (!result.passed) process.exitCode = 1; return;
  }
  if (!options.live) {
    console.log(JSON.stringify({ passed: true, mode: 'offline_fixture_lint', dataset: dataset.id, writtenResponses: 6, teacherReviewed: dataset.provenance.teacherReviewed,
      modelCalls: 0, notice: 'Original synthetic expectations are structurally valid; no model accuracy was measured.' }, null, 2)); return;
  }
  assert(require('../server/ai-provider').current().key(), '--live requires ' + require('../server/ai-provider').current().keyEnv + '.');
  const fd = fs.openSync(path.resolve(options.output), 'wx', 0o600);
  try {
    console.error('Live synthetic written pipeline: maximum ' + MAX_CALLS_PER_RUN * options.repeat + ' provider calls; fixed repeats, no retries, no application endpoints.');
    const result = await run(dataset, { apiKey: require('../server/ai-provider').current().key(), repeat: options.repeat,
      write: bundle => { fs.ftruncateSync(fd, 0); fs.writeSync(fd, JSON.stringify(bundle, null, 2) + '\n', 0, 'utf8'); fs.fsyncSync(fd); },
      progress: item => console.error(JSON.stringify(item)) });
    console.log(JSON.stringify(result.evaluation, null, 2)); if (!result.evaluation.passed) process.exitCode = 1;
  } finally { fs.closeSync(fd); }
}
if (require.main === module) main(process.argv.slice(2)).catch(error => {
  console.error(error instanceof assert.AssertionError ? error.message : 'Synthetic pipeline evaluation failed. Check paths and schemas; provider details are not logged.');
  process.exitCode = 1;
});
module.exports = { argumentsFor, lint, digest, expectedMarks, comparisonInput, statistics, evaluateRun, evaluateBundle, run, MAX_CALLS_PER_RUN };
