#!/usr/bin/env node
'use strict';

// Default: offline fixture checks. Paid provider requests require --live.
// Never calls the application /api/auth, /api/mark or /api/compare endpoints.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { parse } = require('../server/marking-json');
const DEFAULT_FIXTURE = path.join(__dirname, '../tests/fixtures/comparison-calibration.json');
const ERRORS = new Set(require('../server/comparison-policy').ERROR_TYPES);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function argumentsFor(argv) {
  const options = { fixture: DEFAULT_FIXTURE, cases: [], live: false, repeat: 1 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--live') { options.live = true; continue; }
    if (arg === '--help') { options.help = true; continue; }
    const names = { '--fixture': 'fixture', '--reports': 'reports', '--output': 'output', '--case': 'case', '--repeat': 'repeat' };
    assert(names[arg] && argv[i + 1] && !argv[i + 1].startsWith('--'), 'Unknown option or missing value. Use --help.');
    const value = argv[++i];
    if (names[arg] === 'case') options.cases.push(value);
    else options[names[arg]] = value;
  }
  options.repeat = Number(options.repeat);
  assert(Number.isInteger(options.repeat) && options.repeat >= 1 && options.repeat <= 5, '--repeat must be from 1 to 5.');
  assert(!(options.live && options.reports), 'Choose either --live or --reports.');
  assert(options.live || options.repeat === 1, '--repeat applies only to --live.');
  assert(!options.live || options.output, '--live requires a new --output file to preserve the run.');
  return options;
}
function readJson(file) {
  assert(fs.statSync(file).size <= MAX_FILE_BYTES, 'Input file exceeds 10 MiB.');
  return parse(fs.readFileSync(file, 'utf8'));
}
function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function errorKey(value) { return [value.participantId, value.questionId, value.errorType].join('|'); }
function member(input, participantId, questionId) {
  const participant = input.participants.find(p => p.id === participantId);
  return participant && participant.parts.find(p => p.id === questionId);
}
function lint(dataset, engine) {
  assert.equal(dataset.schemaVersion, 1);
  assert(nonempty(dataset.id) && dataset.provenance && typeof dataset.provenance.teacherReviewed === 'boolean');
  assert(dataset.provenance.realStudentData === false, 'This CLI accepts synthetic fixtures only; do not upload real student evidence through it.');
  assert(Array.isArray(dataset.cases) && dataset.cases.length > 0);
  const ids = new Set();
  for (const test of dataset.cases) {
    assert(nonempty(test.id) && !ids.has(test.id), 'Case IDs must be unique.'); ids.add(test.id);
    assert(nonempty(test.purpose));
    engine.canonicalData(test.input);
    const expected = test.expected;
    assert(expected && ['complete', 'needs_review'].includes(expected.status));
    if (expected.reviewReasons) assert(expected.status === 'needs_review' && Array.isArray(expected.reviewReasons) && expected.reviewReasons.length && expected.reviewReasons.every(reason => ['extractor_abstention', 'synthesis_abstention', 'auditor_veto'].includes(reason)), 'Expected review reasons must represent substantive abstention.');
    assert(Array.isArray(expected.errors) && Array.isArray(expected.semanticChecks));
    const keys = new Set();
    for (const item of expected.errors) {
      assert(member(test.input, item.participantId, item.questionId), 'Gold error references missing evidence.');
      assert(ERRORS.has(item.errorType), 'Gold error uses unknown taxonomy.');
      assert(!keys.has(errorKey(item)), 'Gold errors must not be duplicated.'); keys.add(errorKey(item));
    }
    if (expected.allowedOptionalErrors !== undefined) {
      assert(Array.isArray(expected.allowedOptionalErrors), 'Allowed optional errors must be an array.');
      const optionalKeys = new Set();
      for (const item of expected.allowedOptionalErrors) {
        assert(item && Object.keys(item).length === 3 && ['participantId', 'questionId', 'errorType'].every(key => Object.prototype.hasOwnProperty.call(item, key)), 'Optional error allowances must contain exactly participantId, questionId and errorType.');
        assert(member(test.input, item.participantId, item.questionId), 'Allowed optional error references missing evidence.');
        assert(ERRORS.has(item.errorType), 'Allowed optional error uses unknown taxonomy.');
        const key = errorKey(item);
        assert(!optionalKeys.has(key), 'Allowed optional errors must not be duplicated.'); optionalKeys.add(key);
        assert(!keys.has(key), 'An error tuple cannot be both required scored evidence and optional advice.');
      }
    }
    assert(Array.isArray(expected.forbidCriterionShortfalls) && expected.forbidCriterionShortfalls.every(id => test.input.participants.some(p => p.id === id)));
    assert(Array.isArray(expected.requiredFindings) && Array.isArray(expected.forbiddenText));
    for (const required of expected.requiredFindings) {
      assert(ERRORS.has(required.errorType) && ['single_response', 'repeated'].includes(required.scope));
      assert(required.questionIds.length && required.questionIds.every(id => member(test.input, required.participantId, id)));
      if (required.scope === 'repeated') assert(new Set(required.questionIds.map(id => member(test.input, required.participantId, id).questionNumber)).size >= 2);
    }
  }
  for (const test of dataset.cases) if (test.expected.equivalentTo) {
    assert(ids.has(test.expected.equivalentTo) && test.expected.equivalentTo !== test.id);
    const original = dataset.cases.find(c => c.id === test.expected.equivalentTo);
    const ordered = input => input.participants.slice().sort((a, b) => a.id.localeCompare(b.id));
    assert.deepEqual(ordered(test.input), ordered(original.input), 'Order-invariance cases must contain identical participant evidence.');
  }
  return dataset;
}
function narrative(report) {
  const text = [report.summary];
  for (const profile of report.profiles || []) for (const finding of profile.findings || []) text.push(finding.statement, finding.action);
  for (const comparison of report.comparisons || []) text.push(comparison.statement, comparison.action);
  return text.filter(v => typeof v === 'string').join('\n');
}
function citationCorrect(ref, input) {
  if (!ref || !nonempty(ref.quote) || ref.quote.length > 400) return false;
  const part = member(input, ref.participantId, ref.questionId);
  if (!part || !part.criteria.some(c => c.id === ref.criterionId)) return false;
  if (ref.source === 'answer') return part.answer.includes(ref.quote);
  if (ref.source !== 'feedback') return false;
  const feedback = part.feedback;
  const strings = [feedback.summary].concat(feedback.strengths, feedback.improve, feedback.advice);
  for (const criterion of feedback.criteria) if (criterion.id === ref.criterionId) strings.push(criterion.basis, ...criterion.evidence);
  if (feedback.losses) for (const item of feedback.losses.items) {
    if (item.criterionIds.includes(ref.criterionId)) strings.push(item.explanation, item.action, ...item.evidence);
  }
  return strings.some(text => typeof text === 'string' && text.includes(ref.quote));
}
function score(test, report, engine) {
  const failures = [], expected = test.expected, canonical = engine.canonicalData(test.input);
  const findings = [], citations = [], predicted = new Set(), optionalPredicted = new Set();
  function check(ok, message) { if (!ok) failures.push(message); }
  check(report && report.status === expected.status, 'status');
  check(report && Array.isArray(report.profiles) && Array.isArray(report.comparisons), 'report_shape');
  report = report || {};
  if (report.status === 'needs_review') check(!(report.profiles || []).length && !(report.comparisons || []).length, 'review_must_withhold_findings');
  if (expected.reviewReasons) check(report.audit && Array.isArray(report.audit.reasons) && report.audit.reasons.some(reason => expected.reviewReasons.includes(reason)), 'substantive_review_reason');
  if (report.status === 'complete') {
    const profiles = report.profiles || [];
    const synthesis = engine.synthesisProblem({ status: 'complete', summary: report.summary, comparisons: report.comparisons, uncertainties: [] }, canonical.participants, profiles);
    check(!synthesis, 'synthesis_validation:' + synthesis);
    check(new Set(profiles.map(p => p.participantId)).size === test.input.participants.length && profiles.length === test.input.participants.length && profiles.every(p => test.input.participants.some(item => item.id === p.participantId)), 'profile_coverage');
    for (const profile of profiles) {
      const owner = canonical.participants.find(p => p.id === profile.participantId);
      const problem = owner && engine.profileProblem({ status: 'complete', participantId: profile.participantId, findings: profile.findings, uncertainties: [] }, owner);
      check(owner && !problem, 'profile_validation:' + profile.participantId + ':' + (problem || 'owner'));
      for (const finding of profile.findings || []) {
        findings.push({ owner: profile.participantId, finding });
        for (const ref of finding.evidence || []) {
          citations.push(ref);
          if (finding.errorType && ref.participantId === profile.participantId) {
            const key = errorKey({ participantId: profile.participantId, questionId: ref.questionId, errorType: finding.errorType });
            if (finding.kind === 'criterion_shortfall') predicted.add(key);
            else if (finding.kind === 'optional_advice') optionalPredicted.add(key);
          }
        }
        if (expected.requireActionsForErrors && finding.errorType) check(nonempty(finding.action), 'error_action_required:' + profile.participantId);
        if (expected.singleResponseOnly) check(finding.scope === 'single_response', 'unsupported_recurrence:' + profile.participantId);
        if (expected.forbidCriterionShortfalls.includes(profile.participantId)) check(finding.kind !== 'criterion_shortfall', 'invented_scored_shortfall:' + profile.participantId);
      }
    }
    for (const comparison of report.comparisons || []) {
      const refs = comparison.evidence || [];
      citations.push(...refs);
      check(new Set(refs.map(ref => ref.participantId)).size >= 2, 'comparison_needs_peers');
    }
  }
  const correctCitations = citations.filter(ref => citationCorrect(ref, test.input)).length;
  check(correctCitations === citations.length, 'citation_correctness');
  for (const required of expected.requiredFindings) {
    check(findings.some(({ owner, finding }) => owner === required.participantId && finding.kind === 'criterion_shortfall' && finding.errorType === required.errorType && finding.scope === required.scope && required.questionIds.every(id => (finding.evidence || []).some(ref => ref.participantId === owner && ref.questionId === id))), 'required_finding:' + required.participantId + ':' + required.errorType);
  }
  for (const text of expected.forbiddenText) check(!narrative(report).includes(text), 'forbidden_narrative');
  const gold = new Set(expected.errors.map(errorKey));
  const truePositive = [...predicted].filter(key => gold.has(key)).length;
  const falsePositive = [...predicted].filter(key => !gold.has(key));
  const falseNegative = [...gold].filter(key => !predicted.has(key));
  check(!falsePositive.length && !falseNegative.length, 'categorical_expectations');
  const allowed = new Set((expected.allowedOptionalErrors || []).map(errorKey));
  const allowedOptionalErrors = [...optionalPredicted].filter(key => allowed.has(key)).sort();
  const unexpectedOptionalErrors = [...optionalPredicted].filter(key => !allowed.has(key)).sort();
  check(!unexpectedOptionalErrors.length, 'unexpected_optional_diagnostic');
  return { caseId: test.id, statusCorrect: report.status === expected.status, passed: failures.length === 0, failures, truePositive, falsePositive, falseNegative,
    citationCount: citations.length, correctCitations, predictedErrors: [...predicted].sort(),
    optionalDiagnostics: { observed: optionalPredicted.size, allowed: allowedOptionalErrors.length, unexpected: unexpectedOptionalErrors.length,
      predictedErrors: [...optionalPredicted].sort(), allowedErrors: allowedOptionalErrors, unexpectedErrors: unexpectedOptionalErrors },
    manualReviewRequired: expected.semanticChecks };
}
function evaluate(dataset, selected, reports, engine) {
  assert(reports && reports.schemaVersion === 1 && Array.isArray(reports.reports), 'Saved report bundle must use schemaVersion 1 and reports:[{caseId,run,report}].');
  const selectedIds = new Set(selected.map(c => c.id)), results = [], seen = new Set();
  for (const entry of reports.reports) {
    assert(dataset.cases.some(c => c.id === entry.caseId), 'Report contains an unknown case ID.');
    if (!selectedIds.has(entry.caseId)) continue;
    const run = entry.run == null ? 1 : entry.run;
    assert(Number.isInteger(run) && run >= 1 && run <= 5);
    const key = entry.caseId + ':' + run;
    assert(!seen.has(key), 'Duplicate report case/run.'); seen.add(key);
    const test = selected.find(c => c.id === entry.caseId);
    results.push(Object.assign(score(test, entry.report, engine), { run }));
  }
  for (const test of selected) assert(results.some(r => r.caseId === test.id), 'Missing report for selected case: ' + test.id);
  for (const result of results) {
    const reference = selected.find(c => c.id === result.caseId).expected.equivalentTo;
    if (!reference) continue;
    const base = results.find(r => r.caseId === reference && r.run === result.run);
    if (!base) { result.passed = false; result.failures.push('missing_order_invariance_reference'); }
    else if (JSON.stringify(base.predictedErrors) !== JSON.stringify(result.predictedErrors) || base.statusCorrect !== result.statusCorrect) {
      result.passed = false; result.failures.push('order_invariance');
    }
  }
  const tp = results.reduce((n, r) => n + r.truePositive, 0), fp = results.reduce((n, r) => n + r.falsePositive.length, 0), fn = results.reduce((n, r) => n + r.falseNegative.length, 0);
  const refs = results.reduce((n, r) => n + r.citationCount, 0), correct = results.reduce((n, r) => n + r.correctCitations, 0);
  const optionalDiagnostics = Object.fromEntries(['observed', 'allowed', 'unexpected'].map(key => [key, results.reduce((n, r) => n + r.optionalDiagnostics[key], 0)]));
  return { dataset: dataset.id, scoringVersion: 2, teacherReviewed: dataset.provenance.teacherReviewed, labelNotice: dataset.provenance.labels,
    measured: 'Structural and provisional scored-error categorical agreement only; optional diagnostics are counted separately against exact allowances; semantic support and teaching usefulness require the listed human checks.',
    passed: results.every(r => r.passed), summary: { cases: results.length, passingCases: results.filter(r => r.passed).length, errorPrecision: tp + fp ? tp / (tp + fp) : null, errorRecall: tp + fn ? tp / (tp + fn) : null, correctCitationRate: refs ? correct / refs : null, truePositive: tp, falsePositive: fp, falseNegative: fn, optionalDiagnostics }, results };
}
async function main(argv) {
  const options = argumentsFor(argv);
  if (options.help) {
    console.log('Offline lint: node scripts/evaluate-comparison.js\nSaved reports: node scripts/evaluate-comparison.js --reports reports.json [--case ID]\nPaid synthetic evaluation: node scripts/evaluate-comparison.js --live --case ID --output new-reports.json [--repeat 1..5]\nOther options: --fixture path. A saved bundle is {schemaVersion:1,reports:[{caseId,run:1,report:<engine result>}]}.\nDefault and --reports never access the network. Live mode requires DEEPSEEK_API_KEY and only accepts synthetic fixtures.');
    return;
  }
  if (!options.live) globalThis.fetch = async () => { throw new Error('Network is disabled for offline evaluation.'); };
  const engine = require('../server/comparison-engine');
  const dataset = lint(readJson(options.fixture), engine);
  for (const id of options.cases) assert(dataset.cases.some(c => c.id === id), 'Unknown --case.');
  const selected = options.cases.length ? dataset.cases.filter(c => options.cases.includes(c.id)) : dataset.cases;
  let reports;
  if (options.live) {
    assert(nonempty(require('../server/ai-provider').current().key()), '--live requires ' + require('../server/ai-provider').current().keyEnv + '.');
    const output = path.resolve(options.output);
    // Reserve a new private file before any paid call; never overwrite evidence.
    const fd = fs.openSync(output, 'wx', 0o600);
    reports = { schemaVersion: 1, dataset: dataset.id, generatedAt: new Date().toISOString(), model: engine.MODEL, harnessVersion: engine.HARNESS_VERSION, reports: [] };
    const save = () => { fs.ftruncateSync(fd, 0); fs.writeSync(fd, JSON.stringify(reports, null, 2) + '\n', 0, 'utf8'); fs.fsyncSync(fd); };
    try {
      save();
      const ceiling = options.repeat * selected.reduce((sum, test) => sum + test.input.participants.length + 2, 0);
      console.error('Live synthetic evaluation: up to ' + ceiling + ' paid provider calls; never student application endpoints.');
      for (let run = 1; run <= options.repeat; run++) for (const test of selected) {
        try {
          const report = await engine.compare(test.input, { apiKey: require('../server/ai-provider').current().key() });
          reports.reports.push({ caseId: test.id, run, report });
        } catch (error) {
          // No provider error text, response body, or secret enters logs.
          const report = { status: 'transport_error', profiles: [], comparisons: [] };
          if (error && typeof error.code === 'string' && /^[a-z_]{1,80}$/.test(error.code)) report.errorCode = error.code;
          if (error && error.audit) report.audit = error.audit;
          reports.reports.push({ caseId: test.id, run, report });
        }
        save();
        console.error('Completed ' + test.id + ', run ' + run + ': ' + reports.reports[reports.reports.length - 1].report.status);
      }
    } finally { fs.closeSync(fd); }
  } else if (options.reports) reports = readJson(options.reports);
  if (!reports) {
    console.log(JSON.stringify({ passed: true, mode: 'offline_fixture_lint', fixture: dataset.id, cases: selected.length, teacherReviewed: dataset.provenance.teacherReviewed, modelCalls: 0, notice: 'Fixtures and gold references are structurally valid. No model accuracy was measured.' }, null, 2));
    return;
  }
  const result = evaluate(dataset, selected, reports, engine);
  console.log(JSON.stringify(result, null, 2));
  if (!result.passed) process.exitCode = 1;
}
if (require.main === module) main(process.argv.slice(2)).catch(error => {
  // Assertions are authored CLI diagnostics; arbitrary provider errors stay private.
  console.error(error instanceof assert.AssertionError ? error.message : 'Evaluation failed. Check input paths, JSON schema and local engine availability.');
  process.exitCode = 1;
});
module.exports = { argumentsFor, lint, citationCorrect, score, evaluate };
