// In-memory stand-in for server/d1-blob.js. Never touches Cloudflare. Tests copy it over that file.
const { Readable } = require('node:stream');
const data = globalThis.__M = new Map();
const versions = new Map();
let version = 0;
class BlobPreconditionFailedError extends Error {
  constructor() { super('Precondition failed'); this.name = 'BlobPreconditionFailedError'; }
}
async function get(path) {
  if (!data.has(path)) return null;
  return { statusCode: 200, stream: Readable.from([data.get(path)]), blob: { etag: versions.get(path) } };
}
async function put(path, value, options) {
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
  for (const p of [].concat(paths)) { data.delete(p); versions.delete(p); }
}
const configured = () => !!process.env.CF_API_TOKEN;
module.exports = { get, put, list, del, configured, BlobPreconditionFailedError };
