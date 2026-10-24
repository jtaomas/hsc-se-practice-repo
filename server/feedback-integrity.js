'use strict';

const { createHash } = require('node:crypto');

// This checksum detects changed stored content. It is not a signature and does
// not authenticate a party able to replace both the payload and its checksum.
function canonicalDigest(value, maximumBytes = 64 * 1024) {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1 || maximumBytes > 1024 * 1024) return null;
  const hash = createHash('sha256'); let bytes = 0;
  function write(text) {
    bytes += Buffer.byteLength(text, 'utf8');
    if (bytes > maximumBytes) throw new Error('Checksum size limit');
    hash.update(text);
  }
  function visit(item, depth) {
    if (depth > 16) throw new Error('Checksum nesting limit');
    if (item === null || typeof item === 'string' || typeof item === 'boolean' || typeof item === 'number' && Number.isFinite(item)) { write(JSON.stringify(item)); return; }
    if (Array.isArray(item)) {
      write('['); let first = true;
      for (const child of item) { if (!first) write(','); first = false; visit(child, depth + 1); }
      write(']'); return;
    }
    if (item && typeof item === 'object') {
      write('{'); let first = true;
      for (const key of Object.keys(item).sort()) { if (!first) write(','); first = false; write(JSON.stringify(key)); write(':'); visit(item[key], depth + 1); }
      write('}'); return;
    }
    throw new Error('Checksum value is not JSON');
  }
  try { visit(value, 0); return hash.digest('hex'); } catch (_) { return null; }
}

module.exports = { canonicalDigest };
