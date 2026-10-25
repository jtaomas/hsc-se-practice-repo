// Vercel serverless function: accounts and saved progress.
// Passwords are never stored. Each account keeps a random salt and a scrypt hash.
// Data lives in a private Cloudflare D1 database (server/d1-blob.js). Sessions are signed tokens that last 30 days.
const crypto = require('crypto');
const { performance } = require('node:perf_hooks');

const DAY = 86400000;
const SESSION_MS = 30 * DAY;
const MAX_PROGRESS = 3500000;
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60000;
const STORAGE_TIMEOUT_MS = 5000;
const UPDATE_TIMEOUT_MS = 10000;
const UPDATE_ATTEMPTS = 16;
let SECRET = null;

async function blob() { return require('../server/d1-blob'); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b64 = (b) => Buffer.from(b).toString('base64url');

function storageError(code, message) {
  const e = new Error(message); e.status = 503; e.code = code; e.details = { code }; return e;
}
function storageBusy() { return storageError('account_storage_busy', 'The account is busy. Try again in a moment.'); }
async function bounded(operation, deadline = Infinity) {
  const controller = new AbortController(), end = Math.min(performance.now() + STORAGE_TIMEOUT_MS, deadline);
  const timeout = () => end === deadline ? storageBusy() : storageError('account_storage_timeout', 'Account storage exceeded its time limit. Your progress is still saved in this browser.');
  const expired = () => { if (controller.signal.aborted || performance.now() >= end) throw timeout(); };
  let timer;
  try {
    expired();
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal, expired)),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(timeout()); }, Math.max(0, end - performance.now())); })
    ]);
  } finally { clearTimeout(timer); controller.abort(); }
}
async function readRecord(path, deadline, requireVersion) {
  try {
    return await bounded(async (signal, expired) => {
      const { get } = await blob(); expired();
      const r = await get(path, { access: 'private', useCache: false, headers: { 'Accept-Encoding': 'identity' }, abortSignal: signal }); expired();
      if (!r || r.statusCode === 404) return null;
      if (r.statusCode !== 200 || !r.stream) throw new Error('Invalid stored record');
      const etag = r.blob && r.blob.etag;
      // A conditional update must use the exact strong version of the bytes read.
      // Never strip W/ or substitute the version of a later metadata request.
      if (requireVersion && (typeof etag !== 'string' || !etag || etag.startsWith('W/'))) throw storageError('account_storage_version', 'Account storage could not verify the saved record. Please try again shortly.');
      const chunks = []; let bytes = 0;
      for await (const c of r.stream) { expired(); const chunk = Buffer.from(c); bytes += chunk.length; if (bytes > MAX_PROGRESS) throw new Error('Stored record too large'); chunks.push(chunk); }
      expired();
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid stored record');
      return { data, etag };
    }, deadline);
  } catch (e) {
    if (typeof e.code === 'string' && e.code.startsWith('account_storage_')) throw e;
    throw storageError('account_storage_unavailable', 'Account storage is temporarily unavailable. Please try again shortly.');
  }
}
async function readJSON(path) { const r = await readRecord(path); return r && r.data; }
async function writeJSON(path, data, overwrite, etag, deadline) {
  try {
    return await bounded(async (signal, expired) => {
      const { put } = await blob(); expired();
      const options = { access: 'private', addRandomSuffix: false, allowOverwrite: !!overwrite, contentType: 'application/json', abortSignal: signal };
      if (etag) options.ifMatch = etag;
      const result = await put(path, JSON.stringify(data), options); expired(); return result;
    }, deadline);
  } catch (e) {
    if (conflict(e) || (typeof e.code === 'string' && e.code.startsWith('account_storage_'))) throw e;
    throw storageError('account_storage_unavailable', 'Account storage is temporarily unavailable. Please try again shortly.');
  }
}
const exists = (e) => /already exists/i.test(String((e && e.message) || e));
const conflict = (e) => e && (e.name === 'BlobPreconditionFailedError' || /precondition/i.test(e.message)) || exists(e);
async function updateRecord(path, change) {
  const deadline = performance.now() + UPDATE_TIMEOUT_MS;
  for (let attempt = 0; attempt < UPDATE_ATTEMPTS; attempt++) {
    if (performance.now() >= deadline) throw storageBusy();
    const r = await readRecord(path, deadline, true);
    const next = change(r && r.data);
    if (next === null) return r && r.data;
    try { await writeJSON(path, next, !!r, r && r.etag, deadline); return next; }
    catch (e) { if (!conflict(e)) throw e; }
    if (attempt + 1 === UPDATE_ATTEMPTS) break;
    const cap = Math.min(500, 50 * Math.pow(2, attempt));
    const delay = Math.min(Math.floor(cap / 2 + Math.random() * cap / 2), deadline - performance.now());
    if (delay <= 0) throw storageBusy();
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw storageBusy();
}
// Daily backups. The first save of each UTC day first copies the previous state to
// backup/<id>/<day>.json. This costs one extra write per active account per day, and the
// day is remembered inside the progress record so normal saves cost nothing extra.
const BACKUP_DAYS = 7;
const BACKUP_NAME = /^(?:\d{4}-\d{2}-\d{2}|before-restore-\d{13})$/;
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
async function writeBackup(id, name, text) {
  try { await writeJSON('backup/' + id + '/' + name + '.json', JSON.parse(text), false); }
  catch (e) { if (!exists(e)) throw e; }
}
async function pruneBackups(id) {
  const old = [];
  for (let n = BACKUP_DAYS + 1; n <= BACKUP_DAYS + 14; n++) old.push('backup/' + id + '/' + dayOf(Date.now() - n * DAY) + '.json');
  try { await bounded(async (signal, expired) => { const { del } = await blob(); expired(); await del(old, { abortSignal: signal }); expired(); }); }
  catch (e) { console.error('backup prune error:', e && e.message); }
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
function isEduEmail(e) {
  return /^[^\s@]+@(?:[^\s@]+\.)*(?:edu(?:\.[a-z]{2})?|education\.nsw\.gov\.au|det\.nsw\.edu\.au|test)$/i.test(String(e || '').trim());
}

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
        if (!isEduEmail(email)) return fail(400, 'Please use your education email address (e.g. name@education.nsw.gov.au).');
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

    if (p.action === 'profile') {
      const photo = p.photo;
      if (typeof photo !== 'string' || photo.length > 44000 || (photo && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))) return fail(400, 'Choose a JPEG, PNG or WebP image using the photo picker.');
      if (photo) {
        const bytes = Buffer.from(photo.split(',')[1], 'base64');
        if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216 || bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) return fail(400, 'The profile picture is invalid.');
      }
      await updateRecord('profiles/' + sess.id + '.json', () => ({ photo }));
      return res.status(200).json({ ok: true, photo });
    }

    if (p.action === 'load') {
      const data = await readJSON(ppath);
      return res.status(200).json(Object.assign({ email: sess.email, photo: ((await readJSON('profiles/' + sess.id + '.json')) || {}).photo || '' }, progressView(data)));
    }
    if (p.action === 'save') {
      const incoming = p.data || {};
      if (Buffer.byteLength(JSON.stringify(incoming)) > MAX_PROGRESS) return fail(413, 'Your saved progress is too large to store.');
      if (!Array.isArray(p.changes) || !p.revisions || p.changes.some(id => typeof id !== 'string' || !/^(?:[1-9]|1[0-9])$/.test(id))) {
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
          // Saves arrive about every 20 seconds while a student works, so a full 2 h 20 min exam alone can
          // need about 420. The old default of 150 stopped account saves part-way through an exam.
          // 1000 is still well inside the D1 free tier (one row written per save).
          const maxUserSaves = parseInt(process.env.MAX_DAILY_SAVES || '1000', 10);
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
      const found = await bounded(async (signal, expired) => {
        const { list } = await blob(); expired();
        const result = await list({ prefix: 'backup/' + sess.id + '/', abortSignal: signal }); expired(); return result;
      });
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
        // Restoring answers does not reset the current account's save allowance.
        ['_saveDay', '_saveCount'].forEach(key => {
          if (current && Object.prototype.hasOwnProperty.call(current, key)) data[key] = current[key];
        });
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
    if (/access|private|public|store/i.test(String((e && e.message) || ''))) return fail(503, 'Account storage could not be accessed. Check the Cloudflare D1 settings. Error: ' + kind + '.');
    return fail(500, 'The account service had a problem. Try again in a moment. (Error: ' + kind + ')');
  }
};

// Other server handlers share the same signature and expiry validation.
module.exports.verifySession = verify;
