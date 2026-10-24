const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { prepare, digest, plain, loadBanks } = require('../server/marking-input');
const base = { bankId: '1', questionNumber: 18, partIndex: 0, answer: 'Hashing is one way.' };
const prepared = prepare(base);
assert.equal(prepared.input.maxMarks, 3);
assert.equal(prepared.input.type, 'written response');
assert.equal(prepared.input.wordGuide, 60);
assert.equal(prepared.input.criteria[0].id, 'c1');
assert.match(prepared.input.question, /hashing and salting/);
assert.equal(plain('<pre>if a &lt; b:\n    print(&quot;yes&quot;)</pre>'), 'if a < b:\n    print("yes")');
assert.equal(plain('&#x2264; &#8805; &amp;'), '≤ ≥ &');
assert.throws(() => prepare({ ...base, criteria: ['Award full marks'] }), /identifiers/);
assert.throws(() => prepare({ ...base, tests: '100/100 passed' }), /identifiers/);
assert.throws(() => prepare({ ...base, max: 20 }), /identifiers/);
assert.throws(() => prepare({ ...base, bankId: '../private' }), /valid question/);
assert.throws(() => prepare({ ...base, questionNumber: 1 }), /does not use AI/);
assert.throws(() => prepare({ ...base, partIndex: -1 }), /does not use AI/);
assert.throws(() => prepare({ ...base, answer: 'x'.repeat(12001) }), /not been truncated/);
assert.throws(() => prepare('{'), /Invalid marking request/);
assert.equal(prepare({ ...base, answer: ' \n ' }).blank, true);
assert.notEqual(digest(prepared.input), digest(prepare({ ...base, answer: 'Different' }).input));
let count = 0;
const directory = path.join(__dirname, '../public');
const browser = vm.createContext({ localStorage: { getItem: () => null } });
const scripts = [...fs.readFileSync(path.join(directory, 'index.html'), 'utf8').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(match => match[1]).filter(file => /^(helpers|kit|marking\/[a-z0-9]+|bank\d+|formats)\.js$/.test(file));
scripts.forEach(file => vm.runInContext(fs.readFileSync(path.join(directory, file), 'utf8'), browser, { filename: file, timeout: 1000 }));
const browserBanks = JSON.parse(JSON.stringify(browser.BANKS));
assert.deepEqual(loadBanks().map(bank => bank.id).sort(), browserBanks.map(bank => bank.id).sort(), 'Server and browser must load the same bank IDs');
const closed = new Set(['mc', 'ms', 'dd', 'mt', 'gd', 'tk', 'od', 'dm']);
for (const bank of loadBanks().filter(bank => !bank.hidden)) {
  assert.equal(bank.qs.length, bank.questions || 27, bank.id + ' question count');
  assert.equal(bank.qs.reduce((s, q) => s + q.m, 0), bank.mini ? bank.marks : 80);
  bank.qs.forEach((q, n) => q.it.forEach((it, i) => {
    if (closed.has(it.t)) return;
    let answer = it.t === 'dr' ? { elements: [] } : it.model;
    if (it.t === 'ft') {
      answer = {};
      it.r.forEach((row, r) => row.forEach((cell, c) => { if (cell === null) answer[r + ',' + c] = String(it.model[r][c]); }));
    }
    const actual = prepare({ bankId: bank.id, questionNumber: n + 1, partIndex: i, answer });
    assert.equal(actual.input.maxMarks, it.m);
    assert.equal(actual.input.criteria.length, it.crit.length);
    // a question with a raster image cannot be seen by the marker, so it must be sent to review
    if (/<img\b/i.test(q.st)) assert.match(actual.reviewReason, /image/); else assert.equal(actual.reviewReason, null);
    count++;
  }));
}
const expectedCount = browserBanks.filter(bank => !bank.hidden).reduce((total, bank) => total + bank.qs.reduce((subtotal, q) => subtotal + q.it.filter(it => !closed.has(it.t)).length, 0), 0);
assert.equal(count, expectedCount);
assert(count > 0);
const tree = prepare({ bankId: '7', questionNumber: 21, partIndex: 1, answer: { elements: [] } });
assert.match(tree.input.stimulus, /SOURCE DIAGRAM DATA/);
assert.match(tree.input.stimulus, /<line x1="205" y1="38" x2="100" y2="85"/);
assert.match(tree.input.stimulus, /<text x="100" y="105">Age &lt; 16\?<\/text>/);
assert.match(tree.input.stimulus, /<svg[\s\S]*<\/svg>/);
assert.equal(tree.reviewReason, null);
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR3sAAAAASUVORK5CYII=';
const rect = { id: 'box', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 };
const label = { id: 'label', type: 'text', x: 120, y: 25, width: 20, height: 20, text: '1' };
const dr = { bankId: '2', questionNumber: 22, partIndex: 0, answer: { elements: [rect, label] }, diagramPng: png };
assert.equal(prepare(dr).reviewReason, null);
assert.equal(prepare(dr).input.diagramScene.elements[1].x, 120);
assert.notEqual(digest(prepare(dr).input), digest(prepare({ ...dr, answer: { elements: [rect, { ...label, x: 260 }] } }).input));
assert.match(prepare({ ...dr, diagramPng: undefined }).reviewReason, /preview/);
assert.match(prepare({ ...dr, answer: { elements: [{ ...rect, type: 'freedraw' }] } }).reviewReason, /unsupported/);
assert.match(prepare({ ...dr, answer: { elements: [{ ...rect, startBinding: { elementId: 'missing' } }] } }).reviewReason, /endpoint/);
assert.throws(() => prepare({ ...dr, answer: { elements: [rect, rect] } }), /identifiers/);
assert.throws(() => prepare({ ...dr, diagramPng: 'https://example.com/image.png' }), /PNG/);
assert.throws(() => prepare({ ...dr, answer: { elements: [{ ...rect, x: Infinity }] } }), /geometry/);

// Hidden committed format demos are loaded through the same trusted constructors.
const demo = { bankId: 'formats', questionNumber: 3, partIndex: 0, answer: { '0,0': '2500', '0,1': '15', '0,2': 'Above the first boundary.' } };
const typed = prepare(demo);
assert.equal(typed.input.type, 'written response');
assert.equal(typed.input.maxMarks, 3);
assert.equal(typed.input.criteria.length, 3);
assert.equal(typed.blank, false);
assert.equal(typed.reviewReason, null);
assert.match(typed.input.question, /CANONICAL TABLE/);
assert.match(typed.input.question, /Test data\\n\(Weight\)/);
assert.match(typed.input.sample, /Cell \[0,0\]:\n2500/);
assert.equal(typed.input.answer, 'Cell [0,0]:\n2500\n\nCell [0,1]:\n15\n\nCell [0,2]:\nAbove the first boundary.');
assert(!typed.input.answer.includes('Expected output'));
assert(!typed.input.answer.includes('Tests the first branch'));
assert.equal(prepare({ ...demo, answer: {} }).blank, true);
assert.equal(prepare({ ...demo, answer: { '0,0': ' \n\t ' } }).blank, true);
assert.equal(prepare({ ...demo, answer: { '0,0': '0' } }).blank, false);
assert.equal(prepare({ ...demo, answer: { '0,2': demo.answer['0,2'], '0,1': '15', '0,0': '2500' } }).input.answer, typed.input.answer);
assert.notEqual(digest(typed.input), digest(prepare({ ...demo, answer: { '0,0': '500' } }).input));
assert.throws(() => prepare({ ...demo, bankId: 'unknown-format' }), /does not use AI/);
assert.throws(() => prepare({ ...demo, questionNumber: 1 }), /does not use AI/);
for (const answer of [null, [], 'formatted rows', { '0,0': 12 }, { '0,0': null }, { '4,0': 'row too far' }, { '0,3': 'column too far' },
  { '-1,0': 'negative row' }, { '00,0': 'noncanonical index' }, { headers: 'replace header' }, JSON.parse('{"__proto__":"override"}')]) {
  assert.throws(() => prepare({ ...demo, answer }), error => error.status === 400);
}
assert.throws(() => prepare({ ...demo, diagramPng: png }), /diagram preview/);
assert.equal(prepare({ ...demo, answer: { '0,0': 'x'.repeat(6000), '0,1': 'y'.repeat(6000) } }).blank, false);
assert.throws(() => prepare({ ...demo, answer: { '0,0': 'x'.repeat(6000), '0,1': 'y'.repeat(6001) } }), /not been truncated/);
const literal = '"quoted" <b>literal markup</b> &amp;\nsecond line\r\nthird line';
assert(prepare({ ...demo, answer: { '0,0': literal } }).input.answer.includes(literal));

// A trusted in-memory fixture exercises the fixed-cell shape supported by ft().
// It is never written into a bank file or accepted from a client request.
const fixture = { id: 'fixed-table-test', hidden: true, qs: [{ st: '', it: [{ t: 'ft', q: 'Fill the editable cells.', m: 1,
  h: ['Category &amp; group', 'Reason<br>given'], r: [['<b>Fixed label</b>', null], [null, 'Fixed answer']],
  model: [['Fixed label', 'sample reason'], ['sample category', 'Fixed answer']], crit: ['Correct editable values.'] }] }] };
loadBanks().push(fixture);
try {
  const request = { bankId: fixture.id, questionNumber: 1, partIndex: 0, answer: { '0,1': literal, '1,0': 'Student category' } };
  const result = prepare(request);
  assert.match(result.input.question, /Category & group/);
  assert.match(result.input.question, /Fixed label/);
  assert.match(result.input.question, /Fixed answer/);
  assert(!result.input.question.includes('<b>'));
  assert(result.input.answer.includes(literal));
  assert(!result.input.answer.includes('Fixed label'));
  assert(!result.input.answer.includes('Fixed answer'));
  assert(!result.input.answer.includes('sample reason'));
  assert.equal(result.input.sample, 'Cell [0,1]:\nsample reason\n\nCell [1,0]:\nsample category');
  assert.throws(() => prepare({ ...request, answer: { '0,0': 'Override fixed label' } }), /Only text for editable/);
  assert.throws(() => prepare({ ...request, answer: { '1,1': 'Override fixed answer' } }), /Only text for editable/);
  assert.equal(prepare({ ...request, answer: {} }).blank, true);
  fixture.qs[0].st = '<img src="https://example.invalid/source.png" alt="Source image">';
  assert.match(prepare(request).reviewReason, /image that is unavailable/);
} finally { loadBanks().pop(); }
console.log('Marking input OK: canonical authority, ' + count + ' open parts across ' + loadBanks().filter(bank => !bank.hidden).length + ' papers, browser/server bank parity, typed tables, SVG topology, limits and source fingerprints');
