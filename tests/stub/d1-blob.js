// In-memory stand-in for server/d1-blob.js. Never touches Cloudflare. Tests copy it over that file.
const { Readable } = require('node:stream');
const data = globalThis.__M = new Map();
const versions = new Map();
let version = 0;
class BlobPreconditionFailedError extends Error {
  constructor() { super('Precondition failed'); this.name = 'BlobPreconditionFailedError'; }
}
const mem = {
  get(p) {
    if (!data.has(p)) return null;
    return { body: data.get(p), etag: versions.get(p) };
  }
};
async function get(path) {
  const item = mem.get(path);
  if (!item) return null;
  return { statusCode: 200, stream: Readable.from([item.body]), blob: { etag: item.etag, pathname: path } };
}
async function getMany(paths) {
  const map = new Map();
  for (const p of [].concat(paths || [])) {
    const item = mem.get(p);
    if (item) map.set(p, { statusCode: 200, body: Buffer.from(item.body), blob: { etag: item.etag, pathname: p } });
  }
  return map;
}
async function put(path, value, options) {
  options = options || {};
  if (globalThis.__blobBeforePut) await globalThis.__blobBeforePut(path);
  if (globalThis.__blobFailWrites) throw new Error('Storage unavailable');
  if (options.ifMatch && versions.get(path) !== options.ifMatch) throw new BlobPreconditionFailedError();
  if (data.has(path) && !options.allowOverwrite && !options.ifMatch) throw new Error('This blob already exists');
  data.set(path, value); versions.set(path, 'v' + (++version));
  return { pathname: path, etag: versions.get(path) };
}
async function list(options) {
  const prefix = (options && options.prefix) || '';
  return { blobs: [...data.keys()].filter(k => k.startsWith(prefix)).map(pathname => ({ pathname })), hasMore: false };
}
async function del(paths) {
  paths = [].concat(paths || []).filter(p => typeof p === 'string');
  for (const p of paths) { data.delete(p); versions.delete(p); }
}
const configured = () => !!process.env.CF_API_TOKEN;
function create() {
  return { get, getMany, put, list, del, configured, BlobPreconditionFailedError };
}
module.exports = Object.assign(create(), { create, BlobPreconditionFailedError });
