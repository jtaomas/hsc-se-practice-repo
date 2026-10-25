'use strict';
const { verifySession } = require('./auth');

function createAdminHandler(deps) {
  deps = deps || {};
  const blob = deps.blob || (() => require('../server/d1-blob'));
  const verify = deps.verify || verifySession;

  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
    let p = req.body;
    if (typeof p === 'string') { try { p = JSON.parse(p); } catch (_) { p = {}; } }
    p = p && typeof p === 'object' ? p : {};

    try {
      const auth = String((req.headers && req.headers.authorization) || '');
      const sess = await verify(auth.replace(/^Bearer\s+/i, ''));
      if (!sess) return res.status(401).json({ error: 'Sign in required.' });

      if (sess.email !== 'thomas.lu@education.nsw.gov.au') {
          return res.status(403).json({ error: 'Admin access denied.' });
      }

      if (p.action === 'load_all') {
         const store = await blob();
         const pList = await store.list({ prefix: 'progress/' });
         const users = [];

         for (let i = 0; i < (pList.blobs || []).length; i++) {
             const b = pList.blobs[i];
             const uid = String(b.pathname).slice('progress/'.length).replace(/\.json$/, '');
             const r = await store.get(b.pathname, { access: 'private', useCache: false });
             if (r && r.statusCode === 200 && r.stream) {
                 const chunks = [];
                 for await (const c of r.stream) chunks.push(Buffer.from(c));
                 try {
                     users.push({ id: uid, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) });
                 } catch (e) {}
             }
         }

         const uList = await store.list({ prefix: 'users/' });
         const userMeta = {};
         for (let i = 0; i < (uList.blobs || []).length; i++) {
             const b = uList.blobs[i];
             const uid = String(b.pathname).slice('users/'.length).replace(/\.json$/, '');
             const r = await store.get(b.pathname, { access: 'private', useCache: false });
             if (r && r.statusCode === 200 && r.stream) {
                 const chunks = [];
                 for await (const c of r.stream) chunks.push(Buffer.from(c));
                 try {
                     const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                     userMeta[uid] = { email: data.email, name: data.name };
                 } catch (e) {}
             }
         }

         return res.status(200).json({ users, userMeta });
      }
      return res.status(400).json({ error: 'Unknown action.' });
    } catch (e) {
      console.error('admin error:', e);
      return res.status(500).json({ error: 'Admin service error.' });
    }
  };
}
module.exports = createAdminHandler();
