// Class feature: class code, sharing, quotas, validation of the AI analysis, and the API. In-memory storage only.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClassStore, cleanName } = require('../server/class-store');
const synth = require('../server/class-synthesis');
const { createHandler } = require('../api/class');
const { keywordFor } = require('../server/syllabus-context');

function memory() {
  const map = new Map(); let v = 0;
  class Pre extends Error { constructor() { super('Precondition failed'); this.name = 'BlobPreconditionFailedError'; } }
  const store = {
    async get(path) { const d = map.get(path); return d ? { statusCode: 200, stream: (async function* () { yield Buffer.from(d.body); })(), blob: { etag: d.etag } } : null; },
    async getMany(paths) {
      const out = new Map();
      for (const p of [].concat(paths || [])) {
        const d = map.get(p);
        if (d) out.set(p, { statusCode: 200, body: Buffer.from(d.body), blob: { etag: d.etag, pathname: p } });
      }
      return out;
    },
    async put(path, body, o) {
      const cur = map.get(path);
      if (o.ifMatch && (!cur || cur.etag !== o.ifMatch)) throw new Pre();
      if (cur && !o.allowOverwrite && !o.ifMatch) throw new Error('already exists');
      map.set(path, { body: String(body), etag: 'e' + (++v) }); return { etag: 'e' + v };
    },
    async list(o) { return { blobs: [...map.keys()].filter(k => k.startsWith((o && o.prefix) || '')).map(pathname => ({ pathname })) }; },
    async del(paths) { [].concat(paths).forEach(p => map.delete(p)); }
  };
  return { store, map, put: (p, d) => store.put(p, JSON.stringify(d), { allowOverwrite: true }) };
}
const id = n => crypto.createHash('sha256').update('user' + n).digest('hex');
const rest = async (h, body, token = 'ok') => {
  let out; await h({ method: 'POST', body, headers: { authorization: 'Bearer ' + token } }, { setHeader() {}, status(c) { return { json(j) { out = { status: c, body: j }; } }; } }); return out;
};
const paper = text => ({ done: true, ans: { '17.0': text } });

(async () => {
  assert.equal(cleanName('  Sam   Lee '), 'Sam Lee');
  assert.throws(() => cleanName('x'), /name/i);
  assert.throws(() => cleanName('a'.repeat(41)), /name/i);
  assert.equal(cleanName('<b>Al</b>'), 'b Al /b');

  // Class code: right and wrong, normalised, locked after too many wrong attempts, never joins on a bad code.
  const m = memory();
  let clock = Date.parse('2026-10-25T10:00:00Z');
  const store = createClassStore({ blob: () => m.store, now: () => clock, classCode: () => 'Blue-River-2026' });
  assert.equal(store.configured(), true);
  assert.equal(createClassStore({ blob: () => m.store, classCode: () => '' }).configured(), false);
  await assert.rejects(store.join(id(1), 'Sam', 'wrong'), e => e.code === 'bad_code');
  assert.equal(await store.getMember(id(1)), null);
  await store.join(id(1), 'Sam', ' blue-river-2026 ');
  assert.equal((await store.getMember(id(1))).name, 'Sam');
  await store.rename(id(1), 'Samuel');
  assert.equal((await store.getMember(id(1))).name, 'Samuel');
  await store.join(id(2), 'Priya', 'Blue-River-2026');
  assert.equal((await store.members()).length, 2);
  await m.put('profiles/' + id(2) + '.json', { photo: 'data:image/jpeg;base64,/9j/2Q==' });
  for (let i = 0; i < 60; i++) await store.checkCode('nope').catch(() => {});
  await assert.rejects(store.checkCode('Blue-River-2026'), e => e.code === 'class_locked');
  clock += 3600e3;
  assert.equal(await store.checkCode('Blue-River-2026'), true);
  await assert.rejects(createClassStore({ blob: () => m.store, classCode: () => '' }).checkCode(''), e => e.code === 'class_not_configured');

  // Daily AI budget per student and for the site.
  for (let i = 0; i < 30; i++) await store.spend(id(4));
  await assert.rejects(store.spend(id(4)), e => e.code === 'class_quota_user');
  await store.spend(id(2));

  // Synthesis helpers.
  assert.equal(keywordFor('Evaluate the use of Agile.').word, 'evaluate');
  assert.equal(keywordFor('Critically analyse the impact').word, 'critically analyse');
  assert.equal(keywordFor('The reexplained thing'), null);
  assert.equal(synth.targetWords(1), 45); assert.equal(synth.targetWords(4), 180); assert.equal(synth.targetWords(30), 340);
  assert(!synth.answerText({ t: 'tx' }, '<p>too short</p>'));
  assert(!synth.answerText({ t: 'mc' }, 'A'));
  const smashed = 'The social and ethical implications of this proposal include the deprivation of data privacy, where the ]=-[POOL9K';
  const repaired = synth.answerText({ t: 'tx' }, smashed);
  assert.ok(!repaired.includes(']=-[POOL9K'));
  assert.ok(repaired.includes('deprivation of data privacy, where the collection of travel and route data'));
  const letters = synth.label([{ id: 'a', name: 'A', text: 'x' }, { id: 'b', name: 'B', text: 'y' }, { id: 'c', name: 'C', text: 'z' }], 'salt');
  assert.deepEqual(letters.map(x => x.letter).sort(), ['A', 'B', 'C']);
  assert.deepEqual(synth.label([{ id: 'a' }, { id: 'b' }], 's').map(x => x.id), synth.label([{ id: 'b' }, { id: 'a' }], 's').map(x => x.id));
  const lab = [{ letter: 'A', text: 'Agile lets teams respond to changing requirements quickly.' }, { letter: 'B', text: 'Waterfall suits fixed requirements.' }];
  const ctx = { marks: 4 };
  const good = {
    directive: 'Evaluate means judge value using criteria.',
    mainPoints: [
      { point: 'Agile responds to change', syllabus: 'Agile approach', answersQuestion: 'yes', why: 'Directly addresses the question.', madeBy: ['A'], quotes: [{ who: 'A', text: 'respond to changing requirements' }, { who: 'A', text: 'invented words not in the answer' }] },
      { point: 'Waterfall fits fixed scope', syllabus: '', answersQuestion: 'partly', why: 'Contrast only.', madeBy: ['B'], quotes: [] }],
    missed: [], combined: Array(170).fill('word').join(' ')
  };
  assert.equal(synth.validate(good, lab, ctx), null);
  assert.equal(synth.validate(Object.assign({}, good, { combined: 'too short for four marks of work in a real answer' }), lab, ctx), 'combined_length');
  assert.equal(synth.validate(Object.assign({}, good, { extra: 1 }), lab, ctx), 'invalid_shape');
  assert.equal(synth.validate(Object.assign({}, good, { mainPoints: [Object.assign({}, good.mainPoints[0], { madeBy: ['Z'] }), good.mainPoints[1]] }), lab, ctx), 'invalid_madeBy');
  const checked = synth.checkedResult(good, lab);
  assert.equal(checked.mainPoints[0].quotes.length, 1, 'only quotes that appear in the answer survive');

  // API.
  const bank = require('../server/marking-input').loadBanks().find(b => b.id === '8');
  assert(bank && bank.qs[16].it[0].t === 'tx');
  const text1 = 'Agile lets the team deliver working software in short sprints and respond to feedback from the client quickly.';
  const text2 = 'Waterfall is a linear approach where each stage is finished before the next begins, which suits fixed requirements.';
  await m.put('progress/' + id(1) + '.json', { u: { 8: paper('<p>' + text1 + '</p>') } });
  await m.put('progress/' + id(2) + '.json', { u: { 8: paper('<p>' + text2 + '</p>') } });
  let calls = 0;
  const fake = Object.assign({}, synth, { analyse: async (c, l) => { calls++; return synth.checkedResult(Object.assign({}, good, { mainPoints: [{ point: 'Agile responds to change', syllabus: '', answersQuestion: 'yes', why: 'Answers it.', madeBy: [l[0].letter], quotes: [] }, { point: 'Waterfall is linear', syllabus: '', answersQuestion: 'partly', why: 'Contrast only.', madeBy: [l[1].letter], quotes: [] }] }), l); } });
  const verify = async t => t === 'admin' ? { id: id(2), email: 'Thomas.Luu@education.nsw.gov.au' } : t === 'ok' ? { id: id(1), email: 'a@student.det.nsw.edu.au' } : t === 'other' ? { id: id(3) } : null;
  const h = createHandler({ store, verify, synthesis: fake, env: { DEEPSEEK_API_KEY: 'k' } });
  assert.equal((await rest(h, { action: 'status' }, 'bad')).status, 401);
  assert.deepEqual((await rest(h, { action: 'status' })).body, { configured: true, member: true, name: 'Samuel', count: 2, admin: false });
  assert.equal((await rest(h, { action: 'answers', bankId: '8' }, 'other')).body.code, 'not_member');
  assert.equal((await rest(h, { action: 'join', name: 'Joe', code: 'x' }, 'other')).body.code, 'bad_code');
  assert.deepEqual((await rest(h, { action: 'overview' })).body.counts, { 8: 2 });
  assert.deepEqual((await rest(h, { action: 'overview' })).body.papers['8'].map(x => [x.name, x.mine]).sort(), [['Priya', false], ['Samuel', true]]);
  assert.equal((await rest(h, { action: 'answers', bankId: '1' })).body.code, 'invalid_bank', 'archived papers are not shared');
  const ans = (await rest(h, { action: 'answers', bankId: '8' })).body;
  assert.equal(ans.parts['17.0'].length, 2);
  assert.equal(ans.parts['17.0'].find(x => x.name === 'Priya').photo, 'data:image/jpeg;base64,/9j/2Q==');
  assert.equal((await rest(h, { action: 'overview' })).body.papers['8'].find(x => x.name === 'Priya').photo, 'data:image/jpeg;base64,/9j/2Q==');
  assert.deepEqual(ans.parts['17.0'].map(x => [x.name, x.mine]).sort(), [['Priya', false], ['Samuel', true]]);
  assert(!ans.parts['17.0'].some(x => 'email' in x));
  // Single choice parts share which option each classmate picked: option numbers only, and anything out of range is ignored.
  assert.equal(bank.qs[0].it[0].t, 'mc');
  const withPick = (html, pick) => { const x = paper('<p>' + html + '</p>'); x.ans['1.0'] = pick; return x; };
  await m.put('progress/' + id(1) + '.json', { u: { 8: withPick(text1, 2) } });
  await m.put('progress/' + id(2) + '.json', { u: { 8: withPick(text2, 99) } });
  const picks = (await rest(h, { action: 'answers', bankId: '8' })).body.parts['1.0'];
  assert.deepEqual(picks.map(x => [x.name, x.mine, x.choice]), [['Samuel', true, [2]]], 'only valid picks are shared');
  assert(!picks.some(x => 'email' in x || 'text' in x));
  await m.put('progress/' + id(1) + '.json', { u: { 8: paper('<p>' + text1 + '</p>') } });
  await m.put('progress/' + id(2) + '.json', { u: { 8: paper('<p>' + text2 + '</p>') } });
  // Every answer carries its author's mark for the part: their own mark first, else a confirmed AI mark. Provisional, needs-review and out-of-range marks are not shown.
  const priya = async () => (await rest(h, { action: 'answers', bankId: '8' })).body.parts['17.0'].find(x => x.name === 'Priya');
  const putPriya = extra => m.put('progress/' + id(2) + '.json', { u: { 8: Object.assign(paper('<p>' + text2 + '</p>'), extra) } });
  assert.equal((await priya()).mark, null, 'an unmarked answer has no mark');
  assert.equal((await priya()).max, bank.qs[16].it[0].m);
  await putPriya({ self: { '17.0': 2 }, ai: { '17.0': { status: 'marked', g: 1 } } }); assert.equal((await priya()).mark, 2, 'their own mark wins');
  await putPriya({ ai: { '17.0': { status: 'marked', g: 1 } } }); assert.equal((await priya()).mark, 1, 'a confirmed AI mark is used');
  await putPriya({ ai: { '17.0': { status: 'provisional', g: 1 } } }); assert.equal((await priya()).mark, null);
  await putPriya({ ai: { '17.0': { status: 'needs_review', g: null } } }); assert.equal((await priya()).mark, null);
  await putPriya({ ai: { '17.0': { status: 'marked', g: 99 } }, self: { '17.0': -1 } }); assert.equal((await priya()).mark, null, 'out-of-range marks are ignored');
  await m.put('progress/' + id(2) + '.json', { u: { 8: paper('<p>' + text2 + '</p>') } });
  assert.equal((await rest(h, { action: 'analyse', bankId: '8', questionNumber: 1, partIndex: 0 })).body.code, 'invalid_part', 'multiple choice is not analysed');
  assert.equal((await rest(h, { action: 'analyse', bankId: '11', questionNumber: 1, partIndex: 0 })).body.code, 'invalid_part', 'SQL parts use direct model query instead of class prose synthesis');
  const r1 = (await rest(h, { action: 'analyse', bankId: '8', questionNumber: 17, partIndex: 0 })).body;
  assert.equal(r1.status, 'ready'); assert.equal(r1.count, 2); assert(Object.values(r1.names).includes('You')); assert(Object.values(r1.names).includes('Priya'));
  await rest(h, { action: 'analyse', bankId: '8', questionNumber: 17, partIndex: 0 });
  assert.equal(calls, 1, 'second request is served from the class cache');
  // One answer is not enough.
  await m.put('progress/' + id(2) + '.json', { u: { 8: { done: false, ans: { '17.0': text2 } } } });
  assert.equal((await rest(h, { action: 'analyse', bankId: '8', questionNumber: 17, partIndex: 0 })).body.code, 'too_few');
  // Unsubmitted work never leaves its owner.
  assert.equal((await rest(h, { action: 'answers', bankId: '8' })).body.parts['17.0'].length, 1);
  // Practice answers are shared as saved; an exam still being sat is private.
  await m.put('progress/' + id(2) + '.json', { u: { 8: { done: false, mode: 'practice', ans: { '17.0': text2 } } } });
  assert.equal((await rest(h, { action: 'answers', bankId: '8' })).body.parts['17.0'].length, 2);
  await m.put('progress/' + id(2) + '.json', { u: { 8: { done: false, mode: 'exam', start: Date.now(), ans: { '17.0': text2 } } } });
  assert.equal((await rest(h, { action: 'answers', bankId: '8' })).body.parts['17.0'].length, 1);
  // Someone sitting an exam cannot read the class; an abandoned exam (over three hours) no longer locks them.
  await m.put('progress/' + id(1) + '.json', { u: { 8: Object.assign(paper('<p>' + text1 + '</p>'), {}), 9: { done: false, mode: 'exam', start: Date.now() - 600e3, ans: {} } } });
  assert.equal((await rest(h, { action: 'answers', bankId: '8' })).status, 200);
  assert.equal((await rest(h, { action: 'analyse', bankId: '8', questionNumber: 17, partIndex: 0 })).body.code, 'too_few');
  await m.put('progress/' + id(1) + '.json', { u: { 8: paper('<p>' + text1 + '</p>'), 9: { done: false, mode: 'exam', start: Date.now() - 4 * 3600e3, ans: {} } } });
  assert.equal((await rest(h, { action: 'answers', bankId: '8' })).status, 200);
  // Roster lists everyone; only an admin email can change another member's photo.
  const asTok = (tok, body) => new Promise(resolve => { const res = { headers: {}, setHeader() {}, status(c) { this.code = c; return this; }, json(b) { resolve({ status: this.code, body: b }); } }; h({ method: 'POST', headers: { authorization: 'Bearer ' + tok }, body }, res); });
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([255, 216, 1, 2, 3, 255, 217]).toString('base64');
  const roster = await asTok('ok', { action: 'roster' });
  assert.equal(roster.body.admin, false);
  assert.ok(roster.body.members.length >= 2);
  assert.equal((await asTok('ok', { action: 'setphoto', memberId: id(2), photo: jpeg })).body.code, 'not_admin');
  assert.equal((await asTok('admin', { action: 'setphoto', memberId: id(1), photo: 'data:text/html;base64,AAAA' })).body.code, 'bad_photo');
  assert.equal((await asTok('admin', { action: 'setphoto', memberId: id(1), photo: jpeg })).status, 200);
  assert.equal((await asTok('admin', { action: 'roster' })).body.members.filter(x => x.id === id(1))[0].photo, jpeg);
  assert.equal((await asTok('admin', { action: 'setphoto', memberId: id(1), photo: '' })).status, 200);
  assert.equal((await asTok('ok', { action: 'setname', memberId: id(2), name: 'Zed' })).body.code, 'not_admin');
  assert.equal((await asTok('admin', { action: 'setname', memberId: id(1), name: 'Sam Renamed' })).body.name, 'Sam Renamed');
  assert.equal((await asTok('admin', { action: 'setname', memberId: id(1), name: 'x' })).body.code, 'bad_name');
  // Platform admin & class admin progress reports: class admins see class members, system admins see anyone everywhere.
  await m.put('users/' + id(7) + '.json', { email: 'kid@student.det.nsw.edu.au', created: 1 });
  await m.put('progress/' + id(7) + '.json', { ts: 500, u: { 8: { start: 100, done: false, mode: 'practice', ans: { '1.0': 1 } } }, hist: [{ id: '8', name: 'PEM 2026 Trial', at: 400, T: 65, M: 80 }] });
  await m.put('backup/' + id(7) + '/a.json', { u: {} });
  assert.equal((await asTok('ok', { action: 'progress', memberId: id(1) })).body.code, 'not_admin');
  assert.equal((await asTok('ok', { action: 'admin_progress', memberId: id(7) })).body.code, 'not_admin');
  const mp = (await asTok('admin', { action: 'progress', memberId: id(1) })).body;
  assert.equal(mp.name, 'Sam Renamed');
  assert.ok(mp.u && mp.u['8']);
  assert.equal((await asTok('admin', { action: 'progress', memberId: id(7) })).body.code, 'no_member');
  const ap = (await asTok('admin', { action: 'admin_progress', memberId: id(7) })).body;
  assert.equal(ap.email, 'kid@student.det.nsw.edu.au');
  assert.equal(ap.inClass, false);
  assert.equal(ap.hist.length, 1);
  assert.equal(ap.u['8'].ans['1.0'], 1);
  // Separate CLASS_ADMINS vs SYSTEM_ADMINS: class admin can inspect class members only, not arbitrary non-class accounts.
  const hSplit = createHandler({ store, verify: async t => t === 'cadmin' ? { id: id(1), email: 'teacher@education.nsw.gov.au' } : verify(t), synthesis: fake, env: { SYSTEM_ADMINS: 'thomas.luu@education.nsw.gov.au', CLASS_ADMINS: 'teacher@education.nsw.gov.au' } });
  const cStatus = await rest(hSplit, { action: 'status' }, 'cadmin');
  assert.equal(cStatus.body.admin, false);
  assert.equal(cStatus.body.classAdmin, true);
  assert.equal((await rest(hSplit, { action: 'progress', memberId: id(2) }, 'cadmin')).status, 200);
  assert.equal((await rest(hSplit, { action: 'progress', memberId: id(7) }, 'cadmin')).body.code, 'no_member');
  assert.equal((await rest(hSplit, { action: 'admin_progress', memberId: id(7) }, 'cadmin')).body.code, 'not_admin');
  assert.equal((await asTok('ok', { action: 'admin_users' })).body.code, 'not_admin');
  const users = (await asTok('admin', { action: 'admin_users' })).body.users;
  assert.ok(users.some(x => x.id === id(7) && x.inClass === false));
  assert.equal((await asTok('admin', { action: 'admin_name', memberId: id(7), name: 'Kid Name' })).body.name, 'Kid Name');
  assert.equal((await asTok('admin', { action: 'admin_class', memberId: id(7), inClass: true })).body.inClass, true);
  assert.equal((await asTok('admin', { action: 'roster' })).body.members.filter(x => x.id === id(7))[0].name, 'Kid Name');
  assert.equal((await asTok('admin', { action: 'admin_class', memberId: id(7), inClass: false })).body.inClass, false);
  assert.equal((await asTok('admin', { action: 'admin_delete', memberId: id(7), confirmEmail: 'nope' })).body.code, 'confirm');
  assert.equal((await asTok('admin', { action: 'admin_delete', memberId: id(7), confirmEmail: 'KID@student.det.nsw.edu.au' })).status, 200);
  assert.equal((await asTok('admin', { action: 'admin_users' })).body.users.some(x => x.id === id(7)), false);
  assert.equal(m.map.has('progress/' + id(7) + '.json'), false);

  // Admin remark: an admin's browser marks a student's answers again; the results are saved into the student's own paper.
  const part = bank.qs[16].it[0], max = part.m;
  const rec = (g, extra) => Object.assign({ status: 'marked', g, stamp: '{"version":"v","answer":"a"}', fb: { summary: 'Fine.', strengths: ['Named agile.'], improve: ['Add a judgement.'], advice: [], criteria: [{ id: 'c1', assessment: 'met' }], losses: null, quality: [] }, audit: { requestedModel: 'm' } }, extra);
  const progressOf = who => JSON.parse(m.map.get('progress/' + id(who) + '.json').body);
  const seed = async (who, extra) => m.put('progress/' + id(who) + '.json', { ts: 5, _saveDay: '2026-10-25', _saveCount: 3, _revisions: { 8: 'rev-old', 9: 'rev-nine' },
    u: { 8: Object.assign({ done: true, doneAt: 1000, mode: 'exam', ans: { '17.0': '<p>' + text1 + '</p>' }, self: { '1.0': 1 }, ai: { '16.0': { status: 'marked', g: 1, stamp: 's' } }, aiErr: { '17.0': 'AI marking failed' } }, extra), 9: { done: false, ans: {} } }, hist: [{ id: '8', at: 1 }] });
  const remark = (tok, body, who = 2, handler = h) => rest(handler, Object.assign({ action: 'remark_save', memberId: id(who), bankId: '8', doneAt: 1000, marks: { '17.0': rec(max - 1) } }, body), tok);
  await seed(2);
  assert.equal((await remark('bad', {})).status, 401);
  assert.equal((await remark('ok', {})).body.code, 'not_admin', 'a student cannot mark another student');
  assert.equal((await remark('ok', { action: 'admin_remark_save' })).body.code, 'not_admin');
  assert.equal(progressOf(2).u['8'].ai['17.0'], undefined, 'refused requests change nothing');
  assert.equal((await remark('admin', { bankId: '1' })).body.code, 'invalid_bank', 'archived papers cannot be marked this way');
  assert.equal((await remark('admin', { bankId: 'x' })).body.code, 'invalid_bank');
  // Bad input is refused whole: nothing is written when any part is wrong.
  for (const [what, marks] of [
    ['a closed question part', { '1.0': rec(1) }],
    ['a part that does not exist', { '17.9': rec(1), '99.0': rec(1) }],
    ['a key that is not a part', { 'constructor': rec(1) }],
    ['a mark above the maximum', { '17.0': rec(max + 1) }],
    ['a negative mark', { '17.0': rec(-1) }],
    ['a half mark', { '17.0': rec(0.5) }],
    ['a needs-review result with a mark', { '17.0': rec(1, { status: 'needs_review' }) }],
    ['an unknown status', { '17.0': rec(1, { status: 'done' }) }],
    ['no answer reference', { '17.0': rec(1, { stamp: '' }) }],
    ['feedback that is not an object', { '17.0': rec(1, { fb: 'text' }) }],
    ['a strengths list of non-text', { '17.0': rec(1, { fb: { summary: 's', strengths: [1], improve: [], advice: [], criteria: [], losses: null, quality: [] } }) }],
    ['no audit', { '17.0': rec(1, { audit: null }) }],
    ['an empty set', {}],
    ['a list instead of an object', [rec(1)]]]) {
    assert.equal((await remark('admin', { marks })).body.code, 'bad_marks', what);
  }
  assert.equal(progressOf(2).u['8'].ai['17.0'], undefined);
  // The attempt must match, and it must be submitted.
  assert.equal((await remark('admin', { doneAt: 2000 })).body.code, 'paper_changed');
  await seed(2, { done: false });
  assert.equal((await remark('admin', {})).body.code, 'not_submitted');
  await m.put('progress/' + id(2) + '.json', { u: { 9: { done: false, ans: {} } } });
  assert.equal((await remark('admin', {})).body.code, 'no_paper', 'the student has no copy of that paper');
  await m.put('progress/' + id(2) + '.json', {});
  assert.equal((await remark('admin', {})).body.code, 'no_paper', 'the student has no saved progress at all');
  await seed(2);
  // A system admin saves into a class member's paper. Only the marked part, its error flag and the paper revision change.
  const before = progressOf(2);
  const ok = await remark('admin', { marks: { '17.0': rec(max - 1, { extra: 'ignored', fb: { summary: 'Fine.', strengths: ['Named agile.'], improve: [], advice: [], criteria: [], losses: null, quality: [], extra: 'ignored' } }) } });
  assert.equal(ok.status, 200); assert.deepEqual(ok.body, { ok: true, saved: ['17.0'] });
  const after = progressOf(2), paper8 = after.u['8'];
  assert.equal(paper8.ai['17.0'].g, max - 1); assert.equal(paper8.ai['17.0'].status, 'marked');
  assert.equal(paper8.ai['17.0'].stamp, '{"version":"v","answer":"a"}');
  assert.equal(paper8.ai['17.0'].fb.summary, 'Fine.');
  assert.ok(!('extra' in paper8.ai['17.0']) && !('extra' in paper8.ai['17.0'].fb), 'only known fields are kept');
  assert.ok(paper8.ai['17.0'].ts > 0);
  assert.deepEqual(paper8.ai['16.0'], before.u['8'].ai['16.0'], 'other marks are untouched');
  assert.equal(paper8.aiErr['17.0'], undefined, 'the failed-marking note is cleared');
  assert.deepEqual(paper8.ans, before.u['8'].ans); assert.deepEqual(paper8.self, before.u['8'].self);
  assert.equal(paper8.done, true); assert.equal(paper8.doneAt, 1000);
  assert.deepEqual(after.u['9'], before.u['9'], 'other papers are untouched');
  assert.notEqual(after._revisions['8'], 'rev-old', 'the paper has a new revision, so the student\'s browser takes the marks on its next sync');
  assert.equal(after._revisions['9'], 'rev-nine');
  assert.equal(after._saveCount, 3); assert.equal(after.ts, 5); assert.deepEqual(after.hist, before.hist);
  // A result that needs review and a provisional one are saved as they are.
  assert.equal((await remark('admin', { marks: { '17.0': rec(null, { status: 'needs_review' }) } })).status, 200);
  assert.equal(progressOf(2).u['8'].ai['17.0'].g, null);
  assert.equal((await remark('admin', { marks: { '17.0': rec(0, { status: 'provisional' }) } })).status, 200);
  assert.equal(progressOf(2).u['8'].ai['17.0'].status, 'provisional');
  // Several parts at once, including a code or SQL part when the paper has one.
  const multi = {}; bank.qs.forEach((q, qi) => q.it.forEach((it, pi) => { if (['tx', 'py', 'ps', 'sq', 'dr', 'ft'].includes(it.t)) multi[(qi + 1) + '.' + pi] = rec(0); }));
  assert.ok(Object.keys(multi).length > 3);
  assert.equal((await remark('admin', { marks: multi })).body.saved.length, Object.keys(multi).length);
  assert.equal(Object.keys(progressOf(2).u['8'].ai).length, Object.keys(multi).length + 1);
  // Class admins: class members only. System admins use admin_remark_save for any account, including people outside the class.
  await m.put('users/' + id(8) + '.json', { email: 'outside@student.det.nsw.edu.au', created: 1 });
  await seed(8);
  assert.equal((await remark('admin', {}, 8)).body.code, 'no_member', 'the class action is for class members');
  assert.equal((await remark('admin', { action: 'admin_remark_save' }, 8)).status, 200);
  assert.equal(progressOf(8).u['8'].ai['17.0'].g, max - 1);
  assert.equal((await remark('admin', { action: 'admin_remark_save' }, 9)).body.code, 'no_user', 'an account that does not exist');
  await seed(2);
  assert.equal((await remark('cadmin', {}, 2, hSplit)).status, 200, 'a class admin marks a class member');
  assert.equal(progressOf(2).u['8'].ai['17.0'].g, max - 1);
  assert.equal((await remark('cadmin', {}, 8, hSplit)).body.code, 'no_member', 'a class admin cannot mark someone outside the class');
  assert.equal((await remark('cadmin', { action: 'admin_remark_save' }, 8, hSplit)).body.code, 'not_admin', 'admin_remark_save is for system admins only');
  // Two saves at the same moment both land: the update retries against the newest copy of the record.
  const otherKey = Object.keys(multi).find(k => k !== '17.0');
  await seed(2);
  await Promise.all([store.saveMarks(id(2), '8', 1000, { '17.0': rec(1) }), store.saveMarks(id(2), '8', 1000, { [otherKey]: rec(0) })]);
  assert.deepEqual(Object.keys(progressOf(2).u['8'].ai).sort(), ['16.0', '17.0', otherKey].sort());
  // updateAnswer updates a student's answer and revision.
  await store.updateAnswer(id(2), '8', '17.0', 'updated answer text');
  assert.equal(progressOf(2).u['8'].ans['17.0'], 'updated answer text');
  const updApi = await rest(h, { action: 'update_answer', bankId: '8', key: '17.0', text: 'api updated text' }, 'admin');
  assert.equal(updApi.status, 200);
  assert.equal(progressOf(2).u['8'].ans['17.0'], 'api updated text');
  const adminUpdApi = await rest(h, { action: 'admin_update_answer', memberId: id(2), bankId: '8', key: '17.0', text: 'admin fixed text' }, 'admin');
  assert.equal(adminUpdApi.status, 200);
  assert.equal(progressOf(2).u['8'].ans['17.0'], 'admin fixed text');
  // Presence: heartbeats are per member, aged by the server clock, expire after 75 seconds and can be switched off.
  assert.equal((await rest(h, { action: 'presence', bank: '8' }, 'other')).body.code, 'not_member', 'outsiders cannot send or read presence');
  assert.equal((await rest(h, { action: 'presence', bank: '8' }, 'bad')).status, 401);
  clock = Date.parse('2026-10-25T12:00:00Z');
  let pr = (await rest(h, { action: 'presence', bank: '8' })).body;
  assert.deepEqual(pr.online.map(o => [o.id, o.bank, o.ageMs]), [[id(1), '8', 0]], 'only the member who beat is online');
  clock += 30000;
  await rest(h, { action: 'presence', bank: 'not-a-bank' }, 'admin');
  clock += 10000;
  pr = (await rest(h, { action: 'presence', bank: '8' })).body;
  assert.deepEqual(pr.online.map(o => [o.id, o.bank, o.ageMs]).sort(), [[id(1), '8', 0], [id(2), '', 10000]].sort(), 'ages come from the server and a bad bank is dropped');
  clock += 70000;
  pr = (await rest(h, { action: 'presence', bank: '8' })).body;
  assert.deepEqual(pr.online.map(o => o.id), [id(1)], 'a member silent for 80s is no longer online');
  await rest(h, { action: 'presence', off: true });
  pr = (await rest(h, { action: 'presence', bank: '8' }, 'admin')).body;
  assert.deepEqual(pr.online.map(o => o.id), [id(2)], 'closing the tab clears the member at once');
  assert.deepEqual(Object.keys(pr.online[0]).sort(), ['ageMs', 'bank', 'id'], 'presence exposes no email or name');
  const hOff = createHandler({ store, verify, synthesis: fake, env: { DISABLE_PRESENCE: '1' } });
  assert.deepEqual((await rest(hOff, { action: 'presence', bank: '8' })).body.online, [], 'kill switch returns nobody');
  // Admin list: a class member with no login record still shows up, flagged, and cannot be deleted.
  const ghost = id(7);
  await m.put('class/members/' + ghost + '.json', { name: 'hi', joined: 5 });
  await m.put('progress/' + ghost + '.json', { u: { 8: paper('<p>x</p>') } });
  const listed = await store.adminUsers();
  const g = listed.find(x => x.id === ghost);
  assert(g && g.name === 'hi' && g.inClass === true && g.noLogin === true && g.email === '', 'orphan class member is listed');
  assert(listed.every(x => x.id !== ghost || listed.filter(y => y.id === ghost).length === 1), 'listed once');
  assert.equal(listed.filter(x => !x.noLogin).length > 0, true);
  assert.equal((await store.adminUser(ghost)).noLogin, true);
  await assert.rejects(store.adminUser(id(99)), /does not exist/);
  // Closed parts with several slots are shared too: only option numbers, checked against the real options.
  {
    const { loadBanks } = require('../server/marking-input');
    const found = {};
    loadBanks().filter(b => !b.hidden && !b.archived).forEach(b => b.qs.forEach((q, qi) => q.it.forEach((it, pi) => {
      if (['dd', 'gd', 'mt', 'tk', 'od', 'dm'].includes(it.t) && !found[it.t]) found[it.t] = { bank: b.id, key: (qi + 1) + '.' + pi, it };
    })));
    assert.deepEqual(Object.keys(found).sort(), ['dd', 'dm', 'gd', 'mt', 'od', 'tk'], 'every closed type exists in a bank');
    for (const t of Object.keys(found)) {
      const f = found[t], it = f.it;
      let ans, expectLen;
      if (t === 'dd') { ans = { 0: 0, 1: 99 }; }
      else if (t === 'gd') { ans = { [it.r.findIndex(r => r.some(c => typeof c !== 'string')) + ',' + it.r[it.r.findIndex(r => r.some(c => typeof c !== 'string'))].findIndex(c => typeof c !== 'string')]: 0 }; }
      else if (t === 'mt') { ans = { 0: 0, 1: 99 }; }
      else if (t === 'tk') { ans = ['0,0', '9,9']; }
      else if (t === 'od' || t === 'dm') { ans = { 0: 0, 1: 999 }; }
      await m.put('progress/' + id(1) + '.json', { u: { [f.bank]: { done: true, ans: { [f.key]: ans } } } });
      const out = (await rest(h, { action: 'answers', bankId: f.bank })).body.parts[f.key];
      assert.equal(out.length, 1, t + ': one classmate shared');
      assert.equal(out[0].mine, true);
      assert(Array.isArray(out[0].choice), t + ': choice is a list');
      assert(out[0].choice.every(v => Array.isArray(v) ? v.every(Number.isInteger) : Number.isInteger(v)), t + ': only integers are shared');
      assert(!out[0].choice.some(v => v === 99 || v === 999), t + ': an option that does not exist is dropped');
      if (t === 'tk') assert.deepEqual(out[0].choice[0], [0]);
      assert.deepEqual(Object.keys(out[0]).sort(), ['choice', 'id', 'mine', 'name', 'photo']);
    }
    await m.put('progress/' + id(1) + '.json', { u: { 8: paper('<p>x</p>') } });
  }
  console.log('Class tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
