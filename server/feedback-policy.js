'use strict';

// Shared server contract. These diagnostics describe this response, not a
// student's ability, and never supply an additional source of exam marks.
const LOSS_CATEGORIES = Object.freeze(['knowledge_gap', 'technical_error', 'missing_requirement', 'insufficient_explanation', 'application_gap', 'unsupported_judgement', 'misread_command', 'communication', 'no_response']);
const QUALITY_FACTORS = Object.freeze(['clarity', 'concision', 'technical_accuracy', 'relevance', 'structure', 'reasoning', 'evidence_examples', 'terminology', 'consistency', 'code_quality', 'diagram_quality']);

function evidenceCatalog(input) {
  if (input.type === 'diagram') return [];
  let prefix = '[[source:', salt = 0;
  // Handles must not be confused with literal text supplied by the student.
  while (input.answer.includes(prefix)) prefix = '[[source' + (++salt) + ':';
  const catalog = [], seen = new Set();
  for (const raw of input.answer.split('\n')) {
    const line = raw.trim();
    if (!line || /^Cell \[\d+,\d+\]:$/.test(line)) continue;
    for (let at = 0; at < line.length && catalog.length < 96;) {
      let end = Math.min(at + 400, line.length);
      if (end < line.length && /[\uD800-\uDBFF]/.test(line[end - 1])) end--;
      const quote = line.slice(at, end); at = end;
      if (!quote.trim() || seen.has(quote)) continue;
      seen.add(quote); catalog.push({ id: prefix + 'E' + (catalog.length + 1) + ']]', text: quote });
    }
    if (catalog.length === 96) break;
  }
  return catalog;
}
function resolveEvidenceReferences(value, catalog) {
  const references = new Map(catalog.map(item => [item.id, item.text]));
  let count = 0;
  if (!object(value)) return count;
  const groups = [value.criteria, value.quality, object(value.losses) ? value.losses.items : null];
  for (const group of groups) if (Array.isArray(group)) for (const item of group) {
    if (!object(item) || !Array.isArray(item.evidence)) continue;
    item.evidence = item.evidence.map(quote => {
      if (!references.has(quote)) return quote;
      count++; return references.get(quote);
    });
  }
  return count;
}

function scoringModel(input) {
  // Infer only the unambiguous format used by the banks. Mixed rubrics and
  // multi-mark bands stay holistic; equal-looking numbers are not weights.
  const additive = input.criteria.length === input.maxMarks && input.criteria.every(item => /^\s*1 mark\s*:/i.test(item.text));
  const model = { kind: additive ? 'additive' : 'holistic', weights: additive ? input.criteria.map(item => ({ id: item.id, marks: 1 })) : [] };
  if (!additive) {
    const bands = input.criteria.map(item => {
      const match = /^\s*(\d+)(?:\s*[-–]\s*(\d+))?\s+marks?\s*:/i.exec(item.text);
      return match ? { id: item.id, minMarks: Number(match[1]), maxMarks: Number(match[2] || match[1]) } : null;
    });
    // Do not guess from arbitrary prose, mixed point/band rubrics, examples,
    // overlaps, gaps or an incomplete scale. These remain ordinary holistic.
    if (bands.every(band => band && band.minMarks >= 1 && band.minMarks <= band.maxMarks) &&
        bands[0].maxMarks === input.maxMarks && bands[bands.length - 1].minMarks === 1 &&
        bands.every((band, i) => i === 0 || bands[i - 1].minMarks === band.maxMarks + 1)) model.bands = bands;
  }
  return model;
}
function unavailableFeedback() {
  return { losses: { allocation: 'unavailable', totalLost: null, items: [] }, quality: [] };
}
function blankFeedback(input) {
  return { losses: { allocation: 'exact', totalLost: input.maxMarks, items: [{ category: 'no_response', marksLost: input.maxMarks,
    criterionIds: input.criteria.map(item => item.id), evidence: [], explanation: 'No assessable response was submitted, so no rubric marks could be awarded.',
    action: 'Attempt the question using its command verb and the information in the stimulus.' }] },
  quality: QUALITY_FACTORS.map(id => ({ id, rating: null, evidence: [], feedback: 'Not assessable: no response was submitted.', action: 'Submit a response before assessing this factor.' })) };
}
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function keys(value, expected) { return object(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)); }
function text(value, max) { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function evidenceProblem(value, input) {
  if (!Array.isArray(value) || value.length > 6 || value.some(item => !text(item, 400)) || new Set(value).size !== value.length) return 'feedback_evidence_schema';
  const ids = new Set(input.type === 'diagram' ? input.diagramScene.elements.map(item => item.id) : []);
  return value.every(item => input.type === 'diagram' ? ids.has(item) : input.answer.includes(item)) ? null : 'unsupported_feedback_evidence';
}
function scoreProblem(value, input) {
  const model = scoringModel(input), exact = model.kind === 'additive';
  if (exact && value.criteria.some(item => !['met', 'not_met'].includes(item.assessment))) return 'additive_assessment_mismatch';
  if (exact && value.mark !== value.criteria.filter(item => item.assessment === 'met').length) return 'additive_score_mismatch';
  if (model.bands) {
    const selected = model.bands.find(band => value.mark >= band.minMarks && value.mark <= band.maxMarks);
    if (value.mark > 0 && !selected || value.criteria.some(item => item.assessment !== (value.mark === 0 ? 'not_met' : item.id === selected.id ? 'met' : 'context'))) return 'band_assessment_mismatch';
  }
  return null;
}
function feedbackProblem(value, input) {
  const loss = value.losses, quality = value.quality;
  if (!keys(loss, ['allocation', 'totalLost', 'items']) || !Array.isArray(loss.items) || loss.items.length > LOSS_CATEGORIES.length) return 'loss_schema';
  if (value.status !== 'marked') return loss.allocation === 'unavailable' && loss.totalLost === null && !loss.items.length && Array.isArray(quality) && !quality.length ? null : 'review_has_diagnostics';
  const model = scoringModel(input), exact = model.kind === 'additive';
  const bandIds = new Set((model.bands || []).map(band => band.id));
  if (loss.allocation !== (exact ? 'exact' : 'holistic') || loss.totalLost !== input.maxMarks - value.mark || !Number.isInteger(loss.totalLost)) return 'loss_accounting';
  if ((loss.totalLost === 0) !== (loss.items.length === 0)) return 'loss_accounting';
  const criterionMap = new Map(value.criteria.map(item => [item.id, item])), categories = new Set(), assigned = new Set();
  let allocated = 0;
  const score = scoreProblem(value, input);
  if (score) return score;
  for (const item of loss.items) {
    if (!keys(item, ['category', 'marksLost', 'criterionIds', 'evidence', 'explanation', 'action']) || !LOSS_CATEGORIES.includes(item.category) || categories.has(item.category) ||
        !Array.isArray(item.criterionIds) || !item.criterionIds.length || item.criterionIds.length > input.criteria.length || new Set(item.criterionIds).size !== item.criterionIds.length ||
        item.criterionIds.some(id => !criterionMap.has(id) || criterionMap.get(id).assessment === 'context' && !bandIds.has(id)) || !text(item.explanation, 600) || !text(item.action, 500)) return 'loss_schema';
    categories.add(item.category);
    const evidence = evidenceProblem(item.evidence, input);
    if (evidence) return evidence;
    // A nonblank answer cannot be reclassified as no response. Omissions may
    // have no quote; the canonical criterion IDs anchor those diagnoses.
    if (item.category === 'no_response' && (input.type === 'diagram' ? input.diagramScene.elements.length : input.answer.trim())) return 'false_no_response';
    if (exact) {
      if (!Number.isInteger(item.marksLost) || item.marksLost < 1 || item.marksLost !== item.criterionIds.length) return 'loss_accounting';
      for (const id of item.criterionIds) {
        if (assigned.has(id) || criterionMap.get(id).assessment === 'met') return 'duplicate_or_credited_loss';
        assigned.add(id);
      }
      allocated += item.marksLost;
    } else if (item.marksLost !== null) return 'holistic_false_precision';
  }
  if (exact && (allocated !== loss.totalLost || value.criteria.some(item => item.assessment !== 'met' && !assigned.has(item.id)))) return 'loss_accounting';
  if (!Array.isArray(quality) || quality.length !== QUALITY_FACTORS.length) return 'quality_coverage';
  const factors = new Set(QUALITY_FACTORS);
  for (const item of quality) {
    if (!keys(item, ['id', 'rating', 'evidence', 'feedback', 'action']) || !factors.delete(item.id) ||
        !(item.rating === null || Number.isInteger(item.rating) && item.rating >= 0 && item.rating <= 10) || !text(item.feedback, 600) || !text(item.action, 500)) return 'quality_schema';
    const evidence = evidenceProblem(item.evidence, input);
    if (evidence) return evidence;
    if (item.rating !== null && !item.evidence.length) return 'quality_missing_evidence';
    if (item.id === 'code_quality' && !['Python program', 'pseudocode algorithm', 'SQL query', 'HTML and CSS code'].includes(input.type) && item.rating !== null ||
        item.id === 'diagram_quality' && input.type !== 'diagram' && item.rating !== null) return 'quality_inapplicable';
  }
  return null;
}

const FEEDBACK_POLICY = `Provide diagnostic feedback in two separate fields, losses and quality. These describe this submitted response, never a diagnosis of the student's intelligence, disability or general ability.
losses has exactly {"allocation":"exact"|"holistic"|"unavailable","totalLost":integer|null,"items":[{"category":"one allowed ID","marksLost":integer|null,"criterionIds":["canonical IDs"],"evidence":["exact student quotations or diagram IDs"],"explanation":"specific missing achievement and why it affects this rubric","action":"concrete repair or practice action"}]}.
Allowed loss categories are ${LOSS_CATEGORIES.join(', ')}. knowledge_gap means a demonstrated misconception about a required concept; technical_error means an explicit factual, algorithmic or code error; missing_requirement means an omitted required component; insufficient_explanation means a required causal link lacks explanation; application_gap means missing required scenario application; unsupported_judgement means an evaluation lacks required support; misread_command means the required task was not performed; communication applies ONLY if a rubric explicitly assesses communication or meaning is too unclear to demonstrate a required concept; no_response applies ONLY to an empty submission. Do not infer that a missing answer proves missing knowledge. Choose missing_requirement unless there is evidence of a knowledge gap. Use one primary category per lost mark, group related deficits in one item per category, and avoid diagnosing one omission repeatedly.
Use canonicalAssessment.scoringModel. For additive, every criterion is exactly one indivisible mark: use met only when that criterion is fully earned, otherwise use not_met. Both partial and context are forbidden for these one-mark criteria. Describe any partial achievement in basis without awarding that point or changing its label. The mark must equal the count of met criteria; preserve other independently earned points without deducting twice for the same error. allocation must be exact; each missing criterion appears exactly once across loss items and each marksLost equals its criterionIds count. Total category marks must equal maxMarks minus mark. For holistic or mixed rubrics use allocation holistic and marksLost:null in EVERY item: do not pretend a band can be divided into causal marks. totalLost is still exactly maxMarks minus mark. Explain the overall band gap; categories identify contributing causes without claiming exact allocations. When scoringModel.bands is supplied, those are mutually exclusive whole-answer bands: for a positive mark, mark the ONE band containing that mark as met and ALL other bands as context, explaining that they are unselected comparison bands; at zero use not_met for every band. Do not label all subsumed lower bands met or an unselected upper band partial/not_met. Loss items can reference an unselected higher band's ID to explain the shortfall, although its assessment is context; this is a target descriptor, not a separate deduction. A criterion that is genuinely only an illustrative note must not be a loss. Every below-full score needs loss items; full marks have no loss items.
quality contains each of these factor IDs exactly once: ${QUALITY_FACTORS.join(', ')}. Each item has exactly {"id":"factor ID","rating":integer0to10|null,"evidence":["exact quotes or diagram IDs"],"feedback":"specific evidence-linked evaluation","action":"one actionable next step or how to sustain effective practice"}. All ratings assess the RESPONSE in the task's context. They never add or subtract exam marks and need not track the mark. For example a terse correct answer may earn all marks but have limited assessable reasoning; a fluent misconception may have high clarity and low technical_accuracy. Judge clarity (ease of interpreting meaning), concision (useful information without repetition), technical_accuracy (correctness of explicit claims), relevance (focus on task), structure (organisation), reasoning (valid causal or logical links), evidence_examples (appropriate support), terminology (precise technical language), consistency (absence of contradictions), code_quality (readability and organisation, not assumed execution), and diagram_quality (legibility and unambiguous connectors/labels).
Rating anchors: 0-2 severe demonstrated weaknesses; 3-4 recurring material weaknesses; 5-6 adequate with specific gaps; 7-8 strong with minor refinements; 9-10 consistently effective for this response's scope. Assess each factor's own construct: consistency means internal contradictions among the student's claims or representations, including comments contradicted by implementation. A program that consistently implements the wrong logic is technically inaccurate, not internally contradictory merely because it fails the specification; discuss that under technical_accuracy/reasoning. Similarly, an off-topic but clearly expressed response has a relevance weakness, not automatically a clarity weakness. Use null with an explanation when inapplicable or the answer is too short or incomplete to judge reliably. Do not rate missing evidence as zero. code_quality is null except for Python, pseudocode or SQL, and diagram_quality is null except for diagrams. Do not demand examples, long paragraphs, extra terminology or discussion in an identify/name/outline task. A numerical rating always needs at least one actual supporting quote/diagram ID. Do not infer prose-writing weaknesses from code, tables or diagrams; use null where prose factors do not apply. Do not infer execution, performance or correctness from comments claiming tests passed.
Apply factor-specific evidence before assigning ratings. Completeness is assessed by the rubric and loss feedback; do not lower clarity, concision, structure, terminology, consistency or code_quality simply because required content is missing or technically wrong. Clarity asks whether the expressed meaning is understandable, concision asks whether existing wording is needlessly repetitive or padded, structure asks whether the presented ideas are organised, terminology asks whether terms actually used are precise, and consistency asks whether the submitted claims conflict with one another. A rating of 0-6 must identify an actual evidenced weakness in THAT factor. Descriptions such as "unambiguous but incorrect", "no padding but incomplete" or "internally consistent but based on a false premise" cannot justify a low clarity, concision or consistency rating respectively. Record the factual error under technical_accuracy and any invalid inference under reasoning. For strong ratings, describe the observed strength without inventing a minor flaw to explain why it is not 10. Do not spread one omission or misconception into unrelated factor weaknesses. code_quality assesses readability and organisation: a missing guard or incorrect computation is a technical_accuracy/reasoning issue, not a code_quality weakness unless there is also an evidenced readability or organisation problem. When no technical vocabulary is actually used, terminology is null; do not assign a low terminology score merely because technical terms are absent.
An absent example, absent reasoning chain or too-short structure supplies no observed performance to rate: use null for that factor with the precise limitation. If the rubric requires the missing feature, explain that scored omission in losses/improve; do not manufacture a quality score from its absence. In particular, when no example is given and the task does not require one, evidence_examples must be null and feedback must not prescribe an example as a new requirement. An actually attempted but wrong example or inference can receive a low rating supported by that attempt. A quote of the whole answer does not transform an absent feature into an observed one.
Preserve what is already effective. For example, a response ordered mechanism, effect, prevention has that structure even when its effect claim is false; correct the fact without saying the ordering is wrong or recommending the same order as a repair. Every remedial action must identify a real change from the submitted response. When no change is warranted for a factor, say "No change needed" or name the demonstrated practice to maintain. Do not invent generic improvement work to fill every action field. Keep advice scoped to THIS question. For example, a question that explicitly asks for a mechanism, effect and prevention needs those parts; the command "describe" alone does not require prevention. Avoid prescribing fixed sentence counts, transitions, examples or templates unless they address an observed problem or explicit task requirement.
Feedback must explain what the submitted response demonstrates, why it matters, and a feasible next action. Do not invent the process or history behind it: unrelated content does not prove the student copied a template, reused an earlier answer or skipped a particular step. Describe the observable mismatch. Preserve correct diagram notation: recommend association arrowheads only when the task or the relationship semantics require directionality; a plain UML association line is valid. Avoid repeating the same generic advice in every factor. For dense/repetitive prose identify the actual repetition or overloaded wording, and suggest a concrete shorter organisation. Preserve technically necessary detail. An answer beyond full-mark expectations still receives only maxMarks; recognise effective extra depth in quality or optional advice; strengths describe only achievements credited by the rubric. Frame further refinement as optional. Extra correct details are not compulsory; extra incorrect claims affect marks only where they contradict or undermine a scored achievement. Stylistic advice must not masquerade as a lost-mark cause. Do not supply a full replacement answer as the only feedback. Make causal advice technically precise: verification, testing, monitoring and validation reveal evidence or inform a corrective decision; they do not automatically prevent or repair a problem. For example, validation or cross-validation can inform model/hyperparameter selection or early stopping, but measuring validation performance alone does not reduce overfitting. Give the relevant follow-up action rather than naming a check as though it directly fixes the defect.
For diagrams, EVERY criterion, loss and quality evidence array uses only allowedEvidenceIds from diagramEvidenceCatalog, never its displayed labels or attribute values. Use at most 6 unique IDs per array, choosing representative relevant elements rather than every shape; the complete scene remains available to the auditor. Keep evidence arrays to 6 unique items of at most 400 characters each, loss explanations and quality feedback to 600 characters, and actions to 500 characters. For needs_review use losses={"allocation":"unavailable","totalLost":null,"items":[]} and quality=[]; unconfirmed marks must not acquire apparently confirmed diagnoses.`;

module.exports = { LOSS_CATEGORIES, QUALITY_FACTORS, scoringModel, evidenceCatalog, resolveEvidenceReferences, unavailableFeedback, blankFeedback, scoreProblem, feedbackProblem, FEEDBACK_POLICY };
