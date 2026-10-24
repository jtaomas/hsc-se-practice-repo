'use strict';
// Bearer exports are explicitly shared files, never public account lookups.
const crypto = require('node:crypto');
const { error } = require('./comparison-input');
const TTL_MS = 7 * 86400000;
const MAX_EXPORT_BYTES = 200 * 1024;
function createSharing(options = {}) {
  const provider = options.blob || (() => require('./d1-blob'));
  const now = options.now || Date.now;
  let secretPromise;
  async function bounded(fn) {
    const controller = new AbortController(); let timer;
    try {
      return await Promise.race([
        Promise.resolve().then(() => fn(controller.signal)),
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(error(503, 'comparison_storage_timeout', 'Comparison storage exceeded its time limit.')); }, options.timeoutMs || 5000); })
      ]);
    } finally { clearTimeout(timer); controller.abort(); }
  }
  async function read(path, limit) {
    return bounded(async signal => {
      const blob = await provider(); if (signal.aborted) throw new Error('Cancelled');
      const r = await blob.get(path, { access: 'private', useCache: false, abortSignal: signal });
      if (!r || r.statusCode === 404) return null;
      if (r.statusCode !== 200 || !r.stream) throw new Error('Unreadable storage');
      const chunks = []; let bytes = 0;
      for await (const chunk of r.stream) { const b = Buffer.from(chunk); bytes += b.length; if (signal.aborted || bytes > limit) throw new Error('Invalid stored evidence'); chunks.push(b); }
      return require('./marking-json').parse(Buffer.concat(chunks).toString('utf8'));
    });
  }
  async function secret() {
    if (!secretPromise) secretPromise = (async () => {
      let record = await read('system/comparison-signing-v1.json', 1024);
      if (!record) {
        try {
          await bounded(async signal => {
            const blob = await provider(); if (signal.aborted) throw new Error('Cancelled');
            await blob.put('system/comparison-signing-v1.json', JSON.stringify({ key: crypto.randomBytes(32).toString('hex') }), { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json', abortSignal: signal });
          });
        } catch (e) { if (!/already exists|precondition/i.test(String(e.message))) throw e; }
        record = await read('system/comparison-signing-v1.json', 1024);
      }
      if (!record || typeof record.key !== 'string' || !/^[a-f0-9]{64}$/.test(record.key)) throw new Error('Invalid signing configuration');
      return Buffer.from(record.key, 'hex');
    })().catch(e => { secretPromise = null; throw e; });
    return secretPromise;
  }
  async function sign(snapshot, owner) {
    const key = await secret(), createdAt = now();
    if (!/^[a-f0-9]{64}$/.test(owner)) throw new Error('Invalid account');
    const copy = Object.assign({}, snapshot, { participantId: crypto.createHmac('sha256', key).update('participant:' + owner).digest('hex'), createdAt, expiresAt: createdAt + TTL_MS });
    const text = JSON.stringify(copy);
    if (Buffer.byteLength(text) + 200 > MAX_EXPORT_BYTES) throw error(413, 'comparison_export_limit', 'This export exceeds 200 KiB. Select fewer responses.');
    return { snapshot: copy, signature: crypto.createHmac('sha256', key).update(text).digest('hex') };
  }
  async function verify(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 2 || !value.snapshot || typeof value.signature !== 'string' || !/^[a-f0-9]{64}$/.test(value.signature) || Buffer.byteLength(JSON.stringify(value)) > MAX_EXPORT_BYTES) throw error(400, 'invalid_export', 'Use an unedited evidence file exported by this site.');
    const expected = crypto.createHmac('sha256', await secret()).update(JSON.stringify(value.snapshot)).digest();
    if (!crypto.timingSafeEqual(expected, Buffer.from(value.signature, 'hex'))) throw error(403, 'invalid_export_signature', 'This evidence file has changed or was exported by a different site. Export a fresh copy.');
    const s = value.snapshot;
    if (!Number.isSafeInteger(s.createdAt) || !Number.isSafeInteger(s.expiresAt) || s.expiresAt !== s.createdAt + TTL_MS || s.createdAt > now() || s.expiresAt <= now()) throw error(409, 'expired_export', 'An evidence export has expired. Ask the participant for a new export.');
    return s;
  }
  async function loadPaper(owner, bankId) {
    if (!/^[a-f0-9]{64}$/.test(owner)) throw new Error('Invalid account');
    const data = await read('progress/' + owner + '.json', 3500000);
    return data && data.u && data.u[bankId] || null;
  }
  return { sign, verify, loadPaper };
}
module.exports = Object.assign({ createSharing, TTL_MS, MAX_EXPORT_BYTES }, createSharing());
