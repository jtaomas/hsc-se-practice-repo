// Run after npm ci --ignore-scripts. This exercises the actual locked Blob SDK
// against a synthetic HTTP server implemented by Undici MockAgent. All real
// network access is disabled; no environment token, live account or provider is
// used. A compression-dependent weak ETag below is a simulated failure mode,
// not evidence that the production Blob service currently behaves that way.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const sdkRequire = createRequire(require.resolve('@vercel/blob'));
const sdk = require('@vercel/blob');
const { MockAgent, getGlobalDispatcher, setGlobalDispatcher, fetch } = sdkRequire('undici');
const { createStore } = require('../server/marking-store');

const TOKEN = 'vercel_blob_rw_syntheticstore_offlineonly';
const ORIGIN = 'https://syntheticstore.private.blob.vercel-storage.com';
const records = new Map(), requests = [];
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
let version = 0, forceConflict = false;
function save(path, body) {
  const record = { body: String(body), etag: '"synthetic-' + (++version) + '"' };
  records.set(path, record);
  return record;
}
function headersOf(value) {
  const result = {};
  if (Array.isArray(value)) for (let i = 0; i < value.length; i += 2) result[String(value[i]).toLowerCase()] = String(value[i + 1]);
  else for (const [key, item] of Object.entries(value || {})) result[key.toLowerCase()] = String(item);
  return result;
}
function failure() {
  return { statusCode: 412, data: JSON.stringify({ error: { code: 'precondition_failed', message: 'Synthetic conflict' } }), responseOptions: { headers: { 'content-type': 'application/json' } } };
}
const mock = new MockAgent();
mock.disableNetConnect();
mock.get(ORIGIN).intercept({ method: 'GET', path: /.*/ }).reply(options => {
  const url = new URL(options.path, ORIGIN), headers = headersOf(options.headers);
  assert.equal(headers.authorization, 'Bearer ' + TOKEN);
  requests.push({ method: 'GET', pathname: url.pathname.slice(1), cache: url.searchParams.get('cache'), encoding: headers['accept-encoding'] });
  const record = records.get(url.pathname.slice(1));
  if (!record) return { statusCode: 404, data: '' };
  const weak = record.alwaysWeak || (record.compressionSensitive && headers['accept-encoding'] !== 'identity');
  return { statusCode: 200, data: record.body, responseOptions: { headers: { 'content-type': 'application/json', etag: (weak ? 'W/' : '') + record.etag } } };
}).persist();
mock.get('https://vercel.com').intercept({ method: 'PUT', path: /^\/api\/blob\/\?pathname=/ }).reply(options => {
  const url = new URL(options.path, 'https://vercel.com'), path = url.searchParams.get('pathname'), headers = headersOf(options.headers);
  assert.equal(headers.authorization, 'Bearer ' + TOKEN);
  assert.equal(headers['x-vercel-blob-access'], 'private');
  assert.equal(headers['x-add-random-suffix'], '0');
  const old = records.get(path), ifMatch = headers['x-if-match'];
  requests.push({ method: 'PUT', pathname: path, ifMatch, oldEtag: old && old.etag, overwrite: headers['x-allow-overwrite'] });
  if (forceConflict) { forceConflict = false; return failure(); }
  if ((old && headers['x-allow-overwrite'] !== '1') || (ifMatch && (!old || ifMatch !== old.etag))) return failure();
  const record = save(path, options.body);
  return { statusCode: 200, data: JSON.stringify({ url: ORIGIN + '/' + path, downloadUrl: ORIGIN + '/' + path + '?download=1', pathname: path, contentType: 'application/json', contentDisposition: 'attachment', etag: record.etag }), responseOptions: { headers: { 'content-type': 'application/json' } } };
}).persist();
const provider = async () => ({
  get: (path, options) => sdk.get(path, Object.assign({}, options, { token: TOKEN })),
  put: (path, body, options) => sdk.put(path, body, Object.assign({}, options, { token: TOKEN }))
});
const putOptions = { access: 'private', token: TOKEN, addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' };
const getOptions = { access: 'private', token: TOKEN, useCache: false };
async function drain(result) { if (result && result.stream) for await (const _ of result.stream) { /* consume mocked response */ } }

(async () => {
  const previousDispatcher = getGlobalDispatcher();
  const previousApiUrl = process.env.VERCEL_BLOB_API_URL;
  // Prevent a developer-specific alternative SDK endpoint from changing this
  // test. Explicit synthetic tokens override SDK environment authentication.
  process.env.VERCEL_BLOB_API_URL = 'https://vercel.com/api/blob';
  setGlobalDispatcher(mock);
  try {
    await assert.rejects(fetch('https://network-must-stay-disabled.invalid/'), error => error.cause && error.cause.code === 'UND_MOCK_ERR_MOCK_NOT_MATCHED');

    // Real SDK forwards quoted strong validators byte-for-byte and cache=false
    // becomes ?cache=0. This is intentionally more realistic than the v1/v2
    // string validators in the fast in-memory storage tests.
    const first = save('sdk-contract.json', '{"version":1}');
    let fetched = await sdk.get('sdk-contract.json', getOptions);
    assert.equal(fetched.blob.etag, first.etag);
    assert.equal(requests.at(-1).cache, '0');
    await drain(fetched);
    await sdk.put('sdk-contract.json', '{"version":2}', Object.assign({}, putOptions, { ifMatch: fetched.blob.etag }));
    assert.equal(requests.at(-1).ifMatch, first.etag);

    // If an intermediary returns a weak validator, the SDK preserves it and
    // the conditional update fails. It does not silently remove W/ or quotes.
    const compression = save('compression-simulation.json', '{"version":1}');
    compression.compressionSensitive = true;
    fetched = await sdk.get('compression-simulation.json', getOptions);
    assert.equal(fetched.blob.etag, 'W/' + compression.etag);
    await drain(fetched);
    const beforeConflict = requests.filter(request => request.method === 'PUT').length;
    await assert.rejects(sdk.put('compression-simulation.json', '{"version":2}', Object.assign({}, putOptions, { ifMatch: fetched.blob.etag })), error => error instanceof sdk.BlobPreconditionFailedError);
    assert.equal(requests.filter(request => request.method === 'PUT').length, beforeConflict + 1, 'the SDK must not retry a precondition failure internally');
    fetched = await sdk.get('compression-simulation.json', Object.assign({}, getOptions, { headers: { 'Accept-Encoding': 'identity' } }));
    assert.equal(requests.at(-1).encoding, 'identity');
    assert.equal(fetched.blob.etag, compression.etag);
    await drain(fetched);
    await sdk.put('compression-simulation.json', '{"version":2}', Object.assign({}, putOptions, { ifMatch: fetched.blob.etag }));

    records.clear(); requests.length = 0;
    const stores = Array.from({ length: 3 }, () => createStore({ blob: provider, now: () => Date.UTC(2026, 9, 24, 12) }));
    const owner = hash('synthetic-owner'), digests = [0, 1, 2].map(i => hash('synthetic-answer-' + i));
    // Exercise a real SDK 412 in addition to natural shared-ledger contention.
    forceConflict = true;
    const reservations = await Promise.all(stores.map((store, i) => store.getOrReserve(owner, digests[i])));
    assert(reservations.every(reservation => reservation.state === 'reserved'));
    const results = digests.map((_, i) => ({ status: i === 2 ? 'needs_review' : 'marked', mark: i === 2 ? null : i, summary: 'Synthetic stored result ' + i, audit: {} }));
    await Promise.all(stores.map((store, i) => store.finish(owner, digests[i], reservations[i].leaseId, results[i])));
    const writesBeforeCache = requests.filter(request => request.method === 'PUT').length;
    for (let i = 0; i < 3; i++) {
      assert.deepEqual(await stores[(i + 1) % 3].getCached(owner, digests[i]), results[i]);
      assert.deepEqual(await stores[(i + 2) % 3].getOrReserve(owner, digests[i]), { state: 'cached', result: results[i] });
    }
    assert.equal(requests.filter(request => request.method === 'PUT').length, writesBeforeCache, 'cached paths must not write or spend quota');
    const ledgers = [...records].filter(([path]) => path.includes('/quota/')).map(([, record]) => JSON.parse(record.body));
    assert.equal(ledgers.length, 1); assert.equal(ledgers[0].total, 3); assert.equal(ledgers[0].users[hash(owner)], 3);
    for (const request of requests) {
      if (request.method === 'GET') { assert.equal(request.encoding, 'identity'); assert.equal(request.cache, '0'); }
      if (request.method === 'PUT' && request.ifMatch) { assert.match(request.ifMatch, /^"synthetic-\d+"$/); assert.equal(request.overwrite, '1'); }
    }

    // Identity is a mitigation, not permission to rewrite weak validators. A
    // service still returning W/ must fail closed before any conditional PUT.
    const jobPath = [...records.keys()].find(path => path.endsWith('/' + digests[0] + '.json'));
    records.get(jobPath).alwaysWeak = true;
    const beforeWeak = requests.length, logs = [], originalWarn = console.warn;
    console.warn = (...args) => logs.push(args);
    try {
      await assert.rejects(stores[0].getCached(owner, digests[0]), error => error.code === 'marking_storage_version');
      await assert.rejects(stores[0].getOrReserve(owner, digests[0]), error => error.code === 'marking_storage_version');
    } finally { console.warn = originalWarn; }
    assert.equal(requests.slice(beforeWeak).filter(request => request.method === 'PUT').length, 0);
    assert.equal(requests.slice(beforeWeak).filter(request => request.method === 'GET').length, 2, 'weak validators must not trigger a conflict retry loop');
    assert(logs.length > 0);
    const logged = JSON.stringify(logs);
    for (const sensitive of [TOKEN, jobPath, records.get(jobPath).etag, owner, digests[0], results[0].summary]) assert(!logged.includes(sensitive), 'storage diagnostics must not expose synthetic private fields');
    console.log('Real Blob SDK: cache bypass, quoted ETags, identity headers, 412 handling, three-answer CAS/quota/cache and weak-version rejection passed (all HTTP mocked).');
  } finally {
    setGlobalDispatcher(previousDispatcher);
    if (previousApiUrl == null) delete process.env.VERCEL_BLOB_API_URL;
    else process.env.VERCEL_BLOB_API_URL = previousApiUrl;
    await mock.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
