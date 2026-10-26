// Admin remark in the class progress report (public/classview.js): the admin's browser marks a student's saved answers
// and sends the results to the server. All network calls are mocked, no browser needed.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const clone = x => JSON.parse(JSON.stringify(x));
const reply = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => clone(body) });
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(check, what) { for (let i = 0; i < 500 && !check(); i++) await tick(); assert(check(), what || 'asynchronous operation did not finish'); }

function client() {
  const storage = new Map(), timers = [];
  const c = { console, AbortController, window: { addEventListener() {} }, location: { hash: '#/class' },
    document: { addEventListener() {}, querySelector() { return null }, querySelectorAll() { return [] }, getElementById() { return null },
      createElement() { return { innerHTML: '', get textContent() { return this.innerHTML.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') } } } },
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length }, clearTimeout() {}, setInterval() {},
    fetch() { throw new Error('Unexpected network request') }, confirm: () => true, acctText() { return 'Account' }, SYNC: { epoch: 0 }, AIMARKING_VERSION: 'test-v2' };
  vm.createContext(c);
  for (const file of ['helpers.js', 'kit.js', 'widgets.js', 'qtypes.js', 'xd.js', 'ai.js', 'pages.js', 'pages2.js', 'classview.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), c, { filename: file });
  c.S.tok = 'admin-session'; c.S.owner = 'admin@example.test';
  return c;
}
const written = () => ({ t: 'tx', q: 'Explain one thing.', m: 3, w: 50, model: 'Sample answer', crit: ['3 marks for explanation.'] });
const closed = () => ({ t: 'mc', q: 'Pick one.', m: 1, o: ['A', 'B'], a: 0 });
const markResult = (mark = 2) => ({ status: 'marked', mark, summary: 'Evidence supported this mark.', strengths: ['One point explained.'], improve: ['Explain the second point.'], advice: [], criteria: [{ id: 'C1', assessment: 'partial', evidence: ['A point'], basis: 'Partly met.' }], losses: null, quality: [], audit: { requestedModel: 'm', returnedModels: ['m'] } });
// The server's answer when the student's paper is saved. Records what was sent.
function setup(options = {}) {
  const c = client(), sent = { mark: [], class: [] };
  const b = { id: '1', name: 'Test paper', qs: [{ tp: 'Project', st: '<p>Stimulus</p>', db: null, it: [written(), written(), closed()] }] };
  c.BANKS.push(b);
  const paper = Object.assign({ start: 10, done: true, doneAt: 20, mode: 'exam', ans: { '1.0': '<p>First answer.</p>', '1.1': '<p>Second answer.</p>', '1.2': 0 }, self: {}, ai: {}, aiErr: {} }, options.paper);
  c.CV.prog.m1 = { id: 'm1', name: 'Priya', email: 'p@example.test', ts: 1, u: { 1: paper }, hist: [] };
  c.fetch = async (url, request) => {
    const body = JSON.parse(request.body);
    assert.equal(request.headers.authorization, 'Bearer admin-session', 'the admin\'s own sign-in is used');
    if (url === '/api/mark') { sent.mark.push(body); return options.mark ? options.mark(body, sent.mark.length) : reply(markResult(2)); }
    if (url === '/api/class') { sent.class.push(body); return options.save ? options.save(body, sent.class.length) : reply({ ok: true, saved: Object.keys(body.marks) }); }
    throw new Error('Unexpected request to ' + url);
  };
  return { c, b, sent, paper };
}
const finished = (c, key = 'm1|1') => until(() => c.CV.rm[key] && !c.CV.rm[key].running, 'the remark run did not finish');
const html = c => c.cvWithU(c.CV.prog.m1.u, () => c.cvProgHTML('m1', false));

(async () => {
  // Unmarked answers are listed and offered for marking. Closed questions never are.
  {
    const { c, b } = setup();
    const page = html(c);
    assert(page.includes('2 unmarked answers'), 'the summary counts unmarked answers');
    assert(!page.includes('data-cv="remark"'));
    assert(!page.includes('Mark 2 unmarked'));
    assert(!page.includes('Re-mark paper'));
    assert.equal((page.match(/data-mode="one"/g) || []).length, 0);
    assert(c.cvProgHTML.length === 2);
    c.cvWithU(c.CV.prog.m1.u, () => {
      assert.deepEqual(clone(c.cvRmList(b, 'missing').map(t => t.k)), ['1.0', '1.1']);
      assert.deepEqual(clone(c.cvRmList(b, 'one', '1.1').map(t => t.k)), ['1.1']);
      assert.deepEqual(clone(c.cvRmList(b, 'all').map(t => t.k)), ['1.0', '1.1']);
    });
  }
  // The system-admin list uses the admin action.
  {
    const { c } = setup();
    c.CV.prog.m1.isSys = true;
    const page = c.cvWithU(c.CV.prog.m1.u, () => c.cvProgHTML('m1', true));
    assert(page.includes('data-sys="1"') && !page.includes('data-sys="0"'));
  }
  // Marking the unmarked answers: one request per answer, identical to what the student's own browser sends, then one save.
  {
    const { c, b, sent } = setup();
    c.cvRemark('m1', false, '1', 'missing', '');
    assert(c.CV.rm['m1|1'].running);
    assert(c.cvWithU(c.CV.prog.m1.u, () => c.cvProgHTML('m1', false)).includes('Marking 0 of 2...'));
    await finished(c);
    assert.deepEqual(sent.mark.map(x => x.answer).sort(), ['First answer.', 'Second answer.']);
    sent.mark.forEach(x => assert.deepEqual(Object.keys(x).sort(), ['answer', 'bankId', 'partIndex', 'questionNumber']));
    assert.equal(sent.class.length, 1, 'results are saved together');
    const save = sent.class[0];
    assert.equal(save.action, 'remark_save'); assert.equal(save.memberId, 'm1'); assert.equal(save.bankId, '1'); assert.equal(save.doneAt, 20);
    assert.deepEqual(Object.keys(save.marks).sort(), ['1.0', '1.1']);
    assert.equal(save.marks['1.0'].status, 'marked'); assert.equal(save.marks['1.0'].g, 2);
    assert.equal(save.marks['1.0'].fb.summary, 'Evidence supported this mark.');
    // The record is what the student's browser needs: its own check accepts it and scores from it.
    assert.equal(save.marks['1.0'].stamp, c.aiStamp(b, 1, 0, '<p>First answer.</p>'));
    assert.equal(save.marks['1.1'].stamp, c.aiStamp(b, 1, 1, '<p>Second answer.</p>'));
    const student = clone(c.CV.prog.m1.u['1']); student.ai = save.marks; student.aiErr = {};
    c.S.u = { 1: student };
    assert(c.aiRecord(b, 1, 0) && c.aiRecord(b, 1, 1), 'the student\'s browser accepts the saved marks');
    assert.equal(c.score(b, 1, 0).g, 2); assert.equal(c.score(b, 1, 0).src, 'ai');
    assert.equal(c.aiTodo(b).length, 0, 'nothing is left for the student\'s browser to mark');
    // The report now shows the marks and no unmarked answers, and says what happened.
    const after = html(c);
    assert(!after.includes('unmarked answer') && !after.includes('Mark 2 unmarked'));
    assert(after.includes('2 answers marked and saved to Priya’s paper.'));
    assert(after.includes('2 / 3'));
    assert(!after.includes('Re-mark paper'));
    assert.equal(c.CV.rm['m1|1'].ok, true);
  }
  // One part only.
  {
    const { c, sent } = setup();
    c.cvRemark('m1', false, '1', 'one', '1.1');
    await finished(c);
    assert.equal(sent.mark.length, 1); assert.equal(sent.mark[0].partIndex, 1);
    assert.deepEqual(Object.keys(sent.class[0].marks), ['1.1']);
    assert(html(c).includes('1 answer marked and saved to Priya’s paper.'));
  }
  // System admins save through the admin action, which works for accounts outside the class.
  {
    const { c, sent } = setup();
    c.cvRemark('m1', true, '1', 'one', '1.0');
    await finished(c);
    assert.equal(sent.class[0].action, 'admin_remark_save');
  }
  // What counts as unmarked: no mark, a stale mark, provisional and needs-review results. Confirmed marks and the student's own marks do not.
  {
    const { c, b } = setup();
    const stamp = k => c.cvWithU(c.CV.prog.m1.u, () => c.aiStamp(b, 1, +k.split('.')[1]));
    const p = c.CV.prog.m1.u['1'];
    p.ai['1.0'] = { status: 'marked', g: 2, stamp: stamp('1.0'), fb: {}, audit: {} };
    p.ai['1.1'] = { status: 'needs_review', g: null, stamp: stamp('1.1'), fb: {}, audit: {} };
    const list = mode => c.cvWithU(c.CV.prog.m1.u, () => clone(c.cvRmList(b, mode).map(t => t.k)));
    assert.deepEqual(list('missing'), ['1.1'], 'a confirmed mark is left alone; needs review is offered');
    p.ai['1.1'].status = 'provisional'; p.ai['1.1'].g = 1; assert.deepEqual(list('missing'), ['1.1']);
    p.ai['1.1'].status = 'marked'; assert.deepEqual(list('missing'), []);
    assert.deepEqual(list('all'), ['1.0', '1.1'], 'a whole-paper re-mark includes everything');
    p.ai['1.0'].stamp = 'from an older marking process'; assert.deepEqual(list('missing'), ['1.0'], 'a mark from an older marking process counts as unmarked');
    p.ai['1.0'].stamp = stamp('1.0'); p.ai['1.1'].status = 'needs_review'; p.ai['1.1'].g = null; p.self['1.1'] = 1;
    assert.deepEqual(list('missing'), [], 'a mark the student set themselves is left alone');
    assert(!html(c).includes('Mark 1 unmarked'));
    assert.deepEqual(list('all'), ['1.0', '1.1']);
  }
  // Nothing to do: no requests, a plain message.
  {
    const { c, b, sent } = setup();
    const p = c.CV.prog.m1.u['1'];
    [0, 1].forEach(i => { p.ai['1.' + i] = { status: 'marked', g: 1, stamp: c.cvWithU(c.CV.prog.m1.u, () => c.aiStamp(b, 1, i)), fb: {}, audit: {} }; });
    c.cvRemark('m1', false, '1', 'missing', '');
    assert.equal(c.CV.rm['m1|1'].running, false); assert.equal(c.CV.rm['m1|1'].msg, 'Nothing needed marking.');
    assert.equal(sent.mark.length + sent.class.length, 0);
  }
  // Only submitted papers, only when signed in, and not twice at once.
  {
    const { c, sent } = setup({ paper: { done: false } });
    const page = html(c);
    assert(!page.includes('data-cv="remark"') && !page.includes('unmarked answer'));
    c.cvRemark('m1', false, '1', 'missing', ''); assert.equal(c.CV.rm['m1|1'], undefined); assert.equal(sent.mark.length, 0);
  }
  {
    const { c, sent } = setup(); c.S.tok = '';
    assert(!html(c).includes('data-cv="remark"'));
    c.cvRemark('m1', false, '1', 'missing', ''); assert.equal(sent.mark.length, 0);
  }
  {
    const { c, sent } = setup();
    c.cvRemark('m1', false, '1', 'missing', ''); c.cvRemark('m1', false, '1', 'missing', ''); c.cvRemark('m1', false, '1', 'one', '1.0');
    assert(html(c).includes('Marking 0 of 2...'));
    await finished(c);
    assert.equal(sent.mark.length, 2, 'a second click while marking changes nothing');
  }
  // A whole-paper re-mark asks first and does nothing when the admin says no.
  {
    const { c, sent } = setup(); c.confirm = () => false;
    c.cvRemark('m1', false, '1', 'all', ''); assert.equal(c.CV.rm['m1|1'], undefined); assert.equal(sent.mark.length, 0);
    c.confirm = () => true; c.cvRemark('m1', false, '1', 'all', ''); await finished(c); assert.equal(sent.mark.length, 2);
  }
  // The daily marking allowance runs out part-way: finished answers are saved, the rest are reported, and the reason is shown.
  {
    const { c, sent } = setup({ paper: { ans: { '1.0': '<p>One.</p>', '1.1': '<p>Two.</p>', '1.2': 0 } },
      mark: (body, n) => n === 1 ? reply(markResult(1)) : reply({ code: 'quota_exceeded', error: 'Your daily AI marking allowance has been reached.' }, 429) });
    c.cvRemark('m1', false, '1', 'missing', '');
    await finished(c);
    const run = c.CV.rm['m1|1'];
    assert.equal(run.saved, 1); assert.equal(run.failed, 1); assert.equal(run.ok, false);
    assert.deepEqual(Object.keys(sent.class[0].marks), ['1.0']);
    assert(run.msg.includes('1 answer marked and saved') && run.msg.includes('1 did not finish') && run.msg.includes('daily AI marking allowance'));
    assert(!html(c).includes('Mark 1 unmarked'));
  }
  // The server refuses the save (the paper changed): nothing is shown as marked.
  {
    const { c } = setup({ save: () => reply({ code: 'paper_changed', error: 'This paper changed since you opened it. Press Refresh and try again.' }, 409) });
    c.cvRemark('m1', false, '1', 'missing', '');
    await finished(c);
    const run = c.CV.rm['m1|1'];
    assert.equal(run.saved, 0); assert.equal(run.failed, 2); assert(run.msg.includes('Press Refresh'));
    assert.deepEqual(clone(c.CV.prog.m1.u['1'].ai), {}, 'marks the server did not accept are not shown');
    assert(!html(c).includes('Mark 2 unmarked'));
  }
  // A marking result outside the available marks is refused before it is saved.
  {
    const { c, sent } = setup({ mark: () => reply(markResult(9)) });
    c.cvRemark('m1', false, '1', 'one', '1.0');
    await finished(c);
    assert.equal(sent.class.length, 0); assert.equal(c.CV.rm['m1|1'].failed, 1);
  }
  // Open sections stay open while the report redraws as marks arrive.
  {
    const { c } = setup();
    assert(!html(c).includes('<details class="xdd" data-cvd="m1|1" open>'));
    c.CV.dopen['m1|1'] = true;
    assert(html(c).includes('<details class="xdd" data-cvd="m1|1" open>'));
  }
  console.log('Class remark client tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
