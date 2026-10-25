'use strict';
// Which AI service each feature calls, and what it sends. No network: every
// request is captured by a local mock in a child process with a chosen env.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const p = require('../server/ai-provider');

// Selection
assert.equal(p.choose({}).id, 'deepseek');
assert.equal(p.choose({ DEEPSEEK_API_KEY: 'd' }).id, 'deepseek');
assert.equal(p.choose({ OPENCODE_API_KEY: 'o' }).id, 'opencode-go');
assert.equal(p.choose({ OPENCODE_API_KEY: '  ' }).id, 'deepseek', 'a blank key does not switch provider');
assert.equal(p.choose({ OPENCODE_API_KEY: 'o', DEEPSEEK_API_KEY: 'd' }).id, 'opencode-go', 'OpenCode Go is preferred when both keys exist');
assert.equal(p.choose({ OPENCODE_API_KEY: 'o', AI_PROVIDER: 'deepseek' }).id, 'deepseek', 'AI_PROVIDER forces a service');
assert.equal(p.choose({ AI_PROVIDER: 'OpenCode' }).id, 'opencode-go');
assert.equal(p.current({ OPENCODE_API_KEY: ' sk-o ' }).key(), 'sk-o');
assert.equal(p.current({ OPENCODE_API_KEY: 'o', DEEPSEEK_API_KEY: 'd' }).key(), 'o', 'never sends the DeepSeek key to OpenCode');
assert.equal(p.current({ DEEPSEEK_API_KEY: 'd' }).key(), 'd');
assert.equal(p.current({ AI_PROVIDER: 'opencode' }).key(), '', 'forced OpenCode without its key is unconfigured');

// Service details
const oc = p.current({ OPENCODE_API_KEY: 'o' });
assert.equal(oc.endpoint, 'https://opencode.ai/inference/go/openai/v1/chat/completions');
assert.equal(oc.model, 'deepseek-v4.1-flash');
assert.deepEqual(oc.reasoning('high'), { thinking: { type: 'enabled' }, reasoning_effort: 'high' });
assert.deepEqual(p.current({ OPENCODE_API_KEY: 'o', OPENCODE_THINKING: 'off' }).reasoning('high'), {}, 'thinking fields can be switched off');
assert.deepEqual(p.current({ DEEPSEEK_API_KEY: 'd', OPENCODE_THINKING: 'off' }).reasoning('low'), { thinking: { type: 'enabled' }, reasoning_effort: 'low' }, 'the switch only affects OpenCode');
const h = oc.headers('sk-test');
assert.equal(h.Authorization, 'Bearer sk-test'); assert.equal(h['Content-Type'], 'application/json');
assert.match(h['User-Agent'], /^hsc-se-practice-marking\//); assert.match(h['x-opencode-session'], /^[0-9a-f-]{36}$/);
assert.notEqual(oc.headers('k')['x-opencode-session'], h['x-opencode-session'], 'a fresh session id per request');
assert.deepEqual(p.current({ DEEPSEEK_API_KEY: 'd' }).headers('sk-d'), { 'Content-Type': 'application/json', Authorization: 'Bearer sk-d' }, 'DeepSeek requests are unchanged');

// Returned model names
assert.equal(p.canonicalModel('deepseek-v4.1-flash', 'deepseek-v4.1-flash'), 'deepseek-v4.1-flash');
assert.equal(p.canonicalModel('deepseek-v4.1-flash', 'opencode-go/deepseek-v4.1-flash'), 'deepseek-v4.1-flash');
assert.equal(p.canonicalModel('deepseek-v4.1-flash', 'DeepSeek-V4.1-Flash'), 'deepseek-v4.1-flash');
assert.equal(p.canonicalModel('deepseek-v4.1-flash', 'deepseek-v4-pro'), null, 'a different model is still a mismatch');
assert.equal(p.canonicalModel('deepseek-v4.1-flash', 'deepseek-v4.1-flash-0925'), null, 'a different snapshot is still a mismatch');
assert.equal(p.canonicalModel('deepseek-flash', 'deepseek-flash'), 'deepseek-flash');
assert.equal(p.canonicalModel('gpt-x', 'gpt-x'), null, 'only known models are accepted');
assert(p.knownModel('deepseek-flash') && p.knownModel('deepseek-v4.1-flash') && !p.knownModel('deepseek-v4-pro'));

// Each engine sends its request to the configured service (child process, fresh env).
function captured(env, script) {
  const out = execFileSync(process.execPath, ['-e', `
    const seen = [];
    globalThis.fetch = async (url, init) => { seen.push({ url, headers: init.headers, body: JSON.parse(init.body) }); return new Response('{}', { status: 500 }); };
    (async () => { try { ${script} } catch (_) {} process.stdout.write(JSON.stringify(seen)); })();`],
  { cwd: path.join(__dirname, '..'), env: Object.assign({ PATH: process.env.PATH }, env), encoding: 'utf8' });
  return JSON.parse(out);
}
const MARK = `const e = require('./server/marking-engine'); await e.mark({ bankId: '1', questionNumber: 1, partIndex: 0, type: 'written response', maxMarks: 4,
  stimulus: 'Context.', question: 'Explain alpha.', criteria: [{ id: 'c1', text: 'Explains alpha.' }], sample: 'Alpha.', wordGuide: 50, answer: 'alpha', diagramScene: null, diagramPng: null });`;
for (const [env, url, model, key] of [
  [{ OPENCODE_API_KEY: 'sk-oc-test', DEEPSEEK_API_KEY: 'sk-ds-test' }, 'https://opencode.ai/inference/go/openai/v1/chat/completions', 'deepseek-v4.1-flash', 'sk-oc-test'],
  [{ DEEPSEEK_API_KEY: 'sk-ds-test' }, 'https://api.deepseek.com/chat/completions', 'deepseek-flash', 'sk-ds-test']]) {
  const seen = captured(env, MARK);
  assert(seen.length >= 1, 'the marking engine made no request');
  for (const r of seen) {
    assert.equal(r.url, url); assert.equal(r.body.model, model); assert.equal(r.headers.Authorization, 'Bearer ' + key);
    assert.equal(r.body.thinking.type, 'enabled'); assert(['high', 'low'].includes(r.body.reasoning_effort));
    assert.equal(r.body.response_format.type, 'json_object');
  }
}
const off = captured({ OPENCODE_API_KEY: 'k', OPENCODE_THINKING: 'off' }, MARK);
assert(off.length && off.every(r => !('thinking' in r.body) && !('reasoning_effort' in r.body)), 'OPENCODE_THINKING=off removes the thinking fields');
for (const mod of ['marking-engine', 'comparison-engine', 'improvement-engine', 'class-synthesis']) {
  const m = JSON.parse(execFileSync(process.execPath, ['-e', `process.stdout.write(JSON.stringify(require('./server/${mod}').MODEL))`],
    { cwd: path.join(__dirname, '..'), env: { PATH: process.env.PATH, OPENCODE_API_KEY: 'k' }, encoding: 'utf8' }));
  assert.equal(m, 'deepseek-v4.1-flash', mod + ' does not use OpenCode Go');
}
console.log('AI provider OK: OpenCode Go preferred when its key is set, DeepSeek otherwise; endpoint, model, headers, thinking switch and model-name checks for every engine');
