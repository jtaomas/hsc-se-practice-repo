'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const evaluator = require('../scripts/evaluate-improvement');
const canonical = require('../server/marking-input'), marker = require('../server/marking-engine'), coach = require('../server/improvement-engine');
const { QUALITY_FACTORS } = require('../server/feedback-policy');
const clone = value => JSON.parse(JSON.stringify(value));
function actualResult(item) {
  // This function is a test double only, never used by the live evaluator.
  const input = canonical.prepare(item.request).input, quote = input.answer.slice(0, 160);
  const result = { status: 'marked', mark: input.maxMarks, summary: 'ACTUAL_RETURNED_FEEDBACK_SENTINEL', strengths: ['The response explains the required security mechanisms.'], improve: [], advice: [], criteria: input.criteria.map((c, i) => ({ id: c.id, assessment: i ? 'context' : 'met', evidence: i ? [] : [quote], basis: i ? 'Lower overlapping band.' : 'Required explanation is present.' })), losses: { allocation: 'holistic', totalLost: 0, items: [] }, quality: QUALITY_FACTORS.map(id => ({ id, rating: ['code_quality', 'diagram_quality'].includes(id) ? null : 8, evidence: ['code_quality', 'diagram_quality'].includes(id) ? [] : [quote], feedback: 'The response provides evidence relevant to this factor.', action: 'Maintain this precision in a new response.' })), audit: { harnessVersion: marker.HARNESS_VERSION, requestedModel: marker.MODEL, checks: { completed: true, modelMatch: true, outputSchema: true, evidenceSupported: true, blindAgreement: true, auditorApproved: true }, calls: ['marker1', 'marker2', 'auditor'].map(stage => ({ stage, requestedModel: marker.MODEL, returnedModel: marker.MODEL, status: 'completed', finishReason: 'stop', usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 } })) } };
  result.audit = require('./improvement_fixtures').markerAudit(result);
  return result;
}
function fixtures() {
  const data = clone(require('./fixtures/marking-calibration.json'));
  const full = data.cases.find(item => item.id === 'p1-q18-0-full'), beyond = data.cases.find(item => item.id === 'p1-q18-0-beyond_full');
  // Deliberately contradict the actual provider score: labels must not select,
  // change or contaminate the coach input, even when a label says zero.
  beyond.expected.mark = 0; beyond.expected.range = [0, 0]; beyond.expected.rationale = 'LABEL_RATIONALE_SENTINEL must stay entirely outside model context.';
  beyond.expected.feedbackExpectations = ['LABEL_FEEDBACK_SENTINEL']; beyond.tags = ['label_tag_sentinel'];
  const result = actualResult(beyond), later = actualResult(full); later.summary = 'LATER_VARIANT_SENTINEL'; later.audit.feedbackDigest = marker.selectedFeedbackDigest(later);
  const report = { schemaVersion: 1, mode: 'live', fixtureDigest: canonical.digest(data), harnessVersion: marker.HARNESS_VERSION, requestedModel: marker.MODEL, trials: [
    { id: full.id, status: 'needs_review', mark: null, result: { status: 'needs_review', mark: null } },
    { id: beyond.id, status: 'marked', mark: result.mark, repetition: 1, result },
    { id: full.id, status: 'marked', mark: later.mark, repetition: 2, result: later }
  ] };
  return { data, report };
}
function proposal(input) {
  const part = input.parts.find(p => p.partId === '18.0');
  return { summary: 'This synthetic attempt includes a confirmed explanation of hashing and salting. Deliberate blanks cannot identify additional knowledge weaknesses.', strengths: [{ title: 'Security explanation', detail: 'The confirmed response explains the required mechanisms.', evidence: [{ partId: part.partId, source: 'answer', quote: part.answer.slice(0, 160) }] }], knowledgeGaps: [], writingPatterns: [], quality: input.quality.map(q => ({ id: q.id, feedback: q.rating === null ? 'No applicable confirmed evidence supports a rating.' : 'Use the confirmed question feedback to review this demonstrated factor.', action: q.rating === null ? 'Complete an applicable response before assessing this factor.' : 'Apply the same precision in a new security scenario.', evidencePartIds: q.evidencePartIds })), plan: [{ priority: 1, title: 'Optional: Transfer the security explanation', why: 'The confirmed response supports practising the same concepts in a new context.', evidencePartIds: [part.partId], steps: ['Recall the purpose of each mechanism.', 'Apply each mechanism to a new account database scenario.'], exercise: 'Explain how hashing and unique salts protect account data in a different system.', successCheck: 'Name both mechanisms, state a correct effect of each, and link each effect to the new scenario.', schedule: 'Next practice session, then repeat two days later.' }], limitations: ['This synthetic attempt cannot establish recurring writing patterns.'] };
}
(async () => {
  assert.throws(() => evaluator.parseArgs(['--live']), /marking-report/);
  assert.throws(() => evaluator.parseArgs(['--marking-report', 'input.json', '--live']), /explicit budgets/);
  assert.throws(() => evaluator.parseArgs(['--marking-report', 'input.json', '--env-file', '.env.eval']), /explicit/);
  assert.throws(() => evaluator.parseArgs(['--marking-report', 'input.json', '--output', 'input.json']), /overwrite/);
  const flags = ['--live', '--max-calls', '6', '--max-output-tokens', '98304', '--max-usd', '2', '--input-usd-per-million', '0.30', '--output-usd-per-million', '1.20'];
  assert.throws(() => evaluator.parseArgs(['--marking-report', 'input.json', ...flags, '--max-calls', '7']), /budgets/);
  assert.throws(() => evaluator.parseArgs(['--marking-report', 'input.json', ...flags, '--max-usd', '3']), /budgets/);
  const { data, report } = fixtures(), original = clone(report);
  const prepared = await evaluator.buildEvidence(data, report, '1');
  assert.deepEqual(report, original, 'provenance augmentation must not modify source report');
  assert.equal(prepared.selected.length, 1); assert.equal(prepared.selected[0].caseId, 'p1-q18-0-beyond_full'); assert.equal(prepared.selected[0].mark, 3);
  const serialized = JSON.stringify(prepared.input);
  for (const forbidden of ['LABEL_RATIONALE_SENTINEL', 'LABEL_FEEDBACK_SENTINEL', 'label_tag_sentinel', 'LATER_VARIANT_SENTINEL']) assert(!serialized.includes(forbidden));
  assert(serialized.includes('ACTUAL_RETURNED_FEEDBACK_SENTINEL'));
  assert(prepared.controlled.some(p => p.treatment === 'deliberate_open_blank')); assert(prepared.controlled.some(p => p.treatment === 'changed_closed_choice'));
  assert.equal(prepared.input.coverage.totalMaxMarks, 80); assert.equal(prepared.input.parts.find(p => p.partId === '18.0').mark, 3);
  for (const mutate of [r => { r.fixtureDigest = 'changed'; }, r => { r.mode = 'offline_validation'; }, r => { r.harnessVersion = 'old'; }, r => { r.trials[1].result.audit.checks.auditorApproved = false; }, r => { r.trials[1].result.audit.auditor.checks.qualityGrounding = 'uncertain'; }, r => { r.trials[1].result.audit.selectedFeedback = 1; }, r => { r.trials[1].result.summary = 'Changed but still plausible.'; }, r => { r.trials[1].result.quality[0].evidence = ['Invented evidence']; }, r => { r.trials[1].mark = 0; }]) {
    const bad = clone(report); mutate(bad); await assert.rejects(evaluator.buildEvidence(data, bad, '1'));
  }
  await assert.rejects(evaluator.buildEvidence(data, report, '7'), /No confirmed/);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'improvement-evaluator-'));
  try {
    const fixture = path.join(temp, 'fixture.json'), markingReport = path.join(temp, 'marking.json'), output = path.join(temp, 'coach.json');
    fs.writeFileSync(fixture, JSON.stringify(data)); fs.writeFileSync(markingReport, JSON.stringify(report));
    const common = ['--fixture', fixture, '--marking-report', markingReport, '--output', output];
    const offline = await evaluator.run(evaluator.parseArgs(common), { fetch: () => { throw Error('offline must not call'); } });
    assert.equal(offline.mode, 'offline_validation'); assert.equal(offline.trials.length, 0); assert.equal(offline.selectedActualMarks[0].mark, 3);
    let count = 0;
    const live = await evaluator.run(evaluator.parseArgs([...common, ...flags]), { apiKey: 'TEST_ONLY_NO_REAL_SECRET', fetch: async (_url, config) => {
      assert.equal(_url, require('../server/ai-provider').current().endpoint); assert.equal(config.redirect, 'error');
      const body = JSON.parse(config.body), json = body.messages[1].content;
      for (const forbidden of ['LABEL_RATIONALE_SENTINEL', 'LABEL_FEEDBACK_SENTINEL', 'label_tag_sentinel', 'TEST_ONLY_NO_REAL_SECRET']) assert(!json.includes(forbidden));
      count++; const input = JSON.parse(json), value = count === 1 ? proposal(input) : require('./improvement_fixtures').coachApproval();
      return new Response(JSON.stringify({ model: coach.MODEL, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }], usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 } }));
    } });
    assert.equal(live.trials[0].status, 'ready'); assert.equal(count, 2); assert.equal(live.budgetUsage.calls, 2); assert.equal(live.budgetUsage.reservedOutputTokens, 40960); assert.equal(live.metrics.reportedTokens.completion_tokens, 400); assert(!JSON.stringify(live).includes('TEST_ONLY_NO_REAL_SECRET'));
    assert.equal(fs.statSync(output).mode & 0o777, 0o600);
    const stopped = await evaluator.run(evaluator.parseArgs([...common, ...flags, '--max-calls', '1']), { apiKey: 'TEST_ONLY', fetch: () => { throw Error('must not start incomplete attempt'); } });
    assert.equal(stopped.stoppedAtBudget, true); assert.equal(stopped.budgetUsage.calls, 0);
    const insufficientTokens = await evaluator.run(evaluator.parseArgs([...common, ...flags, '--max-output-tokens', '32768']), { apiKey: 'TEST_ONLY', fetch: () => { throw Error('must reserve the distinct stage caps before starting'); } });
    assert.equal(insufficientTokens.budgetUsage.calls, 0); assert.equal(insufficientTokens.stoppedAtBudget, true);
    const exactTokens = await evaluator.run(evaluator.parseArgs([...common, ...flags, '--max-output-tokens', '40960']), { apiKey: 'TEST_ONLY', fetch: async (_url, config) => { const body = JSON.parse(config.body), input = JSON.parse(body.messages[1].content), first = body.max_tokens === 24576; return new Response(JSON.stringify({ model: coach.MODEL, choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(first ? proposal(input) : require('./improvement_fixtures').coachApproval()) } }], usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 } })); } });
    assert.equal(exactTokens.trials[0].status, 'ready'); assert.equal(exactTokens.budgetUsage.reservedOutputTokens, 40960);
    const money = await evaluator.run(evaluator.parseArgs([...common, ...flags, '--max-usd', '0.000000001']), { apiKey: 'TEST_ONLY', fetch: () => { throw Error('must not exceed dollar reservation'); } });
    assert.equal(money.budgetUsage.calls, 0); assert.equal(money.stoppedAtBudget, true);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  console.log('Improvement evaluator OK: exact fixture/report binding, first accepted actual feedback only, no label/secret leakage, synthetic controls, offline default, real harness with mocked provider, token/call/dollar caps.');
})().catch(error => { console.error(error); process.exitCode = 1; });
