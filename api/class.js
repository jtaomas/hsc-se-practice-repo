'use strict';
// Class sharing. Members of the class see each other's submitted answers by name, automatically.
// POST { action: 'status' | 'join' | 'rename' | 'overview' | 'answers' | 'analyse', ... } with a Bearer session token.
const { verifySession } = require('./auth');
const classStore = require('../server/class-store');
const synthesis = require('../server/class-synthesis');
const { loadBanks } = require('../server/marking-input');
// The key for whichever AI service is configured (OpenCode Go or DeepSeek). See server/ai-provider.js.
const aiKey = env => require('../server/ai-provider').current(env).key();

const BANK_ID = /^(?:[1-9]|1[0-9])$/;
function createHandler(deps) {
  deps = deps || {};
  const store = deps.store || classStore.createClassStore();
  const verify = deps.verify || verifySession;
  const banksOf = deps.banks || loadBanks;
  const engine = deps.synthesis || synthesis;
  const env = deps.env || process.env;
  const clock = deps.now || Date.now;
  // Class admins (comma-separated emails in CLASS_ADMINS) can change other members' photos.
  const adminList = () => String(env.CLASS_ADMINS || 'thomas.luu@education.nsw.gov.au').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  const isAdmin = sess => !!sess && !!sess.email && adminList().includes(String(sess.email).toLowerCase());
  const bankFor = id => banksOf().find(b => b.id === id && !b.hidden && !b.archived);

  const sharedPaper = paper => !!paper && (paper.done === true || paper.mode === 'practice');
  // A member who is sitting an exam right now cannot look at the class. Past three hours the exam is treated as abandoned.
  async function sittingExam(id) {
    const papers = await store.papersOf(id).catch(() => ({}));
    return Object.keys(papers).some(k => { const p = papers[k]; return p && p.mode === 'exam' && p.start && !p.done && clock() - p.start < 3 * 3600e3; });
  }

  // Open-ended answers of every member for one paper, in a fixed order.
  async function classAnswers(bank, me) {
    const members = await store.members();
    const parts = {};
    const rows = [];
    for (let i = 0; i < members.length; i += 6) {
      const batch = members.slice(i, i + 6);
      const papers = await Promise.all(batch.map(m => store.paperOf(m.id, bank.id).catch(() => null)));
      batch.forEach((m, k) => rows.push({ member: m, paper: papers[k] }));
    }
    // Practice answers are shared as they are saved and exam answers once submitted. An exam that is still being sat stays private.
    const submitted = rows.filter(r => r.paper && sharedPaper(r.paper));
    bank.qs.forEach((q, qi) => q.it.forEach((item, pi) => {
      if (!engine.isOpen(item)) return;
      const list = [];
      submitted.forEach(r => {
        const text = engine.answerText(item, r.paper.ans && r.paper.ans[(qi + 1) + '.' + pi]);
        if (text) list.push({ id: r.member.id, name: r.member.name, mine: r.member.id === me, photo: r.member.photo || '', text });
      });
      parts[(qi + 1) + '.' + pi] = list;
    }));
    return { members, submitted: submitted.map(r => ({ name: r.member.name, mine: r.member.id === me })), parts };
  }

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    let p = req.body;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (_) { p = {}; } }
    p = p && typeof p === 'object' ? p : {};
    const fail = (status, code, error) => res.status(status).json({ code, error });
    try {
      const auth = String((req.headers && req.headers.authorization) || '');
      const sess = await verify(auth.replace(/^Bearer\s+/i, ''));
      if (!sess) return fail(401, 'auth_required', 'Sign in to use the class page.');
      const configured = store.configured();
      if (p.action === 'status') {
        const member = configured ? await store.getMember(sess.id) : null;
        return res.status(200).json({ configured, member: !!member, name: member ? member.name : '', count: member ? (await store.members()).length : 0, admin: !!member && isAdmin(sess) });
      }
      if (p.action === 'join') {
        const joined = await store.join(sess.id, p.name, p.code);
        return res.status(200).json({ ok: true, member: true, name: joined.name });
      }
      const me = await store.getMember(sess.id);
      if (!me) return fail(403, 'not_member', 'Join the class with your class code first.');
      if (p.action === 'rename') return res.status(200).json(Object.assign({ ok: true }, await store.rename(sess.id, p.name)));

      if (p.action === 'roster') {
        const list = await store.members();
        return res.status(200).json({ admin: isAdmin(sess), members: list.map(m => ({ id: m.id, name: m.name, photo: m.photo || '', mine: m.id === sess.id, joined: m.joined })) });
      }
      if (p.action === 'setname') {
        if (!isAdmin(sess)) return fail(403, 'not_admin', 'Only class admins can change other people\'s names.');
        if (typeof p.memberId !== 'string' || !/^[a-f0-9]{64}$/.test(p.memberId)) return fail(400, 'bad_member', 'Choose a class member.');
        return res.status(200).json(Object.assign({ ok: true }, await store.rename(p.memberId, p.name)));
      }
      if (p.action === 'setphoto') {
        if (!isAdmin(sess)) return fail(403, 'not_admin', 'Only class admins can change other people\'s photos.');
        const photo = p.photo;
        if (typeof p.memberId !== 'string' || !/^[a-f0-9]{64}$/.test(p.memberId)) return fail(400, 'bad_member', 'Choose a class member.');
        if (typeof photo !== 'string' || photo.length > 44000 || (photo && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))) return fail(400, 'bad_photo', 'Choose a JPEG, PNG or WebP image using the photo picker.');
        if (photo) {
          const bytes = Buffer.from(photo.split(',')[1], 'base64');
          if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) return fail(400, 'bad_photo', 'The picture is invalid.');
        }
        await store.setPhoto(p.memberId, photo);
        return res.status(200).json({ ok: true, photo });
      }
      if (p.action === 'overview') {
        const members = await store.members();
        const counts = {};
        const papers = {};
        for (let i = 0; i < members.length; i += 6) {
          const slice = members.slice(i, i + 6);
          const done = await Promise.all(slice.map(m => store.papersOf(m.id).catch(() => ({}))));
          slice.forEach((m, idx) => {
            const u = done[idx] || {};
            Object.keys(u).forEach(id => {
              if (BANK_ID.test(id)) {
                if (sharedPaper(u[id])) counts[id] = (counts[id] || 0) + 1;
                const sp = u[id];
                if (sp && (sp.done || sp.start)) {
                  papers[id] = papers[id] || [];
                  papers[id].push({
                    id: m.id,
                    mine: m.id === sess.id,
                    name: m.name,
                    photo: m.photo || '',
                    status: sp.done ? 'Submitted' : (sp.mode === 'exam' ? 'Sitting exam' : 'In progress')
                  });
                }
              }
            });
          });
        }
        return res.status(200).json({ members: members.length, counts, papers });
      }

      const bank = typeof p.bankId === 'string' && BANK_ID.test(p.bankId) ? bankFor(p.bankId) : null;
      if (!bank) return fail(400, 'invalid_bank', 'Choose an available practice paper.');
      if (p.action === 'answers') {
        const all = await classAnswers(bank, sess.id);
        return res.status(200).json({ bankId: bank.id, members: all.members.length, submitted: all.submitted, parts: all.parts });
      }
      if (p.action === 'analyse') {
        const qn = Number(p.questionNumber), pi = Number(p.partIndex);
        if (!Number.isInteger(qn) || !Number.isInteger(pi)) return fail(400, 'invalid_part', 'Choose a question part.');
        const context = engine.partContext(bank, qn, pi);
        if (!context) return fail(400, 'invalid_part', 'This part is not a written answer, so there is nothing to analyse.');
        const all = await classAnswers(bank, sess.id);
        const entries = (all.parts[qn + '.' + pi] || []);
        if (entries.length < 2) return fail(409, 'too_few', 'At least two classmates need to have shared an answer to this part before the class can be analysed.');
        const labelled = engine.label(entries, bank.id + '.' + qn + '.' + pi);
        const digest = engine.digestFor(context, labelled);
        const names = {}; labelled.forEach(x => { names[x.letter] = x.mine ? 'You' : x.name; });
        const decorate = result => ({ status: 'ready', result, names, count: labelled.length, keyword: context.keyword, targetWords: engine.targetWords(context.marks), model: engine.MODEL, harness: engine.HARNESS_VERSION });
        const hit = await store.cached(digest);
        if (hit) return res.status(200).json(decorate(hit));
        if (!aiKey(env)) return fail(503, 'no_key', 'AI analysis is not configured on this site.');
        await store.spend(sess.id);
        const result = await engine.analyse(context, labelled, { apiKey: aiKey(env) });
        await store.remember(digest, result);
        return res.status(200).json(decorate(result));
      }
      return fail(400, 'unknown_action', 'Unknown request.');
    } catch (e) {
      const status = [400, 401, 403, 404, 409, 413, 429, 502, 503, 504].includes(e.status) ? e.status : 503;
      if (!e.status) console.error('class error:', e && (e.stack || e));
      const safe = e.status && e.code ? e.message : 'The class page had a problem. Try again in a moment.';
      return fail(status, typeof e.code === 'string' && /^[a-z_]+$/.test(e.code) ? e.code : 'class_unavailable', safe);
    }
  };
}
module.exports = createHandler();
module.exports.createHandler = createHandler;
