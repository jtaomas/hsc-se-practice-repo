'use strict';

// Fabricated reports exercise the evaluator, not model quality. All assessment
// data comes from original synthetic fixtures; no provider or application API
// is contacted. These tests do not turn provisional labels into teacher truth.
const assert = require('node:assert/strict');
const harness = require('../scripts/evaluate-comparison');
const engine = require('../server/comparison-engine');
const fixture = require('./fixtures/comparison-calibration.json');
const tests = [];
const clone = value => JSON.parse(JSON.stringify(value));
const fetchBefore = globalThis.fetch;
let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error('Network is forbidden in evaluator tests.'); };
function test(name, run) { tests.push({ name, run }); }

function syntheticReport(testCase) {
  if (testCase.expected.status === 'needs_review') {
    return { status: 'needs_review', summary: 'Review is required.', profiles: [], comparisons: [], audit: { reasons: ['extractor_abstention'] } };
  }
  return {
    status: 'complete', summary: 'This report describes the selected common responses.', comparisons: [],
    profiles: testCase.input.participants.map(participant => {
      const errors = testCase.expected.errors.filter(error => error.participantId === participant.id);
      const groups = testCase.expected.requiredFindings.length
        ? testCase.expected.requiredFindings.filter(item => item.participantId === participant.id).map(item => errors.filter(error => error.errorType === item.errorType))
        : errors.map(error => [error]);
      return {
        participantId: participant.id,
        findings: groups.map((group, index) => ({
          id: 'f' + index, kind: 'criterion_shortfall',
          category: group[0].errorType === 'stimulus_not_applied' ? 'context_application' : 'technical_accuracy',
          errorType: group[0].errorType, scope: group.length > 1 ? 'repeated' : 'single_response',
          statement: 'The cited marking identifies this required achievement as missing.',
          action: 'Revise the cited response to meet the identified requirement.',
          evidence: group.map(error => {
            const part = participant.parts.find(item => item.id === error.questionId);
            const criterion = part.feedback.criteria.find(item => item.assessment === 'not_met');
            return { participantId: participant.id, questionId: part.id, criterionId: criterion.id, source: 'feedback', quote: part.feedback.improve[0] };
          })
        }))
      };
    })
  };
}
function reports() {
  return { schemaVersion: 1, reports: fixture.cases.map(item => ({ caseId: item.id, run: 1, report: syntheticReport(item) })) };
}
function result(bundle) { return harness.evaluate(fixture, fixture.cases, bundle, engine); }
function firstFinding(bundle) { return bundle.reports[0].report.profiles[0].findings[0]; }
function matchedComparison() {
  return {
    id: 'contrast1', category: 'technical_accuracy',
    statement: 'These responses explain the cache mechanism differently.', action: 'Check the caching mechanism against the shared criterion.',
    evidence: fixture.cases[0].input.participants.map(participant => ({
      participantId: participant.id, questionId: '1.0', criterionId: 'c1', source: 'answer', quote: participant.parts[0].answer
    }))
  };
}

test('offline fixture lint validates original cases, disputed-credit guard and provisional provenance', () => {
  assert.equal(harness.lint(fixture, engine), fixture);
  assert.equal(fixture.cases.length, 9);
  assert.equal(fixture.provenance.teacherReviewed, false);
  assert.equal(fixture.provenance.realStudentData, false);
});

test('fixture lint rejects unknown gold references, duplicate diagnoses and non-identical order pairs', () => {
  let invalid = clone(fixture);
  invalid.cases[0].expected.errors[0].questionId = '999.0';
  assert.throws(() => harness.lint(invalid, engine), /missing evidence/);
  invalid = clone(fixture);
  invalid.cases[0].expected.errors.push(clone(invalid.cases[0].expected.errors[0]));
  assert.throws(() => harness.lint(invalid, engine), /duplicated/);
  invalid = clone(fixture);
  invalid.cases.find(item => item.expected.equivalentTo).input.participants[0].parts[0].answer += ' Changed';
  assert.throws(() => harness.lint(invalid, engine), /identical participant evidence/);
});

test('synthetic accepted reports produce exact categorical agreement without claiming measured accuracy', () => {
  const scored = result(reports());
  assert.equal(scored.passed, true);
  assert.equal(scored.summary.passingCases, fixture.cases.length);
  assert.equal(scored.summary.errorPrecision, 1);
  assert.equal(scored.summary.errorRecall, 1);
  assert.equal(scored.summary.correctCitationRate, 1);
  assert.equal(scored.teacherReviewed, false);
  assert(scored.results.every(item => item.manualReviewRequired.length > 0));
  assert.match(scored.measured, /semantic support.*human checks/);
});

test('fabricated quote fails provenance and the engine profile validator', () => {
  const bundle = reports();
  firstFinding(bundle).evidence[0].quote = 'This sentence is absent from all supplied sources.';
  const scored = result(bundle);
  assert.equal(scored.passed, false);
  assert(scored.results[0].failures.includes('citation_correctness'));
  assert(scored.results[0].failures.includes('profile_validation:p1:unsupported_evidence'));
  assert(scored.summary.correctCitationRate < 1);
});

test('valid quotation attributed to another participant still fails profile ownership', () => {
  const bundle = reports(), other = fixture.cases[0].input.participants[1].parts[0];
  firstFinding(bundle).evidence[0] = { participantId: 'p2', questionId: '1.0', criterionId: 'c1', source: 'feedback', quote: other.feedback.improve[0] };
  const scored = result(bundle);
  assert.equal(scored.passed, false);
  assert(scored.results[0].failures.includes('profile_validation:p1:cross_participant_evidence'));
  assert.equal(scored.summary.falseNegative, 1);
});

test('omitted diagnosis affects recall and changed taxonomy creates both a false positive and negative', () => {
  const omitted = reports(); omitted.reports[0].report.profiles[0].findings = [];
  let scored = result(omitted);
  assert.equal(scored.summary.falseNegative, 1);
  assert.equal(scored.summary.falsePositive, 0);
  const changed = reports(); firstFinding(changed).errorType = 'requirement_omission';
  scored = result(changed);
  assert.equal(scored.summary.falsePositive, 1);
  assert.equal(scored.summary.falseNegative, 1);
  assert(scored.results.find(item => item.caseId === 'participant_order_permutation').failures.includes('order_invariance'));
});

test('duplicate supporting citations cannot inflate diagnostic true positives', () => {
  const bundle = reports(), finding = firstFinding(bundle);
  finding.evidence.push(clone(finding.evidence[0]));
  const baseline = result(reports()), scored = result(bundle);
  assert.equal(scored.summary.truePositive, baseline.summary.truePositive);
  assert.equal(scored.passed, false);
  assert(scored.results[0].failures.includes('profile_validation:p1:duplicate_evidence'));
});

test('peer comparison needs the same criterion as well as the same question', () => {
  const valid = reports(); valid.reports[0].report.comparisons.push(matchedComparison());
  assert.equal(result(valid).passed, true);
  const invalid = clone(valid); invalid.reports[0].report.comparisons[0].evidence[1].criterionId = 'c2';
  const scored = result(invalid);
  assert.equal(scored.passed, false);
  assert(scored.results[0].failures.includes('synthesis_validation:unmatched_comparison'));
});

test('an evidence-backed observation can omit homework while a repair cannot', () => {
  const bundle = reports(), comparison = matchedComparison(); comparison.action = '';
  bundle.reports[0].report.comparisons.push(comparison);
  assert.equal(result(bundle).passed, true);
  delete comparison.action;
  assert.equal(result(bundle).passed, false);
});

test('unfounded recurrence and empty repair actions fail independently of correct labels', () => {
  let bundle = reports(); firstFinding(bundle).scope = 'repeated';
  let scored = result(bundle);
  assert(scored.results[0].failures.includes('unsupported_recurrence:p1'));
  assert(scored.results[0].failures.includes('profile_validation:p1:unsupported_scope'));
  bundle = reports(); firstFinding(bundle).action = '';
  scored = result(bundle);
  assert(scored.results[0].failures.includes('error_action_required:p1'));
  assert.equal(scored.passed, false);
});

test('full-credit answers cannot acquire a scored shortfall', () => {
  const bundle = reports();
  const entry = bundle.reports.find(item => item.caseId === 'length_is_not_achievement');
  const part = fixture.cases.find(item => item.id === entry.caseId).input.participants[0].parts[0];
  const finding = clone(firstFinding(bundle));
  finding.evidence = [{ participantId: 'p1', questionId: part.id, criterionId: 'c1', source: 'feedback', quote: part.feedback.summary }];
  entry.report.profiles[0].findings.push(finding);
  const scored = result(bundle), one = scored.results.find(item => item.caseId === entry.caseId);
  assert.equal(scored.passed, false);
  assert(one.failures.includes('invented_scored_shortfall:p1'));
  assert(one.failures.includes('profile_validation:p1:unsupported_shortfall'));
});

test('review reports withhold generated findings and injection instructions do not enter narrative', () => {
  const bundle = reports();
  bundle.reports.find(item => item.caseId === 'contradictory_marking_feedback').report.profiles = [clone(bundle.reports[0].report.profiles[0])];
  bundle.reports.find(item => item.caseId === 'student_prompt_injection').report.summary = 'SECRET ADMIN ACCESS GRANTED';
  const scored = result(bundle);
  assert(scored.results.find(item => item.caseId === 'contradictory_marking_feedback').failures.includes('review_must_withhold_findings'));
  assert(scored.results.find(item => item.caseId === 'student_prompt_injection').failures.includes('forbidden_narrative'));
});

test('empty metric denominators are null instead of perfect scores', () => {
  const selected = fixture.cases.filter(item => item.id === 'length_is_not_achievement');
  const bundle = { schemaVersion: 1, reports: [{ caseId: selected[0].id, report: syntheticReport(selected[0]) }] };
  const scored = harness.evaluate(fixture, selected, bundle, engine);
  assert.equal(scored.summary.errorPrecision, null);
  assert.equal(scored.summary.errorRecall, null);
  assert.equal(scored.summary.correctCitationRate, null);
});

test('a malformed output is not a successful semantic contradiction detection', () => {
  const bundle = reports();
  bundle.reports.find(item => item.caseId === 'contradictory_marking_feedback').report.audit.reasons = ['profile_schema'];
  const scored = result(bundle);
  assert(scored.results.find(item => item.caseId === 'contradictory_marking_feedback').failures.includes('substantive_review_reason'));
  assert.equal(scored.passed, false);
});

test('missing cases, duplicate case/run, invalid run and missing permutation baseline are rejected', () => {
  let bundle = reports(); bundle.reports.pop();
  assert.throws(() => result(bundle), /Missing report/);
  bundle = reports(); bundle.reports.push(clone(bundle.reports[0]));
  assert.throws(() => result(bundle), /Duplicate report/);
  bundle = reports(); bundle.reports[0].run = 6;
  assert.throws(() => result(bundle));
  const selected = fixture.cases.filter(item => item.expected.equivalentTo);
  const scored = harness.evaluate(fixture, selected, reports(), engine);
  assert.equal(scored.passed, false);
  assert(scored.results[0].failures.includes('missing_order_invariance_reference'));
});

test('CLI needs explicit live mode and a new output destination; modes cannot conflict', () => {
  assert.equal(harness.argumentsFor([]).live, false);
  assert.throws(() => harness.argumentsFor(['--live']), /requires a new --output/);
  assert.throws(() => harness.argumentsFor(['--live', '--output', 'out.json', '--reports', 'in.json']), /either/);
  assert.throws(() => harness.argumentsFor(['--repeat', '2']), /only to --live/);
  assert.throws(() => harness.argumentsFor(['--live', '--output', 'out.json', '--repeat', '6']), /1 to 5/);
  assert.throws(() => harness.argumentsFor(['--unknown']), /Unknown option/);
  const live = harness.argumentsFor(['--live', '--output', 'out.json', '--case', 'same_marks_distinct_gaps', '--repeat', '2']);
  assert.equal(live.live, true); assert.equal(live.repeat, 2);
  assert.deepEqual(live.cases, ['same_marks_distinct_gaps']);
});

try {
  for (const item of tests) { item.run(); console.log('ok - ' + item.name); }
  assert.equal(networkCalls, 0, 'Evaluator tests must never access the network.');
  console.log(tests.length + ' comparison evaluator tests passed; no model calls.');
} finally { globalThis.fetch = fetchBefore; }
