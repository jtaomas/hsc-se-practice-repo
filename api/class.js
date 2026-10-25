'use strict';
// Class sharing. Members of the class see each other's submitted answers by name, automatically.
// POST { action: 'status' | 'join' | 'rename' | 'overview' | 'answers' | 'analyse', ... } with a Bearer session token.
// Admin only: 'progress', 'remark_save' (class members) and 'admin_*' incl. 'admin_remark_save' (any account).
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
  // System admins (SYSTEM_ADMINS, defaulting to CLASS_ADMINS or thomas.luu) manage all accounts across the site.
  // Class admins (CLASS_ADMINS plus any system admin) manage and view progress for members of their class.
  const parseEmails = raw => String(raw || '').toLowerCase().split(',').map(x => x.trim()).filter(Boolean);
  const sysAdminList = () => parseEmails(env.SYSTEM_ADMINS || env.CLASS_ADMINS || 'thomas.luu@education.nsw.gov.au');
  const classAdminList = () => Array.from(new Set(sysAdminList().concat(parseEmails(env.CLASS_ADMINS || 'thomas.luu@education.nsw.gov.au'))));
  const isSystemAdmin = sess => !!sess && !!sess.email && sysAdminList().includes(String(sess.email).toLowerCase());
  const isClassAdmin = sess => !!sess && !!sess.email && classAdminList().includes(String(sess.email).toLowerCase());
  const isAdmin = isSystemAdmin;
  const bankFor = id => banksOf().find(b => b.id === id && !b.hidden && !b.archived);

  // Admin remark: the admin's browser marked a student's answers again; this validates and saves the results into the student's paper.
  async function saveRemarks(id, p) {
    const bank = typeof p.bankId === 'string' && BANK_ID.test(p.bankId) ? bankFor(p.bankId) : null;
    if (!bank) throw classStore.error(400, 'invalid_bank', 'Choose an available practice paper.');
    return store.saveMarks(id, bank.id, p.doneAt, classStore.cleanMarks(bank, p.marks, clock()));
  }

  const sharedPaper = paper => !!paper && (paper.done === true || paper.mode === 'practice');
  // A member who is sitting an exam right now cannot look at the class. Past three hours the exam is treated as abandoned.
  async function sittingExam(id) {
    const papers = await store.papersOf(id).catch(() => ({}));
    return Object.keys(papers).some(k => { const p = papers[k]; return p && p.mode === 'exam' && p.start && !p.done && clock() - p.start < 3 * 3600e3; });
  }

  // The mark a student holds for one part: the mark they set themselves, else a confirmed AI mark. Null while it is unmarked.
  // Provisional and needs-review AI results carry no confirmed mark, so they are not shown.
  function partMark(paper, key, max) {
    const ok = v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
    const own = paper.self && paper.self[key];
    if (ok(own)) return own;
    const ai = paper.ai && paper.ai[key];
    return ai && ai.status === 'marked' && ok(ai.g) ? ai.g : null;
  }

  // What a classmate picked in a single or multiple choice part: option numbers only, checked against the real option list.
  function choiceOf(item, stored) {
    const n = Array.isArray(item.o) ? item.o.length : 0;
    const ok = v => Number.isInteger(v) && v >= 0 && v < n;
    if (item.t === 'mc') return ok(stored) ? [stored] : null;
    if (!Array.isArray(stored)) return null;
    const picked = [...new Set(stored.filter(ok))].sort((a, b) => a - b);
    return picked.length ? picked : null;
  }

  function firstSentence(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim();
    const m = t.match(/^.*?[.!?](?:\s|$)/);
    t = m ? m[0].trim() : t;
    return t.length > 220 ? t.slice(0, 217).replace(/\s+\S*$/, '') + '...' : t;
  }
  function partFeedback(paper, key, max) {
    const ai = paper.ai && paper.ai[key];
    if (!ai || ai.status !== 'marked' || !ai.fb || typeof ai.fb !== 'object') return null;
    const f = ai.fb;
    const summary = typeof f.summary === 'string' && f.summary.trim() ? firstSentence(f.summary) : '';
    const losses = f.losses && Array.isArray(f.losses.items) ? f.losses.items : [];
    const problems = [];
    losses.forEach(l => {
      if (l && typeof l.explanation === 'string' && l.explanation.trim()) problems.push(firstSentence(l.explanation));
    });
    if (!problems.length && Array.isArray(f.improve)) {
      f.improve.forEach(x => {
        if (typeof x === 'string' && x.trim()) problems.push(firstSentence(x));
      });
    }
    if (!summary && !problems.length) return null;
    return { summary, problems: problems.slice(0, 4) };
  }

  function parseBlobData(raw) {
    if (!raw) return null;
    const val = raw.body !== undefined ? (Buffer.isBuffer(raw.body) ? raw.body.toString('utf8') : raw.body) : raw;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (_) { return null; }
    }
    if (typeof val === 'object' && val !== null) {
      return val.data !== undefined ? val.data : val;
    }
    return null;
  }

  // Open-ended answers of every member for one paper, in a fixed order.
  async function classAnswers(bank, me) {
    const members = await store.members();
    const parts = {};
    const rows = [];
    const progressPaths = members.map(m => 'progress/' + m.id + '.json');
    const progressMap = typeof store.getMany === 'function' ? await store.getMany(progressPaths).catch(() => null) : null;
    for (let i = 0; i < members.length; i += 6) {
      const batch = members.slice(i, i + 6);
      const papers = progressMap
        ? batch.map(m => {
            const raw = progressMap.get('progress/' + m.id + '.json');
            const d = parseBlobData(raw);
            const p = d && d.u && d.u[bank.id];
            return p && typeof p === 'object' ? p : null;
          })
        : await Promise.all(batch.map(m => store.paperOf(m.id, bank.id).catch(() => null)));
      batch.forEach((m, k) => rows.push({ member: m, paper: papers[k] }));
    }
    // Practice answers are shared as they are saved and exam answers once submitted. An exam that is still being sat stays private.
    const submitted = rows.filter(r => r.paper && sharedPaper(r.paper));
    bank.qs.forEach((q, qi) => q.it.forEach((item, pi) => {
      if (item.t === 'mc' || item.t === 'ms') {
        const key = (qi + 1) + '.' + pi, picks = [];
        submitted.forEach(r => {
          const choice = choiceOf(item, r.paper.ans && r.paper.ans[key]);
          if (choice) picks.push({ id: r.member.id, name: r.member.name, mine: r.member.id === me, photo: r.member.photo || '', choice });
        });
        parts[key] = picks;
        return;
      }
      if (!engine.isOpen(item)) return;
      const list = [];
      submitted.forEach(r => {
        const key = (qi + 1) + '.' + pi;
        const text = engine.answerText(item, r.paper.ans && r.paper.ans[key]);
        if (text) {
          const entry = { id: r.member.id, name: r.member.name, mine: r.member.id === me, photo: r.member.photo || '', text, mark: partMark(r.paper, key, item.m), max: item.m };
          const fb = partFeedback(r.paper, key, item.m);
          if (fb) entry.fb = fb;
          list.push(entry);
        }
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
        const sys = isSystemAdmin(sess), cls = isClassAdmin(sess);
        const count = member ? (typeof store.list === 'function' ? ((await store.list({ prefix: 'class/members/' })).blobs || []).length : (typeof store.memberCount === 'function' ? await store.memberCount() : (await store.members()).length)) : 0;
        const out = { configured, member: !!member, name: member ? member.name : '', count, admin: sys };
        if (cls && !sys) out.classAdmin = true;
        if (p.bundle && member) {
          const list = await store.members();
          out.roster = { admin: cls, members: list.map(m => ({ id: m.id, name: m.name, photo: m.photo || '', mine: m.id === sess.id, joined: m.joined })) };
          const counts = {}, papers = {};
          const progressPaths = list.map(m => 'progress/' + m.id + '.json');
          const progressMap = typeof store.getMany === 'function' ? await store.getMany(progressPaths).catch(() => null) : null;
          for (let i = 0; i < list.length; i += 6) {
            const slice = list.slice(i, i + 6);
            const done = progressMap
              ? slice.map(m => parseBlobData(progressMap.get('progress/' + m.id + '.json')) || {})
              : await Promise.all(slice.map(m => store.papersOf(m.id).catch(() => ({}))));
            slice.forEach((m, idx) => {
              const u = (done[idx] && done[idx].u) || {};
              banksOf().forEach(b => {
                if (b.archived) return;
                const sp = u[b.id];
                if (sp && sp.done) counts[b.id] = (counts[b.id] || 0) + 1;
                if (!sp) return;
                const isDone = !!sp.done, hasStart = !!sp.start, hasUpd = !!sp.upd;
                if (!isDone && !hasStart && !hasUpd) return;
                papers[b.id] = papers[b.id] || [];
                const dur = typeof b.duration === 'number' ? b.duration : (b.duration === 'mini' ? 20 * 60 : 3 * 3600);
                const isWorking = hasStart && !isDone && (clock() - sp.start < dur * 1000);
                const isRecent = hasUpd && (clock() - sp.upd < 300000);
                const isCurrent = isWorking || isRecent;
                papers[b.id].push({
                  id: m.id,
                  name: m.name,
                  photo: m.photo || '',
                  mine: m.id === sess.id,
                  status: isDone ? 'Submitted' : 'In progress',
                  current: isDone ? false : isCurrent,
                  score: isDone ? partMark(sp, '1.0', 1) : null
                });
              });
            });
          }
          out.overview = { members: list.length, counts, papers };
        }
        return res.status(200).json(out);
      }
      if (p.action === 'join') {
        const joined = await store.join(sess.id, p.name, p.code);
        return res.status(200).json({ ok: true, member: true, name: joined.name });
      }
      // Platform admin: works on any account, with or without class membership.
      if (/^admin_/.test(String(p.action))) {
        if (!isSystemAdmin(sess)) return fail(403, 'not_admin', 'Only admins can do this.');
        if (p.action === 'admin_users') return res.status(200).json({ users: await store.adminUsers() });
        const id = String(p.memberId || '');
        if (p.action === 'admin_progress') return res.status(200).json(await store.adminProgress(id));
        if (p.action === 'admin_remark_save') { await store.adminUser(id); return res.status(200).json(Object.assign({ ok: true }, await saveRemarks(id, p))); }
        if (p.action === 'admin_name') return res.status(200).json(Object.assign({ ok: true }, await store.adminSetName(id, p.name)));
        if (p.action === 'admin_photo') {
          const photo = p.photo;
          if (typeof photo !== 'string' || photo.length > 44000 || (photo && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))) return fail(400, 'bad_photo', 'Choose a JPEG, PNG or WebP image using the photo picker.');
          if (photo) {
            const bytes = Buffer.from(photo.split(',')[1], 'base64');
            if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) return fail(400, 'bad_photo', 'The picture is invalid.');
          }
          return res.status(200).json(Object.assign({ ok: true }, await store.adminSetPhoto(id, photo)));
        }
        if (p.action === 'admin_class') return res.status(200).json(Object.assign({ ok: true }, await store.adminSetClass(id, p.inClass === true)));
        if (p.action === 'admin_delete') {
          const target = await store.adminUser(id);
          if (!target.email) return fail(400, 'no_login', 'This account has no login record, so it cannot be deleted here. Remove it from the class instead.');
          if (id === sess.id || classAdminList().includes(String(target.email || '').toLowerCase())) return fail(400, 'protected', 'Admin accounts cannot be deleted here.');
          if (String(p.confirmEmail || '').toLowerCase() !== String(target.email || '').toLowerCase()) return fail(400, 'confirm', 'Type the account email to confirm.');
          return res.status(200).json(Object.assign({ ok: true }, await store.adminDelete(id)));
        }
        return fail(400, 'unknown_action', 'Unknown request.');
      }
      const me = await store.getMember(sess.id);
      if (!me) return fail(403, 'not_member', 'Join the class with your class code first.');
      if (p.action === 'rename') return res.status(200).json(Object.assign({ ok: true }, await store.rename(sess.id, p.name)));

      // Heartbeat from an open tab. Records that this member is here now and returns who else is, by the server's clock.
      if (p.action === 'presence') {
        if (/^(1|true)$/i.test(String(env.DISABLE_PRESENCE || ''))) return res.status(200).json({ ok: true, disabled: true, now: clock(), online: [] });
        if (p.off === true) { await store.unbeat(sess.id); return res.status(200).json({ ok: true, now: clock(), online: [] }); }
        await store.beat(sess.id, typeof p.bank === 'string' ? p.bank : '');
        return res.status(200).json({ ok: true, now: clock(), online: await store.presences() });
      }
      if (p.action === 'roster') {
        const list = await store.members();
        return res.status(200).json({ admin: isClassAdmin(sess), members: list.map(m => ({ id: m.id, name: m.name, photo: m.photo || '', mine: m.id === sess.id, joined: m.joined })) });
      }
      if (p.action === 'progress') {
        if (!isClassAdmin(sess)) return fail(403, 'not_admin', 'Only class admins can view member progress reports.');
        return res.status(200).json(await store.memberProgress(String(p.memberId || '')));
      }
      if (p.action === 'remark_save') {
        if (!isClassAdmin(sess)) return fail(403, 'not_admin', 'Only class admins can mark other students\' answers.');
        const memberId = String(p.memberId || '');
        if (!(await store.getMember(memberId))) return fail(404, 'no_member', 'That person is not in the class.');
        return res.status(200).json(Object.assign({ ok: true }, await saveRemarks(memberId, p)));
      }
      if (p.action === 'setname') {
        if (!isClassAdmin(sess)) return fail(403, 'not_admin', 'Only class admins can change other people\'s names.');
        if (typeof p.memberId !== 'string' || !/^[a-f0-9]{64}$/.test(p.memberId)) return fail(400, 'bad_member', 'Choose a class member.');
        return res.status(200).json(Object.assign({ ok: true }, await store.rename(p.memberId, p.name)));
      }
      if (p.action === 'setphoto') {
        if (!isClassAdmin(sess)) return fail(403, 'not_admin', 'Only class admins can change other people\'s photos.');
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
        const progressPaths = members.map(m => 'progress/' + m.id + '.json');
        const progressMap = typeof store.getMany === 'function' ? await store.getMany(progressPaths).catch(() => null) : null;
        for (let i = 0; i < members.length; i += 6) {
          const slice = members.slice(i, i + 6);
          const done = progressMap
            ? slice.map(m => (parseBlobData(progressMap.get('progress/' + m.id + '.json')) || {}).u || {})
            : await Promise.all(slice.map(m => store.papersOf(m.id).catch(() => ({}))));
          slice.forEach((m, idx) => {
            const u = done[idx] || {};
            let latestOpenId = null;
            let latestOpenTs = -1;
            let latestOpenSp = null;
            Object.keys(u).forEach(k => {
              if (BANK_ID.test(k)) {
                const sp = u[k];
                if (sp && !sp.done && (sp.start || sp.upd)) {
                  const ts = Math.max(sp.upd || 0, sp.start || 0);
                  if (ts > latestOpenTs) {
                    latestOpenTs = ts;
                    latestOpenId = k;
                    latestOpenSp = sp;
                  }
                }
              }
            });
            const isCurrent = latestOpenSp && (
              (latestOpenSp.mode === 'exam' && latestOpenSp.start && clock() - latestOpenSp.start < 3 * 3600e3) ||
              (latestOpenTs > 0 && clock() - latestOpenTs < 45 * 60 * 1000) ||
              !latestOpenSp.upd
            );
            if (!isCurrent) latestOpenId = null;
            Object.keys(u).forEach(id => {
              if (BANK_ID.test(id)) {
                if (sharedPaper(u[id])) counts[id] = (counts[id] || 0) + 1;
                const sp = u[id];
                if (sp && (sp.done || sp.start || sp.upd)) {
                  papers[id] = papers[id] || [];
                  const lastTs = Math.max(sp.upd || 0, sp.start || 0);
                  papers[id].push({
                    id: m.id,
                    mine: m.id === sess.id,
                    name: m.name,
                    photo: m.photo || '',
                    status: sp.done ? 'Submitted' : (sp.mode === 'exam' ? 'Sitting exam' : 'In progress'),
                    current: id === latestOpenId && !sp.done,
                    upd: lastTs
                  });
                }
              }
            });
          });
        }
        Object.keys(papers).forEach(id => {
          papers[id].sort((a, b) => {
            const ra = a.current ? 0 : (a.status === 'Submitted' ? 2 : 1);
            const rb = b.current ? 0 : (b.status === 'Submitted' ? 2 : 1);
            if (ra !== rb) return ra - rb;
            return (b.upd || 0) - (a.upd || 0);
          });
        });
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
        if (!context || context.kind === 'sq') return fail(400, 'invalid_part', 'This part is not a written answer, so there is nothing to analyse.');
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
