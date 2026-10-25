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
  if (name.length < 2 || name.length > 40 || /^(hi|hai|test)$/i.test(name)) throw error(400, 'bad_name', 'Enter your name (2 to 40 characters). Classmates will see it next to your answers.');
  return name;
}
const normaliseCode = value => String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, '');

function createClassStore(options) {
  options = options || {};
  const provider = options.blob || (() => require('./d1-blob'));
  const now = options.now || Date.now;
  const codeSource = options.classCode || (() => process.env.CLASS_CODE);
  const hour = () => new Date(now()).toISOString().slice(0, 13);
  const day = () => new Date(now()).toISOString().slice(0, 10);
  const configuredCode = () => normaliseCode(codeSource());
  const isPreconditionFailure = e => e && (e.name === 'BlobPreconditionFailedError' || /precondition|already exists/i.test(String(e.message)));

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
    return { name: clean };
  }
  async function rename(id, name) {
    const member = await getMember(id);
    if (!member) throw error(403, 'not_member', 'Join the class first.');
    const clean = cleanName(name);
    await update('class/members/' + id + '.json', current => Object.assign({}, current, { name: clean }));
    return { name: clean };
  }
  async function leave(id) {
    if (!ID.test(id)) return;
    await (await provider()).del(['class/members/' + id + '.json']);
  }
  async function members() {
    const store = await provider();
    const listed = await store.list({ prefix: 'class/members/' });
    const ids = (listed.blobs || []).map(b => String(b.pathname).slice('class/members/'.length).replace(/\.json$/, '')).filter(id => ID.test(id)).slice(0, MAX_MEMBERS);
    const out = [];
    const purgeIds = [];
    const isRealD1 = !options.blob;
    for (let i = 0; i < ids.length; i += 8) {
      const rows = await Promise.all(ids.slice(i, i + 8).map(async id => {
        const m = await getMember(id);
        if (!m) return null;
        const clean = String(m.name || '').trim();
        if (/^(hi|hai|test)$/i.test(clean) || (isRealD1 && /^(priya|sam|joyce)$/i.test(clean))) {
          purgeIds.push(id);
          return null;
        }
        const profile = await read('profiles/' + id + '.json');
        return { id, name: m.name, joined: m.joined, photo: (profile && profile.data && profile.data.photo) || '' };
      }));
      rows.forEach(r => { if (r) out.push(r); });
    }
    if (purgeIds.length) {
      const delPaths = [];
      purgeIds.forEach(id => {
        delPaths.push('class/members/' + id + '.json', 'users/' + id + '.json', 'progress/' + id + '.json', 'profiles/' + id + '.json');
      });
      await store.del(delPaths).catch(() => {});
    }
    return out.sort((a, b) => a.joined - b.joined || a.id.localeCompare(b.id));
  }
  // One saved paper per member: u[bankId] from progress/<id>.json. Returned as stored; callers pick the fields they show.
  async function paperOf(id, bankId) {
    const r = ID.test(id) ? await read('progress/' + id + '.json') : null;
    const paper = r && r.data && r.data.u && r.data.u[bankId];
    return paper && typeof paper === 'object' ? paper : null;
  }
  async function papersOf(id) {
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
    return { photo };
  }

  return { configured, setPhoto, checkCode, getMember, join, rename, leave, members, paperOf, papersOf, spend, cached, remember, cleanName };
}

module.exports = { createClassStore, cleanName, normaliseCode, QUOTA, MAX_MEMBERS, error };
