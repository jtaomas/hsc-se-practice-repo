// Only the committed banks execute here. No request content is evaluated as code.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const MAX_BODY_BYTES = 2000000;
const TYPES = { tx: 'written response', ft: 'written response', py: 'Python program', ps: 'pseudocode algorithm', sq: 'SQL query', dr: 'diagram' };
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
let banks;
function error(status, code, message) { return Object.assign(new Error(message), { status, code }); }
function object(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function plain(html) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', times: '×', le: '≤', ge: '≥', ne: '≠' };
  return String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|li|tr|div|h\d|pre)>/gi, '\n').replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<!--[\s\S]*?-->|<[/!a-zA-Z][^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (all, name) => {
      if (name[0] !== '#') return entities[name.toLowerCase()] || all;
      const n = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
      return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : all;
    }).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
function loadBanks() {
  if (!banks) {
    const context = vm.createContext({ localStorage: { getItem: () => null } });
    for (const file of ['helpers.js', 'kit.js', 'bank1.js', 'bank2.js', 'bank3.js', 'bank4.js', 'bank5.js', 'bank6.js', 'formats.js']) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), context, { filename: file, timeout: 1000 });
    }
    banks = JSON.parse(JSON.stringify(context.BANKS));
  }
  return banks;
}
function parseBody(body) {
  let text;
  try { text = typeof body === 'string' ? body : JSON.stringify(body); } catch (_) { throw error(400, 'invalid_request', 'Invalid marking request.'); }
  if (!text || Buffer.byteLength(text) > MAX_BODY_BYTES) throw error(413, 'input_too_large', 'This response is too large for automatic marking.');
  let p;
  try { p = JSON.parse(text); } catch (_) { throw error(400, 'invalid_request', 'Invalid marking request.'); }
  if (!object(p) || Object.keys(p).some(k => !['bankId', 'questionNumber', 'partIndex', 'answer', 'diagramPng'].includes(k))) throw error(400, 'invalid_request', 'Send the question identifiers and saved answer only.');
  return p;
}
const SCENE_FIELDS = ['id', 'type', 'x', 'y', 'width', 'height', 'angle', 'text', 'originalText', 'containerId', 'boundElements', 'startBinding', 'endBinding', 'startArrowhead', 'endArrowhead', 'points', 'groupIds', 'backgroundColor', 'fillStyle', 'strokeColor', 'strokeWidth', 'strokeStyle', 'roughness', 'roundness', 'fontSize', 'fontFamily', 'textAlign', 'verticalAlign', 'opacity', 'frameId', 'elbowed', 'fixedSegments'];
function sceneEvidence(answer) {
  if (!object(answer) || Object.keys(answer).some(k => k !== 'elements') || !Array.isArray(answer.elements) || answer.elements.length > 500) throw error(400, 'invalid_diagram', 'The saved diagram is invalid or too large.');
  const elements = [], ids = new Set();
  let reviewReason = null;
  for (const element of answer.elements) {
    if (!object(element)) throw error(400, 'invalid_diagram', 'The saved diagram contains an invalid element.');
    if (element.isDeleted === true) continue;
    if (typeof element.id !== 'string' || !element.id || element.id.length > 128 || ids.has(element.id)) throw error(400, 'invalid_diagram', 'The saved diagram has invalid element identifiers.');
    ids.add(element.id);
    if (!['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line'].includes(element.type)) reviewReason = 'This drawing contains unsupported elements. Please review the diagram manually.';
    if (['x', 'y', 'width', 'height'].some(k => !Number.isFinite(element[k]) || Math.abs(element[k]) > 1000000) || element.width < 0 || element.height < 0) throw error(400, 'invalid_diagram', 'The saved diagram contains invalid geometry.');
    for (const name of ['angle', 'opacity', 'fontSize', 'strokeWidth']) if (element[name] != null && (!Number.isFinite(element[name]) || Math.abs(element[name]) > 1000000)) throw error(400, 'invalid_diagram', 'The saved diagram contains invalid geometry.');
    if (element.points != null && (!Array.isArray(element.points) || element.points.length > 1000 || element.points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(n => !Number.isFinite(n) || Math.abs(n) > 1000000)))) throw error(400, 'invalid_diagram', 'The saved diagram contains invalid connector geometry.');
    for (const name of ['text', 'originalText']) if (element[name] != null && (typeof element[name] !== 'string' || element[name].length > 12000)) throw error(400, 'invalid_diagram', 'A diagram label is invalid or too long.');
    const clean = {};
    SCENE_FIELDS.forEach(k => { if (Object.hasOwn(element, k)) clean[k] = element[k]; });
    elements.push(clean);
  }
  for (const element of elements) {
    for (const k of ['startBinding', 'endBinding']) if (element[k] != null && (!object(element[k]) || !ids.has(element[k].elementId))) reviewReason = 'The diagram has a connector whose endpoint cannot be resolved. Please review it manually.';
    if (element.containerId && !ids.has(element.containerId)) reviewReason = 'A diagram label cannot be matched to its shape. Please review it manually.';
  }
  const scene = { elements };
  if (Buffer.byteLength(JSON.stringify(scene)) > 90000) throw error(413, 'input_too_large', 'The saved diagram is too large for automatic marking.');
  return { scene, reviewReason };
}
function pngEvidence(value) {
  if (value == null) return null;
  if (typeof value !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) throw error(400, 'invalid_diagram', 'The diagram preview must be a PNG image.');
  const bytes = Buffer.from(value.slice(value.indexOf(',') + 1), 'base64');
  if (bytes.length < 33 || bytes.length > 1000000 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(16) < 1 || bytes.readUInt32BE(20) < 1 || bytes.readUInt32BE(16) > 2000 || bytes.readUInt32BE(20) > 2000) throw error(400, 'invalid_diagram', 'The diagram preview is invalid or too large.');
  return value;
}
function tableEvidence(it, answer) {
  if (!object(answer)) throw error(400, 'invalid_answer', 'Send the saved table cells as row,column entries.');
  if (!Array.isArray(it.h) || !it.h.length || !it.h.every(h => typeof h === 'string') || !Array.isArray(it.r) || !it.r.length ||
      !it.r.every(row => Array.isArray(row) && row.length === it.h.length && row.every(cell => cell === null || typeof cell === 'string'))) {
    throw error(503, 'invalid_question', 'The question table needs correction before automatic marking.');
  }
  const editable = [], allowed = new Set();
  it.r.forEach((row, r) => row.forEach((cell, c) => { if (cell === null) { const key = r + ',' + c; editable.push({ key, r, c }); allowed.add(key); } }));
  if (Object.keys(answer).some(key => !allowed.has(key) || typeof answer[key] !== 'string')) {
    throw error(400, 'invalid_answer', 'Only text for editable cells in this question may be submitted.');
  }
  if (Object.values(answer).reduce((size, value) => size + value.length, 0) > 12000) {
    throw error(413, 'input_too_large', 'This table exceeds the automatic marking limit. It has not been truncated or marked.');
  }
  function entry(cell, value) { return 'Cell [' + cell.key + ']:\n' + value; }
  const entered = editable.filter(cell => Object.hasOwn(answer, cell.key) && answer[cell.key].trim());
  // Preserve literal quotes, newlines and markup in student values. JSON-escaping
  // them here would make genuine evidence quotes fail the engine's substring check.
  const response = entered.map(cell => entry(cell, answer[cell.key])).join('\n\n');
  const sample = editable.filter(cell => Array.isArray(it.model[cell.r]) && it.model[cell.r][cell.c] != null)
    .map(cell => entry(cell, String(it.model[cell.r][cell.c]))).join('\n\n');
  const template = { columns: it.h.map(plain), rows: it.r.map(row => row.map(cell => cell === null ? null : plain(cell))) };
  return { answer: response, sample, blank: !entered.length,
    question: '\n\nCANONICAL TABLE: row and column indices start at 0. Null cells are editable. Headers and fixed cells belong to the question, not to the student response.\n' + JSON.stringify(template) };
}
function prepare(body) {
  const p = parseBody(body);
  if (typeof p.bankId !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(p.bankId) || !Number.isInteger(p.questionNumber) || !Number.isInteger(p.partIndex)) throw error(400, 'invalid_question', 'Choose a valid question part.');
  const bank = loadBanks().find(b => b.id === p.bankId), q = bank && bank.qs[p.questionNumber - 1], it = q && q.it[p.partIndex];
  if (!it || !TYPES[it.t]) throw error(400, 'invalid_question', 'This question part does not use AI marking.');
  let answer, diagramScene = null, diagramPng = null, reviewReason = null, table = null;
  if (it.t === 'dr') {
    const evidence = sceneEvidence(p.answer);
    diagramScene = evidence.scene; reviewReason = evidence.reviewReason; answer = JSON.stringify(diagramScene);
    diagramPng = pngEvidence(p.diagramPng);
    if (diagramScene.elements.length && !diagramPng) reviewReason = 'The diagram preview is unavailable. Please review the drawing manually.';
  } else if (it.t === 'ft') {
    if (p.diagramPng != null) throw error(400, 'invalid_answer', 'A table response cannot include a diagram preview.');
    table = tableEvidence(it, p.answer); answer = table.answer;
  } else {
    if (p.diagramPng != null || typeof p.answer !== 'string') throw error(400, 'invalid_answer', 'Send the saved text or code answer.');
    if (p.answer.length > 12000) throw error(413, 'input_too_large', 'This answer exceeds the automatic marking limit. It has not been truncated or marked.');
    answer = p.answer.replace(/\r\n/g, '\n');
  }
  if (!Array.isArray(it.crit) || !it.crit.length || it.crit.some(c => typeof c !== 'string' || !c.trim())) reviewReason = 'The question has incomplete marking criteria and needs review.';
  const db = q.db ? '\n\n' + Object.keys(q.db).map(n => 'Table ' + n + '\n' + q.db[n].c.join(' | ') + '\n' + q.db[n].r.map(r => r.join(' | ')).join('\n')).join('\n\n') : '';
  const input = { bankId: bank.id, questionNumber: p.questionNumber, partIndex: p.partIndex, type: TYPES[it.t], maxMarks: it.m, stimulus: plain(q.st) + db,
    question: (it.lb ? it.lb + ' ' : '') + plain(it.q) + (table ? table.question : ''), criteria: (it.crit || []).map((text, i) => ({ id: 'c' + (i + 1), text })),
    sample: table ? table.sample : it.t === 'tx' ? plain(it.model) : it.model, wordGuide: it.w || null, answer, diagramScene, diagramPng };
  return { input, reviewReason, blank: table ? table.blank : diagramScene ? !diagramScene.elements.length : !answer.trim(), questionVersion: digest(q), rubricVersion: digest(it.crit) };
}
module.exports = { prepare, digest, plain, loadBanks, MAX_BODY_BYTES };
