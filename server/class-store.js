'use strict';
// The class: one shared group, joined with a code the owner sets in CLASS_CODE.
// Members automatically see each other's submitted answers (by name), so there is no per-answer consent step.
// All data is in D1 through server/d1-blob.js:
//   class/members/<id>.json          { name, joined }
//   class/attempts/<hour>.json       wrong-code counter (limits guessing)
//   class/quota/<day>/<id|site>.json AI analysis counters
//   class/synth/<digest>.json        cached AI analyses (shared by the whole class)
const crypto = require('node:crypto');

const ID = /^[a-f0-9]{64}$/;
const MAX_MEMBERS = 200;
const WRONG_CODES_PER_HOUR = 60;
const QUOTA = Object.freeze({ perUser: 30, site: 150 });
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function error(status, code, message) { return Object.assign(new Error(message), { status, code }); }

function cleanName(value) {
  const name = String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 40) throw error(400, 'bad_name', 'Enter your name (2 to 40 characters). Classmates will see it next to your answers.');
  return name;
}
const normaliseCode = value => String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, '');

// ---- Admin remark: AI marking results that an admin's browser produced for a student's answers. ----
// The browser sends the same record the student's own browser would keep in paper.ai[<question>.<part>]. Nothing is trusted
// beyond its shape: the part must be one the AI marks, the mark must fit the part, and only known fields are kept.
const MARK_KEY = /^[1-9]\d?\.\d{1,2}$/;
const AI_PART_TYPES = new Set(['tx', 'ft', 'py', 'ps', 'sq', 'dr']);
const MARK_STATUS = new Set(['marked', 'provisional', 'needs_review']);
const MAX_PROGRESS = 3500000;
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const strList = (v, n, max) => Array.isArray(v) && v.length <= n && v.every(s => typeof s === 'string' && s.length <= max);
function cleanMarks(bank, input, ts) {
  const bad = message => error(400, 'bad_marks', message);
  if (!isObj(input)) throw bad('Send the marks to save.');
  const keys = Object.keys(input);
  if (!keys.length || keys.length > 60) throw bad('Send between 1 and 60 marks.');
  const out = {};
  for (const k of keys) {
    const at = MARK_KEY.test(k) ? k.split('.') : null;
    const q = at && bank.qs[+at[0] - 1];
    const it = q && q.it[+at[1]];
    if (!it || !AI_PART_TYPES.has(it.t)) throw bad('Part ' + k + ' is not marked by AI.');
    const r = input[k];
    if (!isObj(r) || !MARK_STATUS.has(r.status)) throw bad('Part ' + k + ' has no valid marking result.');
    if (r.status === 'needs_review' ? r.g !== null : !(Number.isInteger(r.g) && r.g >= 0 && r.g <= it.m)) throw bad('Part ' + k + ' has a mark outside 0 to ' + it.m + '.');
    if (typeof r.stamp !== 'string' || !r.stamp || r.stamp.length > 400000) throw bad('Part ' + k + ' is missing its answer reference.');
    const fb = r.fb;
    if (!isObj(fb) || typeof fb.summary !== 'string' || fb.summary.length > 2000 || !strList(fb.strengths, 12, 600) || !strList(fb.improve, 12, 600) || !strList(fb.advice, 12, 600) ||
        !Array.isArray(fb.criteria) || fb.criteria.length > 80 || !Array.isArray(fb.quality) || fb.quality.length > 40 || !(fb.losses === null || isObj(fb.losses)) || !isObj(r.audit)) throw bad('Part ' + k + ' has feedback in the wrong shape.');
    const rec = { status: r.status, g: r.g, stamp: r.stamp, fb: { summary: fb.summary, strengths: fb.strengths, improve: fb.improve, advice: fb.advice, criteria: fb.criteria, losses: fb.losses, quality: fb.quality }, audit: r.audit, ts };
    if (Buffer.byteLength(JSON.stringify(rec.fb)) + Buffer.byteLength(JSON.stringify(rec.audit)) > 120000) throw bad('Part ' + k + ' has too much feedback to save.');
    out[k] = rec;
  }
  return out;
}

function createClassStore(options) {
  options = options || {};
  const provider = options.blob || (() => require('./d1-blob'));
  const now = options.now || Date.now;
  const codeSource = options.classCode || (() => process.env.CLASS_CODE);
  const hour = () => new Date(now()).toISOString().slice(0, 13);
  const day = () => new Date(now()).toISOString().slice(0, 10);
  const configuredCode = () => normaliseCode(codeSource());
  const isPreconditionFailure = e => e && (e.name === 'BlobPreconditionFailedError' || /precondition|already exists/i.test(String(e.message)));

  let _membersCache = null, _membersCacheAt = 0;
  function invalidateMembers() { _membersCache = null; _membersCacheAt = 0; }

  function parseJSON(entry) {
    if (!entry) return null;
    const raw = entry.body !== undefined ? (Buffer.isBuffer(entry.body) ? entry.body.toString('utf8') : entry.body) : entry;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch (_) { return null; }
    }
    if (typeof raw === 'object' && raw !== null) {
      return raw.data !== undefined ? raw.data : raw;
    }
    return null;
  }

  async function getMany(paths) {
    const store = await provider();
    if (typeof store.getMany === 'function') {
      return store.getMany(paths);
    }
    const map = new Map();
    await Promise.all(paths.map(async p => {
      const r = await read(p);
      if (r && r.data != null) {
        map.set(p, { statusCode: 200, body: Buffer.from(JSON.stringify(r.data)), blob: { etag: r.etag, pathname: p } });
      }
    }));
    return map;
  }

  async function read(path) {
    const store = await provider();
    const r = await store.get(path, { access: 'private', useCache: false });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    const chunks = []; for await (const c of r.stream) chunks.push(Buffer.from(c));
    return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')), etag: r.blob && r.blob.etag };
  }
  async function write(path, data, overwrite, etag) {
    const store = await provider();
    const o = { access: 'private', addRandomSuffix: false, allowOverwrite: !!overwrite, contentType: 'application/json' };
    if (etag) o.ifMatch = etag;
    return store.put(path, JSON.stringify(data), o);
  }
  // Compare-and-swap update of one record. change(current) returns the next value, or null to leave it alone.
  async function update(path, change) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const r = await read(path);
      const next = change(r && r.data);
      if (next === null) return r && r.data;
      try { await write(path, next, !!r, r && r.etag); return next; } catch (e) { if (!isPreconditionFailure(e)) throw e; }
    }
    throw error(503, 'class_busy', 'The class is busy. Try again in a moment.');
  }

  const configured = () => configuredCode().length > 0;

  // Wrong codes are counted per hour for the whole site, so guessing the code is not practical.
  async function checkCode(code) {
    if (!configured()) throw error(503, 'class_not_configured', 'The class code has not been set up on this site yet. Ask your teacher.');
    const path = 'class/attempts/' + hour() + '.json';
    const bucket = await read(path);
    if (bucket && bucket.data.wrong >= WRONG_CODES_PER_HOUR) throw error(429, 'class_locked', 'Too many wrong class codes were entered. Try again in an hour.');
    const given = Buffer.from(sha(normaliseCode(code))), want = Buffer.from(sha(configuredCode()));
    if (normaliseCode(code) && crypto.timingSafeEqual(given, want)) return true;
    await update(path, current => ({ wrong: ((current && current.wrong) || 0) + 1 }));
    throw error(400, 'bad_code', 'That class code is not right. Check it with your teacher.');
  }

  async function getMember(id) {
    if (!ID.test(id)) return null;
    const r = await read('class/members/' + id + '.json');
    return r ? r.data : null;
  }
  // Validates everything first and only then writes, so a bad code never leaves a half-joined member.
  async function join(id, name, code) {
    if (!ID.test(id)) throw error(400, 'bad_account', 'Invalid account.');
    const clean = cleanName(name);
    await checkCode(code);
    const path = 'class/members/' + id + '.json';
    const existing = await read(path);
    if (!existing) {
      const listed = await (await provider()).list({ prefix: 'class/members/' });
      if ((listed.blobs || []).length >= MAX_MEMBERS) throw error(409, 'class_full', 'The class is full.');
    }
    await update(path, current => ({ name: clean, joined: (current && current.joined) || now() }));
    invalidateMembers();
    return { name: clean };
  }
  async function rename(id, name) {
    const member = await getMember(id);
    if (!member) throw error(403, 'not_member', 'Join the class first.');
    const clean = cleanName(name);
    await update('class/members/' + id + '.json', current => Object.assign({}, current, { name: clean }));
    invalidateMembers();
    return { name: clean };
  }
  async function leave(id) {
    if (!ID.test(id)) return;
    await (await provider()).del(['class/members/' + id + '.json']);
    invalidateMembers();
  }
  async function memberCount() {
    if (_membersCache && now() - _membersCacheAt < 20000) return _membersCache.length;
    const store = await provider();
    const listed = await store.list({ prefix: 'class/members/' });
    return (listed.blobs || []).length;
  }
  async function members() {
    if (_membersCache && now() - _membersCacheAt < 20000) return _membersCache;
    const store = await provider();
    const listed = await store.list({ prefix: 'class/members/' });
    const ids = (listed.blobs || []).map(b => String(b.pathname).slice('class/members/'.length).replace(/\.json$/, '')).filter(id => ID.test(id)).slice(0, MAX_MEMBERS);
    if (!ids.length) { _membersCache = []; _membersCacheAt = now(); return []; }
    const memberPaths = ids.map(id => 'class/members/' + id + '.json');
    const profilePaths = ids.map(id => 'profiles/' + id + '.json');
    const map = typeof store.getMany === 'function' ? await store.getMany([...memberPaths, ...profilePaths]) : await getMany([...memberPaths, ...profilePaths]);
    const out = [];
    for (const id of ids) {
      const m = parseJSON(map.get('class/members/' + id + '.json'));
      if (!m || !m.name) continue;
      const profile = parseJSON(map.get('profiles/' + id + '.json'));
      out.push({ id, name: m.name, joined: m.joined, photo: (profile && profile.photo) || '' });
    }
    const res = out.sort((a, b) => a.joined - b.joined || a.id.localeCompare(b.id));
    _membersCache = res;
    _membersCacheAt = now();
    return res;
  }
  // One saved paper per member: u[bankId] from progress/<id>.json. Returned as stored; callers pick the fields they show.
  async function paperOf(id, bankId) {
    const r = ID.test(id) ? await read('progress/' + id + '.json') : null;
    const paper = r && r.data && r.data.u && r.data.u[bankId];
    return paper && typeof paper === 'object' ? paper : null;
  }
  async function papersOf(id) {
    if (Array.isArray(id)) {
      const ids = id.filter(x => ID.test(x));
      if (!ids.length) return new Map();
      const paths = ids.map(x => 'progress/' + x + '.json');
      const store = await provider();
      const map = typeof store.getMany === 'function' ? await store.getMany(paths) : await getMany(paths);
      const out = new Map();
      for (const memberId of ids) {
        const d = parseJSON(map.get('progress/' + memberId + '.json'));
        out.set(memberId, (d && d.u) || {});
      }
      return out;
    }
    const r = ID.test(id) ? await read('progress/' + id + '.json') : null;
    return (r && r.data && r.data.u) || {};
  }

  // Daily AI analysis budget: per student and for the whole site. Counted before the model is called.
  async function spend(id) {
    const d = day();
    const keys = [['class/quota/' + d + '/' + id + '.json', QUOTA.perUser, 'class_quota_user', 'You have used today’s class analyses. Try again tomorrow.'],
      ['class/quota/' + d + '/site.json', QUOTA.site, 'class_quota_site', 'The class has used today’s AI analyses. Try again tomorrow.']];
    for (const [path, limit, code, message] of keys) {
      let over = false;
      await update(path, current => { const n = (current && current.n) || 0; if (n >= limit) { over = true; return null; } return { n: n + 1 }; });
      if (over) throw error(429, code, message);
    }
  }
  async function cached(digest) {
    if (!/^[a-f0-9]{64}$/.test(digest)) return null;
    const r = await read('class/synth/' + digest + '.json');
    return r ? r.data : null;
  }
  async function remember(digest, result) {
    if (!/^[a-f0-9]{64}$/.test(digest)) return;
    await write('class/synth/' + digest + '.json', result, true);
  }

  // Admin action: set or clear a member's profile photo (a validated JPEG data URL, or '' to remove it).
  async function setPhoto(id, photo) {
    if (!(await getMember(id))) throw error(404, 'no_member', 'That person is not in the class.');
    await update('profiles/' + id + '.json', current => Object.assign({}, current, { photo }));
    invalidateMembers();
    return { photo };
  }

  // ---- Platform admin: every account on the site, not only class members. ----
  async function adminUsers() {
    const store = await provider();
    const listed = await store.list({ prefix: 'users/' });
    const ids = (listed.blobs || []).map(b => String(b.pathname).slice('users/'.length).replace(/\.json$/, '')).filter(id => ID.test(id)).slice(0, 1000);
    const inClass = new Set(((await store.list({ prefix: 'class/members/' })).blobs || []).map(b => String(b.pathname).slice('class/members/'.length).replace(/\.json$/, '')));
    const out = [];
    for (let i = 0; i < ids.length; i += 8) {
      const rows = await Promise.all(ids.slice(i, i + 8).map(async id => {
        const u = await read('users/' + id + '.json');
        if (!u) return null;
        const m = inClass.has(id) ? await getMember(id) : null;
        const profile = await read('profiles/' + id + '.json');
        return { id, email: u.data.email || '', name: (m && m.name) || u.data.name || '', inClass: !!m, photo: (profile && profile.data && profile.data.photo) || '', created: u.data.created || 0 };
      }));
      rows.forEach(r => { if (r) out.push(r); });
    }
    return out.sort((a, b) => a.email.localeCompare(b.email));
  }
  async function adminUser(id) {
    if (!ID.test(id)) throw error(400, 'bad_member', 'Choose an account.');
    const u = await read('users/' + id + '.json');
    if (!u) throw error(404, 'no_user', 'That account does not exist.');
    return u.data;
  }
  async function adminSetName(id, name) {
    await adminUser(id);
    const clean = cleanName(name);
    await update('users/' + id + '.json', cur => cur ? Object.assign({}, cur, { name: clean }) : null);
    if (await getMember(id)) await update('class/members/' + id + '.json', cur => Object.assign({}, cur, { name: clean }));
    invalidateMembers();
    return { name: clean };
  }
  async function adminSetPhoto(id, photo) {
    await adminUser(id);
    await update('profiles/' + id + '.json', cur => Object.assign({}, cur, { photo }));
    invalidateMembers();
    return { photo };
  }
  async function adminSetClass(id, on) {
    const u = await adminUser(id);
    if (!on) { await leave(id); return { inClass: false }; }
    const existing = await getMember(id);
    if (!existing) {
      const name = cleanName(u.name || String(u.email || '').split('@')[0].replace(/[._]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      await update('class/members/' + id + '.json', () => ({ name, joined: now() }));
    }
    invalidateMembers();
    return { inClass: true };
  }
  async function memberProgress(id) {
    if (!ID.test(id)) throw error(400, 'bad_member', 'Choose a class member.');
    const m = await getMember(id);
    if (!m) throw error(404, 'no_member', 'That person is not in the class.');
    const u = await read('users/' + id + '.json');
    const p = await read('progress/' + id + '.json');
    const d = (p && p.data) || {};
    return {
      id,
      name: m.name,
      email: (u && u.data && u.data.email) || '',
      inClass: true,
      joined: m.joined || 0,
      created: (u && u.data && u.data.created) || 0,
      ts: d.ts || 0,
      u: d.u && typeof d.u === 'object' ? d.u : {},
      hist: Array.isArray(d.hist) ? d.hist : []
    };
  }
  async function adminProgress(id) {
    if (!ID.test(id)) throw error(400, 'bad_member', 'Choose an account.');
    const u = await read('users/' + id + '.json');
    const m = await getMember(id);
    if (!u && !m) throw error(404, 'no_user', 'That account does not exist.');
    const p = await read('progress/' + id + '.json');
    const d = (p && p.data) || {};
    return {
      id,
      name: (m && m.name) || (u && u.data && u.data.name) || '',
      email: (u && u.data && u.data.email) || '',
      inClass: !!m,
      joined: (m && m.joined) || 0,
      created: (u && u.data && u.data.created) || 0,
      ts: d.ts || 0,
      u: d.u && typeof d.u === 'object' ? d.u : {},
      hist: Array.isArray(d.hist) ? d.hist : []
    };
  }
  // Admin action: write AI marking results into a student's submitted paper. The caller has already checked who may do this.
  // doneAt ties the results to the attempt the admin was looking at, so a restarted or restored paper is never marked by mistake.
  // The paper gets a new revision, so the student's browser takes the marks on its next sync (or asks them to choose, if they edited it too).
  async function saveMarks(id, bankId, doneAt, marks) {
    if (!ID.test(id)) throw error(400, 'bad_member', 'Choose a student.');
    await update('progress/' + id + '.json', current => {
      const paper = current && current.u && current.u[bankId];
      if (!isObj(paper)) throw error(404, 'no_paper', 'This student has no saved copy of that paper.');
      if (paper.done !== true) throw error(409, 'not_submitted', 'Only a submitted paper can be marked this way.');
      if ((Number(paper.doneAt) || 0) !== (Number(doneAt) || 0)) throw error(409, 'paper_changed', 'This paper changed since you opened it. Press Refresh and try again.');
      const next = Object.assign({}, paper, { ai: Object.assign({}, isObj(paper.ai) ? paper.ai : {}), aiErr: Object.assign({}, isObj(paper.aiErr) ? paper.aiErr : {}) });
      Object.keys(marks).forEach(k => { next.ai[k] = marks[k]; delete next.aiErr[k]; });
      const revisions = Object.assign({}, isObj(current._revisions) ? current._revisions : {});
      revisions[bankId] = crypto.randomBytes(16).toString('hex');
      const data = Object.assign({}, current, { u: Object.assign({}, current.u, { [bankId]: next }), _revisions: revisions });
      if (Buffer.byteLength(JSON.stringify(data)) > MAX_PROGRESS) throw error(413, 'too_large', 'This student\'s saved progress is too large to add marks to.');
      return data;
    });
    return { saved: Object.keys(marks) };
  }
  async function adminDelete(id) {
    await adminUser(id);
    const store = await provider();
    const backups = ((await store.list({ prefix: 'backup/' + id + '/' })).blobs || []).map(b => b.pathname);
    await store.del(['users/' + id + '.json', 'progress/' + id + '.json', 'profiles/' + id + '.json', 'class/members/' + id + '.json'].concat(backups));
    invalidateMembers();
    return { deleted: true };
  }

  // Live presence: one small record per member, rewritten by the browser heartbeat. Only the server clock is ever used.
  const PRESENCE_TTL = 75000;
  async function beat(id, bank) {
    if (!ID.test(id)) return;
    await write('class/presence/' + id + '.json', { t: now(), b: /^(?:[1-9]|1[0-9])$/.test(String(bank || '')) ? String(bank) : '' }, true);
  }
  async function unbeat(id) {
    if (!ID.test(id)) return;
    await write('class/presence/' + id + '.json', { t: 0, b: '' }, true);
  }
  // Members seen within the last 75 seconds, with how old that sighting is according to the server.
  async function presences() {
    const list = await members();
    if (!list.length) return [];
    const paths = list.map(m => 'class/presence/' + m.id + '.json');
    const map = await getMany(paths).catch(() => new Map());
    const t = now(), out = [];
    list.forEach(m => {
      const rec = parseJSON(map.get('class/presence/' + m.id + '.json'));
      if (!rec || typeof rec.t !== 'number' || rec.t <= 0) return;
      const age = Math.max(0, t - rec.t);
      if (age < PRESENCE_TTL) out.push({ id: m.id, ageMs: age, bank: typeof rec.b === 'string' ? rec.b : '' });
    });
    return out;
  }

  return { configured, list: async o => (await provider()).list(o), getMany, memberCount, setPhoto, saveMarks, memberProgress, adminUsers, adminUser, adminProgress, adminSetName, adminSetPhoto, adminSetClass, adminDelete, checkCode, getMember, join, rename, leave, members, beat, unbeat, presences, paperOf, papersOf, spend, cached, remember, cleanName };
}

module.exports = { createClassStore, cleanName, cleanMarks, normaliseCode, QUOTA, MAX_MEMBERS, error };
