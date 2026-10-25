'use strict';
// Blob-style key/value storage on Cloudflare D1 (free, hard-capped, no card needed).
// Same small surface the site used with Vercel Blob: get, put (with ifMatch and allowOverwrite), list, del.
// One table, one row per path. Bodies are gzipped and base64 encoded so a 3.5 MB progress record fits
// D1's 2 MB row limit. Every write gets a fresh random etag; ifMatch is a compare-and-swap on that etag.
// Settings (Vercel environment variables): CF_ACCOUNT_ID, D1_DATABASE_ID, CF_API_TOKEN (D1 Edit permission).
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { Readable } = require('node:stream');

class BlobPreconditionFailedError extends Error {
  constructor() { super('Precondition failed'); this.name = 'BlobPreconditionFailedError'; }
}
const SCHEMA = 'CREATE TABLE IF NOT EXISTS blobs (path TEXT PRIMARY KEY, body TEXT NOT NULL, etag TEXT NOT NULL, updated INTEGER NOT NULL) WITHOUT ROWID';
const MAX_BODY = 8 * 1024 * 1024;
function checkSignal(signal) {
  if (signal && signal.aborted) { const e = new Error('Storage request cancelled.'); e.name = 'AbortError'; throw e; }
}
function pause(ms, signal) {
  checkSignal(signal);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { if (signal) signal.removeEventListener('abort', abort); resolve(); }, ms);
    function abort() { clearTimeout(timer); if (signal) signal.removeEventListener('abort', abort); const e = new Error('Storage request cancelled.'); e.name = 'AbortError'; reject(e); }
    if (signal) signal.addEventListener('abort', abort, { once: true });
  });
}

function create(config) {
  config = config || {};
  const env = () => ({
    account: config.accountId || process.env.CF_ACCOUNT_ID,
    database: config.databaseId || process.env.D1_DATABASE_ID,
    token: config.apiToken || process.env.CF_API_TOKEN
  });
  const doFetch = (...a) => (config.fetch || fetch)(...a);
  let ready = null;
  const cacheEnabled = config.cache !== undefined ? !!config.cache : !config.fetch;
  const cacheTTL = typeof config.cacheTTL === 'number' ? config.cacheTTL : 5000;
  const cache = new Map();

  function cacheSet(path, value) {
    if (!cacheEnabled) return;
    if (cache.size >= 1000) cache.delete(cache.keys().next().value);
    cache.set(path, value);
  }
  function cacheGet(path) {
    if (!cacheEnabled) return null;
    const item = cache.get(path);
    if (!item) return null;
    if (Date.now() > item.expires) {
      cache.delete(path);
      return null;
    }
    return item;
  }
  function cacheDelete(path) {
    cache.delete(path);
  }

  async function sql(statement, params, signal, retrySafe = true) {
    checkSignal(signal);
    const c = env();
    if (!c.account || !c.database || !c.token) { const e = new Error('Account storage is not configured.'); e.name = 'StorageNotConfigured'; throw e; }
    const url = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(c.account) + '/d1/database/' + encodeURIComponent(c.database) + '/query';
    let last;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await pause(150 * attempt, signal);
      checkSignal(signal);
      let res, json;
      try {
        res = await doFetch(url, { method: 'POST', signal, headers: { authorization: 'Bearer ' + c.token, 'content-type': 'application/json' }, body: JSON.stringify({ sql: statement, params: params || [] }) });
        checkSignal(signal);
        json = await res.json().catch(() => null);
        checkSignal(signal);
      } catch (e) {
        checkSignal(signal);
        if (!retrySafe) { const uncertain = new Error('Storage write could not be confirmed.'); uncertain.uncertainMutation = true; throw uncertain; }
        last = e; continue;
      }
      if (res.status === 429 || res.status >= 500) {
        last = new Error('Storage busy (' + res.status + ')');
        if (!retrySafe) { last.uncertainMutation = true; throw last; }
        continue;
      }
      const first = json && Array.isArray(json.result) && json.result.length === 1 && json.result[0];
      if (!res.ok || !json || json.success !== true || first && first.success === false) {
        const detail = json && json.errors && json.errors[0] && json.errors[0].message;
        const e = new Error('Storage request failed' + (detail ? ': ' + String(detail).slice(0, 120) : ' (' + res.status + ')'));
        e.name = res.status === 401 || res.status === 403 ? 'StorageAuthError' : 'StorageError';
        // An unknown 2xx envelope does not tell us whether the write committed.
        // Explicit API/query failures remain failures; an absent/malformed
        // success field gets the same exact-version confirmation as a lost body.
        if (!retrySafe && res.ok && (!json || json.success !== false && !(first && first.success === false))) e.uncertainMutation = true;
        throw e;
      }
      const changes = first && first.meta && first.meta.changes;
      if (!first || !Array.isArray(first.results) || (changes != null && (!Number.isSafeInteger(changes) || changes < 0)) || !retrySafe && changes == null) {
        const e = new Error('Storage returned an invalid query result.'); e.uncertainMutation = !retrySafe; throw e;
      }
      return { rows: first.results, changes: changes || 0 };
    }
    throw last || new Error('Storage unavailable');
  }
  async function init(signal) {
    checkSignal(signal);
    const globalInit = config.tableInitialized ||
                       process.env.D1_TABLE_INITIALIZED === '1' ||
                       process.env.D1_TABLE_INITIALIZED === 'true' ||
                       (globalThis.__d1TableInitialized && !config.fetch);
    if (globalInit) {
      if (!ready) ready = Promise.resolve();
      return;
    }
    if (!ready) {
      ready = sql(SCHEMA, [], signal).then(() => {
        globalThis.__d1TableInitialized = true;
      }).catch(e => { ready = null; throw e; });
    }
    await ready;
    checkSignal(signal);
  }
  const encode = (value) => {
    const buf = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
    if (buf.length > MAX_BODY) throw new Error('Record is too large to store.');
    return zlib.gzipSync(buf, { level: 6 }).toString('base64');
  };
  const decode = (text) => zlib.gunzipSync(Buffer.from(text, 'base64'));
  const newEtag = () => crypto.randomBytes(12).toString('hex');

  async function get(path, options) {
    const signal = options && options.abortSignal;
    const skipCache = !cacheEnabled || (options && (options.noCache || options.useCache === false));
    if (!skipCache && typeof path === 'string') {
      const cached = cacheGet(path);
      if (cached) {
        checkSignal(signal);
        return { statusCode: 200, stream: Readable.from([cached.body]), blob: { etag: cached.etag, pathname: path } };
      }
    }
    await init(signal);
    const r = await sql('SELECT body, etag FROM blobs WHERE path = ?', [path], signal);
    if (!r.rows.length) return null;
    const body = decode(r.rows[0].body);
    const etag = String(r.rows[0].etag);
    if (!skipCache && typeof path === 'string') {
      cacheSet(path, { body, etag, expires: Date.now() + cacheTTL });
    }
    return { statusCode: 200, stream: Readable.from([body]), blob: { etag, pathname: path } };
  }
  async function getMany(paths, options) {
    paths = [].concat(paths || []).filter(p => typeof p === 'string');
    if (!paths.length) return new Map();
    const signal = options && options.abortSignal;
    const skipCache = !cacheEnabled || (options && (options.noCache || options.useCache === false));
    const results = new Map();
    const missing = [];
    if (!skipCache) {
      for (const p of paths) {
        if (results.has(p)) continue;
        const cached = cacheGet(p);
        if (cached) {
          results.set(p, {
            statusCode: 200,
            body: cached.body,
            blob: { etag: cached.etag, pathname: p }
          });
        } else if (!missing.includes(p)) {
          missing.push(p);
        }
      }
    } else {
      for (const p of paths) {
        if (!missing.includes(p)) missing.push(p);
      }
    }
    if (!missing.length) {
      checkSignal(signal);
      return results;
    }
    await init(signal);
    for (let i = 0; i < missing.length; i += 50) {
      const chunk = missing.slice(i, i + 50);
      const placeholders = chunk.map(() => '?').join(',');
      const r = await sql('SELECT path, body, etag FROM blobs WHERE path IN (' + placeholders + ')', chunk, signal);
      for (const row of r.rows) {
        const body = decode(row.body);
        const etag = String(row.etag);
        if (!skipCache) {
          cacheSet(row.path, { body, etag, expires: Date.now() + cacheTTL });
        }
        results.set(row.path, {
          statusCode: 200,
          body,
          blob: { etag: String(row.etag), pathname: row.path }
        });
      }
    }
    return results;
  }
  async function put(path, value, options) {
    options = options || {};
    const signal = options.abortSignal;
    await init(signal);
    const body = encode(value), etag = newEtag(), now = Date.now();
    try {
      if (options.ifMatch) {
        const r = await sql('UPDATE blobs SET body = ?, etag = ?, updated = ? WHERE path = ? AND etag = ?', [body, etag, now, path, options.ifMatch], signal, false);
        if (!r.changes) throw new BlobPreconditionFailedError();
      } else if (options.allowOverwrite) {
        await sql('INSERT INTO blobs (path, body, etag, updated) VALUES (?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET body = excluded.body, etag = excluded.etag, updated = excluded.updated', [path, body, etag, now], signal, false);
      } else {
        const r = await sql('INSERT INTO blobs (path, body, etag, updated) VALUES (?, ?, ?, ?) ON CONFLICT(path) DO NOTHING', [path, body, etag, now], signal, false);
        if (!r.changes) throw new Error('This blob already exists');
      }
    } catch (error) {
      cacheDelete(path);
      if (!error.uncertainMutation) throw error;
      checkSignal(signal);
      // A lost acknowledgement must not replay an increment, mistake our own
      // lease for another job, or overwrite a concurrent writer. Confirm only
      // this exact operation's fresh version AND bytes; never substitute a new
      // version for data from an earlier read.
      let observed;
      try { observed = await sql('SELECT body, etag FROM blobs WHERE path = ?', [path], signal); }
      catch (_) { checkSignal(signal); throw error; }
      checkSignal(signal);
      if (observed.rows.length !== 1 || observed.rows[0].etag !== etag || observed.rows[0].body !== body) throw error;
    }
    if (cacheEnabled && typeof path === 'string') {
      const valBuf = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
      cacheSet(path, { body: valBuf, etag, expires: Date.now() + cacheTTL });
    }
    return { pathname: path, etag };
  }
  async function list(options) {
    const prefix = String((options && options.prefix) || '');
    const signal = options && options.abortSignal;
    await init(signal);
    const r = await sql('SELECT path FROM blobs WHERE path >= ? AND path < ? ORDER BY path LIMIT 1000', [prefix, prefix + '￿'], signal);
    return { blobs: r.rows.map(row => ({ pathname: String(row.path) })), hasMore: false };
  }
  async function del(paths, options) {
    paths = [].concat(paths || []).filter(p => typeof p === 'string');
    for (const p of paths) cacheDelete(p);
    const signal = options && options.abortSignal;
    await init(signal);
    for (let i = 0; i < paths.length; i += 50) {
      const chunk = paths.slice(i, i + 50);
      await sql('DELETE FROM blobs WHERE path IN (' + chunk.map(() => '?').join(',') + ')', chunk, signal, true);
    }
  }
  const configured = () => { const c = env(); return !!(c.account && c.database && c.token); };
  return { get, getMany, put, list, del, configured, BlobPreconditionFailedError };
}

module.exports = Object.assign(create(), { create, BlobPreconditionFailedError });
