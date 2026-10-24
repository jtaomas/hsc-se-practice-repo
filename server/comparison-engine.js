'use strict';

const { parse } = require('./marking-json');
const { HARNESS_VERSION, CATEGORIES, ERROR_TYPES, AUDIT_FLAGS, EXTRACTOR_POLICY, SYNTHESIS_POLICY, AUDITOR_POLICY } = require('./comparison-policy');
// This is the provider's rolling alias, not an immutable dated snapshot.
const MODEL = 'deepseek-flash';
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
const LIMITS = Object.freeze({ participants: 8, concurrency: 2, calls: 10, profileMs: 100000, stageMs: 100000,
  synthesisMs: 70000, auditorMs: 70000, overallMs: 240000, maxTokens: 32768,
  inputBytes: 350 * 1024, requestBytes: 768 * 1024, responseBytes: 1024 * 1024, profileBytes: 5000, synthesisBytes: 8000, resultBytes: 56000 });
const TYPES = ['written response', 'Python program', 'pseudocode algorithm', 'SQL query', 'closed response'];
const ASSESSMENTS = ['met', 'partial', 'not_met', 'context'];

function failure(status, code, message) { const error = new Error(message); error.status = status; error.code = code; return error; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function exactKeys(value, keys) { return object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key)); }
function text(value, max, empty) { return typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0); }
function strings(value, count, length) { return Array.isArray(value) && value.length <= count && value.every(item => text(item, length, false)); }
function identifier(value) { return typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(value); }
function mentionedParticipants(value) { return (value.match(/\bp\d+\b/gi) || []).map(id => id.toLowerCase()); }
function byteLength(value) { try { return Buffer.byteLength(JSON.stringify(value), 'utf8'); } catch (_) { return Infinity; } }
function invalidInput() { throw failure(400, 'invalid_comparison_input', 'The comparison requires verified responses to the same question parts from two to eight participants.'); }

function canonicalData(input) {
  if (byteLength(input) > LIMITS.inputBytes) throw failure(413, 'comparison_input_too_large', 'Select fewer responses or participants for this comparison.');
  if (!object(input) || !identifier(input.bankId) || !text(input.questionSetVersion, 200, false) ||
      !Array.isArray(input.participants) || input.participants.length < 2 || input.participants.length > LIMITS.participants) invalidInput();
  const seen = new Set();
  const participants = input.participants.map(participant => {
    if (!object(participant) || !/^p[1-8]$/.test(participant.id) || seen.has(participant.id) ||
        !Array.isArray(participant.parts) || !participant.parts.length || participant.parts.length > 160 ||
        !object(participant.coverage) || !['includedParts', 'excludedParts', 'totalParts'].every(key => Number.isSafeInteger(participant.coverage[key]) && participant.coverage[key] >= 0) ||
        participant.coverage.includedParts < participant.parts.length || participant.coverage.includedParts + participant.coverage.excludedParts !== participant.coverage.totalParts) invalidInput();
    seen.add(participant.id);
    const partIds = new Set();
    const parts = participant.parts.map(part => {
      if (!object(part) || !Number.isSafeInteger(part.questionNumber) || part.questionNumber < 1 || part.questionNumber > 1000 ||
          !Number.isSafeInteger(part.partIndex) || part.partIndex < 0 || part.partIndex > 100 || part.id !== part.questionNumber + '.' + part.partIndex || partIds.has(part.id) ||
          !text(part.topic, 300, true) || !TYPES.includes(part.type) || !text(part.question, 30000, false) || !text(part.stimulus, 100000, true) ||
          !text(part.sample, 100000, true) || !text(part.answer, 100000, true) || !Number.isSafeInteger(part.maxMarks) || part.maxMarks < 1 || part.maxMarks > 20 ||
          !Number.isSafeInteger(part.mark) || part.mark < 0 || part.mark > part.maxMarks || part.status !== 'marked' || !['agentic', 'automatic'].includes(part.source) ||
          (part.type === 'closed response') !== (part.source === 'automatic') || !Array.isArray(part.criteria) || !part.criteria.length || part.criteria.length > 100 ||
          !part.criteria.every(item => object(item) && identifier(item.id) && text(item.text, 10000, false)) || new Set(part.criteria.map(item => item.id)).size !== part.criteria.length) invalidInput();
      partIds.add(part.id);
      const feedback = part.feedback;
      if (!object(feedback) || !text(feedback.summary, 2000, true) || !['strengths', 'improve', 'advice'].every(key => strings(feedback[key], 10, 2000)) ||
          !Array.isArray(feedback.criteria) || feedback.criteria.length !== part.criteria.length) invalidInput();
      const expected = new Set(part.criteria.map(item => item.id));
      for (const criterion of feedback.criteria) {
        if (!object(criterion) || !expected.delete(criterion.id) || !ASSESSMENTS.includes(criterion.assessment) ||
            !strings(criterion.evidence, 10, 1000) || !text(criterion.basis, 2000, true)) invalidInput();
      }
      // Reconstruct every object. Unknown fields (names, emails, account IDs,
      // signatures, browser labels, and client statistics) never reach a model.
      return { id: part.id, questionNumber: part.questionNumber, partIndex: part.partIndex, topic: part.topic, type: part.type,
        question: part.question, stimulus: part.stimulus, criteria: part.criteria.map(item => ({ id: item.id, text: item.text })), sample: part.sample,
        maxMarks: part.maxMarks, answer: part.answer, mark: part.mark, status: 'marked', source: part.source,
        feedback: { summary: feedback.summary, strengths: feedback.strengths.slice(), improve: feedback.improve.slice(), advice: feedback.advice.slice(),
          criteria: feedback.criteria.map(item => ({ id: item.id, assessment: item.assessment, evidence: item.evidence.slice(), basis: item.basis })) } };
    });
    return { id: participant.id, parts, coverage: { includedParts: participant.coverage.includedParts,
      excludedParts: participant.coverage.excludedParts, totalParts: participant.coverage.totalParts } };
  });
  // A matched comparison must have exactly the same canonical opportunities.
  // Marks, submissions and feedback can differ; question/rubric data cannot.
  function definition(part) { return JSON.stringify([part.id, part.questionNumber, part.partIndex, part.topic, part.type, part.question, part.stimulus, part.criteria, part.sample, part.maxMarks]); }
  const common = new Map(participants[0].parts.map(part => [part.id, definition(part)]));
  for (const participant of participants.slice(1)) {
    if (participant.parts.length !== common.size || participant.parts.some(part => common.get(part.id) !== definition(part))) invalidInput();
  }
  return { bankId: input.bankId, questionSetVersion: input.questionSetVersion, participants };
}

function evidenceRecord(citation, participants) {
  const participant = participants.find(item => item.id === citation.participantId);
  const part = participant && participant.parts.find(item => item.id === citation.questionId);
  const criterion = part && part.criteria.find(item => item.id === citation.criterionId);
  const assessment = criterion && part.feedback.criteria.find(item => item.id === citation.criterionId);
  return participant && part && criterion && assessment ? { participant, part, criterion, assessment } : null;
}

function evidenceProblem(evidence, participants, expectedParticipantId) {
  if (!Array.isArray(evidence) || !evidence.length || evidence.length > 6) return 'evidence_schema';
  const seen = new Set();
  for (const citation of evidence) {
    if (!exactKeys(citation, ['participantId', 'questionId', 'criterionId', 'source', 'quote']) || !identifier(citation.participantId) || !identifier(citation.questionId) ||
        !identifier(citation.criterionId) || !['answer', 'feedback'].includes(citation.source) || !text(citation.quote, 400, false)) return 'evidence_schema';
    if (expectedParticipantId && citation.participantId !== expectedParticipantId) return 'cross_participant_evidence';
    const record = evidenceRecord(citation, participants);
    if (!record) return 'unknown_evidence_reference';
    const feedback = record.part.feedback;
    const source = citation.source === 'answer' ? [record.part.answer] : [feedback.summary].concat(feedback.strengths, feedback.improve, feedback.advice, [record.assessment.basis], record.assessment.evidence);
    if (!source.some(item => item.includes(citation.quote))) return 'unsupported_evidence';
    const key = JSON.stringify([citation.participantId, citation.questionId, citation.criterionId, citation.source, citation.quote]);
    if (seen.has(key)) return 'duplicate_evidence';
    seen.add(key);
  }
  return null;
}

function profileProblem(value, participant) {
  if (byteLength(value) > LIMITS.profileBytes) return 'profile_too_large';
  if (!exactKeys(value, ['status', 'participantId', 'findings', 'uncertainties']) || value.participantId !== participant.id ||
      !['complete', 'needs_review'].includes(value.status) || !Array.isArray(value.findings) || value.findings.length > 6 || !strings(value.uncertainties, 5, 300)) return 'profile_schema';
  if (value.status !== 'complete') return value.findings.length || !value.uncertainties.length ? 'profile_schema' : 'extractor_abstention';
  if (value.uncertainties.length) return 'uncertain_profile';
  const ids = new Set(), diagnoses = new Set();
  for (const finding of value.findings) {
    if (!exactKeys(finding, ['id', 'kind', 'category', 'errorType', 'scope', 'statement', 'action', 'evidence']) || !identifier(finding.id) || ids.has(finding.id) ||
        !['strength', 'criterion_shortfall', 'optional_advice'].includes(finding.kind) || !CATEGORIES.includes(finding.category) ||
        (finding.errorType !== null && !ERROR_TYPES.includes(finding.errorType)) || !['single_response', 'repeated'].includes(finding.scope) ||
        !text(finding.statement, 600, false) || !text(finding.action, 500, finding.kind === 'strength')) return 'finding_schema';
    ids.add(finding.id);
    const problem = evidenceProblem(finding.evidence, [participant], participant.id);
    if (problem) return problem;
    const records = finding.evidence.map(citation => evidenceRecord(citation, [participant]));
    if (mentionedParticipants(finding.statement + ' ' + finding.action).some(id => id !== participant.id)) return 'cross_participant_claim';
    const questions = new Set(records.map(record => record.part.questionNumber));
    if (finding.scope === 'repeated' ? questions.size < 2 : questions.size !== 1) return 'unsupported_scope';
    if ((finding.category === 'response_concision' || finding.errorType === 'irrelevant_repetition') && finding.kind !== 'optional_advice') return 'concision_as_scoring';
    if ((finding.category === 'response_concision' || finding.errorType === 'irrelevant_repetition') && !finding.evidence.some(citation => citation.source === 'answer')) return 'concision_without_response';
    if (finding.kind === 'strength' && (finding.errorType !== null || !finding.evidence.some(citation => citation.source === 'answer') ||
        records.some(record => !['met', 'partial'].includes(record.assessment.assessment)))) return 'uncredited_strength';
    if (finding.kind === 'criterion_shortfall') {
      if (finding.errorType === null || records.some(record => record.part.mark === record.part.maxMarks || !['partial', 'not_met'].includes(record.assessment.assessment))) return 'unsupported_shortfall';
      const cited = new Set(finding.evidence.map(citation => citation.questionId + ':' + citation.criterionId));
      for (const key of cited) if (!finding.evidence.some(citation => citation.source === 'feedback' && citation.questionId + ':' + citation.criterionId === key)) return 'shortfall_without_feedback';
    }
    if (finding.kind !== 'strength' && records.every(record => record.part.type === 'closed response')) return 'closed_response_diagnosis';
    if (finding.category === 'sql_correctness' && records.some(record => record.part.type !== 'SQL query')) return 'category_type_mismatch';
    if (finding.category === 'code_correctness' && records.some(record => !['Python program', 'pseudocode algorithm'].includes(record.part.type))) return 'category_type_mismatch';
    // One coded error at one criterion must not be inflated by paraphrases or
    // alternative quotations. This is not a count of all possible mistakes.
    const diagnosis = JSON.stringify([finding.kind, finding.errorType || finding.category,
      Array.from(new Set(finding.evidence.map(citation => citation.questionId + ':' + citation.criterionId))).sort()]);
    if (diagnoses.has(diagnosis)) return 'duplicate_finding';
    diagnoses.add(diagnosis);
  }
  return null;
}

function synthesisProblem(value, participants) {
  if (byteLength(value) > LIMITS.synthesisBytes) return 'synthesis_too_large';
  if (!exactKeys(value, ['status', 'summary', 'comparisons', 'uncertainties']) || !['complete', 'needs_review'].includes(value.status) ||
      !text(value.summary, 700, false) || !Array.isArray(value.comparisons) || value.comparisons.length > 8 || !strings(value.uncertainties, 5, 300)) return 'synthesis_schema';
  if (value.status !== 'complete') return value.comparisons.length || !value.uncertainties.length ? 'synthesis_schema' : 'synthesis_abstention';
  if (value.uncertainties.length) return 'uncertain_synthesis';
  const ids = new Set(), contrasts = new Set();
  for (const comparison of value.comparisons) {
    if (!exactKeys(comparison, ['id', 'category', 'statement', 'action', 'evidence']) || !identifier(comparison.id) || ids.has(comparison.id) ||
        !CATEGORIES.includes(comparison.category) || !text(comparison.statement, 700, false) || !text(comparison.action, 500, false)) return 'comparison_schema';
    ids.add(comparison.id);
    const problem = evidenceProblem(comparison.evidence, participants);
    if (problem) return problem;
    const people = new Set(comparison.evidence.map(citation => citation.participantId));
    if (people.size < 2) return 'comparison_without_peers';
    if (mentionedParticipants(comparison.statement + ' ' + comparison.action).some(id => !people.has(id))) return 'uncited_participant_claim';
    const basis = new Set(comparison.evidence.map(citation => citation.questionId + ':' + citation.criterionId));
    if (basis.size !== 1) return 'unmatched_comparison';
    const contrast = JSON.stringify([comparison.category, Array.from(basis), Array.from(people).sort()]);
    if (contrasts.has(contrast)) return 'duplicate_comparison';
    contrasts.add(contrast);
  }
  return null;
}

function auditProblem(value) {
  if (!exactKeys(value, AUDIT_FLAGS.concat(['reason', 'uncertainties'])) || !AUDIT_FLAGS.every(key => typeof value[key] === 'boolean') ||
      !text(value.reason, 600, false) || !strings(value.uncertainties, 5, 300)) return 'auditor_schema';
  return AUDIT_FLAGS.every(key => value[key]) && !value.uncertainties.length ? null : 'auditor_veto';
}

async function boundedBody(response, maximum) {
  const declared = response.headers && response.headers.get && response.headers.get('content-length');
  if (declared && Number(declared) > maximum) throw failure(502, 'provider_response_too_large', 'The comparison service returned too much data.');
  if (!response.body || typeof response.body.getReader !== 'function') throw failure(502, 'provider_response_unreadable', 'The comparison service returned an unreadable response.');
  const reader = response.body.getReader(), chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > maximum) { reader.cancel().catch(() => {}); throw failure(502, 'provider_response_too_large', 'The comparison service returned too much data.'); }
      chunks.push(Buffer.from(next.value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, bytes).toString('utf8');
}

async function compare(input, options = {}) {
  const data = canonicalData(input), fetcher = options.fetch || globalThis.fetch, now = options.now || Date.now;
  const timers = { set: options.setTimeout || setTimeout, clear: options.clearTimeout || clearTimeout };
  const limits = Object.assign({}, LIMITS);
  for (const [key, value] of Object.entries(options.limits || {})) {
    if (!Object.prototype.hasOwnProperty.call(limits, key) || !Number.isSafeInteger(value) || value < 1 || value > LIMITS[key]) throw failure(500, 'invalid_comparison_limits', 'The comparison limits are invalid.');
    limits[key] = value;
  }
  if (data.participants.length > limits.participants || byteLength(data) > limits.inputBytes) throw failure(413, 'comparison_input_too_large', 'Select fewer responses or participants for this comparison.');
  const apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw failure(503, 'no_key', 'AI comparison is not configured.');
  const started = now(), deadline = started + limits.overallMs, controllers = new Set();
  const audit = { harnessVersion: HARNESS_VERSION, requestedModel: MODEL, returnedModels: [], calls: [],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    checks: { completed: false, modelMatch: false, outputSchema: false, evidenceSupported: false, blindProfiles: false, auditorApproved: false }, reasons: [] };
  function finish() {
    audit.durationMs = Math.max(0, now() - started);
    audit.checks.completed = audit.calls.length > 0 && audit.calls.every(call => call.status === 'completed' && call.finishReason === 'stop');
    audit.checks.modelMatch = audit.calls.length > 0 && audit.calls.every(call => call.returnedModel === MODEL);
    return audit;
  }
  function review(reason) {
    audit.reasons.push(reason);
    return { status: 'needs_review', profiles: [], comparisons: [], summary: 'The evidence checks could not confirm a reliable comparison. Review the selected responses and marking feedback before using comparative advice.', audit: finish() };
  }
  async function request(stage, policy, content, stageDeadline) {
    const requestBody = JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: policy }, { role: 'user', content: JSON.stringify(content) }],
      thinking: { type: 'enabled' }, reasoning_effort: 'high', max_tokens: limits.maxTokens, response_format: { type: 'json_object' } });
    if (Buffer.byteLength(requestBody, 'utf8') > limits.requestBytes) throw failure(413, 'comparison_request_too_large', 'Select fewer responses or participants for this comparison.');
    if (audit.calls.length >= Math.min(limits.calls, data.participants.length + 2)) throw failure(502, 'comparison_call_budget', 'The comparison reached its call limit.');
    const available = Math.min(stageDeadline, deadline) - now();
    if (available <= 0) throw failure(504, 'comparison_timeout', 'AI comparison exceeded its time limit. Select fewer responses or try again later.');
    const controller = new AbortController(); controllers.add(controller);
    const began = now(), record = { stage, status: 'running', requestedModel: MODEL };
    audit.calls.push(record);
    let timer, active = true, timedOut = false;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetcher(ENDPOINT, { method: 'POST', signal: controller.signal,
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey }, body: requestBody });
          const body = await boundedBody(response, limits.responseBytes);
          if (!active || controller.signal.aborted) throw failure(502, 'provider_cancelled', 'The comparison request was cancelled.');
          if (!response.ok) {
            if (response.status === 429) throw failure(429, 'provider_rate_limit', 'The comparison service is busy. Try again later.');
            if (response.status === 401 || response.status === 403) throw failure(503, 'provider_auth', 'The comparison service configuration needs attention.');
            if (response.status === 402) throw failure(503, 'provider_balance', 'The comparison service is temporarily unavailable.');
            throw failure(502, 'provider_error', 'The comparison service could not complete the request.');
          }
          let envelope;
          try { envelope = parse(body); } catch (_) { throw failure(502, 'provider_envelope', 'The comparison service returned an unreadable response.'); }
          if (!object(envelope)) throw failure(502, 'provider_envelope', 'The comparison service returned an unreadable response.');
          record.status = 'completed';
          record.returnedModel = typeof envelope.model === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(envelope.model) ? envelope.model : null;
          audit.returnedModels.push(record.returnedModel);
          if (typeof envelope.system_fingerprint === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(envelope.system_fingerprint)) record.systemFingerprint = envelope.system_fingerprint;
          const choice = Array.isArray(envelope.choices) && envelope.choices.length === 1 ? envelope.choices[0] : null;
          record.finishReason = choice && typeof choice.finish_reason === 'string' && /^[a-z_]{1,40}$/.test(choice.finish_reason) ? choice.finish_reason : null;
          record.usage = {};
          for (const key of ['prompt_tokens', 'completion_tokens', 'total_tokens']) {
            const count = envelope.usage && envelope.usage[key];
            if (Number.isSafeInteger(count) && count >= 0 && count <= 10000000) { record.usage[key] = count; audit.usage[key] += count; }
          }
          if (record.returnedModel !== MODEL) return { problem: 'model_mismatch' };
          if (record.finishReason !== 'stop') return { problem: 'incomplete_completion' };
          if (!choice.message || typeof choice.message.content !== 'string') return { problem: 'missing_content' };
          if (choice.message.tool_calls != null || choice.message.function_call != null) return { problem: 'unexpected_tool_call' };
          if (choice.message.refusal != null) return { problem: 'provider_refusal' };
          let value;
          try { value = parse(choice.message.content); } catch (_) { return { problem: 'invalid_json' }; }
          return { value };
        })(),
        new Promise((_, reject) => { controller.signal.addEventListener('abort', () => reject(timedOut ? failure(504, 'comparison_timeout', 'AI comparison exceeded its time limit. Select fewer responses or try again later.') : failure(502, 'provider_cancelled', 'The comparison request was cancelled.')), { once: true }); }),
        new Promise((_, reject) => { timer = timers.set(() => { timedOut = true; reject(failure(504, 'comparison_timeout', 'AI comparison exceeded its time limit. Select fewer responses or try again later.')); controller.abort(); }, available); })
      ]);
    } catch (error) {
      record.status = 'failed';
      const safe = error && error.code && error.status ? error : failure(502, 'provider_unavailable', 'Could not reach the comparison service. Try again later.');
      record.errorCode = safe.code;
      throw safe;
    } finally { active = false; timers.clear(timer); controller.abort(); controllers.delete(controller); record.durationMs = Math.max(0, now() - began); }
  }
  try {
    // A shared phase deadline includes queue time: eight participants cannot
    // multiply a per-call timeout into an unbounded serverless invocation.
    const profileDeadline = Math.min(deadline, started + limits.profileMs, started + limits.stageMs);
    const profiles = new Array(data.participants.length);
    let next = 0, profileError = null, cancelled = false;
    async function worker() {
      while (!cancelled && !profileError && next < data.participants.length) {
        const index = next++, participant = data.participants[index];
        const result = await request('profile:' + participant.id, EXTRACTOR_POLICY,
          { bankId: data.bankId, questionSetVersion: data.questionSetVersion, participant }, profileDeadline);
        const problem = result.problem || (byteLength(result.value) > limits.profileBytes ? 'profile_too_large' : profileProblem(result.value, participant));
        if (problem) { profileError = problem; return; }
        profiles[index] = { participantId: participant.id, findings: result.value.findings };
      }
    }
    const workers = Array.from({ length: Math.min(limits.concurrency, data.participants.length) }, () => worker());
    try { await Promise.all(workers); }
    catch (error) { cancelled = true; controllers.forEach(controller => controller.abort()); await Promise.allSettled(workers); throw error; }
    if (profileError) return review(profileError);
    audit.checks.blindProfiles = true;
    const synthesis = await request('synthesis', SYNTHESIS_POLICY, { originalEvidence: data, independentProfiles: profiles }, now() + limits.synthesisMs);
    const synthesisIssue = synthesis.problem || (byteLength(synthesis.value) > limits.synthesisBytes ? 'synthesis_too_large' : synthesisProblem(synthesis.value, data.participants));
    if (synthesisIssue) return review(synthesisIssue);
    audit.checks.outputSchema = true;
    audit.checks.evidenceSupported = true;
    const final = await request('auditor', AUDITOR_POLICY,
      { originalEvidence: data, independentProfiles: profiles, proposedSynthesis: synthesis.value }, now() + limits.auditorMs);
    const auditIssue = final.problem || auditProblem(final.value);
    // Never release an auditor's prose or an unapproved proposal through audit
    // metadata; it might itself contain the unsupported comparative advice.
    if (!final.problem && (auditIssue === null || auditIssue === 'auditor_veto')) {
      audit.auditor = Object.fromEntries(AUDIT_FLAGS.map(flag => [flag, final.value[flag]]));
      audit.auditor.uncertaintyCount = final.value.uncertainties.length;
    }
    if (auditIssue) return review(auditIssue);
    audit.checks.auditorApproved = true;
    const result = { status: 'complete', profiles, comparisons: synthesis.value.comparisons, summary: synthesis.value.summary, audit: finish() };
    return byteLength(result) <= limits.resultBytes ? result : review('result_too_large');
  } catch (error) { controllers.forEach(controller => controller.abort()); error.audit = finish(); throw error; }
}

module.exports = { MODEL, HARNESS_VERSION, LIMITS, compare, canonicalData, evidenceRecord, evidenceProblem, profileProblem, synthesisProblem, auditProblem };
