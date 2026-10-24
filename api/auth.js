// Vercel serverless function: accounts and saved progress.
// Passwords are never stored. Each account keeps a random salt and a scrypt hash.
// Data lives in a private Vercel Blob store. Sessions are signed tokens that last 30 days.
const crypto = require('crypto');

const DAY = 86400000;
const SESSION_MS = 30 * DAY;
const MAX_PROGRESS = 3500000;
const MAX_FAILS = 8;
const LOCK_MS = 15 * 60000;
let SECRET = null;

async function blob() { return import('@vercel/blob'); }
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const b64 = (b) => Buffer.from(b).toString('base64url');

async function readJSON(path) {
  const { get } = await blob();
  const r = await get(path, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  const chunks = [];
  for await (const c of r.stream) chunks.push(Buffer.from(c));
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch (e) { return null; }
}
async function writeJSON(path, data, overwrite) {
  const { put } = await blob();
  return put(path, JSON.stringify(data), { access: 'private', addRandomSuffix: false, allowOverwrite: !!overwrite, contentType: 'application/json' });
}
const exists = (e) => /already exists/i.test(String((e && e.message) || e));

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
  if (!token || token.indexOf('.') < 0) return null;
  const [body, mac] = token.split('.');
  const want = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!p || !p.id || !p.exp || p.exp < Date.now()) return null;
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
        const salt = crypto.randomBytes(16);
        const hash = await hashPw(pw, salt);
        try {
          await writeJSON(path, { email, salt: salt.toString('hex'), hash: hash.toString('hex'), created: Date.now(), fails: 0, lock: 0 }, false);
        } catch (e) {
          if (exists(e)) return fail(409, 'An account with this email already exists. Sign in instead.');
          throw e;
        }
        const token = await sign({ id, email, exp: Date.now() + SESSION_MS });
        return res.status(200).json({ token, email });
      }
      const u = await readJSON(path);
      if (u && u.lock && u.lock > Date.now()) return fail(429, 'Too many wrong passwords. Try again in 15 minutes.');
      let ok = false;
      if (u) {
        const h = await hashPw(pw, Buffer.from(u.salt, 'hex'));
        const w = Buffer.from(u.hash, 'hex');
        ok = h.length === w.length && crypto.timingSafeEqual(h, w);
      } else {
        await hashPw(pw, Buffer.alloc(16));
      }
      if (!ok) {
        if (u) {
          u.fails = (u.fails || 0) + 1;
          if (u.fails >= MAX_FAILS) { u.lock = Date.now() + LOCK_MS; u.fails = 0; }
          try { await writeJSON(path, u, true); } catch (e) {}
        }
        await sleep(400);
        return fail(401, 'The email or password is not correct.');
      }
      if (u.fails || u.lock) { u.fails = 0; u.lock = 0; try { await writeJSON(path, u, true); } catch (e) {} }
      const token = await sign({ id, email: u.email, exp: Date.now() + SESSION_MS });
      return res.status(200).json({ token, email: u.email });
    }

    const auth = String(req.headers.authorization || '');
    const sess = await verify(auth.replace(/^Bearer\s+/i, ''));
    if (!sess) return fail(401, 'Your sign-in has expired. Sign in again.');
    const ppath = 'progress/' + sess.id + '.json';

    if (p.action === 'load') {
      const data = await readJSON(ppath);
      return res.status(200).json({ email: sess.email, data: data || null });
    }
    if (p.action === 'save') {
      const text = JSON.stringify(p.data || {});
      if (text.length > MAX_PROGRESS) return fail(413, 'Your saved progress is too large to store.');
      const { put } = await blob();
      await put(ppath, text, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
      return res.status(200).json({ ok: true, at: Date.now() });
    }
    return fail(400, 'Unknown request.');
  } catch (e) {
    return fail(500, 'The account service had a problem. Try again in a moment.');
  }
};
