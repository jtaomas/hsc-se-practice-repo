'use strict';

// Post-exam evidence comes from committed questions and private, current marking
// records. Browser-provided scores, feedback and self marks are never accepted.
const markingInput = require('./marking-input');
const marker = require('./marking-engine');
const { LOSS_CATEGORIES, QUALITY_FACTORS, feedbackProblem } = require('./feedback-policy');
const HASH = /^[a-f0-9]{64}$/;
const OPEN = new Set(['tx', 'py', 'ps', 'sq', 'dr', 'ft', 'wb']);
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const fail = message => Object.assign(new Error(message), { status: 400, code: 'invalid_improvement_input' });
const partId = (n, i) => n + '.' + i;
function canonicalText(value) {
  const source = String(value || ''), diagrams = source.match(/<svg\b[\s\S]*?<\/svg\s*>/gi) || [];
  return markingInput.plain(source) + (diagrams.length ? '\nCanonical inline SVG (data only; never execute):\n' + diagrams.join('\n') : '');
}
function cancelled(options) { if (options.signal && options.signal.aborted) throw Object.assign(new Error('Loading the confirmed evidence was cancelled.'), { status: 504, code: 'marking_timeout' }); }

function closed(it, raw) {
  const answer = raw == null ? null : raw;
  let correct = 0, total = 0, blank = answer === null, mark;
  const rows = [];
  function index(value, length) { if (!Number.isInteger(value) || value < 0 || value >= length) throw fail('A closed response contains an invalid selection.'); }
  function row(key, chosen, options, expected, label) {
    if (chosen != null) index(chosen, options.length);
    total++; if (chosen === expected) correct++;
    rows.push({ item: label || key, selected: chosen == null ? 'No answer' : canonicalText(options[chosen]), expected: canonicalText(options[expected]), correct: chosen === expected });
  }
  function mapping(keys) {
    if (answer !== null && (!object(answer) || Object.keys(answer).some(key => !keys.includes(key)))) throw fail('A closed response contains invalid answer fields.');
    blank = answer === null || !Object.values(answer).some(value => value != null);
    return answer || {};
  }
  if (it.t === 'mc') { if (answer !== null) index(answer, it.o.length); row('choice', answer, it.o, it.a); mark = correct; }
  else if (it.t === 'ms') {
    if (answer !== null && (!Array.isArray(answer) || new Set(answer).size !== answer.length)) throw fail('A multiple selection response is invalid.');
    const selected = answer || []; selected.forEach(v => index(v, it.o.length)); blank = !selected.length;
    const wrong = selected.filter(v => !it.a.includes(v)).length + it.a.filter(v => !selected.includes(v)).length;
    mark = it.m === 1 ? (wrong ? 0 : 1) : Math.max(0, it.m - wrong);
    rows.push({ selected: selected.map(v => canonicalText(it.o[v])), expected: it.a.map(v => canonicalText(it.o[v])), correct: wrong === 0 });
  } else if (it.t === 'tk') {
    const allowed = []; it.r.forEach((r, ri) => it.h.slice(1).forEach((_, ci) => allowed.push(ri + ',' + ci)));
    if (answer !== null && (!Array.isArray(answer) || new Set(answer).size !== answer.length || answer.some(v => !allowed.includes(v)))) throw fail('A tick-grid response is invalid.');
    const selected = answer || []; blank = !selected.length;
    it.r.forEach((r, ri) => { total += r[1].length; const expected = r[1].map(ci => ri + ',' + ci); correct += selected.filter(v => expected.includes(v)).length; correct -= selected.filter(v => v.startsWith(ri + ',') && !expected.includes(v)).length; rows.push({ item: canonicalText(r[0]), selected: selected.filter(v => v.startsWith(ri + ',')), expected, selectedLabels: selected.filter(v => v.startsWith(ri + ',')).map(v => canonicalText(it.h[Number(v.split(',')[1]) + 1])), expectedLabels: r[1].map(ci => canonicalText(it.h[ci + 1])) }); });
    correct = Math.max(0, correct);
  } else if (it.t === 'dd') {
    const a = mapping(it.b.map((_, i) => String(i))); it.b.forEach((b, i) => row(String(i), a[i], b[0], b[1]));
  } else if (it.t === 'gd') {
    const cells = []; it.r.forEach((r, ri) => r.forEach((v, ci) => { if (typeof v !== 'string') cells.push({ key: ri + ',' + ci, v, label: canonicalText(r[0]) + ' / ' + canonicalText(it.h[ci]) }); }));
    const a = mapping(cells.map(c => c.key)); cells.forEach(c => row(c.key, a[c.key], c.v[0], c.v[1], c.label));
  } else if (it.t === 'mt' || it.t === 'dm') {
    const a = mapping(it.r.map((_, i) => String(i))); it.r.forEach((r, i) => row(String(i), a[i], it.t === 'mt' ? it.h.slice(1) : it.tok, r[1], canonicalText(r[0])));
  } else if (it.t === 'od') {
    const slots = it.lines.filter(line => line.k === 'slot'); const a = mapping(slots.map((_, i) => String(i)));
    slots.forEach((line, i) => { if (a[i] != null) index(a[i], it.pool.length); total++; const ok = a[i] != null && it.pool[a[i]] === line.t; if (ok) correct++; rows.push({ item: 'Slot ' + (i + 1), selected: a[i] == null ? 'No answer' : canonicalText(it.pool[a[i]]), expected: canonicalText(line.t), correct: ok }); });
  } else throw fail('This paper contains an unsupported closed question.');
  if (mark == null) { if (!total) throw fail('A closed question has no scoring units.'); mark = correct === total ? it.m : Math.floor(it.m * correct / total + 1e-9); }
  return { mark, blank, objective: JSON.stringify(rows) };
}

function readableClosed(it, evidence) {
  const rows = JSON.parse(evidence.objective), answers = [], comparisons = [];
  function selection(value) { return Array.isArray(value) ? value.length ? value.join('; ') : 'Nothing selected' : String(value); }
  rows.forEach((row, index) => {
    const label = it.t === 'dd' ? 'Dropdown ' + (index + 1) : row.item && row.item !== 'choice' ? row.item : 'Choice';
    const chosen = selection(row.selectedLabels || row.selected), expected = selection(row.expectedLabels || row.expected);
    const correct = typeof row.correct === 'boolean' ? row.correct : JSON.stringify(row.selected.slice().sort()) === JSON.stringify(row.expected.slice().sort());
    answers.push(label + ' — selected: ' + chosen + '.');
    comparisons.push(label + ' — selected: ' + chosen + '. Expected: ' + expected + '. ' + (correct ? 'Correct.' : 'Incorrect.'));
  });
  return { answer: answers.join('\n'), objective: comparisons.join('\n') };
}

function aggregate(parts) {
  const coverage = { totalParts: parts.length, confirmedParts: 0, blankParts: 0, reviewParts: 0, unmarkedParts: 0, knownMark: 0, assessedMaxMarks: 0, pendingMaxMarks: 0, totalMaxMarks: 0 };
  const categories = LOSS_CATEGORIES.map(category => ({ category, exactMarksLost: 0, holisticOccurrences: 0, partIds: [] }));
  let totalKnownLost = 0, unallocatedLost = 0;
  for (const part of parts) {
    coverage.totalMaxMarks += part.maxMarks;
    if (part.mark === null) { coverage.pendingMaxMarks += part.maxMarks; coverage[part.status === 'needs_review' ? 'reviewParts' : 'unmarkedParts']++; continue; }
    coverage.confirmedParts++; if (part.blank) coverage.blankParts++;
    coverage.knownMark += part.mark; coverage.assessedMaxMarks += part.maxMarks;
    const lost = part.maxMarks - part.mark; totalKnownLost += lost;
    if (!part.losses || part.losses.allocation !== 'exact') unallocatedLost += lost;
    for (const item of part.losses && part.losses.items || []) {
      const category = categories.find(c => c.category === item.category); if (!category) continue;
      if (!category.partIds.includes(part.partId)) category.partIds.push(part.partId);
      if (part.losses.allocation === 'exact') category.exactMarksLost += item.marksLost;
      else if (!category._seen) category._seen = new Set();
      if (part.losses.allocation === 'holistic' && !category._seen.has(part.partId)) { category.holisticOccurrences++; category._seen.add(part.partId); }
    }
  }
  categories.forEach(c => { delete c._seen; });
  const quality = QUALITY_FACTORS.map(id => {
    const rated = parts.filter(p => p.status === 'marked' && !p.blank && Array.isArray(p.quality) && p.quality.some(q => q.id === id && Number.isInteger(q.rating)));
    return { id, rating: rated.length ? Math.round(10 * rated.reduce((sum, p) => sum + p.quality.find(q => q.id === id).rating, 0) / rated.length) / 10 : null, assessedParts: rated.length, evidencePartIds: rated.map(p => p.partId) };
  });
  return { coverage, lossSummary: { totalKnownLost, unallocatedLost, unknownMaxMarks: coverage.pendingMaxMarks, categories }, quality };
}

function cacheValid(result, prepared, inputDigest, answerDigest, markerEngine, options = {}) {
  if (!object(result) || !['marked', 'needs_review', ...(options.allowProvisional ? ['provisional'] : [])].includes(result.status) || !object(result.audit)) return false;
  const a = result.audit;
  if (a.inputDigest !== inputDigest || a.questionVersion !== prepared.questionVersion || a.rubricVersion !== prepared.rubricVersion || a.harnessVersion !== markerEngine.HARNESS_VERSION || a.requestedModel !== markerEngine.MODEL || (prepared.input.type === 'diagram' && a.answerDigest !== answerDigest)) return false;
  if (result.status === 'needs_review') return result.mark === null;
  // Provisional decisions are usable only by the marking endpoint. Coaching,
  // comparison exports and evaluation of confirmed evidence use the default.
  if (result.status === 'provisional') {
    if (typeof markerEngine.provisionalProvenanceProblem !== 'function' || markerEngine.provisionalProvenanceProblem(result) ||
        typeof markerEngine.coreProblem !== 'function' || !Number.isInteger(result.mark) || result.mark < 0 || result.mark > prepared.input.maxMarks) return false;
    const core = { status: 'marked', mark: result.mark, criteria: result.criteria, uncertainties: [] };
    try { return !markerEngine.coreProblem(core, prepared.input) && !feedbackProblem(result, prepared.input); } catch (_) { return false; }
  }
  if (!Number.isInteger(result.mark) || result.mark < 0 || result.mark > prepared.input.maxMarks || typeof markerEngine.confirmedProvenanceProblem !== 'function' || markerEngine.confirmedProvenanceProblem(result)) return false;
  const loss = result.losses;
  if (!object(loss) || !['exact', 'holistic'].includes(loss.allocation) || loss.totalLost !== prepared.input.maxMarks - result.mark || !Array.isArray(loss.items)) return false;
  if (loss.items.some(item => !object(item) || !LOSS_CATEGORIES.includes(item.category) || !Array.isArray(item.criterionIds) || !Array.isArray(item.evidence) || typeof item.explanation !== 'string' || typeof item.action !== 'string' || (loss.allocation === 'exact' ? !Number.isInteger(item.marksLost) || item.marksLost < 1 : item.marksLost !== null))) return false;
  if (loss.allocation === 'exact' && loss.items.reduce((sum, item) => sum + item.marksLost, 0) !== loss.totalLost) return false;
  if (!Array.isArray(result.quality) || result.quality.length !== QUALITY_FACTORS.length || result.quality.some(q => !object(q)) || new Set(result.quality.map(q => q.id)).size !== QUALITY_FACTORS.length || result.quality.some(q => !QUALITY_FACTORS.includes(q.id) || (q.rating !== null && (!Number.isInteger(q.rating) || q.rating < 0 || q.rating > 10)) || !Array.isArray(q.evidence) || typeof q.feedback !== 'string' || typeof q.action !== 'string')) return false;
  if (typeof result.summary !== 'string' || !['strengths', 'improve', 'advice', 'criteria'].every(key => Array.isArray(result[key]))) return false;
  if (['strengths', 'improve', 'advice'].some(key => result[key].some(value => typeof value !== 'string'))) return false;
  const criteria = new Set(prepared.input.criteria.map(c => c.id));
  const sceneIds = new Set(prepared.input.diagramScene ? prepared.input.diagramScene.elements.map(e => e.id) : []);
  if (result.criteria.length !== criteria.size || result.criteria.some(c => !object(c) || !criteria.delete(c.id) || !['met', 'partial', 'not_met', 'context'].includes(c.assessment) || typeof c.basis !== 'string' || !c.basis.trim() || !Array.isArray(c.evidence) || (['met', 'partial'].includes(c.assessment) && !c.evidence.length) || c.evidence.some(quote => typeof quote !== 'string' || !quote.trim() || (prepared.input.type === 'diagram' ? !sceneIds.has(quote) : !prepared.input.answer.includes(quote))))) return false;
  if (result.mark > 0 && !result.criteria.some(c => ['met', 'partial'].includes(c.assessment))) return false;
  try { return !feedbackProblem(result, prepared.input); } catch (_) { return false; }
}

async function prepare(body, options) {
  options = options || {}; const markerEngine = options.marker || marker;
  let raw; try { raw = typeof body === 'string' ? body : JSON.stringify(body); } catch (_) { throw fail('Invalid improvement request.'); }
  if (!raw || Buffer.byteLength(raw) > 2000000) throw Object.assign(fail('This exam is too large for the improvement coach.'), { status: 413 });
  let payload; try { payload = JSON.parse(raw); } catch (_) { throw fail('Invalid improvement request.'); }
  if (!object(payload) || Object.keys(payload).some(k => !['bankId', 'answers'].includes(k)) || typeof payload.bankId !== 'string' || !Array.isArray(payload.answers)) throw fail('Send the paper and complete submitted answers only.');
  const bank = markingInput.loadBanks().find(b => b.id === payload.bankId && !b.hidden);
  if (!bank) throw fail('Choose an available examination paper.');
  const expected = new Map(); bank.qs.forEach((q, qi) => q.it.forEach((it, i) => expected.set(partId(qi + 1, i), { q, it, qi, i })));
  if (payload.answers.length !== expected.size) throw fail('Include every part of the submitted paper, including blanks.');
  const submitted = new Map();
  for (const value of payload.answers) {
    if (!object(value) || Object.keys(value).some(k => !['questionNumber', 'partIndex', 'answer', 'markingReference'].includes(k)) || !Number.isInteger(value.questionNumber) || !Number.isInteger(value.partIndex) || !Object.hasOwn(value, 'answer') || (value.markingReference != null && !HASH.test(value.markingReference))) throw fail('An answer reference is invalid.');
    const id = partId(value.questionNumber, value.partIndex); if (!expected.has(id) || submitted.has(id)) throw fail('Each paper part must appear exactly once.'); submitted.set(id, value);
  }
  const parts = [];
  async function build([id, source]) {
    cancelled(options);
    const { q, it, qi, i } = source, entry = submitted.get(id);
    const base = { partId: id, questionNumber: qi + 1, partIndex: i, type: it.t, topic: q.tp || '', maxMarks: it.m, question: canonicalText(it.q), stimulus: canonicalText(q.st), contextLimitations: /<(?:img|image)\b/i.test(String(q.st || '') + String(it.q || '') + JSON.stringify(it.o || [])) ? 'External image pixels are unavailable to this coach. Use objective results or confirmed marker feedback only; do not infer image content.' : '', answer: '', criteria: [], objective: '', feedback: '', mark: null, status: 'unmarked', blank: false, losses: null, quality: [] };
    if (!OPEN.has(it.t)) {
      if (it.t === 'dd') base.question += '\nCanonical completion template (numbered placeholders identify the dropdowns):\n' + canonicalText(it.tpl);
      if (it.t === 'od') base.question += '\nCanonical ordering layout, including fixed lines and indentation levels:\n' + JSON.stringify(it.lines.map(line => ({ kind: line.k, level: line.lv, text: canonicalText(line.t) })));
      const evidence = closed(it, entry.answer); Object.assign(base, evidence, readableClosed(it, evidence), { status: 'marked', feedback: it.why ? markingInput.plain(it.why) : '', evidenceDigest: markingInput.digest({ question: q, answer: entry.answer }) });
    } else {
      const answer = entry.answer === null ? it.t === 'dr' ? { elements: [] } : it.t === 'ft' || it.t === 'wb' ? {} : '' : entry.answer;
      const prepared = markingInput.prepare({ bankId: bank.id, questionNumber: qi + 1, partIndex: i, answer });
      const original = { input: prepared.input, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: markerEngine.MODEL, harness: markerEngine.HARNESS_VERSION };
      const answerDigest = markingInput.digest({ ...original, input: { ...prepared.input, diagramPng: null } });
      const inputDigest = prepared.input.type === 'diagram' ? entry.markingReference : markingInput.digest(original);
      Object.assign(base, { answer: prepared.input.answer, question: prepared.input.question, stimulus: prepared.input.stimulus, criteria: prepared.input.criteria, blank: prepared.blank, evidenceDigest: answerDigest });
      if (prepared.blank) { base.status = 'marked'; base.mark = 0; base.objective = 'No answer submitted.'; }
      else {
        cancelled(options);
        const cached = inputDigest ? await options.store.getCached(options.sessionId, inputDigest) : null;
        cancelled(options);
        if (cached && cacheValid(cached, prepared, inputDigest, answerDigest, markerEngine)) {
          base.status = cached.status; base.mark = cached.mark;
          if (cached.status === 'marked') { base.losses = cached.losses; base.quality = cached.quality; base.feedback = [cached.summary, ...cached.strengths, ...cached.improve, ...cached.advice, ...cached.criteria.map(c => c.id + ': ' + c.assessment + '. ' + c.basis), ...cached.losses.items.map(l => l.explanation + '\n' + l.action), ...cached.quality.map(q => q.id + ': ' + q.feedback + '\n' + q.action)].join('\n'); }
          base.markingDigest = markingInput.digest(cached);
        } else if (prepared.reviewReason && prepared.input.type !== 'diagram') base.status = 'needs_review';
      }
    }
    if (base.blank) base.losses = { allocation: 'exact', totalLost: base.maxMarks - base.mark, items: base.maxMarks === base.mark ? [] : [{ category: 'no_response', marksLost: base.maxMarks - base.mark, criterionIds: [], evidence: [], explanation: 'No answer submitted.', action: 'Attempt this part before diagnosing a knowledge gap.' }] };
    return base;
  }
  const entries = Array.from(expected); let next = 0;
  async function worker() { while (next < entries.length) { const index = next++; parts[index] = await build(entries[index]); } }
  await Promise.all(Array.from({ length: Math.min(6, entries.length) }, worker));
  const summaries = aggregate(parts);
  return { bankId: bank.id, bankName: bank.name, parts, ...summaries };
}
module.exports = { prepare, aggregate, closed, cacheValid };
