'use strict';

// Syntax adapters only. Call after strict JSON parsing and BEFORE the existing
// scoring, literal-evidence, feedback and audit validators. This module never
// establishes a mark or supplies missing achievements, quotations or bases.
const MAX_CRITERIA = 100;
const MAX_DIAGNOSTICS = 8;
const FIELDS = ['id', 'assessment', 'evidence', 'basis'];
const ASSESSMENTS = ['met', 'partial', 'not_met', 'context'];
const DIAGNOSTIC_CODES = Object.freeze([
  'canonical_criteria_invalid', 'criteria_type', 'criteria_count', 'criterion_type', 'criterion_extra_fields',
  'id_missing', 'id_type', 'id_unknown', 'id_duplicate', 'assessment_missing', 'assessment_type', 'assessment_value',
  'evidence_missing', 'evidence_type', 'evidence_count', 'evidence_item_type', 'evidence_item_empty', 'evidence_item_length',
  'basis_missing', 'basis_type', 'basis_empty', 'basis_length'
]);
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function canonicalIds(input) {
  if (!object(input) || !Array.isArray(input.criteria) || !input.criteria.length || input.criteria.length > MAX_CRITERIA) return null;
  const ids = input.criteria.map(c => object(c) ? c.id : null);
  return ids.every(id => typeof id === 'string' && id.trim() && id.length <= 80) && new Set(ids).size === ids.length ? ids : null;
}

function normalizeCriteria(proposal, input) {
  const repairs = { criteriaMap: 0, evidenceStrings: 0 }, ids = canonicalIds(input);
  if (!ids || !object(proposal)) return { value: proposal, repairs };
  let criteria = proposal.criteria;
  if (object(criteria)) {
    const keys = Object.keys(criteria);
    // The map explicitly supplies every ID exactly once. A conflicting nested
    // ID is ambiguous, so do not remove it or choose one source over another.
    if (keys.length !== ids.length || keys.some(id => !ids.includes(id)) ||
        ids.some(id => !Object.hasOwn(criteria, id) || !object(criteria[id]) ||
          Object.hasOwn(criteria[id], 'id') && criteria[id].id !== id)) return { value: proposal, repairs };
    criteria = ids.map(id => ({ ...criteria[id], id }));
    repairs.criteriaMap = 1;
  }
  if (!Array.isArray(criteria) || criteria.length > MAX_CRITERIA) return { value: proposal, repairs };
  const normalized = criteria.map(c => {
    if (!object(c)) return c;
    if (typeof c.evidence !== 'string') return { ...c };
    repairs.evidenceStrings++;
    // Keep even empty/oversized strings byte-for-byte. The strict validator
    // must reject them rather than silently replacing them with no evidence.
    return { ...c, evidence: [c.evidence] };
  });
  if (!repairs.criteriaMap && !repairs.evidenceStrings) return { value: proposal, repairs };
  return { value: { ...proposal, criteria: normalized }, repairs };
}

// Diagnostics describe shape, never content. Unknown IDs/keys, labels, basis
// text and evidence are not returned. The caller adds its allowlisted stage.
// This is NOT a substitute for the existing marking validators.
function criterionDiagnostics(proposal, input) {
  const ids = canonicalIds(input), criteria = object(proposal) ? proposal.criteria : null;
  const result = { expectedCount: ids ? ids.length : 0,
    actualCount: Array.isArray(criteria) ? Math.min(criteria.length, MAX_CRITERIA + 1) : null, issues: [], truncated: false };
  function add(code, index) {
    if (result.issues.length === MAX_DIAGNOSTICS) { result.truncated = true; return; }
    result.issues.push(index == null ? { code } : { code, index });
  }
  if (!ids) { add('canonical_criteria_invalid'); return result; }
  if (!Array.isArray(criteria)) { add('criteria_type'); return result; }
  if (criteria.length !== ids.length) add('criteria_count');
  const expected = new Set(ids), seen = new Set();
  for (let index = 0; index < Math.min(criteria.length, MAX_CRITERIA); index++) {
    const c = criteria[index];
    if (!object(c)) { add('criterion_type', index); continue; }
    if (Object.keys(c).some(key => !FIELDS.includes(key))) add('criterion_extra_fields', index);
    for (const field of FIELDS) if (!Object.hasOwn(c, field)) add(field + '_missing', index);
    if (Object.hasOwn(c, 'id')) {
      if (typeof c.id !== 'string') add('id_type', index);
      else if (!expected.has(c.id)) add('id_unknown', index);
      else if (seen.has(c.id)) add('id_duplicate', index);
      else seen.add(c.id);
    }
    if (Object.hasOwn(c, 'assessment')) {
      if (typeof c.assessment !== 'string') add('assessment_type', index);
      else if (!ASSESSMENTS.includes(c.assessment)) add('assessment_value', index);
    }
    if (Object.hasOwn(c, 'evidence')) {
      if (!Array.isArray(c.evidence)) add('evidence_type', index);
      else {
        if (c.evidence.length > 6) add('evidence_count', index);
        for (const quote of c.evidence.slice(0, 7)) {
          if (typeof quote !== 'string') add('evidence_item_type', index);
          else if (!quote.trim()) add('evidence_item_empty', index);
          else if (quote.length > 400) add('evidence_item_length', index);
        }
      }
    }
    if (Object.hasOwn(c, 'basis')) {
      if (typeof c.basis !== 'string') add('basis_type', index);
      else if (!c.basis.trim()) add('basis_empty', index);
      else if (c.basis.length > 600) add('basis_length', index);
    }
  }
  if (criteria.length > MAX_CRITERIA) result.truncated = true;
  return result;
}

// An output-shape aid, not a proposed decision. The prompt must require each
// null placeholder to be replaced with an actual assessment/decision basis;
// credited criteria still require literal student evidence under normal rules.
function criteriaTemplate(input) {
  const ids = canonicalIds(input);
  if (!ids) throw new TypeError('Invalid canonical criterion identifiers.');
  return ids.map(id => ({ id, assessment: null, evidence: [], basis: null }));
}

module.exports = { normalizeCriteria, criterionDiagnostics, criteriaTemplate, DIAGNOSTIC_CODES, MAX_DIAGNOSTICS };
