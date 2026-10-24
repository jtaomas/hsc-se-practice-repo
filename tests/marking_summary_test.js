'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { buildSummary, markdown, parseArgs, writeSummary, stability } = require('../scripts/summarize-marking-evaluations');
const source = require('./fixtures/marking-calibration.json');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'marking-summary-'));
try {
  const cases = ['p1-q18-0-full', 'p1-q18-0-partial', 'p1-q18-0-blank'].map(id => source.cases.find(item => item.id === id));
  const fixture = { schemaVersion: 1, teacherCertified: false, cases };
  const fixtureFile = path.join(temp, 'fixture.json'); fs.writeFileSync(fixtureFile, JSON.stringify(fixture));
  function trial(item, status, mark, detailed) {
    const calls = item.tags.includes('blank') ? [] : [1, 2, 3].map(() => ({ returnedModel: 'deepseek-flash', systemFingerprint: 'test-fingerprint', usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }, reasoning_content: 'SECRET_SENTINEL', headers: { Authorization: 'SECRET_SENTINEL' } }));
    return { id: item.id, expectedStatus: item.expected.status, expectedMark: item.expected.mark, expectedRange: item.expected.range,
      status, mark, deterministic: item.tags.includes('blank'), durationMs: 100, feedbackIssues: !detailed && status === 'marked' ? ['loss_schema'] : [],
      result: { status, mark, summary: 'SECRET_SENTINEL', strengths: ['SECRET_SENTINEL'], improve: ['SECRET_SENTINEL'],
        ...(detailed ? { losses: {}, quality: [{ feedback: 'SECRET_SENTINEL', evidence: ['SECRET_SENTINEL'] }] } : {}),
        audit: { reasons: status === 'needs_review' ? ['blind_disagreement'] : [], reason: 'SECRET_SENTINEL', returnedModels: ['deepseek-flash'], calls, evaluatorProviderCalls: calls.length } } };
  }
  function report(trials, harness, finished) {
    return { schemaVersion: 1, mode: 'live', fixtureDigest: sha(JSON.stringify(fixture)), harnessVersion: harness, requestedModel: 'deepseek-flash',
      budget: { apiKey: 'SECRET_SENTINEL', prices: { input: 1, output: 2 } }, trials, ...(finished ? { stoppedAtBudget: false } : {}) };
  }
  const a = path.join(temp, 'a.json'), b = path.join(temp, 'b.json');
  fs.writeFileSync(a, JSON.stringify(report([trial(cases[0], 'marked', 3, false), trial(cases[1], 'needs_review', null, false), trial(cases[2], 'marked', 0, false)], 'version-1', true)));
  fs.writeFileSync(b, JSON.stringify(report([trial(cases[0], 'marked', 2, true), trial(cases[1], 'marked', 2, true), trial(cases[2], 'marked', 0, true)], 'version-2', false)));
  const options = parseArgs(['--report', 'v1=' + a, '--report', 'v2=' + b, '--fixture', fixtureFile, '--pilot', 'v1', '--planned', 'v1=3', '--planned', 'v2=3', '--json', path.join(temp, 'summary.json'), '--markdown', path.join(temp, 'summary.md')]);
  const result = writeSummary(options), first = result.runs[0], second = result.runs[1];
  assert.equal(result.finality, 'includes_incomplete_checkpoints');
  assert.equal(first.sourceReportSha256, sha(fs.readFileSync(a)));
  assert.equal(first.metricsAll.trials, 3); assert.equal(first.metricsProviderOnly.trials, 2); assert.equal(first.metricsDeterministic.trials, 1);
  assert.equal(first.metricsProviderOnly.scoreCoverage, .5); assert.equal(first.metricsProviderOnly.rangeAgreementAmongScored, 1);
  assert.equal(first.metricsProviderOnly.rangeAgreementIncludingAbstentions, .5);
  assert.equal(first.metricsProviderOnly.legacyContractScored, 1); assert.equal(first.metricsProviderOnly.detailedFeedbackMechanicallyFlagged, 0);
  assert.equal(second.metricsProviderOnly.underAwards, 1); assert.equal(second.metricsProviderOnly.meanAbsoluteErrorAmongScored, .5);
  assert.equal(second.metricsProviderOnly.scored, 2); assert.equal(second.metricsProviderOnly.rangeAgreementAmongScored, .5);
  assert.equal(second.matchedPilot.comparableAnswerAndLabelProviderMetrics.trials, 2);
  assert.equal(second.byPilotExposureProviderOnly.pilot_question_exposed.trials, 2);
  assert.deepEqual(first.systemFingerprints, ['test-fingerprint']);
  assert(!JSON.stringify(result).includes('SECRET_SENTINEL'));
  assert(markdown(result).includes('Interim snapshot'));
  assert(markdown(result).includes('in initial pilot'));
  assert(!markdown(result).includes('/ previously unrun question'));
  assert(result.pilotReference.exposureSemantics.includes('relative only to the initial pilot'));
  const later = JSON.parse(JSON.stringify(result)); later.runs[1].harnessVersion = 'blind-marking-v4-feedback';
  assert(markdown(later).includes('Every question part in these later runs has already appeared in v3'));
  later.runs[1].harnessVersion = 'blind-marking-v5-feedback';
  assert(markdown(later).includes('The v4, v5 and v6 evaluations are development reruns'));
  const matched = buildSummary({ ...options, matches: [['v1', 'v2']] });
  assert.equal(matched.matchedRuns[0].caseIds.length, 2);
  assert.equal(matched.matchedRuns[0].beforeMetrics.scoreCoverage, .5);
  assert.equal(matched.matchedRuns[0].afterMetrics.scoreCoverage, 1);
  assert(markdown(matched).includes('Matched development cases: v1 versus v2'));
  const repeated = stability([
    { id: 'a', status: 'marked', mark: 2 }, { id: 'a', status: 'needs_review', mark: null }, { id: 'a', status: 'marked', mark: 2 },
    { id: 'b', status: 'marked', mark: 0 }, { id: 'b', status: 'marked', mark: 1 },
    { id: 'c', status: 'needs_review', mark: null }, { id: 'c', status: 'needs_review', mark: null },
    { id: 'd', status: 'marked', mark: 3 }
  ]);
  assert.equal(repeated.uniqueCases, 4); assert.equal(repeated.repeatedCases, 3);
  assert.equal(repeated.statusVariableCases, 1); assert.equal(repeated.releasedMarkVariableCases, 1); assert.equal(repeated.outcomeVariableCases, 2);
  assert.deepEqual(repeated.cases[0].releasedMarks, [2]);
  assert.deepEqual(repeated.cases[0].outcomes, { 'marked:2': 2, needs_review: 1 });
  assert.deepEqual(repeated.cases[2].releasedMarks, []);
  const repeatFile = path.join(temp, 'repeat.json');
  fs.writeFileSync(repeatFile, JSON.stringify(report([
    { ...trial(cases[0], 'marked', 3, true), repetition: 1 },
    { ...trial(cases[0], 'needs_review', null, true), repetition: 2 },
    { ...trial(cases[0], 'marked', 3, true), repetition: 3 }
  ], 'blind-marking-v5-feedback', true)));
  const withRepeated = buildSummary({ ...options, reports: [...options.reports, { label: 'v5_repeat', path: repeatFile }] });
  const repeatedMarkdown = markdown(withRepeated), repeatSection = repeatedMarkdown.indexOf('## Repeated-run stability');
  assert(repeatSection > 0);
  assert(!repeatedMarkdown.slice(0, repeatSection).includes('| v5_repeat |'));
  assert(repeatedMarkdown.slice(repeatSection).includes('marked:3 × 2; needs_review × 1'));
  assert.equal(withRepeated.runs[2].metricsProviderOnly.scoreCoverage, 2 / 3);
  assert.equal(withRepeated.runs[2].stability.uniqueCases, 1);
  assert.equal(withRepeated.runs[2].stability.releasedMarkVariableCases, 0);
  assert.throws(() => buildSummary({ ...options, reports: [...options.reports, { label: 'repeat', path: repeatFile }], matches: [['v1', 'repeat']] }), /single-attempt/);
  assert(!markdown(result).includes('SECRET_SENTINEL'));
  assert(fs.existsSync(options.json)); assert(fs.existsSync(options.markdown));
  const altered = JSON.parse(fs.readFileSync(b)); altered.trials[0].expectedMark = 2; fs.writeFileSync(b, JSON.stringify(altered));
  assert.throws(() => buildSummary(options), /Recorded labels/);
  assert.throws(() => parseArgs(['--report', 'v1=' + a, '--fixture', fixtureFile, '--pilot', 'v1', '--json', fixtureFile]), /overwrite/);
  assert.throws(() => parseArgs(['--report', 'v1=' + a, '--report', 'v1=' + a, '--fixture', fixtureFile, '--json', path.join(temp, 'out.json')]), /Duplicate/);
  console.log('marking summary: provenance, historical labels, provider-only denominators, legacy schema, grouping and sensitive-field exclusion passed');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
