#!/usr/bin/env node
'use strict';

// Read-only report reduction. This file never imports the marker, reads an API
// key, makes requests, changes labels, or copies model prose into public output.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const semanticDigest = value => sha256(JSON.stringify(value));
const code = value => typeof value === 'string' && /^[a-z][a-z0-9_:-]{0,99}$/.test(value) ? value : null;
const id = value => typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(value) ? value : null;
const number = value => Number.isFinite(value) && value >= 0 ? value : null;
const fraction = (n, d) => d ? n / d : null;
const unique = values => [...new Set(values.filter(value => value != null))].sort();
const NOTES = {
  'p3-q18-0-partial': { classification: 'disputed_rubric_boundary', note: 'Fixed gold is 2. A mechanism-only answer goes beyond naming, but the 2-mark descriptor can require some effect or prevention. A score of 1 is defensible under that reading; teacher/rubric adjudication is needed.' },
  'p4-q18-0-contradiction': { classification: 'disputed_rubric_boundary', note: 'Fixed gold is 1. The 2-mark descriptor asks for one well-described approach and identification of the other. Crediting the correct top-down explanation plus the bottom-up name, despite its wrong description, is a defensible alternative interpretation.' },
  'p3-q18-0-contradiction': { classification: 'quality_label_caution', note: 'The low-consistency expectation may conflate a false consequence claim with internal contradiction. High consistency with low technical accuracy is defensible; the mechanical quality flag is not a validated error.' },
  'p7-q25-0-visual_no_attributes': { classification: 'quality_construct_review', note: 'Historical v3 review: diagram quality was reduced partly for absent attributes, a content omission; the full diagram with the same layout received a higher visual-quality rating. The feedback also cited spacing, so the exact value is subjective. Inspect each later run separately before claiming this issue persists.' }
};
function assert(condition, message) { if (!condition) throw new Error(message); }
function loadJson(file) {
  assert(fs.statSync(file).size <= 64 * 1024 * 1024, 'Input exceeds 64 MiB.');
  const bytes = fs.readFileSync(file);
  return { value: JSON.parse(bytes), source: path.basename(file), sha256: sha256(bytes) };
}
function countBy(values) { const result = {}; values.forEach(value => { result[value] = (result[value] || 0) + 1; }); return result; }
function latency(values) {
  const sorted = values.filter(value => value !== null).sort((a, b) => a - b);
  return { median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : null,
    p95: sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * .95) - 1)] : null };
}
function compactTrial(trial, fixtureCase) {
  assert(trial && fixtureCase && id(trial.id), 'A report contains an unknown case.');
  assert(['development', 'held_out'].includes(fixtureCase.split) && ['tx', 'py', 'ps', 'sq', 'ft', 'dr'].includes(fixtureCase.source.type) && /^[a-f0-9]{64}$/.test(fixtureCase.source.questionVersion) && /^[a-f0-9]{64}$/.test(fixtureCase.source.rubricVersion), 'Invalid fixture source metadata.');
  const expected = fixtureCase.expected;
  assert(['marked', 'needs_review'].includes(expected.status), 'Invalid expected status.');
  assert(trial.expectedStatus === expected.status && trial.expectedMark === expected.mark &&
    JSON.stringify(trial.expectedRange) === JSON.stringify(expected.range), 'Recorded labels differ from the supplied historical fixture.');
  const result = trial.result || {}, audit = result.audit || {}, calls = Array.isArray(audit.calls) ? audit.calls : [];
  assert(['marked', 'provisional', 'needs_review', 'error'].includes(trial.status), 'Unknown trial status.');
  const released = ['marked', 'provisional'].includes(trial.status);
  assert(!released || Number.isInteger(trial.mark) && trial.mark >= 0 && trial.mark <= fixtureCase.source.maxMarks, 'Invalid awarded mark.');
  assert(result.status === trial.status && (!released || result.mark === trial.mark), 'Recorded outcome differs from the original result.');
  assert(typeof trial.deterministic === 'boolean', 'Missing deterministic/provider distinction.');
  const numeric = trial.status === 'marked' && expected.status === 'marked';
  const provisional = trial.status === 'provisional' && expected.status === 'marked';
  const outsideRange = mark => mark < expected.range[0] ? 'under' : mark > expected.range[1] ? 'over' : null;
  const tokens = { prompt: 0, completion: 0, total: 0 };
  let unknownUsageCalls = 0;
  for (const call of calls) {
    const usage = call.usage;
    if (!usage || number(usage.prompt_tokens) === null || number(usage.completion_tokens) === null) unknownUsageCalls++;
    if (usage) for (const [key, field] of [['prompt', 'prompt_tokens'], ['completion', 'completion_tokens'], ['total', 'total_tokens']]) if (number(usage[field]) !== null) tokens[key] += usage[field];
  }
  const diagnosticContract = trial.status === 'provisional' ? 'unavailable_provisional' : trial.status !== 'marked' || trial.deterministic ? 'not_assessed' : result.losses && Array.isArray(result.quality) ? 'detailed' : 'legacy';
  return {
    id: trial.id, repetition: Number.isInteger(trial.repetition) ? trial.repetition : 1,
    questionPart: [fixtureCase.request.bankId, fixtureCase.request.questionNumber, fixtureCase.request.partIndex].join('/'),
    splitLabel: fixtureCase.split, type: fixtureCase.source.type, tags: unique(fixtureCase.tags.map(code)),
    questionVersion: fixtureCase.source.questionVersion, rubricVersion: fixtureCase.source.rubricVersion,
    responseDigest: semanticDigest({ answer: fixtureCase.request.answer, diagramPng: fixtureCase.request.diagramPng || null }),
    maxMarks: fixtureCase.source.maxMarks, expectedStatus: expected.status, expectedMark: expected.mark, expectedRange: expected.range,
    status: trial.status, mark: released ? trial.mark : null, deterministic: trial.deterministic,
    exactAgreement: expected.status === 'needs_review' ? trial.status === 'needs_review' : numeric && trial.mark === expected.mark,
    rangeAgreement: expected.status === 'needs_review' ? trial.status === 'needs_review' : numeric && trial.mark >= expected.range[0] && trial.mark <= expected.range[1],
    signedError: numeric ? trial.mark - expected.mark : null,
    outsideRange: numeric ? outsideRange(trial.mark) : null,
    provisionalExactAgreement: provisional ? trial.mark === expected.mark : null,
    provisionalRangeAgreement: provisional ? outsideRange(trial.mark) === null : null,
    provisionalSignedError: provisional ? trial.mark - expected.mark : null,
    provisionalOutsideRange: provisional ? outsideRange(trial.mark) : null,
    abstentionCodes: unique((audit.reasons || []).map(code)), errorCode: code(result.errorCode),
    mechanicalFeedbackCodes: unique((trial.feedbackIssues || []).map(code)), diagnosticContract,
    selectedFeedback: audit.selectedFeedback === 0 || audit.selectedFeedback === 1 ? audit.selectedFeedback : null,
    feedbackCandidates: Array.isArray(audit.feedbackCandidates) ? audit.feedbackCandidates.filter(candidate => (candidate.index === 0 || candidate.index === 1) && typeof candidate.eligible === 'boolean').map(candidate => ({ index: candidate.index, eligible: candidate.eligible, problem: code(candidate.problem) })) : [],
    durationMs: number(trial.durationMs), providerCalls: Number.isInteger(audit.evaluatorProviderCalls) ? audit.evaluatorProviderCalls : calls.length,
    harnessCalls: calls.length, reportedTokens: tokens, unknownUsageCalls,
    returnedModels: unique((audit.returnedModels || []).map(id)), systemFingerprints: unique(calls.map(call => id(call.systemFingerprint))),
    adjudication: NOTES[trial.id] || null
  };
}
function metrics(rows, prices) {
  const labelled = rows.filter(row => row.expectedStatus === 'marked'), scored = labelled.filter(row => row.status === 'marked');
  const provisional = labelled.filter(row => row.status === 'provisional');
  const review = rows.filter(row => row.expectedStatus === 'needs_review');
  const detailed = rows.filter(row => row.diagnosticContract === 'detailed');
  const tokens = rows.reduce((sum, row) => ({ prompt: sum.prompt + row.reportedTokens.prompt, completion: sum.completion + row.reportedTokens.completion, total: sum.total + row.reportedTokens.total }), { prompt: 0, completion: 0, total: 0 });
  const unknown = rows.reduce((sum, row) => sum + row.unknownUsageCalls, 0);
  return { trials: rows.length, questionParts: unique(rows.map(row => row.questionPart)).length,
    scoreLabelled: labelled.length, scored: scored.length, confirmedScores: scored.length, scoreCoverage: fraction(scored.length, labelled.length),
    provisionalScores: provisional.length, releasedScores: scored.length + provisional.length,
    releasedRate: fraction(scored.length + provisional.length, labelled.length), provisionalRate: fraction(provisional.length, labelled.length),
    unscoredLabelledTrials: labelled.length - scored.length - provisional.length,
    unexpectedNumericReleases: rows.filter(row => row.expectedStatus !== 'marked' && ['marked', 'provisional'].includes(row.status)).length,
    provisionalExactAgreement: fraction(provisional.filter(row => row.provisionalExactAgreement).length, provisional.length),
    provisionalRangeAgreement: fraction(provisional.filter(row => row.provisionalRangeAgreement).length, provisional.length),
    provisionalMeanAbsoluteError: fraction(provisional.reduce((sum, row) => sum + Math.abs(row.provisionalSignedError), 0), provisional.length),
    provisionalSignedBias: fraction(provisional.reduce((sum, row) => sum + row.provisionalSignedError, 0), provisional.length),
    provisionalOverAwards: provisional.filter(row => row.provisionalOutsideRange === 'over').length,
    provisionalUnderAwards: provisional.filter(row => row.provisionalOutsideRange === 'under').length,
    exactMatches: scored.filter(row => row.exactAgreement).length, rangeMatches: scored.filter(row => row.rangeAgreement).length,
    exactAgreementAmongScored: fraction(scored.filter(row => row.exactAgreement).length, scored.length),
    rangeAgreementAmongScored: fraction(scored.filter(row => row.rangeAgreement).length, scored.length),
    rangeAgreementIncludingAbstentions: fraction(labelled.filter(row => row.rangeAgreement).length, labelled.length),
    meanAbsoluteErrorAmongScored: fraction(scored.reduce((sum, row) => sum + Math.abs(row.signedError), 0), scored.length),
    signedBiasAmongScored: fraction(scored.reduce((sum, row) => sum + row.signedError, 0), scored.length),
    overAwards: scored.filter(row => row.outsideRange === 'over').length, underAwards: scored.filter(row => row.outsideRange === 'under').length,
    withheld: labelled.filter(row => row.status === 'needs_review').length, failures: rows.filter(row => row.status === 'error').length,
    expectedReviewCases: review.length, expectedReviewsConfirmed: review.filter(row => row.status === 'needs_review').length,
    abstentionCodes: countBy(rows.filter(row => row.status === 'needs_review').flatMap(row => row.abstentionCodes)),
    provisionalCodes: countBy(rows.filter(row => row.status === 'provisional').flatMap(row => row.abstentionCodes)),
    errorCodes: countBy(rows.filter(row => row.status === 'error').map(row => row.errorCode || 'unclassified')),
    detailedFeedbackScored: detailed.length, detailedFeedbackMechanicallyFlagged: detailed.filter(row => row.mechanicalFeedbackCodes.length).length,
    legacyContractScored: rows.filter(row => row.diagnosticContract === 'legacy').length,
    selectedSecondFeedback: rows.filter(row => row.status === 'marked' && row.selectedFeedback === 1).length,
    selectedFeedbackWithIneligibleAlternative: rows.filter(row => row.status === 'marked' && row.selectedFeedback !== null && row.feedbackCandidates.some(candidate => !candidate.eligible)).length,
    mechanicalFeedbackCodes: countBy(detailed.flatMap(row => row.mechanicalFeedbackCodes)),
    providerCalls: rows.reduce((sum, row) => sum + row.providerCalls, 0), reportedTokens: tokens, unknownUsageCalls: unknown,
    latencyMs: latency(rows.map(row => row.durationMs)),
    estimatedReportedUsageUsd: prices && unknown === 0 ? (tokens.prompt * prices.input + tokens.completion * prices.output) / 1000000 : null };
}
function groups(rows, key, prices) {
  const result = {};
  for (const row of rows) for (const value of key(row)) { if (!result[value]) result[value] = []; result[value].push(row); }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)).map(([name, items]) => [name, metrics(items, prices)]));
}
function stability(rows) {
  const grouped = new Map();
  for (const row of rows) { if (!grouped.has(row.id)) grouped.set(row.id, []); grouped.get(row.id).push(row); }
  const cases = [...grouped].filter(([, trials]) => trials.length > 1).map(([id, trials]) => {
    const confirmedMarks = [...new Set(trials.filter(row => row.status === 'marked').map(row => row.mark))].sort((a, b) => a - b);
    const provisionalMarks = [...new Set(trials.filter(row => row.status === 'provisional').map(row => row.mark))].sort((a, b) => a - b);
    const releasedMarks = [...new Set([...confirmedMarks, ...provisionalMarks])].sort((a, b) => a - b);
    const statuses = unique(trials.map(row => row.status));
    const outcomes = countBy(trials.map(row => ['marked', 'provisional'].includes(row.status) ? row.status + ':' + row.mark : row.status));
    return { id, trials: trials.length, statuses, confirmedMarks, provisionalMarks, releasedMarks, outcomes, statusVaries: statuses.length > 1,
      releasedMarkVaries: releasedMarks.length > 1, outcomeVaries: Object.keys(outcomes).length > 1 };
  }).sort((a, b) => a.id.localeCompare(b.id));
  return { uniqueCases: grouped.size, repeatedCases: cases.length, statusVariableCases: cases.filter(row => row.statusVaries).length,
    releasedMarkVariableCases: cases.filter(row => row.releasedMarkVaries).length, outcomeVariableCases: cases.filter(row => row.outcomeVaries).length, cases };
}
function buildSummary(options) {
  const fixtures = new Map(options.fixtures.map(file => {
    const loaded = loadJson(file), value = loaded.value;
    assert(value.schemaVersion === 1 && value.teacherCertified === false && Array.isArray(value.cases), 'Invalid assistant-labelled fixture.');
    return [semanticDigest(value), { ...loaded, caseMap: new Map(value.cases.map(item => [item.id, item])) }];
  }));
  const runs = options.reports.map(entry => {
    const loaded = loadJson(entry.path), report = loaded.value, fixture = fixtures.get(report.fixtureDigest);
    assert(report.schemaVersion === 1 && ['live', 'live_baseline', 'replay'].includes(report.mode) && fixture && Array.isArray(report.trials), 'Supply the exact historical fixture for every live report.');
    const rows = report.trials.map(trial => compactTrial(trial, fixture.caseMap.get(trial.id)));
    assert(new Set(rows.map(row => row.id + ':' + row.repetition)).size === rows.length, 'Duplicate case/repetition in a report.');
    const prices = report.budget && report.budget.prices && number(report.budget.prices.input) !== null && number(report.budget.prices.output) !== null ? { input: report.budget.prices.input, output: report.budget.prices.output } : null;
    const provider = rows.filter(row => !row.deterministic);
    return { label: entry.label, sourceReport: loaded.source, sourceReportSha256: loaded.sha256,
      fixtureSource: fixture.source, fixtureSourceSha256: fixture.sha256, fixtureDigest: report.fixtureDigest,
      harnessVersion: id(report.harnessVersion), requestedModel: id(report.requestedModel),
      returnedModels: unique(rows.flatMap(row => row.returnedModels)), systemFingerprints: unique(rows.flatMap(row => row.systemFingerprints)),
      runFinished: typeof report.stoppedAtBudget === 'boolean', stoppedAtBudget: typeof report.stoppedAtBudget === 'boolean' ? report.stoppedAtBudget : null,
      plannedTrials: options.planned[entry.label] || null, completedTrials: rows.length, fixtureCases: fixture.caseMap.size,
      stability: stability(rows),
      metricsAll: metrics(rows, prices), metricsProviderOnly: metrics(provider, prices), metricsDeterministic: metrics(rows.filter(row => row.deterministic), prices),
      byTypeProviderOnly: groups(provider, row => [row.type], prices), byTagProviderOnly: groups(provider, row => row.tags, prices),
      tokenPricesUsdPerMillion: prices, cases: rows };
  });
  const pilot = runs.find(run => run.label === options.pilot);
  assert(pilot, 'Choose an existing report label for --pilot.');
  const pilotIds = new Set(pilot.cases.map(row => row.id)), pilotParts = new Set(pilot.cases.map(row => row.questionPart));
  const paidParts = new Set(pilot.cases.filter(row => !row.deterministic).map(row => row.questionPart));
  const pilotById = new Map(pilot.cases.map(row => [row.id, row]));
  for (const run of runs) {
    for (const row of run.cases) {
      row.pilotExposure = pilotParts.has(row.questionPart) ? 'pilot_question_exposed' : 'previously_unrun_question';
      row.paidPilotExposure = paidParts.has(row.questionPart) ? 'paid_pilot_question_exposed' : 'previously_unrun_by_provider';
      const reference = pilotById.get(row.id);
      row.matchedPilot = reference ? { sameAnswer: row.responseDigest === reference.responseDigest,
        sameQuestionSource: row.questionVersion === reference.questionVersion && row.rubricVersion === reference.rubricVersion,
        sameLabel: row.expectedStatus === reference.expectedStatus && row.expectedMark === reference.expectedMark && JSON.stringify(row.expectedRange) === JSON.stringify(reference.expectedRange) } : null;
    }
    const provider = run.cases.filter(row => !row.deterministic), matched = provider.filter(row => row.matchedPilot && row.matchedPilot.sameAnswer && row.matchedPilot.sameLabel);
    run.byPilotExposureProviderOnly = groups(provider, row => [row.pilotExposure], run.tokenPricesUsdPerMillion);
    run.byPaidPilotExposureProviderOnly = groups(provider, row => [row.paidPilotExposure], run.tokenPricesUsdPerMillion);
    run.matchedPilot = { referenceLabel: pilot.label, referenceCaseCount: pilotIds.size, observedCaseCount: run.cases.filter(row => pilotIds.has(row.id)).length,
      comparableAnswerAndLabelProviderMetrics: metrics(matched, run.tokenPricesUsdPerMillion),
      unchangedQuestionProviderMetrics: metrics(matched.filter(row => row.matchedPilot.sameQuestionSource), run.tokenPricesUsdPerMillion),
      changedQuestionCases: matched.filter(row => !row.matchedPilot.sameQuestionSource).map(row => row.id) };
  }
  const matchedRuns = (options.matches || []).map(([beforeLabel, afterLabel]) => {
    const before = runs.find(run => run.label === beforeLabel), after = runs.find(run => run.label === afterLabel);
    assert(before && after && before !== after && !before.stability.repeatedCases && !after.stability.repeatedCases, 'Matched runs must be distinct single-attempt reports.');
    const prior = new Map(before.cases.map(row => [row.id, row]));
    const eligible = after.cases.filter(row => { const old = prior.get(row.id); return old && !old.deterministic && !row.deterministic &&
      old.responseDigest === row.responseDigest && old.questionVersion === row.questionVersion && old.rubricVersion === row.rubricVersion &&
      old.expectedStatus === row.expectedStatus && old.expectedMark === row.expectedMark && JSON.stringify(old.expectedRange) === JSON.stringify(row.expectedRange); });
    const ids = eligible.map(row => row.id), selected = new Set(ids);
    return { before: beforeLabel, after: afterLabel, scope: 'Same answer, question/rubric source and fixed label; provider-only. Status does not affect inclusion.', caseIds: ids,
      excludedAfterCases: after.cases.filter(row => !selected.has(row.id)).map(row => row.id),
      beforeMetrics: metrics(before.cases.filter(row => selected.has(row.id)), before.tokenPricesUsdPerMillion), afterMetrics: metrics(eligible, after.tokenPricesUsdPerMillion) };
  });
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), labelSource: 'assistant_independent_reasoning', teacherCertified: false, matchedRuns,
    finality: runs.every(run => run.runFinished && (run.plannedTrials === null || run.plannedTrials === run.completedTrials)) ? 'supplied_runs_complete' : 'includes_incomplete_checkpoints',
    pilotReference: { label: pilot.label, exposureSemantics: 'All exposure groups are relative only to the initial pilot. previously_unrun_question means not in that initial pilot; previously_unrun_by_provider means not provider-assessed in that initial pilot. These keys do not imply that a question was unseen in any later development run.', exactCaseIds: [...pilotIds].sort(), questionParts: [...pilotParts].sort(), paidProviderQuestionParts: [...paidParts].sort() },
    safeguards: ['Only whitelisted score, diagnostic-code and provenance metadata is exported; full feedback, answer text and model reasoning remain in workspace reports.',
      'Fixed labels and raw score discrepancies are unchanged. Adjudication notes are qualitative cautions, not retroactive corrections.',
      'Provider metrics exclude deterministic blanks/review guards; tag groups overlap and must not be summed.',
      'Provisional scores are reported separately from confirmed scores and agreement. Numeric release coverage includes both; unavailable provisional feedback is not assessed as confirmed feedback.',
      'Legacy v1 absence of later losses/quality fields is a contract difference, not a newly generated diagnostic error.',
      'Exposure groups refer only to the initial pilot. Later full-corpus reruns follow development review of earlier runs; no untouched or teacher-certified holdout is claimed.'], runs };
}
function percent(value) { return value === null ? '—' : (100 * value).toFixed(1) + '%'; }
function numeric(value) { return value === null ? '—' : value.toFixed(3); }
function tableRow(run, m, suffix) { return `| ${run.label}${suffix || ''} | ${m.trials} | ${m.scored}/${m.scoreLabelled} | ${percent(m.rangeAgreementAmongScored)} | ${percent(m.rangeAgreementIncludingAbstentions)} | ${numeric(m.meanAbsoluteErrorAmongScored)} | ${m.overAwards}/${m.underAwards} | ${m.withheld}/${m.failures} |`; }
function markdown(summary) {
  const singleRuns = summary.runs.filter(run => !run.stability.repeatedCases);
  const repeatedRuns = summary.runs.filter(run => run.stability.repeatedCases);
  const lines = ['# AI marking evaluation review', '', summary.finality === 'supplied_runs_complete' ? 'The supplied runs are complete. Figures below refer to their saved reports and fixed original labels.' : '**Interim snapshot: at least one supplied run is incomplete. These are checkpoint figures, not final benchmark results.**', '',
    'Labels are synthetic, assistant-authored and not teacher-certified. Raw disagreements remain counted even when an independent review finds a defensible alternative interpretation. See [evaluation provenance and case notes](MARKING_EVALUATION_NOTES.md).', '',
    '## Separate runs: provider-assessed cases only', '',
    '| Run | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |'];
  singleRuns.forEach(run => lines.push(tableRow(run, run.metricsProviderOnly)));
  if (summary.runs.some(run => run.cases.some(row => row.status === 'provisional'))) {
    lines.push('', '## Provisional numeric outcomes: separate from confirmed agreement', '',
      'The scored/confirmed columns throughout this report count only marked decisions. Provisional outcomes are conservative numeric releases with withheld educational diagnostics; they are not auditor-confirmed agreement. Their accuracy and error counts are reported separately below. All nonreleased cases remain in the eligible denominator.', '',
      '| Run | Confirmed / eligible | Provisional | All numeric releases / eligible | Release rate | Provisional exact | Provisional in range | Provisional MAE | Provisional over / under |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const run of summary.runs) { const m = run.metricsProviderOnly;
      lines.push(`| ${run.label} | ${m.confirmedScores}/${m.scoreLabelled} | ${m.provisionalScores} | ${m.releasedScores}/${m.scoreLabelled} | ${percent(m.releasedRate)} | ${percent(m.provisionalExactAgreement)} | ${percent(m.provisionalRangeAgreement)} | ${numeric(m.provisionalMeanAbsoluteError)} | ${m.provisionalOverAwards}/${m.provisionalUnderAwards} |`);
    }
    lines.push('', '| Run | Provisional case | Reference range | Provisional mark | Raw error | Outcome codes |', '| --- | --- | --- | ---: | --- | --- |');
    for (const run of summary.runs) for (const row of run.cases.filter(row => row.status === 'provisional')) {
      lines.push(`| ${run.label} | ${row.id} | ${row.expectedRange ? row.expectedRange.join('–') : 'review required'} | ${row.mark} | ${row.provisionalOutsideRange || (row.provisionalRangeAgreement ? 'within range' : 'unexpected numeric release')} | ${row.abstentionCodes.join(', ') || '—'} |`);
    }
  }
  lines.push('', 'These rows cover different scopes. Compare v1/v2 on the matched pilot below; do not treat their ten-case pilot as a full-corpus baseline. The v1 baseline is the historical implementation at the start of this review. Upstream positive-audit changes later merged into v5 were not separately evaluated as that baseline. Deterministic input checks are excluded from all rows above. MAE is against the preferred exact mark; range agreement allows the predeclared holistic interval. Repeated-run experiments are reported separately below.', '',
    '## Matched pilot: same answer and fixed label', '',
    '| Run | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  singleRuns.forEach(run => lines.push(tableRow(run, run.matchedPilot.comparableAnswerAndLabelProviderMetrics)));
  for (const run of singleRuns) if (run.matchedPilot.changedQuestionCases.length) lines.push('', `${run.label}: the following matched answers have changed question/sample source fingerprints and are not a pure harness-only comparison: ${run.matchedPilot.changedQuestionCases.map(value => '`' + value + '`').join(', ')}. The compact JSON also reports the unchanged-source subset.`);
  for (const match of summary.matchedRuns || []) {
    lines.push('', '## Matched development cases: ' + match.before + ' versus ' + match.after, '', match.scope + ' These known cases do not establish unseen-question performance.', '',
      '| Run | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      tableRow({ label: match.before }, match.beforeMetrics), tableRow({ label: match.after }, match.afterMetrics));
    if (match.excludedAfterCases.length) lines.push('', 'Excluded from this exact-source comparison: ' + match.excludedAfterCases.join(', ') + '.');
  }
  lines.push('', '## Question-level exposure in the initial pilot', '', '| Run / group | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  const exposureLabels = { pilot_question_exposed: 'in initial pilot', previously_unrun_question: 'not in initial pilot' };
  for (const run of singleRuns) for (const [group, m] of Object.entries(run.byPilotExposureProviderOnly)) lines.push(tableRow(run, m, ' / ' + exposureLabels[group]));
  lines.push('', 'Exposure is grouped by question part and refers only to the initial pilot. The conservative grouping includes the pilot’s deterministic missing-preview diagram. The JSON separately supplies exposure based strictly on provider calls in that pilot. Its historical group keys are defined in pilotReference.exposureSemantics. Nominal held-out labels were partly pilot-exposed; no untouched-holdout claim is made.');
  if (summary.runs.some(run => /^blind-marking-v[4-9]/.test(run.harnessVersion || ''))) lines.push('', 'The v4, v5 and v6 evaluations are development reruns after reviewing the full v3 corpus. Every question part in these later runs has already appeared in v3. “Not in initial pilot” does not mean new or unseen in a later run. The v4 preflight and v6 focused probe cover selected cases; they are not replacements for the broad v5 run.');
  lines.push('', '## Response formats: provider-only', '', '| Run / format | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  const formats = { tx: 'written', py: 'Python', ps: 'pseudocode', sq: 'SQL', ft: 'typed table', dr: 'diagram' };
  for (const run of singleRuns) for (const [type, m] of Object.entries(run.byTypeProviderOnly)) lines.push(tableRow(run, m, ' / ' + (formats[type] || type)));
  lines.push('', '## Selected challenge groups: provider-only', '', '| Run / group | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  const challengeTags = ['beyond_full', 'partial', 'minimal', 'zero', 'contradiction', 'prompt_injection', 'repetition', 'dense_writing', 'visual_diagram'];
  for (const run of singleRuns) for (const tag of challengeTags) if (run.byTagProviderOnly[tag]) lines.push(tableRow(run, run.byTagProviderOnly[tag], ' / ' + tag.replaceAll('_', ' ')));
  lines.push('', 'Challenge tags overlap; these rows cannot be summed into a corpus total. Full tag breakdowns are in the JSON.');
  if (repeatedRuns.length) {
    lines.push('', '## Repeated-run stability: separate experiment', '', 'Repeated attempts use the same answers and do not add independent examples. Trial-level agreement below is not a larger benchmark. A withheld result is a separate outcome, never a zero; released-mark variation compares only actual numeric scores.', '', '| Run | Distinct cases | Repeated cases | Total trials | Cases with status variation | Cases with released-mark variation | Cases with any outcome variation |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const run of repeatedRuns) lines.push(`| ${run.label} | ${run.stability.uniqueCases} | ${run.stability.repeatedCases} | ${run.completedTrials} | ${run.stability.statusVariableCases} | ${run.stability.releasedMarkVariableCases} | ${run.stability.outcomeVariableCases} |`);
    lines.push('', '| Run | Provider trials | Scored / eligible trials | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |', '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const run of repeatedRuns) lines.push(tableRow(run, run.metricsProviderOnly));
    lines.push('', '| Run | Case | Observed outcomes (count) |', '| --- | --- | --- |');
    for (const run of repeatedRuns) for (const row of run.stability.cases) lines.push(`| ${run.label} | ${row.id} | ${Object.entries(row.outcomes).map(([outcome, count]) => outcome + ' × ' + count).join('; ')} |`);
  }
  lines.push('', '## Withholding and transport diagnostics', '', '| Run | Code | Provider trials |', '| --- | --- | ---: |');
  for (const run of summary.runs) {
    for (const [code, count] of Object.entries(run.metricsProviderOnly.abstentionCodes)) lines.push(`| ${run.label} | ${code} | ${count} |`);
    for (const [code, count] of Object.entries(run.metricsProviderOnly.errorCodes)) lines.push(`| ${run.label} | ${code} (transport/run error) | ${count} |`);
  }
  lines.push('', '## Fixed-label discrepancies and mechanical flags', '', '| Run | Case | Expected | Observed | Raw flags / outcome | Review caution |', '| --- | --- | --- | --- | --- | --- |');
  let exceptions = 0;
  for (const run of summary.runs) for (const row of run.cases) if (row.status === 'marked' && (!row.rangeAgreement || row.diagnosticContract === 'detailed' && row.mechanicalFeedbackCodes.length)) {
    exceptions++; lines.push(`| ${run.label} | ${row.id} | ${row.expectedRange ? row.expectedRange.join('–') : 'review'} | ${row.mark} | ${[row.outsideRange, ...row.mechanicalFeedbackCodes].filter(Boolean).join(', ') || '—'} | ${row.adjudication ? row.adjudication.note : 'Needs case-level review; raw comparison is not teacher adjudication.'} |`);
  }
  if (!exceptions) lines.push('| — | — | — | — | No completed exceptions in this snapshot | This is not a claim about pending trials. |');
  lines.push('', 'Mechanical checks cannot establish pedagogical usefulness and can miss confusion between factual accuracy and other quality factors. A fixed quality expectation can also be wrong. Detailed semantic observations stay in the provenance/case notes; full student-facing feedback remains in the workspace source reports.', '', '## Run identity and completion', '', '| Run | Harness | Completed / planned | Finished | Deterministic cases | Source SHA-256 |', '| --- | --- | ---: | --- | ---: | --- |');
  summary.runs.forEach(run => lines.push(`| ${run.label} | ${run.harnessVersion} | ${run.completedTrials}/${run.plannedTrials || '?'} | ${run.runFinished ? run.stoppedAtBudget ? 'budget-stopped' : 'yes' : 'checkpoint'} | ${run.metricsDeterministic.trials} | ${run.sourceReportSha256} |`));
  lines.push('', 'The accompanying [compact case-level JSON](data/marking-evaluation-summary.json) records fixture digests, requested/returned model identities and fingerprints, type/tag breakdowns, abstention codes, latency and reported token usage. Tag groups overlap. Its optional cost values use user-supplied rates and reported usage, exclude cache discounts, and are not a provider invoice.', '', 'Changes after this snapshot require a new generated summary. Raw reports retain their original source identity; later versions must be reported separately.', '');
  return lines.join('\n');
}
function parseArgs(args) {
  const options = { reports: [], fixtures: [], planned: {}, matches: [] };
  for (let i = 0; i < args.length; i++) {
    const name = args[i], value = args[++i]; assert(value && !value.startsWith('--'), 'Missing argument value.');
    if (name === '--report') { const split = value.indexOf('='); assert(split > 0 && /^[a-z0-9_-]{1,30}$/.test(value.slice(0, split)), 'Use --report label=path.'); options.reports.push({ label: value.slice(0, split), path: value.slice(split + 1) }); }
    else if (name === '--fixture') options.fixtures.push(value);
    else if (name === '--pilot') options.pilot = value;
    else if (name === '--match') { const pair = value.split(':'); assert(pair.length === 2 && pair.every(label => /^[a-z0-9_-]{1,30}$/.test(label)), 'Use --match before:after.'); options.matches.push(pair); }
    else if (name === '--json') options.json = value;
    else if (name === '--markdown') options.markdown = value;
    else if (name === '--planned') { const [label, count] = value.split('='); assert(/^[a-z0-9_-]{1,30}$/.test(label) && Number.isSafeInteger(Number(count)) && Number(count) > 0, 'Use --planned label=count.'); options.planned[label] = Number(count); }
    else throw new Error('Unknown summarizer option.');
  }
  assert(options.reports.length && options.reports.length <= 10 && options.fixtures.length && options.json, 'Supply reports, exact fixtures and a JSON output.');
  assert(new Set(options.reports.map(entry => entry.label)).size === options.reports.length, 'Duplicate report label.');
  const inputs = [...options.reports.map(entry => entry.path), ...options.fixtures].map(file => path.resolve(file));
  assert([options.json, options.markdown].filter(Boolean).every(file => !inputs.includes(path.resolve(file))), 'Outputs cannot overwrite source reports or fixtures.');
  assert(!options.markdown || path.resolve(options.markdown) !== path.resolve(options.json), 'JSON and Markdown outputs must differ.');
  return options;
}
function writeSummary(options) {
  const summary = buildSummary(options);
  fs.mkdirSync(path.dirname(options.json), { recursive: true }); fs.writeFileSync(options.json, JSON.stringify(summary, null, 2) + '\n');
  if (options.markdown) { fs.mkdirSync(path.dirname(options.markdown), { recursive: true }); fs.writeFileSync(options.markdown, markdown(summary)); }
  return summary;
}
if (require.main === module) {
  try { const output = writeSummary(parseArgs(process.argv.slice(2))); process.stdout.write(JSON.stringify({ finality: output.finality, runs: output.runs.map(run => ({ label: run.label, completed: run.completedTrials, finished: run.runFinished })) }) + '\n'); }
  catch (_) { process.stderr.write('Could not summarize: check report/fixture identity, argument values and readable JSON. Source contents were not printed.\n'); process.exitCode = 1; }
}
module.exports = { compactTrial, metrics, stability, buildSummary, markdown, parseArgs, writeSummary };
