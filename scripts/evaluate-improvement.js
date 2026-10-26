#!/usr/bin/env node
'use strict';

// Explicit opt-in provider evaluation. Never contacts production application
// endpoints or reads/writes an account. Labels stay outside both model prompts.
const fs = require('node:fs');
const path = require('node:path');
const canonical = require('../server/marking-input');
const marker = require('../server/marking-engine');
const inputs = require('../server/improvement-input');
const coach = require('../server/improvement-engine');
const { readEvaluationKey, validateDataset, budgetedFetch } = require('./evaluate-marking');
const CAPS = Object.freeze({ calls: 6, outputTokens: 98304, usd: 2, repeats: 3 });
const OPEN = new Set(['tx', 'py', 'ps', 'sq', 'dr', 'ft', 'wb']);
const fail = message => { throw new Error(message); };
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const clone = value => JSON.parse(JSON.stringify(value));
function readJson(file) {
  if (fs.statSync(file).size > 64 * 1024 * 1024) fail('Evaluation input exceeds 64 MiB.');
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { fail('Evaluation JSON input cannot be parsed.'); }
}
function parseArgs(args) {
  const options = { fixture: path.join(__dirname, '../tests/fixtures/marking-calibration.json'), bankId: '1', repeats: 1, live: false, validate: false };
  const names = { '--fixture': 'fixture', '--marking-report': 'markingReport', '--bank': 'bankId', '--env-file': 'envFile', '--repeats': 'repeats', '--max-calls': 'maxCalls', '--max-output-tokens': 'maxOutputTokens', '--max-usd': 'maxUsd', '--input-usd-per-million': 'inputPrice', '--output-usd-per-million': 'outputPrice', '--output': 'output' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--live') options.live = true;
    else if (args[i] === '--validate') options.validate = true;
    else if (names[args[i]] && args[i + 1] && !args[i + 1].startsWith('--')) options[names[args[i]]] = args[++i];
    else fail('Unknown option or missing option value.');
  }
  for (const name of ['repeats', 'maxCalls', 'maxOutputTokens', 'maxUsd', 'inputPrice', 'outputPrice']) if (options[name] != null) options[name] = Number(options[name]);
  if (!options.markingReport) fail('Supply --marking-report containing actual live marking results.');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(options.bankId) || !integer(options.repeats, 1, CAPS.repeats)) fail('Invalid bank or repeat count.');
  if (options.live && options.validate) fail('Choose validation or live mode separately.');
  if (options.envFile && !options.live) fail('--env-file requires explicit --live mode.');
  if (options.inputPrice != null || options.outputPrice != null) {
    if (![options.inputPrice, options.outputPrice].every(n => Number.isFinite(n) && n > 0 && n <= 1000)) fail('Supply both positive finite token prices.');
    options.prices = { input: options.inputPrice, output: options.outputPrice };
  }
  if (options.live && (!integer(options.maxCalls, 1, CAPS.calls) || !integer(options.maxOutputTokens, 1, CAPS.outputTokens) || !Number.isFinite(options.maxUsd) || options.maxUsd <= 0 || options.maxUsd > CAPS.usd || !options.prices)) fail('Live mode requires explicit budgets up to 6 calls, 98304 output tokens and $2, plus both token prices.');
  if (options.output && [options.fixture, options.markingReport, options.envFile].filter(Boolean).some(file => path.resolve(file) === path.resolve(options.output))) fail('Output must not overwrite any input or environment file.');
  return options;
}
function correctClosed(it) {
  if (it.t === 'mc') return it.a;
  if (it.t === 'ms') return it.a.slice();
  if (it.t === 'tk') return it.r.flatMap((r, ri) => r[1].map(ci => ri + ',' + ci));
  if (it.t === 'dd') return Object.fromEntries(it.b.map((b, i) => [i, b[1]]));
  if (it.t === 'mt' || it.t === 'dm') return Object.fromEntries(it.r.map((r, i) => [i, r[1]]));
  if (it.t === 'od') return Object.fromEntries(it.lines.filter(l => l.k === 'slot').map((l, i) => [i, it.pool.indexOf(l.t)]));
  if (it.t === 'gd') { const out = {}; it.r.forEach((r, ri) => r.forEach((cell, ci) => { if (typeof cell !== 'string') out[ri + ',' + ci] = cell[1]; })); return out; }
  fail('Unsupported closed response type.');
}
function changedClosed(it) {
  const answer = correctClosed(it);
  if (it.t === 'mc') return (answer + 1) % it.o.length;
  if (it.t === 'ms') return answer.includes(0) ? answer.filter(v => v !== 0) : [...answer, 0];
  if (it.t === 'tk') return answer.includes('0,0') ? answer.filter(v => v !== '0,0') : [...answer, '0,0'];
  const key = Object.keys(answer)[0]; let length;
  if (it.t === 'dd') length = it.b[Number(key)][0].length;
  else if (it.t === 'mt') length = it.h.length - 1;
  else if (it.t === 'dm') length = it.tok.length;
  else if (it.t === 'gd') { const [r, c] = key.split(',').map(Number); length = it.r[r][c][0].length; }
  else if (it.t === 'od') { answer[key] = it.pool.findIndex(value => value !== it.pool[answer[key]]); return answer; }
  answer[key] = (answer[key] + 1) % length; return answer;
}
function liveAccepted(result) { return marker.confirmedProvenanceProblem(result) === null; }

async function buildEvidence(data, report, bankId) {
  validateDataset(data);
  if (!report || report.mode !== 'live' || report.schemaVersion !== 1 || report.fixtureDigest !== canonical.digest(data) || !Array.isArray(report.trials)) fail('Marking report must be live and match the exact fixture digest; use the original fixture snapshot.');
  if (report.harnessVersion !== marker.HARNESS_VERSION || report.requestedModel !== marker.MODEL) fail('Marking report uses a different marker harness or model; rerun marking first.');
  const bank = canonical.loadBanks().find(b => b.id === bankId && !b.hidden); if (!bank) fail('Unknown examination bank.');
  const byId = new Map(data.cases.map(item => [item.id, item])), chosen = new Map(), records = new Map(), selected = [];
  for (let index = 0; index < report.trials.length; index++) {
    const trial = report.trials[index], item = byId.get(trial.id);
    if (!item) fail('Marking report refers to a case absent from the matching fixture.');
    if (item.request.bankId !== bankId || trial.deterministic || !trial.result || trial.result.status !== 'marked') continue;
    const key = item.request.questionNumber + '.' + item.request.partIndex;
    if (chosen.has(key)) continue;
    const prepared = canonical.prepare(item.request);
    if (prepared.blank || prepared.reviewReason || trial.status !== 'marked' || trial.mark !== trial.result.mark || !liveAccepted(trial.result)) fail('A selected marking trial is not a confirmed complete live assessment.');
    const original = { input: prepared.input, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion, model: marker.MODEL, harness: marker.HARNESS_VERSION };
    const inputDigest = canonical.digest(original), answerDigest = canonical.digest({ ...original, input: { ...prepared.input, diagramPng: null } });
    // Only provenance is added. Scores, criterion decisions, feedback, losses
    // and factor ratings remain exactly as returned by the prior live marker.
    const result = clone(trial.result);
    result.audit = { ...result.audit, inputDigest, answerDigest, questionVersion: prepared.questionVersion, rubricVersion: prepared.rubricVersion };
    if (!inputs.cacheValid(result, prepared, inputDigest, answerDigest, marker)) fail('A selected actual marking result failed current evidence/feedback validation.');
    records.set(inputDigest, result); chosen.set(key, { item, inputDigest });
    selected.push({ partId: key, caseId: item.id, reportTrialIndex: index, repetition: trial.repetition == null ? null : trial.repetition, mark: result.mark, maxMarks: prepared.input.maxMarks, inputDigest, sourceResultDigest: canonical.digest(trial.result) });
  }
  if (!selected.length) fail('No confirmed nonblank live marking result exists for this bank. No coach requests were made.');
  let closedIndex = 0;
  const controlled = [], answers = bank.qs.flatMap((q, qi) => q.it.map((it, i) => {
    const key = (qi + 1) + '.' + i, selection = chosen.get(key);
    if (selection) return { questionNumber: qi + 1, partIndex: i, answer: clone(selection.item.request.answer), markingReference: selection.inputDigest };
    if (OPEN.has(it.t)) { controlled.push({ partId: key, treatment: 'deliberate_open_blank' }); return { questionNumber: qi + 1, partIndex: i, answer: null }; }
    const position = closedIndex++ % 3, answer = position === 0 ? correctClosed(it) : position === 1 ? changedClosed(it) : null;
    controlled.push({ partId: key, treatment: position === 0 ? 'canonical_closed_choice' : position === 1 ? 'changed_closed_choice' : 'deliberate_closed_blank' });
    return { questionNumber: qi + 1, partIndex: i, answer };
  }));
  const request = { bankId, answers };
  const input = await inputs.prepare(request, { sessionId: 'evaluation-only', store: { getCached: async (session, digest) => { if (session !== 'evaluation-only') fail('Unexpected evaluation session.'); return records.get(digest) || null; } } });
  for (const selection of selected) {
    const part = input.parts.find(p => p.partId === selection.partId);
    if (!part || part.status !== 'marked' || part.mark !== selection.mark) fail('Actual marking evidence did not survive canonical coach preparation.');
  }
  input.evaluationContext = 'Constructed synthetic coaching evaluation using actual provider-marked fixture responses and deliberately controlled closed choices and blanks; not a real student sitting.';
  return { input, selected, controlled, requestDigest: canonical.digest(request) };
}
function usage(results, prices) {
  const calls = results.flatMap(result => result.audit && result.audit.calls || []), tokens = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let incompleteUsageCalls = 0, incompleteReasoningUsageCalls = 0, reasoningTokens = 0;
  for (const call of calls) {
    if (!call.usage || !integer(call.usage.prompt_tokens, 0, Number.MAX_SAFE_INTEGER) || !integer(call.usage.completion_tokens, 0, Number.MAX_SAFE_INTEGER)) incompleteUsageCalls++;
    if (call.usage && integer(call.usage.reasoning_tokens, 0, Number.MAX_SAFE_INTEGER)) reasoningTokens += call.usage.reasoning_tokens; else incompleteReasoningUsageCalls++;
    for (const key of Object.keys(tokens)) if (call.usage && integer(call.usage[key], 0, Number.MAX_SAFE_INTEGER)) tokens[key] += call.usage[key];
  }
  return { harnessCalls: calls.length, reportedTokens: tokens, incompleteUsageCalls, reportedReasoningTokens: incompleteReasoningUsageCalls ? null : reasoningTokens, incompleteReasoningUsageCalls, estimatedReportedUsageUsd: prices && !incompleteUsageCalls ? (tokens.prompt_tokens * prices.input + tokens.completion_tokens * prices.output) / 1000000 : null,
    costNote: 'User-supplied prices and reported usage give an estimate, not a verified bill. Failed or missing usage is not zero.' };
}
async function run(options, dependencies = {}) {
  const data = readJson(options.fixture), source = readJson(options.markingReport), prepared = await buildEvidence(data, source, options.bankId);
  const report = { schemaVersion: 1, mode: options.live ? 'live' : 'offline_validation', syntheticAttempt: true, fixtureDigest: canonical.digest(data), sourceMarkingReportDigest: canonical.digest(source),
    markerHarnessVersion: marker.HARNESS_VERSION, harnessVersion: coach.HARNESS_VERSION, requestedModel: coach.MODEL, bankId: options.bankId, requestDigest: prepared.requestDigest,
    selectionPolicy: 'First confirmed current-version nonblank live trial per canonical question part, in source report order. Selection ignores expected scores, ranges, tags and rationales.',
    selectedActualMarks: prepared.selected, controlledParts: prepared.controlled, coverage: prepared.input.coverage, lossSummary: prepared.input.lossSummary, quality: prepared.input.quality, trials: [],
    limitations: ['This is a constructed synthetic attempt, not a real student paper.', 'Only prior confirmed live marking outputs supply open-response scores and feedback; fixture labels are excluded from coach and audit prompts.', 'One smoke test does not establish teaching quality or rating calibration.', 'Missing open cases are deliberate blanks and must not be interpreted as evidence of missing knowledge.', 'An audit pass is a same-model gate, not independent teacher validation.'] };
  function checkpoint() { if (options.output) { fs.writeFileSync(options.output, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 }); fs.chmodSync(options.output, 0o600); } }
  if (!options.live) { report.liveEvaluation = 'Not run. Evidence and actual cached marks were validated without provider requests.'; report.metrics = usage([], options.prices); checkpoint(); return report; }
  const key = dependencies.apiKey || (options.envFile ? readEvaluationKey(options.envFile) : require('../server/ai-provider').current().key());
  if (!key) fail(require('../server/ai-provider').current().keyEnv + ' is absent; no coach requests were made.');
  const bounded = budgetedFetch(dependencies.fetch || globalThis.fetch, options);
  report.budget = { maxCalls: options.maxCalls, maxOutputTokens: options.maxOutputTokens, maxUsd: options.maxUsd, prices: options.prices };
  report.stoppedAtBudget = false;
  for (let repeat = 1; repeat <= options.repeats; repeat++) {
    if (bounded.state.calls + 2 > options.maxCalls || bounded.state.reservedOutputTokens + (coach.LIMITS.coachMaxTokens + coach.LIMITS.auditMaxTokens) > options.maxOutputTokens) { report.stoppedAtBudget = true; break; }
    let result; const began = Date.now(), before = bounded.state.calls;
    try { result = await (dependencies.improve || coach.improve)(prepared.input, { apiKey: key, fetch: bounded.fetch }); }
    catch (error) { result = { status: 'error', errorCode: typeof error.code === 'string' && /^[a-z_]{1,80}$/.test(error.code) ? error.code : 'evaluation_failed', audit: error.audit || { calls: [] } }; }
    report.trials.push({ repetition: repeat, durationMs: Date.now() - began, providerCalls: bounded.state.calls - before, status: result.status, result });
    report.budgetUsage = { ...bounded.state }; report.metrics = usage(report.trials.map(t => t.result), options.prices); checkpoint();
    if (result.errorCode === 'evaluation_budget') { report.stoppedAtBudget = true; break; }
  }
  report.budgetUsage = { ...bounded.state }; report.metrics = usage(report.trials.map(t => t.result), options.prices); checkpoint(); return report;
}
if (require.main === module) {
  (async () => {
    try {
      const report = await run(parseArgs(process.argv.slice(2)));
      process.stdout.write(JSON.stringify({ mode: report.mode, bankId: report.bankId, selectedActualMarks: report.selectedActualMarks, coverage: report.coverage, budgetUsage: report.budgetUsage, metrics: report.metrics, trials: report.trials.map(t => ({ repetition: t.repetition, status: t.status, reason: t.result.audit && t.result.audit.reason, providerCalls: t.providerCalls })) }, null, 2) + '\n');
    } catch (error) { process.stderr.write(error && typeof error.message === 'string' && !error.audit ? error.message.slice(0, 200) + '\n' : 'Coach evaluation failed; no provider detail was printed.\n'); process.exitCode = 1; }
  })();
}
module.exports = { CAPS, parseArgs, correctClosed, changedClosed, liveAccepted, buildEvidence, usage, run };
