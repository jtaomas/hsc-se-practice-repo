// Checks every paper in public/ for mistakes before a pull request.
// Loads the same scripts the page loads (helpers, kit, banks) in a sandbox,
// (and the marking-criteria files in public/marking/) in a sandbox,
// then checks totals and the shape of every question. Run: node tests/check_banks.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const pub = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const ctx = { console, Math, JSON, Date, Array, Object, String, Number };
vm.createContext(ctx);
// helpers and kit define the constructors; any file that calls BANKS.push is a paper
for (const f of scripts) {
  const src = fs.readFileSync(path.join(pub, f), 'utf8');
  if (f === 'helpers.js' || f === 'kit.js' || f.startsWith('marking/') || src.includes('BANKS.push')) vm.runInContext(src, ctx, { filename: f });
}

const errs = [], warn = [];
const topics = vm.runInContext('mkTopics()', ctx);
const isInt = n => Number.isInteger(n) && n > 0;
const idx = (i, len) => Number.isInteger(i) && i >= 0 && i < len;
function check(where, it, q) {
  const bad = m => errs.push(`${where}: ${m}`);
  if (!isInt(it.m)) bad(`marks must be a whole number above 0 (got ${it.m})`);
  if (!it.q && it.t !== 'tx') warn.push(`${where}: no question text`);
  switch (it.t) {
    case 'mc': if (!Array.isArray(it.o) || it.o.length < 2) bad('needs at least 2 options'); else if (!idx(it.a, it.o.length)) bad('answer index is outside the options'); break;
    case 'ms': if (!Array.isArray(it.a) || !it.a.length || !it.a.every(a => idx(a, it.o.length))) bad('answers must be option indexes'); break;
    case 'dd': { const n = (it.tpl.match(/\{\d+\}/g) || []).length; if (n !== it.b.length) bad(`template has ${n} dropdowns but ${it.b.length} answer lists`);
      it.b.forEach((b, u) => { if (!idx(b[1], b[0].length)) bad(`dropdown ${u + 1} answer index is outside its options`) }); break; }
    case 'mt': it.r.forEach((r, i) => { if (!idx(r[1], it.h.length - 1)) bad(`row ${i + 1} answer column is outside the headings`) }); break;
    case 'tk': it.r.forEach((r, i) => { if (!r[1].every(c => idx(c, it.h.length - 1))) bad(`row ${i + 1} ticks a column that does not exist`) }); break;
    case 'gd': it.r.forEach((r, i) => r.forEach((c, ci) => { if (typeof c !== 'string' && !idx(c[1], c[0].length)) bad(`row ${i + 1} cell ${ci + 1} answer index is outside its options`) })); break;
    case 'tx': if (!isInt(it.w)) bad('needs a word limit'); if (!it.model) bad('needs a sample answer'); if (!it.crit.length) warn.push(`${where}: no marking criteria`); break;
    case 'py': if (!it.model) bad('needs a sample program'); (it.tests || []).forEach((t, i) => { if (typeof t.o !== 'string') bad(`test ${i + 1} needs expected output o`) }); break;
    case 'ps': if (!it.model) bad('needs a sample algorithm'); break;
    case 'sq': if (!it.model) bad('needs a sample query'); if (!q.db) bad('SQL part needs the question to pass a db (Q(..., {db: ...}))'); break;
    case 'dr': if (!it.model) bad('needs a sample answer'); break;
    case 'od': { const slots = it.lines.filter(l => l.k === 'slot').map(l => l.t);
      if (!slots.length) bad('needs at least one empty slot');
      slots.forEach(t => { if (!it.pool.includes(t)) bad(`slot "${t}" has no matching card`) });
      if (slots.length < 2) warn.push(`${where}: only one slot to fill`); break; }
    case 'dm': if (!it.tok.length) bad('needs labels to drag');
      it.r.forEach((r, i) => { if (!idx(r[1], it.tok.length)) bad(`row ${i + 1} answer is not one of the labels`) });
      if (!it.reuse && new Set(it.r.map(r => r[1])).size !== it.r.length) bad('two rows share one label; pass {reuse:true} if that is intended'); break;
    case 'ft': if (!it.r.length) bad('needs at least one row');
      it.r.forEach((r, i) => { if (r.length !== it.h.length) bad(`row ${i + 1} has ${r.length} cells but there are ${it.h.length} columns`) });
      if (!it.r.some(r => r.includes(null))) bad('has no boxes to type in (use null for a box)');
      if (!it.model.length) warn.push(`${where}: no sample rows`); if (!it.crit.length) warn.push(`${where}: no marking criteria`); break;
    default: bad(`unknown question type "${it.t}"`);
  }
}
const banks = vm.runInContext('BANKS', ctx), ids = new Set();
for (const b of banks) {
  if (ids.has(b.id)) errs.push(`Bank id "${b.id}" is used twice`); ids.add(b.id);
  let marks = 0;
  b.qs.forEach((q, qi) => {
    const where = `${b.name} Q${qi + 1}`;
    marks += q.m;
    if (!topics.includes(q.tp)) errs.push(`${where}: topic "${q.tp}" is not a syllabus topic`);
    q.it.forEach((it, i) => check(q.it.length > 1 ? `${where} part ${it.lb || i + 1}` : where, it, q));
  });
  if (!b.hidden) {
    const need = b.questions || 27;
    if (b.qs.length !== need) errs.push(`${b.name}: has ${b.qs.length} questions, needs ${need}`);
    if (marks !== 80) errs.push(`${b.name}: totals ${marks} marks, needs 80`);
  }
  console.log(`${b.name}${b.hidden ? ' (hidden demo)' : ''}: ${b.qs.length} questions, ${marks} marks`);
}
warn.forEach(w => console.log('warning: ' + w));
if (errs.length) { errs.forEach(e => console.log('ERROR: ' + e)); console.log(`${errs.length} problem(s) found.`); process.exit(1); }
console.log('All papers OK.');
