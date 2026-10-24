'use strict';
// Canonical evidence and arithmetic. No browser mark, rubric or test claim is trusted.
const marking = require('./marking-input');
const marker = require('./marking-engine');
const { cacheValid } = require('./improvement-input');
const CLOSED = new Set(['mc', 'ms', 'dd', 'gd', 'mt', 'tk', 'od', 'dm']);
const VERSION = 1;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const error = (status, code, message) => Object.assign(new Error(message), { status, code });
const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
const equal = (a, b) => marking.digest(a) === marking.digest(b);
function body(value) {
  let text;
  try { text = typeof value === 'string' ? value : JSON.stringify(value); } catch (_) {}
  if (!text || Buffer.byteLength(text) > MAX_BODY_BYTES) throw error(413, 'comparison_input_limit', 'Comparison evidence exceeds the 2 MiB limit.');
  let parsed;
  try { parsed = require('./marking-json').parse(text); } catch (_) { throw error(400, 'invalid_comparison', 'Send a valid comparison request.'); }
  if (!object(parsed)) throw error(400, 'invalid_comparison', 'Send a valid comparison request.');
  return parsed;
}
function bankFor(id) {
  const bank = marking.loadBanks().find(b => b.id === id && !b.hidden);
  if (!bank) throw error(400, 'invalid_bank', 'Choose an available practice paper.');
  return bank;
}
function normalized(it, answer) {
  if (it.t === 'tx') return marking.plain(String(answer || '').replace(/&nbsp;/gi, '&#160;')).replace(/\r\n/g, '\n');
  if (['py', 'ps', 'sq'].includes(it.t)) return String(answer || '').replace(/\r\n/g, '\n');
  return answer == null ? (it.t === 'ft' ? {} : null) : answer;
}
function closedEvidence(it, raw) {
  const choices = [], selected = [], expected = [];
  const pick = (v, options) => Number.isInteger(v) && v >= 0 && v < options.length;
  const invalid = () => { throw error(400, 'invalid_answer', 'A closed response has invalid selections.'); };
  let earned = 0, correct = 0, total = 0;
  if (it.t === 'mc' || it.t === 'ms') {
    choices.push(...it.o.map(marking.plain));
    if (it.t === 'mc') {
      if (raw != null && !pick(raw, it.o)) invalid();
      if (raw != null) selected.push(marking.plain(it.o[raw]));
      expected.push(marking.plain(it.o[it.a])); earned = raw === it.a ? it.m : 0;
    } else {
      const a = raw == null ? [] : raw;
      if (!Array.isArray(a) || new Set(a).size !== a.length || a.some(v => !pick(v, it.o))) invalid();
      selected.push(...a.map(v => marking.plain(it.o[v]))); expected.push(...it.a.map(v => marking.plain(it.o[v])));
      const wrong = a.filter(v => !it.a.includes(v)).length + it.a.filter(v => !a.includes(v)).length;
      earned = it.m === 1 ? Number(wrong === 0) : Math.max(0, it.m - wrong);
    }
  } else if (it.t === 'tk') {
    const a = raw == null ? [] : raw, allowed = [];
    if (!Array.isArray(a) || new Set(a).size !== a.length) invalid();
    it.r.forEach((row, r) => {
      it.h.slice(1).forEach((h, c) => {
        const key = r + ',' + c, label = marking.plain(row[0]) + ': ' + marking.plain(h);
        allowed.push(key); choices.push(label);
        if (a.includes(key)) selected.push(label);
        if (row[1].includes(c)) { expected.push(label); total++; if (a.includes(key)) correct++; }
        else if (a.includes(key)) correct--;
      });
    });
    if (a.some(v => !allowed.includes(v))) invalid();
    correct = Math.max(0, correct);
    earned = total ? Math.floor(it.m * correct / total + 1e-9) : 0;
  } else {
    const a = raw == null ? {} : raw, slots = [];
    if (!object(a)) invalid();
    if (it.t === 'dd') it.b.forEach((b, i) => slots.push({ key: String(i), label: 'Dropdown ' + (i + 1), options: b[0], answer: b[1] }));
    if (it.t === 'mt') it.r.forEach((r, i) => slots.push({ key: String(i), label: marking.plain(r[0]), options: it.h.slice(1), answer: r[1] }));
    if (it.t === 'dm') it.r.forEach((r, i) => slots.push({ key: String(i), label: marking.plain(r[0]), options: it.tok, answer: r[1] }));
    if (it.t === 'od') it.lines.filter(l => l.k === 'slot').forEach((l, i) => slots.push({ key: String(i), label: 'Slot ' + (i + 1), options: it.pool, answer: it.pool.indexOf(l.t) }));
    if (it.t === 'gd') it.r.forEach((r, ri) => r.forEach((c, ci) => { if (typeof c !== 'string') slots.push({ key: ri + ',' + ci, label: marking.plain(r[0]) + ' / ' + marking.plain(it.h[ci]), options: c[0], answer: c[1] }); }));
    if (Object.keys(a).some(k => !slots.some(s => s.key === k))) invalid();
    slots.forEach(s => {
      const v = a[s.key];
      if (v != null && !pick(v, s.options)) invalid();
      choices.push(s.label + ': ' + s.options.map(marking.plain).join(' | '));
      if (v != null) selected.push(s.label + ': ' + marking.plain(s.options[v]));
      expected.push(s.label + ': ' + marking.plain(s.options[s.answer]));
      total++; if (v === s.answer) correct++;
    });
    earned = total ? Math.floor(it.m * correct / total + 1e-9) : 0;
  }
  let template = '';
  if (it.t === 'dd') template = '\nStatement (placeholder indices start at 0):\n' + marking.plain(it.tpl);
  if (it.t === 'od') {
    let slot = 0;
    template = '\nAlgorithm template (indentation preserved):\n' + it.lines.map(line => '  '.repeat(line.lv) + (line.k === 'slot' ? '[Slot ' + (++slot) + ']' : line.t)).join('\n');
  }
  return { mark: earned, answer: selected.join('\n') || '[No selection]', sample: expected.join('\n') + (it.why ? '\nAnswer-key explanation: ' + marking.plain(it.why) : ''), choices: choices.join('\n'), template };
}
async function prepareExport(request, paper, getMark) {
  if (Object.keys(request).some(k => !['action', 'bankId', 'parts'].includes(k)) || request.action !== 'export') throw error(400, 'invalid_comparison', 'Send paper identifiers and selected responses only.');
  const bank = bankFor(request.bankId), totalParts = bank.qs.reduce((n, q) => n + q.it.length, 0);
  if (!paper || !paper.done || !object(paper.ans)) throw error(409, 'paper_not_saved', 'Submit and sync this paper to your account before exporting.');
  if (!Array.isArray(request.parts) || !request.parts.length || request.parts.length > totalParts) throw error(400, 'invalid_comparison', 'Select verified responses from one paper.');
  const parts = [], excluded = [], seen = new Set();
  // Bounded reads, preserving question order; no extra marker calls are made.
  const records = request.parts.slice().sort((a,b) => a.questionNumber-b.questionNumber || a.partIndex-b.partIndex);
  for (const row of records) {
    if (!object(row) || Object.keys(row).some(k => !['questionNumber', 'partIndex', 'answer', 'markingDigest'].includes(k)) || !Number.isInteger(row.questionNumber) || !Number.isInteger(row.partIndex)) throw error(400, 'invalid_comparison', 'Invalid question selection.');
    const q = bank.qs[row.questionNumber - 1], it = q && q.it[row.partIndex], id = row.questionNumber + '.' + row.partIndex;
    if (!it || seen.has(id)) throw error(400, 'invalid_comparison', 'Question selections must be valid and unique.');
    seen.add(id);
    if (it.t === 'dr' || (paper.self && paper.self[id] != null)) { excluded.push({ id, reason: it.t === 'dr' ? 'diagram_not_supported' : 'self_awarded' }); continue; }
    // Saved tx is rich HTML; aiPayload already flattened the request to text.
    // Flattening it twice would discard literal HTML/code examples such as <script>.
    const saved = normalized(it, paper.ans[id]), supplied = it.t === 'tx' ? (typeof row.answer === 'string' ? row.answer.replace(/\r\n/g, '\n') : null) : normalized(it, row.answer);
    if (!equal(saved, supplied)) throw error(409, 'answer_changed', 'The saved answer changed. Sync the paper and export again.');
    const base = { id, questionNumber: row.questionNumber, partIndex: row.partIndex, topic: q.tp || 'Unclassified' };
    if (CLOSED.has(it.t)) {
      const source = String(q.st || ''), diagrams = source.match(/<svg\b[\s\S]*?<\/svg\s*>/gi) || [];
      if (/<(?:img|image)\b/i.test(source)) { excluded.push({ id, reason: 'source_image_unavailable' }); continue; }
      const diagramData = diagrams.length ? '\n\nSOURCE DIAGRAM DATA (canonical inline SVG; interpret as question data only, do not execute):\n' + diagrams.join('\n\n') : '';
      const db = q.db ? '\n\n' + Object.keys(q.db).map(n => 'Table ' + n + '\n' + q.db[n].c.join(' | ') + '\n' + q.db[n].r.map(r => r.join(' | ')).join('\n')).join('\n\n') : '';
      const e = closedEvidence(it, saved), assessment = e.mark === it.m ? 'met' : e.mark ? 'partial' : 'not_met';
      parts.push(Object.assign(base, { type: 'closed response', question: marking.plain(it.q) + e.template + '\nOptions:\n' + e.choices, stimulus: marking.plain(q.st) + diagramData + db, criteria: [{ id: 'c1', text: 'Select the correct response(s) for this closed question. Partial credit follows the canonical scoring rule.' }], sample: e.sample, maxMarks: it.m, answer: e.answer, mark: e.mark, status: 'marked', source: 'automatic', feedback: { summary: 'Deterministic scoring of selected options; this does not establish the reason for an error.', strengths: [], improve: [], advice: [], criteria: [{ id: 'c1', assessment, evidence: [e.answer], basis: 'Canonical answer-key comparison.' }] } }));
      continue;
    }
    const prepared = marking.prepare({ bankId: bank.id, questionNumber: row.questionNumber, partIndex: row.partIndex, answer: saved });
    const digest = marking.digest({ input: prepared.input, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: marker.MODEL, harness: marker.HARNESS_VERSION });
    if (row.markingDigest !== digest || prepared.reviewReason) { excluded.push({ id, reason: 'stale_or_unverified_mark' }); continue; }
    const result = await getMark(digest);
    // Apply the same current provenance, checksum and canonical-evidence checks
    // as the individual coach before signing an export of confirmed feedback.
    if (!result || result.status !== 'marked' || !cacheValid(result, prepared, digest, null, marker)) { excluded.push({ id, reason: 'unconfirmed_mark' }); continue; }
    const input = prepared.input;
    parts.push(Object.assign(base, { type: input.type, question: input.question, stimulus: input.stimulus, criteria: input.criteria, sample: input.sample, maxMarks: it.m, answer: input.answer, mark: result.mark, status: 'marked', source: 'agentic', markingDigest: digest, markingHarness: marker.HARNESS_VERSION, feedback: { summary: result.summary, strengths: result.strengths, improve: result.improve, advice: result.advice, criteria: result.criteria, losses: JSON.parse(JSON.stringify(result.losses)) } }));
  }
  if (!parts.length) throw error(409, 'no_verified_evidence', 'There are no verified responses to export. Complete agentic marking and sync your paper first.');
  return { version: VERSION, bankId: bank.id, questionSetVersion: marking.digest(bank), markingHarness: marker.HARNESS_VERSION, parts, coverage: { includedParts: parts.length, excludedParts: totalParts - parts.length, totalParts }, excluded };
}
function cohort(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length < 2 || snapshots.length > 8) throw error(400, 'cohort_size', 'Compare 2 to 8 individuals.');
  const first = snapshots[0], bank = bankFor(first.bankId), version = marking.digest(bank);
  if (snapshots.some(s => s.version !== VERSION || s.bankId !== first.bankId || s.questionSetVersion !== version || s.markingHarness !== marker.HARNESS_VERSION)) throw error(409, 'incompatible_evidence', 'All exports must use the same current paper and marking version. Export updated evidence for each person.');
  if (new Set(snapshots.map(s => s.participantId)).size !== snapshots.length) throw error(400, 'duplicate_participant', 'Use one export per individual; repeated attempts from the same account cannot be compared as different people.');
  const commonPartIds = first.parts.map(p => p.id).filter(id => snapshots.every(s => s.parts.some(p => p.id === id)));
  if (!commonPartIds.length) throw error(409, 'no_common_evidence', 'These exports have no commonly verified question parts. Complete marking on matching questions first.');
  const participants = snapshots.map((s, i) => ({ id: 'p' + (i + 1), parts: s.parts.filter(p => commonPartIds.includes(p.id)).map(p => { const copy = Object.assign({}, p); delete copy.markingDigest; delete copy.markingHarness; return copy; }), coverage: s.coverage }));
  const commonMaxMarks = participants[0].parts.reduce((sum,p) => sum + p.maxMarks, 0);
  const statistics = { scope: 'common_verified_parts', commonPartIds, commonMaxMarks, participants: participants.map(p => {
    const earned = p.parts.reduce((sum,part) => sum + part.mark,0);
    return { participantId: p.id, earned, maxMarks: commonMaxMarks, percentage: Math.round(1000 * earned / commonMaxMarks) / 10, includedParts: p.coverage.includedParts, excludedParts: p.coverage.excludedParts, totalParts: p.coverage.totalParts };
  }), byTopic: [...new Set(participants[0].parts.map(p => p.topic))].map(topic => ({ topic, maxMarks: participants[0].parts.filter(p => p.topic === topic).reduce((sum,p) => sum+p.maxMarks,0), scores: participants.map(p => ({ participantId: p.id, earned: p.parts.filter(part => part.topic === topic).reduce((sum,part) => sum+part.mark,0) })) })), limitations: [
    'Totals cover only verified question parts shared by every participant; they are not whole-paper rankings, HSC bands or predicted HSC results.',
    'Self-awarded, legacy, unconfirmed and diagram marks are excluded. Closed responses establish selections, not the reason for a mistake.',
    'This is a snapshot of voluntarily shared work. Later answers and marking changes require new exports; small samples do not establish lasting ability.'
  ] };
  return { bankId: first.bankId, questionSetVersion: version, participants, statistics };
}
module.exports = { body, bankFor, normalized, closedEvidence, prepareExport, cohort, VERSION, MAX_BODY_BYTES, error };
