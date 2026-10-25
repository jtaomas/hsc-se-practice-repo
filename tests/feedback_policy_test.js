'use strict';
// Reviewer-authored contract regressions for the observed PEM Q18 withholding.
// These are synthetic feedback objects, not recovered provider outputs or a
// teacher-certified score. No model, account, storage or network calls occur.
const assert = require('node:assert/strict');
const { prepare, loadBanks, digest } = require('../server/marking-input');
const { QUALITY_FACTORS, scoringModel, feedbackProblem } = require('../server/feedback-policy');
const clone = value => JSON.parse(JSON.stringify(value));
const header = 'Holistic bands: award the one band that best fits the whole response. Do not add bands together.';
const prepared = prepare({ bankId: '8', questionNumber: 18, partIndex: 0, answer: 'Data protection keeps personal information confidential.' });
const input = prepared.input;
const canonical = loadBanks().find(bank => bank.id === '8').qs[17];
assert.deepEqual(input.rubricGuidance, [header]);
assert.equal(prepared.questionVersion, digest(canonical));
assert.equal(prepared.rubricVersion, digest(canonical.it[0].crit), 'original rubric provenance must include the guidance');
assert.equal(input.criteria.length, 2);
assert(input.criteria.every(item => item.text !== header), 'instructions must not become assessable achievements');
const high = input.criteria.find(item => /^2 marks:/.test(item.text));
const low = input.criteria.find(item => /^1 mark:/.test(item.text));
assert(high && low);
assert.deepEqual(scoringModel(input).bands, [{ id: high.id, minMarks: 2, maxMarks: 2 }, { id: low.id, minMarks: 1, maxMarks: 1 }]);
const value = { status: 'marked', mark: 1,
  criteria: input.criteria.map(item => ({ id: item.id, assessment: item.id === low.id ? 'met' : 'context' })),
  losses: { allocation: 'holistic', totalLost: 1, items: [{ category: 'insufficient_explanation', marksLost: null, criterionIds: [high.id], evidence: [],
    explanation: 'The answer identifies confidentiality but does not develop the benefit.', action: 'Explain how preventing unauthorised access protects personal information.' }] },
  quality: QUALITY_FACTORS.map(id => ({ id, rating: null, evidence: [], feedback: 'Synthetic contract probe: this factor is not assessed.', action: 'This probe checks loss validation only.' })) };
assert.equal(feedbackProblem(value, input), null, 'a genuine higher-band context target must be allowed without splitting its marks');

// Reconstruct the old canonical shape, without claiming it reproduces the
// unknown contents of either live marker's discarded loss object.
const oldInput = Object.assign({}, input, { criteria: [{ id: 'instruction', text: header }].concat(input.criteria) });
const oldValue = clone(value); oldValue.criteria.unshift({ id: 'instruction', assessment: 'context' });
assert.equal(scoringModel(oldInput).bands, undefined);
assert.equal(feedbackProblem(oldValue, oldInput), 'loss_schema', 'the former header row disabled the band exception');

function rejects(change, expected) {
  const candidate = clone(value); change(candidate);
  assert.equal(feedbackProblem(candidate, input), expected);
}
rejects(v => { v.losses.items[0].marksLost = 1; }, 'holistic_false_precision');
rejects(v => { v.losses.totalLost = 0; }, 'loss_accounting');
rejects(v => { v.losses.items[0].criterionIds = ['instruction']; }, 'loss_schema');
rejects(v => { v.losses.items[0].criterionIds = [high.id, high.id]; }, 'loss_schema');
rejects(v => { v.losses.items[0].category = 'unlisted_category'; }, 'loss_schema');
rejects(v => { v.losses.items.push(clone(v.losses.items[0])); }, 'loss_schema');
rejects(v => { v.losses.items[0].inferred = true; }, 'loss_schema');
rejects(v => { v.losses.items[0].evidence = ['This quotation is not in the answer.']; }, 'unsupported_feedback_evidence');
rejects(v => { v.losses.items[0].category = 'no_response'; }, 'false_no_response');
rejects(v => { v.criteria.find(item => item.id === high.id).assessment = 'not_met'; }, 'band_assessment_mismatch');
rejects(v => { v.quality[0].rating = 8; }, 'quality_missing_evidence');

// The change must not grant arbitrary context notes the band exception or
// turn an incomplete rubric into a guessed scoring scale.
const mixed = clone(oldInput); mixed.criteria[0].text = 'An illustrative example may use access permissions.';
const noteLoss = clone(oldValue); noteLoss.losses.items[0].criterionIds = ['instruction'];
assert.equal(scoringModel(mixed).bands, undefined);
assert.equal(feedbackProblem(noteLoss, mixed), 'loss_schema');

const additiveInput = Object.assign({}, input, { criteria: [{ id: 'p1', text: '1 mark: identifies the benefit.' }, { id: 'p2', text: '1 mark: explains the benefit.' }] });
const additive = clone(value); additive.criteria = [{ id: 'p1', assessment: 'met' }, { id: 'p2', assessment: 'not_met' }];
additive.losses.allocation = 'exact'; additive.losses.items[0].marksLost = 1; additive.losses.items[0].criterionIds = ['p2'];
assert.equal(feedbackProblem(additive, additiveInput), null);
additive.criteria[1].assessment = 'partial';
assert.equal(feedbackProblem(additive, additiveInput), 'additive_assessment_mismatch');
console.log('Feedback policy OK: canonical PEM Q18 higher-band loss, unchanged rubric hashes, prior-header failure mechanism and strict loss/evidence/accounting guards. OFFLINE ONLY.');
