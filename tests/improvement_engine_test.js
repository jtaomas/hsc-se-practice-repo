'use strict';
const assert = require('node:assert/strict');
const { improve, proposalProblem, resultProblem, projectEvidence, resolveObjectiveReferences, publicResultDigest, HARNESS_VERSION, MODEL, LIMITS, AUDIT_CHECKS } = require('../server/improvement-engine');
const fixture = require('./improvement_fixtures');
const clone = value => JSON.parse(JSON.stringify(value));
const input = fixture.input();
function approval() { return fixture.coachApproval(); }
function provider(outputs, inspect) { let n = 0; const fn = async (_url, options) => { const request = JSON.parse(options.body); assert.equal(request.model, 'deepseek-flash'); assert.equal(request.reasoning_effort, 'low'); assert.equal(request.max_tokens, n === 0 ? LIMITS.coachMaxTokens : LIMITS.auditMaxTokens); assert(!request.tools); if (inspect) inspect(request, n); const output = outputs[n++]; return new Response(JSON.stringify({ model: 'deepseek-flash', choices: [{ finish_reason: 'stop', message: { content: typeof output === 'string' ? output : JSON.stringify(output) } }] }), { status: 200 }); }; fn.count = () => n; return fn; }
(async () => {
  const original = clone(input), good = fixture.proposal(input), fetch = provider([good, approval()], (request, n) => { const payload = JSON.parse(request.messages[1].content); if (n === 1) assert.deepEqual(payload.originalEvidence, clone(projectEvidence(input))); });
  assert.equal(proposalProblem(good, input), null);
  // Full-credit-only practice is explicitly optional, including correct closed selections.
  const fullCredit = clone(good);
  fullCredit.plan = [{ priority: 1, title: 'Maintain the correct selection', why: 'The selected answer already earns all available marks.', evidencePartIds: ['1.0'], steps: ['Recall the selected data structure.', 'Identify a new situation where it is useful.'], exercise: 'Optionally choose the same structure for a fresh valid scenario.', successCheck: 'The chosen structure satisfies the new scenario; the original correct answer needs no additional content.', schedule: 'Optional next practice session.' }];
  for (const title of ['Maintain the correct selection', 'optional: Maintain the selection', ' Optional: Maintain the selection']) {
    fullCredit.plan[0].title = title;
    assert.equal(proposalProblem(fullCredit, input), 'full_credit_optional');
    const badFetch = provider([fullCredit]);
    const withheld = await improve(input, { apiKey: 'mock', fetch: badFetch });
    assert.equal(withheld.audit.reason, 'full_credit_optional'); assert.equal(badFetch.count(), 1); assert.deepEqual(withheld.plan, []);
  }
  fullCredit.plan[0].title = 'Optional: Maintain the correct selection';
  assert.equal(proposalProblem(fullCredit, input), null);
  const optionalResult = await improve(input, { apiKey: 'mock', fetch: provider([fullCredit, approval()]) });
  assert.equal(optionalResult.status, 'ready'); assert.deepEqual(optionalResult.coverage, input.coverage);
  const mixedCredit = clone(fullCredit); mixedCredit.plan[0].evidencePartIds = ['1.0', '18.0']; mixedCredit.plan[0].title = 'Develop the incomplete explanation';
  assert.equal(proposalProblem(mixedCredit, input), null, 'a genuine shortfall may support a required practice target');
  const extraContent = clone(fullCredit); extraContent.plan[0].successCheck = 'Add one new technical mechanism before the original full-credit answer counts as successfully edited.';
  const mandatoryAudit = approval(); mandatoryAudit.checks.qualitySeparation = 'fail'; mandatoryAudit.issues = [{ checkId: 'qualitySeparation', detail: 'An optional title does not excuse required new content in the editing pass condition.' }];
  const mandatoryResult = await improve(input, { apiKey: 'mock', fetch: provider([extraContent, mandatoryAudit]) });
  assert.equal(mandatoryResult.audit.reason, 'coach_auditor_veto'); assert.deepEqual(mandatoryResult.plan, []);
  const closedInput = clone(input); closedInput.parts.find(p => p.partId === '1.0').mark = 0; closedInput.parts.find(p => p.partId === '1.0').objective = 'Selected queue; expected stack.';
  const tentative = clone(good); tentative.knowledgeGaps = [{ title: 'Data structure selection to review', detail: 'Queue was selected where stack was expected. Reviewing their access order may help; this selection does not establish why the answer was chosen.', occurrence: 'isolated', evidence: [{ partId: '1.0', source: 'objective', quote: 'Selected queue; expected stack.' }], action: 'Compare one queue example and one stack example, then select a structure for a fresh scenario.' }];
  assert.equal(proposalProblem(tentative, closedInput), null);
  const tentativeResult = await improve(closedInput, { apiKey: 'mock', fetch: provider([tentative, approval()], request => {
    const policy = request.messages[0].content;
    assert(policy.includes('topic-review recommendation')); assert(policy.includes('unobserved')); assert(policy.includes('artifact')); assert(policy.includes('branches actually reached'));
  }) });
  assert.equal(tentativeResult.status, 'ready', 'cautious review advice is allowed, subject to independent semantic audit');
  const causal = clone(tentative); causal.knowledgeGaps[0].detail = 'You guessed because you cannot understand access order.';
  const causalAudit = approval(); causalAudit.checks.closedEvidenceScope = 'fail'; causalAudit.issues = [{ checkId: 'closedEvidenceScope', detail: 'The choice alone does not establish guessing, ability or the cause of the error.' }];
  assert.equal((await improve(closedInput, { apiKey: 'mock', fetch: provider([causal, causalAudit]) })).audit.reason, 'coach_auditor_veto');
  const projected = projectEvidence(input); assert.equal(projected.parts.length, input.parts.length); assert.deepEqual(projected.coverage, input.coverage);
  assert.equal(projected.scoreInterpretation.earnedMarks, input.coverage.knownMark); assert.equal(projected.scoreInterpretation.assessedPossibleMarks, input.coverage.assessedMaxMarks); assert.equal(projected.scoreInterpretation.unconfirmedPossibleMarks, 5);
  for (let i = 0; i < input.parts.length; i++) { const originalPart = input.parts[i], sent = projected.parts[i]; if (originalPart.mark !== null && !originalPart.blank) { const { objectiveReferences, ...source } = sent; assert.deepEqual(source, originalPart); assert(Array.isArray(objectiveReferences)); } else { assert.equal(sent.answer, ''); assert.equal(sent.mark, originalPart.mark); assert.equal(sent.status, originalPart.status); assert.deepEqual(sent.criteria, []); } }
  assert(!JSON.stringify(projected).includes('print(1)'), 'unconfirmed code is not sent to the coach or auditor');
  const result = await improve(input, { apiKey: 'mock', fetch });
  assert.equal(result.status, 'ready'); assert.equal(fetch.count(), 2); assert.deepEqual(result.audit.calls.map(c => c.maxTokens), [24576, 16384]); assert.equal(LIMITS.stageMs, 115000); assert.equal(LIMITS.auditMs, 105000); assert.equal(LIMITS.overallMs, 225000); assert.deepEqual(input, original);
  assert.equal(result.quality.find(q => q.id === 'concision').rating, 4); assert.equal(result.quality.find(q => q.id === 'code_quality').rating, null);
  assert.equal(result.coverage.pendingMaxMarks, 5); assert.equal(result.lossSummary.unallocatedLost, 2); assert.equal(result.lossSummary.totalKnownLost, 5);
  const provenance = { inputDigest: 'a'.repeat(64), harnessVersion: HARNESS_VERSION, requestedModel: MODEL };
  const cached = clone(result); Object.assign(cached.audit, provenance); assert.equal(resultProblem(cached, input, provenance), null);
  for (const change of [r => { r.summary += ' A new plausible assertion.'; }, r => { r.plan[0].exercise += ' Include a different task.'; }, r => { r.quality[0].feedback += ' Changed interpretation.'; }]) { const altered = clone(cached); change(altered); assert.equal(resultProblem(altered, input, provenance), 'cached_coach_digest'); }
  function reverseObjectKeys(value) { if (Array.isArray(value)) return value.map(reverseObjectKeys); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).reverse().map(key => [key, reverseObjectKeys(value[key])])); return value; }
  const reordered = clone(reverseObjectKeys(cached)); assert.equal(publicResultDigest(reordered), cached.audit.resultDigest); assert.equal(resultProblem(reordered, input, provenance), null, 'JSON roundtrip and object key order do not change a valid approval checksum');
  for (const [change, expected] of [[r => { r.coverage.knownMark++; }, 'cached_coach_aggregates'], [r => { r.lossSummary.totalKnownLost++; }, 'cached_coach_aggregates'], [r => { r.quality[0].rating = 0; }, 'cached_coach_quality'], [r => { r.quality[0].evidencePartIds = ['21.0']; }, 'cached_coach_quality'], [r => { r.audit.inputDigest = 'b'.repeat(64); }, 'cached_coach_provenance'], [r => { r.audit.checks.auditorApproved = false; }, 'cached_coach_unapproved'], [r => { r.plan[0].evidencePartIds = ['99.0']; }, 'plan_schema']]) { const altered = clone(cached); change(altered); assert.equal(resultProblem(altered, input, provenance), expected); }
  for (const change of [r => { r.audit.calls = []; }, r => { r.audit.returnedModels = [MODEL]; }, r => { r.audit.returnedModels[0] = 'wrong-model'; }, r => { r.audit.calls.reverse(); }, r => { r.audit.calls[0].status = 'failed'; }, r => { r.audit.calls[1].finishReason = 'length'; }, r => { r.audit.calls[1].requestedModel = 'wrong-model'; }, r => { r.audit.calls[0].returnedModel = 'wrong-model'; }, r => { r.audit.calls[1].errorCode = 'provider_error'; }, r => { r.audit.calls[0].maxTokens = 16384; }, r => { r.audit.calls[1].maxTokens = 24576; }, r => { r.audit.calls[0].resolvedObjectiveReferences = 121; }, r => { r.audit.reasoningEffort = 'high'; }, r => { r.audit.reason = 'coach_auditor_veto'; }]) { const altered = clone(cached); change(altered); assert.equal(resultProblem(altered, input, provenance), 'cached_coach_completion', 'contradictory completion telemetry cannot reuse approval'); }
  for (const change of [r => { r.audit.auditor.checks.instructionIsolation = 'fail'; }, r => { r.audit.auditor.checks.scoreInterpretation = 'uncertain'; }, r => { r.audit.auditor.issueCount = 1; }, r => { r.audit.auditor.confirm = true; }]) { const altered = clone(cached); change(altered); assert.equal(resultProblem(altered, input, provenance), 'cached_coach_unapproved'); }
  for (const [change, expected] of [
    [p => { p.writingPatterns[0].evidence.pop(); }, 'unsupported_recurring_pattern'],
    [p => { p.writingPatterns[0].evidence[0].quote = 'Invented quotation'; }, 'coach_evidence'],
    [p => { p.strengths[0].evidence[0].partId = '99.0'; }, 'coach_evidence'],
    [p => { p.strengths[0].evidence[0] = { partId: '21.0', source: 'answer', quote: 'print(1)' }; }, 'coach_evidence'],
    [p => { p.knowledgeGaps[0].evidence = [{ partId: '22.0', source: 'objective', quote: 'No answer submitted.' }]; }, 'blank_knowledge_inference'],
    [p => { p.writingPatterns[0].evidence = [{ partId: '1.0', source: 'objective', quote: 'Selected stack' }]; p.writingPatterns[0].occurrence = 'isolated'; }, 'non_prose_writing_pattern'],
    [p => { p.quality[0].rating = 10; }, 'quality_evidence'],
    [p => { p.quality[0] = null; }, 'quality_coverage'],
    [p => { p.quality.find(q => q.id === 'code_quality').evidencePartIds = ['21.0']; }, 'quality_evidence'],
    [p => { p.plan[0].priority = 2; }, 'plan_schema'],
    [p => { p.plan = []; }, 'plan_missing'],
    [p => { p.plan = Array.from({ length: 4 }, (_, i) => ({ ...p.plan[0], priority: i + 1 })); }, 'plan_missing'],
    [p => { p.mark = 80; }, 'coach_schema']
  ]) { const p = clone(good); change(p); assert.equal(proposalProblem(p, input), expected); const f = provider([p]); assert.equal((await improve(input, { apiKey: 'mock', fetch: f })).status, 'needs_review'); assert.equal(f.count(), 1); }
  for (const [change, diagnostic] of [
    [p => { p.quality[0].id = 'PRIVATE_UNTRUSTED_FACTOR'; }, { factorId: null, path: 'quality[0].id', reason: 'unknown_factor' }],
    [p => { delete p.quality[0].action; }, { factorId: 'clarity', path: 'quality[0].fields', reason: 'missing_fields' }],
    [p => { p.quality[0].PRIVATE_FIELD = 'PRIVATE_PROSE'; }, { factorId: 'clarity', path: 'quality[0].fields', reason: 'extra_fields' }],
    [p => { p.quality[0].feedback = 'PRIVATE_PROSE'.repeat(60); }, { factorId: 'clarity', path: 'quality[0].feedback', reason: 'text_bound' }],
    [p => { p.quality[0].action = ''; }, { factorId: 'clarity', path: 'quality[0].action', reason: 'text_bound' }],
    [p => { p.quality[0].evidencePartIds = ['PRIVATE_PART']; }, { factorId: 'clarity', path: 'quality[0].evidencePartIds', reason: 'invalid_rated_part_references' }],
    [p => { p.quality[9].evidencePartIds = ['18.0']; }, { factorId: 'code_quality', path: 'quality[9].evidencePartIds', reason: 'null_factor_references' }]
  ]) { const bad = clone(good); change(bad); assert.equal(proposalProblem(bad, input), 'quality_evidence'); const response = await improve(input, { apiKey: 'mock', fetch: provider([bad]) }); assert.equal(response.status, 'needs_review'); assert.deepEqual(response.audit.validation, diagnostic); assert(!JSON.stringify(response.audit.validation).includes('PRIVATE')); assert.equal(response.audit.calls.length, 1); }
  // The measured v6 failure copied correct server ratings into every row.
  // Even numerically correct extra fields remain rejected, never stripped.
  const copiedMetrics = clone(good); copiedMetrics.quality.forEach(q => { q.rating = input.quality.find(source => source.id === q.id).rating; });
  const copiedResponse = await improve(input, { apiKey: 'mock', fetch: provider([copiedMetrics]) });
  assert.equal(copiedResponse.status, 'needs_review'); assert.equal(copiedResponse.audit.reason, 'quality_evidence'); assert.deepEqual(copiedResponse.audit.validation, { factorId: 'clarity', path: 'quality[0].fields', reason: 'extra_fields' }); assert.equal(copiedResponse.audit.calls.length, 1);
  const copiedCount = clone(good); copiedCount.quality[0].assessedParts = input.quality[0].assessedParts; assert.equal(proposalProblem(copiedCount, input), 'quality_evidence');
  for (const key of ['coverage', 'lossSummary']) { const copiedAggregate = clone(good); copiedAggregate[key] = clone(input[key]); assert.equal(proposalProblem(copiedAggregate, input), 'coach_schema'); }
  // Objective handles hydrate immutable source lines without relaxing literals.
  const refInput = clone(input), objectivePart = refInput.parts.find(p => p.partId === '1.0');
  objectivePart.objective = 'First selected value is correct.\nSecond selected value is correct.\n\n' + 'L'.repeat(401);
  refInput.parts.push({ ...clone(objectivePart), partId: '2.0', objective: 'Different first value.' });
  const refProjected = projectEvidence(refInput), catalog = refProjected.parts.find(p => p.partId === '1.0').objectiveReferences;
  assert.deepEqual(catalog, [{ id: '@objective:1.0:1', quote: 'First selected value is correct.' }, { id: '@objective:1.0:2', quote: 'Second selected value is correct.' }]);
  assert.equal(refProjected.parts.find(p => p.partId === '1.0').objective, objectivePart.objective, 'full original objective is never shortened');
  assert(!refProjected.parts.find(p => p.partId === '21.0').objectiveReferences); assert(!refProjected.parts.find(p => p.partId === '22.0').objectiveReferences);
  const handles = clone(good); handles.strengths = [{ title: 'Correct objective values', detail: 'Both selections match.', evidence: [{ partId: '1.0', source: 'objective', quote: '@objective:1.0:1' }, { partId: '1.0', source: 'objective', quote: '@objective:1.0:2' }] }];
  const untouchedHandles = clone(handles), resolved = resolveObjectiveReferences(handles, refInput);
  assert.equal(resolved.problem, null); assert.equal(resolved.count, 2); assert.deepEqual(handles, untouchedHandles, 'the draft is not mutated'); assert.equal(proposalProblem(resolved.value, refInput), null);
  let auditedResolved = false;
  const refResult = await improve(refInput, { apiKey: 'mock', fetch: provider([handles, approval()], (request, index) => { if (index === 1) { const sent = JSON.parse(request.messages[1].content); assert.deepEqual(sent.proposal.strengths[0].evidence, resolved.value.strengths[0].evidence); assert.deepEqual(sent.originalEvidence, clone(refProjected)); auditedResolved = true; } }) });
  assert.equal(refResult.status, 'ready'); assert(auditedResolved); assert.equal(refResult.audit.calls[0].resolvedObjectiveReferences, 2); assert(!JSON.stringify(refResult.strengths).includes('@objective:')); assert.equal(refResult.writingPatterns[0].occurrence, 'recurring');
  for (const mutate of [p => { p.strengths[0].evidence[0].quote = '@objective:1.0:99'; }, p => { p.strengths[0].evidence[0].partId = '2.0'; }, p => { p.strengths[0].evidence[0].source = 'answer'; }, p => { p.strengths[0].evidence[0].quote += ' @objective:1.0:2'; }, p => { p.strengths[0].evidence[0] = { partId: '22.0', source: 'objective', quote: '@objective:22.0:1' }; }, p => { p.strengths[0].evidence[0] = { partId: '21.0', source: 'objective', quote: '@objective:21.0:1' }; }]) { const bad = clone(handles); mutate(bad); const rejected = await improve(refInput, { apiKey: 'mock', fetch: provider([bad]) }); assert.equal(rejected.status, 'needs_review'); assert.equal(rejected.audit.reason, 'objective_reference'); assert.equal(rejected.audit.calls.length, 1); }
  const joined = clone(handles); joined.strengths[0].evidence = [{ partId: '1.0', source: 'objective', quote: 'First selected value is correct. Second selected value is correct.' }];
  assert.equal((await improve(refInput, { apiKey: 'mock', fetch: provider([joined]) })).audit.reason, 'coach_evidence', 'whitespace changes to literal quotes remain rejected');
  const exactLines = clone(joined); exactLines.strengths[0].evidence[0].quote = 'First selected value is correct.\nSecond selected value is correct.';
  assert.equal(proposalProblem(resolveObjectiveReferences(exactLines, refInput).value, refInput), null, 'literal multiline citations still work when exact');
  const repeatedPart = clone(handles); repeatedPart.knowledgeGaps[0].occurrence = 'recurring'; repeatedPart.knowledgeGaps[0].evidence = clone(handles.strengths[0].evidence);
  assert.equal((await improve(refInput, { apiKey: 'mock', fetch: provider([repeatedPart]) })).audit.reason, 'unsupported_recurring_pattern', 'two handles from one part are not two observations across parts');
  const copiedWithHandle = clone(handles); copiedWithHandle.quality[0].rating = input.quality[0].rating;
  assert.equal((await improve(refInput, { apiKey: 'mock', fetch: provider([copiedWithHandle]) })).audit.reason, 'quality_evidence');
  const reservedText = clone(refInput); reservedText.parts.find(p => p.partId === '1.0').objective = '@objective:1.0:99';
  const oneHandle = clone(handles); oneHandle.strengths[0].evidence = [{ partId: '1.0', source: 'objective', quote: '@objective:1.0:1' }];
  const once = resolveObjectiveReferences(oneHandle, reservedText); assert.equal(once.problem, null); assert.equal(once.value.strengths[0].evidence[0].quote, '@objective:1.0:99', 'resolution is a single lookup, never recursive');
  for (const id of Object.keys(AUDIT_CHECKS)) for (const outcome of ['fail', 'uncertain']) { const rejectedAudit = approval(); rejectedAudit.checks[id] = outcome; rejectedAudit.issues = [{ checkId: id, detail: 'The proposed claim is unsupported.' }]; const rejectedResult = await improve(input, { apiKey: 'mock', fetch: provider([good, rejectedAudit]) }); assert.equal(rejectedResult.status, 'needs_review'); assert.equal(rejectedResult.audit.reason, 'coach_auditor_veto'); }
  for (const change of [a => { a.checks.instructionIsolation = true; }, a => { a.confirm = true; }, a => { a.checks.evidenceGrounding = 'fail'; }, a => { a.issues = [{ checkId: 'evidenceGrounding', detail: 'Everything is supported.' }]; }, a => { delete a.checks.technicalCorrectness; }, a => { a.checks.unknownCheck = 'pass'; }]) { const invalid = approval(); change(invalid); const rejectedResult = await improve(input, { apiKey: 'mock', fetch: provider([good, invalid]) }); assert.equal(rejectedResult.status, 'needs_review'); assert.equal(rejectedResult.audit.reason, 'coach_auditor_schema'); }
  const veto = approval(); veto.checks.patternScope = 'fail'; veto.issues = [{ checkId: 'patternScope', detail: 'The claimed recurring pattern is unsupported.' }];
  const rejected = await improve(input, { apiKey: 'mock', fetch: provider([good, veto]) }); assert.equal(rejected.status, 'needs_review'); assert.deepEqual(rejected.plan, []); assert.deepEqual(rejected.coverage, result.coverage);
  const duplicate = JSON.stringify(good).replace('{', '{"summary":"Injected",');
  assert.equal((await improve(input, { apiKey: 'mock', fetch: provider([duplicate]) })).audit.reason, 'invalid_json');
  const model = async () => new Response(JSON.stringify({ model: 'different', choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(good) } }] }));
  assert.equal((await improve(input, { apiKey: 'mock', fetch: model })).audit.reason, 'model_mismatch');
  const truncated = async () => new Response(JSON.stringify({ model: MODEL, choices: [{ finish_reason: 'length', message: { content: '', reasoning_content: 'PRIVATE_REASONING_MUST_NOT_BE_RETAINED' } }], usage: { prompt_tokens: 100, completion_tokens: 16384, total_tokens: 16484, completion_tokens_details: { reasoning_tokens: 16384 } } }));
  const cut = await improve(input, { apiKey: 'mock', fetch: truncated }); assert.equal(cut.status, 'needs_review'); assert.equal(cut.audit.reason, 'incomplete_completion'); assert.equal(cut.audit.calls.length, 1); assert.equal(cut.audit.calls[0].usage.reasoning_tokens, 16384); assert.equal(cut.audit.calls[0].finalContentBytes, 0); assert(!JSON.stringify(cut).includes('PRIVATE_REASONING'));
  const tool = async () => new Response(JSON.stringify({ model: 'deepseek-flash', choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(good), tool_calls: [] } }] }));
  assert.equal((await improve(input, { apiKey: 'mock', fetch: tool })).audit.reason, 'invalid_completion');
  await assert.rejects(improve(input, { apiKey: 'mock', fetch: async () => new Promise(() => {}), limits: { overallMs: 15, stageMs: 15 } }), e => e.code === 'marking_timeout');
  await assert.rejects(improve(input, { apiKey: 'mock', fetch: provider([good]), limits: { requestBytes: 20 } }), e => e.status === 413);
  await assert.rejects(improve(input, { apiKey: 'mock', fetch: provider([good]), limits: { responseBytes: 20 } }), e => e.code === 'provider_response_too_large');
  console.log('Improvement engine OK: literal evidence, independent audit, scope constraints, exact aggregates, abstention, duplicate JSON, tool refusal, limits and timeout. MOCKS ONLY.');
})().catch(e => { console.error(e); process.exitCode = 1; });
