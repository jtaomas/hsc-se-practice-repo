// Vercel serverless function: marks one answer with DeepSeek.
// The key comes from the DEEPSEEK_API_KEY environment variable only.
const MAXLEN = 12000;
function clip(s, n) { s = s == null ? '' : String(s); return s.length > n ? s.slice(0, n) + '\n[cut]' : s; }
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') { res.status(200).json({ ok: true, serverKey: !!process.env.DEEPSEEK_API_KEY }); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST.' }); return; }
  const key = process.env.DEEPSEEK_API_KEY || '';
  if (!key) { res.status(401).json({ code: 'no_key', error: 'AI marking is not set up on this site yet.' }); return; }
  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = {}; } }
  p = p || {};
  const call = async (messages, max) => {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.1, max_tokens: max, response_format: { type: 'json_object' } })
    });
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch (e) { j = {}; }
    return { r, j };
  };
  try {
    const max = Math.max(1, Math.min(20, parseInt(p.max, 10) || 1));
    const sys = 'You are a strict, fair NSW HSC Software Engineering marker. Mark one student answer out of ' + max + ' using only the marking criteria and the sample answer given. ' +
      'Award marks for correct ideas even when the wording or code differs from the sample. Do not award marks for vague statements, for repeating the question, or for content that is wrong. ' +
      'If automatic test results are given, treat them as strong evidence for code answers. For a diagram, the answer is a text description of shapes, text and connectors read from the student\'s drawing; judge it against the criteria. ' +
      'The student is in Year 12. Write feedback addressed to the student, plain and specific, with no flattery. ' +
      'Reply with JSON only: {"mark": integer from 0 to ' + max + ', "summary": one or two sentences, "strengths": array of at most 3 short strings naming what earned marks, "improve": array of at most 3 short strings naming what would earn more marks}.';
    const user = 'QUESTION TYPE: ' + clip(p.type, 40) + '\nMARKS AVAILABLE: ' + max + (p.wordLimit ? '\nWORD LIMIT: ' + p.wordLimit : '') +
      '\n\nSTIMULUS:\n' + clip(p.stimulus, 4000) + '\n\nQUESTION:\n' + clip(p.question, 2000) +
      '\n\nMARKING CRITERIA:\n' + (Array.isArray(p.criteria) ? p.criteria.map((c, i) => (i + 1) + '. ' + clip(c, 400)).join('\n') : '') +
      '\n\nSAMPLE ANSWER:\n' + clip(p.sample, 3000) + (p.tests ? '\n\nAUTOMATIC CHECK:\n' + clip(p.tests, 300) : '') +
      '\n\nSTUDENT ANSWER:\n' + clip(p.answer, MAXLEN);
    const { r, j } = await call([{ role: 'system', content: sys }, { role: 'user', content: user }], 700);
    if (r.status === 401 || r.status === 403) { res.status(401).json({ code: 'bad_key', error: 'DeepSeek rejected this key.' }); return; }
    if (r.status === 402) { res.status(402).json({ error: 'The DeepSeek account has no balance left.' }); return; }
    if (r.status === 429) { res.status(429).json({ error: 'DeepSeek is rate limiting requests. Try again in a minute.' }); return; }
    if (!r.ok) { res.status(502).json({ error: (j.error && j.error.message) || 'DeepSeek returned ' + r.status }); return; }
    let out = {};
    try { out = JSON.parse(j.choices[0].message.content); } catch (e) { res.status(502).json({ error: 'DeepSeek sent a reply that could not be read.' }); return; }
    let mark = Math.round(Number(out.mark));
    if (!isFinite(mark)) { res.status(502).json({ error: 'DeepSeek did not return a mark.' }); return; }
    mark = Math.max(0, Math.min(max, mark));
    const arr = (a) => (Array.isArray(a) ? a.slice(0, 3).map((x) => clip(x, 300)) : []);
    res.status(200).json({ mark, summary: clip(out.summary, 600), strengths: arr(out.strengths), improve: arr(out.improve) });
  } catch (e) {
    res.status(502).json({ error: 'Could not reach DeepSeek.' });
  }
};
