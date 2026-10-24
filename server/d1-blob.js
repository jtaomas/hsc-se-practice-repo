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

function create(config) {
  config = config || {};
  const env = () => ({
    account: config.accountId || process.env.CF_ACCOUNT_ID,
    database: config.databaseId || process.env.D1_DATABASE_ID,
    token: config.apiToken || process.env.CF_API_TOKEN
  });
  const doFetch = (...a) => (config.fetch || fetch)(...a);
  let ready = null;

  async function sql(statement, params, signal) {
    const c = env();
    if (!c.account || !c.database || !c.token) { const e = new Error('Account storage is not configured.'); e.name = 'StorageNotConfigured'; throw e; }
    const url = 'https://api.cloudflare.com/client/v4/accounts/' + encodeURIComponent(c.account) + '/d1/database/' + encodeURIComponent(c.database) + '/query';
    let last;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) await new Promise(r => setTimeout(r, 150 * attempt));
      let res, json;
      try {
        res = await doFetch(url, { method: 'POST', signal, headers: { authorization: 'Bearer ' + c.token, 'content-type': 'application/json' }, body: JSON.stringify({ sql: statement, params: params || [] }) });
        json = await res.json().catch(() => null);
      } catch (e) { if (signal && signal.aborted) throw e; last = e; continue; }
      if (res.status === 429 || res.status >= 500) { last = new Error('Storage busy (' + res.status + ')'); continue; }
      if (!res.ok || !json || json.success === false) {
        const detail = json && json.errors && json.errors[0] && json.errors[0].message;
        const e = new Error('Storage request failed' + (detail ? ': ' + String(detail).slice(0, 120) : ' (' + res.status + ')'));
        e.name = res.status === 401 || res.status === 403 ? 'StorageAuthError' : 'StorageError';
        throw e;
      }
      const first = json.result && json.result[0];
      return { rows: (first && first.results) || [], changes: (first && first.meta && first.meta.changes) || 0 };
    }
    throw last || new Error('Storage unavailable');
  }
  async function init(signal) {
    if (!ready) ready = sql(SCHEMA, [], signal).catch(e => { ready = null; throw e; });
    return ready;
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
    await init(signal);
    const r = await sql('SELECT body, etag FROM blobs WHERE path = ?', [path], signal);
    if (!r.rows.length) return null;
    return { statusCode: 200, stream: Readable.from([decode(r.rows[0].body)]), blob: { etag: String(r.rows[0].etag), pathname: path } };
  }
  async function put(path, value, options) {
    options = options || {};
    const signal = options.abortSignal;
    await init(signal);
    const body = encode(value), etag = newEtag(), now = Date.now();
    if (options.ifMatch) {
      const r = await sql('UPDATE blobs SET body = ?, etag = ?, updated = ? WHERE path = ? AND etag = ?', [body, etag, now, path, options.ifMatch], signal);
      if (!r.changes) throw new BlobPreconditionFailedError();
    } else if (options.allowOverwrite) {
      await sql('INSERT INTO blobs (path, body, etag, updated) VALUES (?, ?, ?, ?) ON CONFLICT(path) DO UPDATE SET body = excluded.body, etag = excluded.etag, updated = excluded.updated', [path, body, etag, now], signal);
    } else {
      const r = await sql('INSERT INTO blobs (path, body, etag, updated) VALUES (?, ?, ?, ?) ON CONFLICT(path) DO NOTHING', [path, body, etag, now], signal);
      if (!r.changes) throw new Error('This blob already exists');
    }
    return { pathname: path, etag };
  }
  async function list(options) {
    const prefix = String((options && options.prefix) || '');
    await init();
    const r = await sql('SELECT path FROM blobs WHERE path >= ? AND path < ? ORDER BY path LIMIT 1000', [prefix, prefix + '￿']);
    return { blobs: r.rows.map(row => ({ pathname: String(row.path) })), hasMore: false };
  }
  async function del(paths) {
    paths = [].concat(paths || []).filter(p => typeof p === 'string');
    await init();
    for (let i = 0; i < paths.length; i += 50) {
      const chunk = paths.slice(i, i + 50);
      await sql('DELETE FROM blobs WHERE path IN (' + chunk.map(() => '?').join(',') + ')', chunk);
    }
  }
  const configured = () => { const c = env(); return !!(c.account && c.database && c.token); };
  return { get, put, list, del, configured, BlobPreconditionFailedError };
}

module.exports = Object.assign(create(), { create, BlobPreconditionFailedError });
