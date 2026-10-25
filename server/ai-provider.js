'use strict';

// One place that decides which AI service every server feature calls (marking,
// improvement plans, comparisons and the class analysis).
//
//   OPENCODE_API_KEY set  -> OpenCode Go, model deepseek-v4.1-flash (spends the
//                            OpenCode Go subscription, not DeepSeek balance)
//   otherwise             -> DeepSeek's own API, model deepseek-flash
//
// AI_PROVIDER=opencode|deepseek forces one. Both serve DeepSeek-V4.1-Flash, so a
// mark confirmed through either remains valid evidence for the other.
// OPENCODE_THINKING=off drops the DeepSeek thinking fields if OpenCode ever
// rejects them (scripts/check-ai-provider.js tests this with one tiny call).

const crypto = require('crypto');

const PROVIDERS = Object.freeze({
  opencode: Object.freeze({
    id: 'opencode-go',
    label: 'OpenCode Go',
    endpoint: 'https://opencode.ai/inference/go/openai/v1/chat/completions',
    model: 'deepseek-v4.1-flash',
    keyEnv: 'OPENCODE_API_KEY'
  }),
  deepseek: Object.freeze({
    id: 'deepseek',
    label: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-flash',
    keyEnv: 'DEEPSEEK_API_KEY'
  })
});

// Every model name that means DeepSeek-V4.1-Flash on a supported service.
const KNOWN_MODELS = Object.freeze(Object.values(PROVIDERS).map(p => p.model));
const USER_AGENT = 'hsc-se-practice-marking/1.0 (+https://hsc-se-practice-repo.vercel.app)';

function nonempty(value) { return typeof value === 'string' && value.trim() !== ''; }

function choose(env) {
  env = env || process.env;
  const forced = typeof env.AI_PROVIDER === 'string' ? env.AI_PROVIDER.trim().toLowerCase() : '';
  if (forced === 'opencode' || forced === 'opencode-go') return PROVIDERS.opencode;
  if (forced === 'deepseek') return PROVIDERS.deepseek;
  return nonempty(env.OPENCODE_API_KEY) ? PROVIDERS.opencode : PROVIDERS.deepseek;
}

function current(env) {
  env = env || process.env;
  const p = choose(env);
  const thinking = !(p === PROVIDERS.opencode && /^(off|false|0|no)$/i.test(String(env.OPENCODE_THINKING || '').trim()));
  return Object.freeze({
    ...p,
    thinking,
    key(source) { const value = (source || env)[p.keyEnv]; return nonempty(value) ? value.trim() : ''; },
    // DeepSeek's thinking-mode fields. Sent unless OPENCODE_THINKING=off.
    reasoning(effort) { return thinking ? { thinking: { type: 'enabled' }, reasoning_effort: effort } : {}; },
    headers(apiKey) {
      const h = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey };
      // OpenCode asks direct API clients to name themselves and send a session id.
      if (p === PROVIDERS.opencode) { h['User-Agent'] = USER_AGENT; h['x-opencode-session'] = crypto.randomUUID(); }
      return h;
    }
  });
}

// Gateways sometimes add a prefix or change case (eg "opencode-go/deepseek-v4.1-flash").
// Returns the requested model id when the reply is the same model, else null.
function canonicalModel(requested, returned) {
  if (typeof returned !== 'string' || !KNOWN_MODELS.includes(requested)) return null;
  if (returned === requested) return requested;
  const base = returned.trim().toLowerCase().split('/').pop();
  return base === requested ? requested : null;
}
function sameModel(requested, returned) { return canonicalModel(requested, returned) !== null; }
function knownModel(value) { return typeof value === 'string' && KNOWN_MODELS.includes(value); }

module.exports = { PROVIDERS, KNOWN_MODELS, USER_AGENT, choose, current, canonicalModel, sameModel, knownModel };
