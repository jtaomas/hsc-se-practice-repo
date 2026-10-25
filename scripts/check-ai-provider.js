'use strict';
// Sends ONE tiny request (about 150 tokens) to the configured AI service and
// reports whether the marking engine will accept its replies. Run it after
// setting or changing a key:
//   OPENCODE_API_KEY=... node scripts/check-ai-provider.js
//   DEEPSEEK_API_KEY=... node scripts/check-ai-provider.js
// The key is read from the environment and is never printed.
const provider = require('../server/ai-provider');

async function main() {
  const ai = provider.current(), key = ai.key();
  console.log(`Service: ${ai.label}\nEndpoint: ${ai.endpoint}\nModel: ${ai.model}\nThinking fields: ${ai.thinking ? 'sent' : 'off (OPENCODE_THINKING=off)'}`);
  if (!key) { console.log(`\nNo key: set ${ai.keyEnv}. Nothing was sent.`); process.exit(2); }
  const body = { model: ai.model, messages: [{ role: 'system', content: 'Reply with a JSON object only.' }, { role: 'user', content: 'Return {"ok": true}.' }],
    ...ai.reasoning('low'), max_tokens: 400, response_format: { type: 'json_object' } };
  const started = Date.now(), response = await fetch(ai.endpoint, { method: 'POST', headers: ai.headers(key), body: JSON.stringify(body) });
  const text = await response.text(); let json = null; try { json = JSON.parse(text); } catch (_) {}
  const choice = json && Array.isArray(json.choices) ? json.choices[0] : null, returned = json && json.model;
  const checks = {
    'HTTP status 200': response.status === 200,
    'model name accepted': provider.sameModel(ai.model, returned),
    'finished normally': !!choice && choice.finish_reason === 'stop',
    'valid JSON reply': (() => { try { return !!JSON.parse(choice.message.content); } catch (_) { return false; } })()
  };
  console.log(`\nHTTP ${response.status} in ${((Date.now() - started) / 1000).toFixed(1)} s; returned model: ${returned || 'none'}`);
  if (json && json.usage) console.log(`Tokens: ${json.usage.total_tokens}${json.usage.completion_tokens_details && json.usage.completion_tokens_details.reasoning_tokens != null ? ` (reasoning ${json.usage.completion_tokens_details.reasoning_tokens})` : ''}${json.usage.opencode ? `; billed to: ${json.usage.opencode.billing_source}` : ''}`);
  for (const [name, ok] of Object.entries(checks)) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (response.status === 400 && ai.thinking && ai.id === 'opencode-go') console.log('\nA 400 can mean the thinking fields were rejected. Try again with OPENCODE_THINKING=off.');
  if (!response.ok) console.log('\nError body (first 300 characters): ' + text.slice(0, 300).replace(key, '[key]'));
  process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
}
main().catch(error => { console.log('Request failed: ' + (error && error.message)); process.exit(1); });
