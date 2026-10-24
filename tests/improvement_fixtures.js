'use strict';
const { QUALITY_FACTORS } = require('../server/feedback-policy');
const { aggregate } = require('../server/improvement-input');
function input() {
  const parts = [
    { partId: '18.0', type: 'tx', topic: 'Secure software', question: 'Explain hashing and salting.', stimulus: '', maxMarks: 3, mark: 1, status: 'marked', blank: false, answer: 'Hashing is one way. Hashing is one way.', objective: '', criteria: [{ id: 'c1', text: 'Explain salting.' }], feedback: 'Explain how a unique random salt resists precomputed attacks.', losses: { allocation: 'holistic', totalLost: 2, items: [{ category: 'insufficient_explanation', marksLost: null }] }, quality: QUALITY_FACTORS.map(id => ({ id, rating: ['code_quality', 'diagram_quality'].includes(id) ? null : id === 'concision' ? 3 : 7 })) },
    { partId: '20.0', type: 'tx', topic: 'Security', question: 'Explain access control.', stimulus: '', maxMarks: 2, mark: 1, status: 'marked', blank: false, answer: 'Limit access. Limit access.', objective: '', criteria: [{ id: 'c1', text: 'Apply access control to roles.' }], feedback: 'Explain which role needs which access.', losses: { allocation: 'exact', totalLost: 1, items: [{ category: 'application_gap', marksLost: 1 }] }, quality: QUALITY_FACTORS.map(id => ({ id, rating: ['code_quality', 'diagram_quality'].includes(id) ? null : id === 'concision' ? 5 : 9 })) },
    { partId: '1.0', type: 'mc', maxMarks: 1, mark: 1, status: 'marked', blank: false, answer: '0', objective: 'Selected stack; expected stack.', criteria: [], feedback: '', quality: [] },
    { partId: '21.0', type: 'py', maxMarks: 5, mark: null, status: 'needs_review', blank: false, answer: 'print(1)', objective: '', feedback: '', criteria: [], quality: [] },
    { partId: '22.0', type: 'tx', maxMarks: 2, mark: 0, status: 'marked', blank: true, answer: '', objective: 'No answer submitted.', feedback: '', criteria: [], losses: { allocation: 'exact', totalLost: 2, items: [{ category: 'no_response', marksLost: 2 }] }, quality: [] }
  ];
  return { bankId: 'test', bankName: 'Test paper', parts, ...aggregate(parts) };
}
function proposal(data = input()) {
  return { summary: 'The confirmed responses name relevant ideas but need more scenario-specific explanation. Repetition in two written parts can be removed without losing those ideas.',
    strengths: [{ title: 'Relevant security ideas', detail: 'You correctly identify hashing as one way.', evidence: [{ partId: '18.0', source: 'answer', quote: 'Hashing is one way.' }] }],
    knowledgeGaps: [{ title: 'Explain the role of salts', detail: 'The confirmed feedback indicates that explaining how salts resist precomputed attacks is a useful review target.', occurrence: 'isolated', evidence: [{ partId: '18.0', source: 'feedback', quote: 'Explain how a unique random salt resists precomputed attacks.' }], action: 'Use one password example to contrast hashes with and without unique salts.' }],
    writingPatterns: [{ title: 'Repeated sentences', detail: 'Both written answers repeat a statement without adding a new technical link.', occurrence: 'recurring', evidence: [{ partId: '18.0', source: 'answer', quote: 'Hashing is one way. Hashing is one way.' }, { partId: '20.0', source: 'answer', quote: 'Limit access. Limit access.' }], action: 'Replace the repeated sentence with the missing explanation or scenario link.' }],
    quality: data.quality.map(q => ({ id: q.id, feedback: q.rating === null ? 'This factor has insufficient applicable confirmed evidence.' : 'Review the linked confirmed response feedback for the specific demonstrated strength and gap.', action: q.rating === null ? 'Complete an applicable response before rating this factor.' : 'Rewrite the linked response while preserving its correct technical claims.', evidencePartIds: q.evidencePartIds })),
    plan: [{ priority: 1, title: 'Explain security mechanisms', why: 'The confirmed feedback identifies missing causal and scenario links.', evidencePartIds: ['18.0', '20.0'], steps: ['Recall each mechanism without notes.', 'Apply the mechanism to one concrete account scenario.'], exercise: 'Write two short explanations: how a unique salt helps and why a role should have limited permissions.', successCheck: 'Each explanation names the mechanism, states its effect, and connects the effect to the scenario with no duplicated sentence.', schedule: 'Next practice session; repeat on a new scenario two days later.' }], limitations: ['The code answer remains under review and supplies no confirmed quality evidence.'] };
}
// Mock-only provenance factory. Live evaluation never constructs approvals.
function markerAudit(result) {
  const marker = require('../server/marking-engine');
  const core = { status: result.status, mark: result.mark, criteria: result.criteria.map(c => ({ id: c.id, assessment: c.assessment })) };
  return { harnessVersion: marker.HARNESS_VERSION, requestedModel: marker.MODEL, reasons: [],
    checks: { completed: true, modelMatch: true, outputSchema: true, evidenceSupported: true, blindAgreement: true, auditorApproved: true },
    calls: ['marker1', 'marker2', 'auditor'].map(stage => ({ stage, requestedModel: marker.MODEL, returnedModel: marker.MODEL, status: 'completed', finishReason: 'stop' })),
    returnedModels: [marker.MODEL, marker.MODEL, marker.MODEL], proposals: [JSON.parse(JSON.stringify(core)), JSON.parse(JSON.stringify(core))],
    selectedFeedback: 0, feedbackCandidates: [{ index: 0, eligible: true, problem: null }, { index: 1, eligible: true, problem: null }],
    auditor: { checks: Object.fromEntries(Object.keys(marker.AUDIT_CHECKS).map(id => [id, 'pass'])), issueCount: 0, selectedFeedback: 0 },
    feedbackDigest: marker.selectedFeedbackDigest(result) };
}
function coachApproval() {
  const coach = require('../server/improvement-engine');
  return { checks: Object.fromEntries(Object.keys(coach.AUDIT_CHECKS).map(id => [id, 'pass'])), issues: [] };
}
function coachAudit() {
  const coach = require('../server/improvement-engine');
  return { harnessVersion: coach.HARNESS_VERSION, requestedModel: coach.MODEL, reasoningEffort: coach.REASONING_EFFORT,
    returnedModels: [coach.MODEL, coach.MODEL], calls: ['coach', 'coach_auditor'].map((stage, index) => ({ stage, ...(index === 0 ? { resolvedObjectiveReferences: 0 } : {}), maxTokens: index === 0 ? coach.LIMITS.coachMaxTokens : coach.LIMITS.auditMaxTokens, requestedModel: coach.MODEL, returnedModel: coach.MODEL, reasoningEffort: coach.REASONING_EFFORT, status: 'completed', finishReason: 'stop' })),
    checks: { outputSchema: true, evidenceSupported: true, auditorApproved: true }, auditor: { checks: coachApproval().checks, issueCount: 0 } };
}
module.exports = { input, proposal, markerAudit, coachApproval, coachAudit };
