// Vercel serverless function: accounts and saved progress.
// Passwords are never stored. Each account keeps a random salt and a scrypt hash.
// Data lives in a private Cloudflare D1 database (server/d1-blob.js). Sessions are signed tokens that last 30 days.
const crypto = require('crypto');

const DAY = 86400000;
const SESSION_MS = 30 * DAY;
const MAX_PROGRESS = 3500000;
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60000;
let SECRET = null;

async function blob() { return require('../server/d1-blob'); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b64 = (b) => Buffer.from(b).toString('base64url');

async function readRecord(path) {
  const { get } = await blob();
  const r = await get(path, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  const chunks = [];
  for await (const c of r.stream) chunks.push(Buffer.from(c));
  return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')), etag: r.blob.etag };
}
async function readJSON(path) { const r = await readRecord(path); return r && r.data; }
async function writeJSON(path, data, overwrite, etag) {
  const { put } = await blob();
  const options = { access: 'private', addRandomSuffix: false, allowOverwrite: !!overwrite, contentType: 'application/json' };
  if (etag) options.ifMatch = etag;
  return put(path, JSON.stringify(data), options);
}
const exists = (e) => /already exists/i.test(String((e && e.message) || e));
const conflict = (e) => e && (e.name === 'BlobPreconditionFailedError' || /precondition/i.test(e.message)) || exists(e);
async function updateRecord(path, change) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const r = await readRecord(path);
    if (r && !r.etag) throw new Error('Storage did not provide a version.');
    const next = change(r && r.data);
    if (next === null) return r && r.data;
    try { await writeJSON(path, next, !!r, r && r.etag); return next; }
    catch (e) { if (!conflict(e)) throw e; }
  }
  const e = new Error('The account is busy. Try again in a moment.'); e.status = 503; throw e;
}
// Daily backups. The first save of each UTC day first copies the previous state to
// backup/<id>/<day>.json. This costs one extra write per active account per day, and the
// day is remembered inside the progress record so normal saves cost nothing extra.
const BACKUP_DAYS = 7;
const BACKUP_NAME = /^(?:\d{4}-\d{2}-\d{2}|before-restore-\d{13})$/;
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
async function writeBackup(id, name, text) {
  const { put } = await blob();
  try { await put('backup/' + id + '/' + name + '.json', text, { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json' }); }
  catch (e) { if (!exists(e)) throw e; }
}
async function pruneBackups(id) {
  const old = [];
  for (let n = BACKUP_DAYS + 1; n <= BACKUP_DAYS + 14; n++) old.push('backup/' + id + '/' + dayOf(Date.now() - n * DAY) + '.json');
  try { const { del } = await blob(); await del(old); } catch (e) { console.error('backup prune error:', e && e.message); }
}
function progressView(data) {
  data = data || {};
  const revisions = Object.assign({}, data._revisions || {});
  Object.keys(data.u || {}).forEach(id => { if (!revisions[id]) revisions[id] = sha(JSON.stringify(data.u[id])); });
  const clean = Object.assign({}, data); delete clean._revisions; delete clean._backupDay; delete clean._saveDay; delete clean._saveCount;
  return { data: clean, revisions };
}
function mergeHistory(a, b) {
  const result = (a || []).slice();
  (b || []).forEach(h => { if (!result.some(x => x.id === h.id && x.at === h.at)) result.push(h); });
  return result;
}

async function secret() {
  if (SECRET) return SECRET;
  let s = await readJSON('system/secret.json');
  if (!s || !s.k) {
    try { await writeJSON('system/secret.json', { k: crypto.randomBytes(32).toString('hex') }, false); } catch (e) { if (!exists(e)) throw e; }
    s = await readJSON('system/secret.json');
  }
  SECRET = Buffer.from(s.k, 'hex');
  return SECRET;
}
async function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
  return body + '.' + mac;
}
async function verify(token) {
  if (typeof token !== 'string' || token.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [body, mac] = token.split('.');
  const want = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!p || typeof p !== 'object' || Array.isArray(p) || typeof p.id !== 'string' || !/^[a-f0-9]{64}$/.test(p.id) || !Number.isSafeInteger(p.exp) || p.exp <= Date.now()) return null;
  return p;
}
function hashPw(pw, salt) {
  return new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,200}\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST.' }); return; }
  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
  p = p || {};
  const fail = (code, error) => res.status(code).json({ error });
  try {
    if (p.action === 'signup' || p.action === 'login') {
      const email = String(p.email || '').trim().toLowerCase();
      const pw = String(p.password || '');
      if (!EMAIL.test(email) || email.length > 120) return fail(400, 'Enter a valid email address.');
      if (pw.length < 8) return fail(400, 'The password must be at least 8 characters.');
      if (pw.length > 200) return fail(400, 'The password is too long.');
      const id = sha(email);
      const path = 'users/' + id + '.json';
      if (p.action === 'signup') {
        // Name is shown to classmates. A class code joins the class straight away; a wrong code stops sign-up before anything is created.
        const classCode = String(p.classCode || '').trim();
        const classes = classCode || p.name ? require('../server/class-store') : null;
        const name = p.name != null && String(p.name).trim() ? classes.cleanName(p.name) : '';
        if (classCode) {
          if (!name) return fail(400, 'Enter your name to join the class.');
          await classes.createClassStore().checkCode(classCode);
        }
        const salt = crypto.randomBytes(16);
        const hash = await hashPw(pw, salt);
        try {
          await writeJSON(path, Object.assign({ email, salt: salt.toString('hex'), hash: hash.toString('hex'), created: Date.now(), fails: 0, lock: 0 }, name ? { name } : {}), false);
        } catch (e) {
          if (exists(e)) return fail(409, 'An account with this email already exists. Sign in instead.');
          throw e;
        }
        let joined = false, joinError = '';
        // The account already exists, so a failed join must not look like a failed sign-up: report it and let them join from the Class page.
        if (classCode) { try { await classes.createClassStore().join(id, name, classCode); joined = true; } catch (e) { joinError = e && e.status ? e.message : 'Could not join the class just now. Join from the Class page.'; } }
        const token = await sign({ id, email, exp: Date.now() + SESSION_MS });
        return res.status(200).json(Object.assign({ token, email, name, joined }, joinError ? { joinError } : {}));
      }
      const ticket = crypto.randomBytes(16).toString('hex');
      // Reserve a slot before hashing, so parallel requests cannot all pass the limit.
      const u = await updateRecord(path, current => {
        if (!current) return null;
        if (current.lock > Date.now()) {
          const e = new Error('Too many wrong passwords. Try again in 15 minutes.'); e.status = 429; throw e;
        }
        if (current.lock) { current.fails = 0; current.lock = 0; }
        current.fails = (current.fails || 0) + 1;
        if (current.fails >= MAX_FAILS) current.lock = Date.now() + LOCK_MS;
        current.lastAttempt = ticket;
        return current;
      });
      let ok = false;
      if (u) {
        const h = await hashPw(pw, Buffer.from(u.salt, 'hex'));
        const w = Buffer.from(u.hash, 'hex');
        ok = h.length === w.length && crypto.timingSafeEqual(h, w);
      } else {
        await hashPw(pw, Buffer.alloc(16));
      }
      if (!ok) {
        await sleep(400);
        return fail(401, 'The email or password is not correct.');
      }
      await updateRecord(path, current => {
        // Do not erase failures reserved by requests that arrived after this one.
        if (!current || current.lastAttempt !== ticket) return null;
        current.fails = 0; current.lock = 0; return current;
      });
      const token = await sign({ id, email: u.email, exp: Date.now() + SESSION_MS });
      return res.status(200).json({ token, email: u.email });
    }

    const auth = String(req.headers.authorization || '');
    const sess = await verify(auth.replace(/^Bearer\s+/i, ''));
    if (!sess) return fail(401, 'Your sign-in has expired. Sign in again.');
    const ppath = 'progress/' + sess.id + '.json';

    if (p.action === 'load') {
      const data = await readJSON(ppath);
      return res.status(200).json(Object.assign({ email: sess.email }, progressView(data)));
    }
    if (p.action === 'save') {
      const incoming = p.data || {};
      if (Buffer.byteLength(JSON.stringify(incoming)) > MAX_PROGRESS) return fail(413, 'Your saved progress is too large to store.');
      if (!Array.isArray(p.changes) || !p.revisions || p.changes.some(id => typeof id !== 'string' || !/^(?:[1-9]|10)$/.test(id))) {
        return fail(409, 'Reload this page to use the updated progress-saving system.');
      }
      const today = dayOf(Date.now());
      let snapshot = null;
      const saved = await updateRecord(ppath, current => {
        snapshot = current && current._backupDay !== today ? JSON.stringify(current) : null;
        const view = progressView(current), data = view.data, revisions = view.revisions;
        const clashes = p.changes.filter(id => (p.revisions[id] || null) !== (revisions[id] || null));
        if (clashes.length) {
          const e = new Error('This paper changed on another device. Choose which version to keep on the Account page.');
          e.status = 409; e.details = Object.assign({ code: 'progress_conflict', conflicts: clashes }, view); throw e;
        }
        data.u = Object.assign({}, data.u || {});
        p.changes.forEach(id => {
          if (incoming.u && incoming.u[id]) data.u[id] = incoming.u[id]; else delete data.u[id];
          revisions[id] = crypto.randomBytes(16).toString('hex');
        });
        data.hist = mergeHistory(data.hist, incoming.hist);
        if ((incoming.ts || 0) >= (data.ts || 0)) {
          ['ts', 'font', 'fg', 'bg'].forEach(k => { data[k] = incoming[k] || 0; });
        }
        data.v = 2; data._revisions = revisions; data._backupDay = today;
        if (!process.env.DISABLE_SAVE_CAPS) {
          const maxUserSaves = parseInt(process.env.MAX_DAILY_SAVES || '150', 10);
          const saveCount = (current && current._saveDay === today ? current._saveCount : 0) || 0;
          if (saveCount >= maxUserSaves) {
            const e = new Error('Daily save limit reached for this account. Your answers remain saved in this browser until tomorrow.');
            e.status = 429; e.details = { code: 'daily_save_cap_reached' }; throw e;
          }
          data._saveDay = today;
          data._saveCount = saveCount + 1;
        }
        if (typeof incoming.classCode === 'string') {
          const cc = incoming.classCode.toUpperCase().trim().slice(0, 20);
          if (/^[A-Z0-9_-]{2,20}$/.test(cc)) data.classCode = cc; else delete data.classCode;
        } else if (incoming.classCode === null || incoming.classCode === '') {
          delete data.classCode;
        }
        if (Buffer.byteLength(JSON.stringify(data)) > MAX_PROGRESS) {
          const e = new Error('Your saved progress is too large to store.'); e.status = 413; throw e;
        }
        return data;
      });
      if (snapshot) {
        try { await writeBackup(sess.id, today, snapshot); await pruneBackups(sess.id); }
        catch (e) { console.error('backup error:', e && (e.stack || e)); }
      }
      return res.status(200).json(Object.assign({ ok: true, at: Date.now() }, progressView(saved)));
    }
    if (p.action === 'backups') {
      const { list } = await blob();
      const found = await list({ prefix: 'backup/' + sess.id + '/' });
      const names = (found.blobs || []).map(b => String(b.pathname).slice(('backup/' + sess.id + '/').length).replace(/\.json$/, '')).filter(n => BACKUP_NAME.test(n)).sort().reverse();
      return res.status(200).json({ backups: names });
    }
    if (p.action === 'restore') {
      if (typeof p.name !== 'string' || !BACKUP_NAME.test(p.name)) return fail(400, 'Choose a backup from the list.');
      const snap = await readJSON('backup/' + sess.id + '/' + p.name + '.json');
      if (!snap) return fail(404, 'That backup no longer exists.');
      const now = await readJSON(ppath);
      if (now) await writeBackup(sess.id, 'before-restore-' + Date.now(), JSON.stringify(now));
      const restored = await updateRecord(ppath, current => {
        const data = progressView(snap).data, revisions = {};
        const ids = new Set([...Object.keys(data.u || {}), ...Object.keys((current && current.u) || {}), ...Object.keys((current && current._revisions) || {})]);
        ids.forEach(id => { revisions[id] = crypto.randomBytes(16).toString('hex'); });
        data.u = data.u || {};
        data.hist = mergeHistory(data.hist, current && current.hist);
        data.v = 2; data._revisions = revisions; data._backupDay = dayOf(Date.now());
        return data;
      });
      return res.status(200).json(Object.assign({ ok: true, restored: p.name }, progressView(restored)));
    }
    return fail(400, 'Unknown request.');
  } catch (e) {
    if (e.status) return res.status(e.status).json(Object.assign({ error: e.message }, e.details || {}));
    console.error('auth error:', e && (e.stack || e));
    if (!(await blob()).configured()) return fail(503, 'Account storage is not connected to this site yet. The site owner needs to add the Cloudflare D1 settings in Vercel and redeploy.');
    const kind = String((e && e.name) || 'Error').slice(0, 60);
    if (/access|private|public|store/i.test(String((e && e.message) || ''))) return fail(503, 'Account storage is set up wrongly (it must be a private Blob store). Error: ' + kind + '.');
    return fail(500, 'The account service had a problem. Try again in a moment. (Error: ' + kind + ')');
  }
};

// Other server handlers share the same signature and expiry validation.
module.exports.verifySession = verify;
