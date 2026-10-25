'use strict';

const assert = require('node:assert/strict');
const { normalizeCriteria, criterionDiagnostics, criteriaTemplate, DIAGNOSTIC_CODES, MAX_DIAGNOSTICS } = require('../server/marking-format');
const { parse } = require('../server/marking-json');
const { prepare } = require('../server/marking-input');
const input = { criteria: [{ id: 'c1' }, { id: 'c2' }] };
const clone = value => JSON.parse(JSON.stringify(value));
const criterion = (id = 'c1') => ({ id, assessment: 'met', evidence: ['A literal "quote".\nNext line.'], basis: 'The response demonstrates the criterion.' });
const proposal = () => ({ status: 'marked', mark: 2, criteria: [criterion(), criterion('c2')], uncertainties: [], quality: [], extraTopLevel: 'Must remain for strict rejection.' });
function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
const codes = value => criterionDiagnostics(value, input).issues.map(issue => issue.code);

// Canonical values pass unchanged. This adapter never rewrites the score,
// accepted labels, candidate diagnostics or unexpected fields.
const original = freeze(proposal());
assert.equal(normalizeCriteria(original, input).value, original);
assert.deepEqual(normalizeCriteria(original, input).repairs, { criteriaMap: 0, evidenceStrings: 0 });
assert.deepEqual(criterionDiagnostics(original, input).issues, []);

// A single quotation may be wrapped without changing one character, including
// code escapes and whitespace. It cannot be split, trimmed or inferred.
for (const evidence of ['alpha', '  alpha\n', 'print("a\\b")', '', 'x'.repeat(401)]) {
  const value = proposal(); value.criteria[0].evidence = evidence; freeze(value);
  const before = JSON.stringify(value), normalized = normalizeCriteria(value, input);
  assert.deepEqual(normalized.value, { ...value, criteria: [{ ...value.criteria[0], evidence: [evidence] }, { ...value.criteria[1] }] });
  assert.deepEqual(normalized.repairs, { criteriaMap: 0, evidenceStrings: 1 });
  assert.equal(JSON.stringify(value), before);
  assert.equal(normalized.value.mark, value.mark); assert.equal(normalized.value.extraTopLevel, value.extraTopLevel);
  if (!evidence) assert(codes(normalized.value).includes('evidence_item_empty'));
  if (evidence.length > 400) assert(codes(normalized.value).includes('evidence_item_length'));
}

// Complete maps are structural equivalents to ID-bearing array rows. Both
// missing nested IDs and redundant matching IDs preserve the exact binding.
for (const nestedIds of [false, true]) {
  const c1 = criterion(), c2 = criterion('c2'); c2.evidence = 'second quote';
  if (!nestedIds) { delete c1.id; delete c2.id; }
  const value = freeze({ ...proposal(), criteria: { c2, c1 } });
  const normalized = normalizeCriteria(value, input);
  assert.deepEqual(normalized.value.criteria, [criterion(), { ...criterion('c2'), evidence: ['second quote'] }]);
  assert.deepEqual(normalized.repairs, { criteriaMap: 1, evidenceStrings: 1 });
  assert.equal(normalized.value.mark, 2); assert.equal(normalized.value.extraTopLevel, value.extraTopLevel);
  assert.deepEqual(criterionDiagnostics(normalized.value, input).issues, []);
  assert.deepEqual(normalizeCriteria(normalized.value, input).repairs, { criteriaMap: 0, evidenceStrings: 0 });
}

// No choice between conflicting ID sources, no missing/extra row deletion,
// and no coercion of malformed rows into apparent scoring decisions.
for (const criteria of [
  { c1: criterion() }, { c1: criterion(), c2: criterion('c2'), secretUnknown: criterion('secretUnknown') },
  { c1: criterion('c2'), c2: criterion('c2') }, { c1: null, c2: criterion('c2') },
  { c1: [], c2: criterion('c2') }, 'criteria text', null, [criterion(), null]
]) {
  const value = freeze({ ...proposal(), criteria }), normalized = normalizeCriteria(value, input);
  assert.deepEqual(normalized.value, value); assert.deepEqual(normalized.repairs, { criteriaMap: 0, evidenceStrings: 0 });
  assert(criterionDiagnostics(normalized.value, input).issues.length > 0);
}

// Missing bases, semantic synonyms, wrong evidence and mark types stay wrong.
// Unknown keys are retained so the strict marking validator can reject them.
for (const change of [
  value => { value.criteria[0].assessment = 'partially correct'; },
  value => { value.criteria[0].assessment = 'Met'; },
  value => { value.criteria[0].assessment = 'not met'; },
  value => { delete value.criteria[0].basis; value.criteria[0].reason = 'Alternative field'; },
  value => { value.criteria[0].evidence = ['fabricated quotation']; },
  value => { value.criteria[0].evidence = null; },
  value => { value.criteria[0].evidence = [['nested quotation']]; },
  value => { value.criteria[0].evidence = ['same', 'same']; },
  value => { value.criteria[0].id = 'c2'; },
  value => { value.criteria[0].unknown = 'retained'; },
  value => { value.mark = '2'; }
]) {
  const value = proposal(); change(value); const before = clone(value), normalized = normalizeCriteria(freeze(value), input);
  assert.deepEqual(normalized.value, before); assert.deepEqual(normalized.repairs, { criteriaMap: 0, evidenceStrings: 0 });
}
const mappedExtra = { ...proposal(), criteria: { c1: { ...criterion(), hiddenField: 'PRIVATE' }, c2: criterion('c2') } };
const mappedResult = normalizeCriteria(mappedExtra, input).value;
assert.equal(mappedResult.criteria[0].hiddenField, 'PRIVATE'); assert(codes(mappedResult).includes('criterion_extra_fields'));
assert.throws(() => parse('{"criteria":{"c1":{},"\\u00631":{}}}'), /Duplicate JSON key/);
const pollutedMap = JSON.parse('{"c1":{"assessment":"met","evidence":"alpha","basis":"Present."},"c2":{"assessment":"met","evidence":"beta","basis":"Present."},"__proto__":{"leak":"PRIVATE"}}');
assert.equal(normalizeCriteria({ criteria: pollutedMap }, input).value.criteria, pollutedMap, 'Unknown map keys must not disappear during conversion');
const inherited = Object.create({ c2: criterion('c2') }); inherited.c1 = criterion();
assert.equal(normalizeCriteria({ criteria: inherited }, input).value.criteria, inherited, 'Prototype properties cannot supply missing canonical rows');

// Every shape failure is independently identifiable without returning its
// input. Evidence truth, score arithmetic and audit approval are out of scope.
for (const [change, expected] of [
  [v => { v.criteria = {}; }, 'criteria_type'], [v => { v.criteria.pop(); }, 'criteria_count'],
  [v => { v.criteria[0] = false; }, 'criterion_type'], [v => { v.criteria[0].extra = 'PRIVATE'; }, 'criterion_extra_fields'],
  [v => { delete v.criteria[0].id; }, 'id_missing'], [v => { v.criteria[0].id = 7; }, 'id_type'],
  [v => { v.criteria[0].id = 'PRIVATE_UNKNOWN_ID'; }, 'id_unknown'], [v => { v.criteria[1].id = 'c1'; }, 'id_duplicate'],
  [v => { delete v.criteria[0].assessment; }, 'assessment_missing'], [v => { v.criteria[0].assessment = null; }, 'assessment_type'],
  [v => { v.criteria[0].assessment = 'PRIVATE_LABEL'; }, 'assessment_value'],
  [v => { delete v.criteria[0].evidence; }, 'evidence_missing'], [v => { v.criteria[0].evidence = 'PRIVATE_QUOTE'; }, 'evidence_type'],
  [v => { v.criteria[0].evidence = Array(7).fill('PRIVATE_QUOTE'); }, 'evidence_count'],
  [v => { v.criteria[0].evidence = [null]; }, 'evidence_item_type'], [v => { v.criteria[0].evidence = [' \n']; }, 'evidence_item_empty'],
  [v => { v.criteria[0].evidence = ['PRIVATE'.repeat(100)]; }, 'evidence_item_length'],
  [v => { delete v.criteria[0].basis; }, 'basis_missing'], [v => { v.criteria[0].basis = {}; }, 'basis_type'],
  [v => { v.criteria[0].basis = ' '; }, 'basis_empty'], [v => { v.criteria[0].basis = 'PRIVATE'.repeat(100); }, 'basis_length']
]) {
  const value = proposal(); change(value); const diagnostic = criterionDiagnostics(value, input);
  assert(diagnostic.issues.some(issue => issue.code === expected), expected);
  assert(!JSON.stringify(diagnostic).includes('PRIVATE'));
  assert(diagnostic.issues.every(issue => DIAGNOSTIC_CODES.includes(issue.code)));
}
const tooMany = { criteria: Array.from({ length: 1000 }, () => ({ PRIVATE_FIELD: 'PRIVATE_VALUE' })) };
const bounded = criterionDiagnostics(tooMany, input);
assert.equal(bounded.actualCount, 101); assert.equal(bounded.issues.length, MAX_DIAGNOSTICS); assert.equal(bounded.truncated, true);
assert(Buffer.byteLength(JSON.stringify(bounded)) < 1024); assert(!JSON.stringify(bounded).includes('PRIVATE'));
assert.equal(normalizeCriteria(tooMany, input).value, tooMany);
const hundredInput = { criteria: Array.from({ length: 100 }, (_, i) => ({ id: 'c' + (i + 1) })) };
const hundred = { status: 'marked', mark: 0, criteria: Object.fromEntries(hundredInput.criteria.map(c => [c.id,
  { assessment: 'not_met', evidence: 'α\n"quoted"\\path', basis: 'No relevant achievement.' }])) };
const hundredResult = normalizeCriteria(freeze(hundred), hundredInput);
assert.equal(hundredResult.value.criteria.length, 100); assert.equal(hundredResult.value.mark, 0);
assert.deepEqual(hundredResult.repairs, { criteriaMap: 1, evidenceStrings: 100 });
assert(hundredResult.value.criteria.every(c => c.evidence[0] === 'α\n"quoted"\\path'));
assert.deepEqual(criterionDiagnostics(hundredResult.value, hundredInput).issues, []);
assert.equal(criteriaTemplate(hundredInput).length, 100);
for (const bad of [{}, { criteria: [] }, { criteria: [{ id: 'c1' }, { id: 'c1' }] }, { criteria: [{ id: '' }] }]) {
  assert.equal(normalizeCriteria(original, bad).value, original);
  assert.deepEqual(criterionDiagnostics(original, bad).issues, [{ code: 'canonical_criteria_invalid' }]);
  assert.throws(() => criteriaTemplate(bad), /Invalid canonical/);
}

// The live Q21 raw failure was not retained. This confirms its CURRENT source
// IDs get explicit unfilled output rows; it does not claim to replay that loss.
const q21 = prepare({ bankId: '8', questionNumber: 21, partIndex: 0,
  answer: 'SAST scans source code without executing the program. It can flag risky operations during development before the application is deployed.' }).input;
const template = criteriaTemplate(q21);
assert.deepEqual(template, q21.criteria.map(c => ({ id: c.id, assessment: null, evidence: [], basis: null })));
assert(template.every(row => row.assessment === null && row.basis === null && row.evidence.length === 0));
assert.deepEqual(Object.keys(template[0]).sort(), ['assessment', 'basis', 'evidence', 'id']);
console.log('Marking format OK: lossless maps/quote wrapping, unchanged scores/evidence/labels, strict-invalid preservation, bounded private diagnostics and canonical templates');
