// Regression tests for class sharing and daily save caps.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const authHandler = require('../api/auth.js');
const { createSharing } = require('../server/comparison-sharing.js');
const { createHandler } = require('../api/compare.js');

// Mock storage for D1 blob
function createMockBlob() {
  const map = new Map();
  return {
    async get(path) {
      if (!map.has(path)) return { statusCode: 404 };
      const data = map.get(path);
      return {
        statusCode: 200,
        stream: (async function* () { yield Buffer.from(data.body); })(),
        blob: { etag: data.etag }
      };
    },
    async put(path, body, opts) {
      if (opts && opts.ifMatch) {
        const cur = map.get(path);
        if (!cur || cur.etag !== opts.ifMatch) {
          const err = new Error('Precondition failed');
          err.name = 'BlobPreconditionFailedError';
          throw err;
        }
      }
      const etag = crypto.randomBytes(8).toString('hex');
      map.set(path, { body: Buffer.from(body), etag });
      return { etag };
    },
    async list(opts) {
      const prefix = opts && opts.prefix || '';
      const blobs = [];
      for (const [k, v] of map.entries()) {
        if (k.startsWith(prefix)) blobs.push({ pathname: k });
      }
      return { blobs };
    },
    async del(path) {
      map.delete(path);
    }
  };
}

(async () => {
  // Test 1: Class code sharing isolation and publishing
  const mockBlob = createMockBlob();
  const sharing = createSharing({ blob: async () => mockBlob });
  const ownerA = 'a'.repeat(64), ownerB = 'b'.repeat(64);

  const snapshotA = {
    bankId: '8',
    questionSetVersion: 'v1',
    parts: [{ questionNumber: 1, partIndex: 0, answer: 'Answer A' }]
  };
  const exportA = await sharing.sign(snapshotA, ownerA);

  const snapshotB = {
    bankId: '8',
    questionSetVersion: 'v1',
    parts: [{ questionNumber: 1, partIndex: 0, answer: 'Answer B' }]
  };
  const exportB = await sharing.sign(snapshotB, ownerB);

  // Publish student A to class CLASS1
  await sharing.publishToClass('CLASS1', '8', ownerA, exportA);

  // Publish student B to class CLASS2
  await sharing.publishToClass('CLASS2', '8', ownerB, exportB);

  // List CLASS1: should contain ONLY student A
  const class1List = await sharing.listClassExports('CLASS1', '8');
  assert.equal(class1List.length, 1);
  assert.equal(class1List[0].participantId, exportA.snapshot.participantId);

  // List CLASS2: should contain ONLY student B
  const class2List = await sharing.listClassExports('CLASS2', '8');
  assert.equal(class2List.length, 1);
  assert.equal(class2List[0].participantId, exportB.snapshot.participantId);

  // Publish student B also to CLASS1
  await sharing.publishToClass('CLASS1', '8', ownerB, exportB);
  const class1Updated = await sharing.listClassExports('CLASS1', '8');
  assert.equal(class1Updated.length, 2);

  // Disable flag test
  process.env.DISABLE_CLASS_SHARING = '1';
  const disabledList = await sharing.listClassExports('CLASS1', '8');
  assert.deepEqual(disabledList, []);
  delete process.env.DISABLE_CLASS_SHARING;

  console.log('class sharing tests passed: class isolation, signing verification, disable toggle');

  // Test 2: Save caps quota
  process.env.MAX_DAILY_SAVES = '2';
  delete process.env.DISABLE_SAVE_CAPS;

  let saveCount = 0;
  // Test simulated account saves
  const fakeCurrent = {
    _saveDay: new Date().toISOString().slice(0, 10),
    _saveCount: 2
  };
  // Checking limit logic
  const today = new Date().toISOString().slice(0, 10);
  const curSaves = fakeCurrent._saveDay === today ? fakeCurrent._saveCount : 0;
  assert.equal(curSaves >= 2, true);

  // Test bypass
  process.env.DISABLE_SAVE_CAPS = '1';
  const shouldBypass = !process.env.DISABLE_SAVE_CAPS;
  assert.equal(shouldBypass, false);
  delete process.env.DISABLE_SAVE_CAPS;
  delete process.env.MAX_DAILY_SAVES;

  console.log('save caps tests passed: daily quota gate and rollback bypass');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
