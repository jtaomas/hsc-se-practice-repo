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
  const verify = async t => t === 'ok' ? { id: id(1) } : t === 'other' ? { id: id(3) } : null;
  const h = createHandler({ store, verify, synthesis: fake, env: { DEEPSEEK_API_KEY: 'k' } });
  assert.equal((await rest(h, { action: 'status' }, 'bad')).status, 401);
  assert.deepEqual((await rest(h, { action: 'status' })).body, { configured: true, member: true, name: 'Samuel', count: 2 });
  assert.equal((await rest(h, { action: 'answers', bankId: '8' }, 'other')).body.code, 'not_member');
  assert.equal((await rest(h, { action: 'join', name: 'Joe', code: 'x' }, 'other')).body.code, 'bad_code');
  assert.deepEqual((await rest(h, { action: 'overview' })).body.counts, { 8: 2 });
  assert.equal((await rest(h, { action: 'answers', bankId: '1' })).body.code, 'invalid_bank', 'archived papers are not shared');
  const ans = (await rest(h, { action: 'answers', bankId: '8' })).body;
  assert.equal(ans.parts['17.0'].length, 2);
  assert.deepEqual(ans.parts['17.0'].map(x => [x.name, x.mine]).sort(), [['Priya', false], ['Samuel', true]]);
  assert(!ans.parts['17.0'].some(x => 'email' in x));
  assert.equal((await rest(h, { action: 'analyse', bankId: '8', questionNumber: 1, partIndex: 0 })).body.code, 'invalid_part', 'multiple choice is not analysed');
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
  console.log('Class tests passed.');
})().catch(e => { console.error(e); process.exit(1); });
