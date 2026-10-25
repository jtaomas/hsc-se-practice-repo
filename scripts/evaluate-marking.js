#!/usr/bin/env node
'use strict';

// Offline by default. Paid evaluation uses the engine directly and never calls
// the deployed account/mark APIs or writes student account data.
const fs = require('node:fs');
const path = require('node:path');
const { prepare, digest, loadBanks } = require('../server/marking-input');
const engine = require('../server/marking-engine');
const feedback = require('../server/feedback-policy');
const DEFAULT_FIXTURE = path.join(__dirname, '../tests/fixtures/marking-calibration.json');
const ENDPOINT = 'https://api.deepseek.com/chat/completions';
// Reserve every logical stage before starting a case. The optional shared
// connection retry may use only otherwise-unreserved explicit budget.
const MAX_LOGICAL_CALLS = engine.MAX_LOGICAL_CALLS ?? 5;
const MAX_NETWORK_ATTEMPTS = engine.MAX_NETWORK_ATTEMPTS ?? 6;
const safeCode = value => typeof value === 'string' && /^[a-z_]{1,80}$/.test(value) ? value : 'evaluation_failed';
function fail(message) { throw new Error(message); }
function integer(value, minimum, maximum) { return Number.isSafeInteger(value) && value >= minimum && value <= maximum; }
function readJson(file) {
  if (fs.statSync(file).size > 64 * 1024 * 1024) fail('Evaluation file exceeds 64 MiB.');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function readEvaluationKey(file) {
  if (fs.statSync(file).size > 65536) fail('Evaluation environment file exceeds 64 KiB.');
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const matches = lines.filter(line => /^\s*(?:export\s+)?DEEPSEEK_API_KEY\s*=/.test(line));
  if (matches.length !== 1) fail('Evaluation environment file must contain exactly one DEEPSEEK_API_KEY assignment.');
  let value = matches[0].replace(/^\s*(?:export\s+)?DEEPSEEK_API_KEY\s*=\s*/, '').trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  // Deliberately no interpolation, command substitution, escape processing or
  // shell evaluation. Only the one requested credential is read into memory.
  if (!/^[A-Za-z0-9_.~+\/=-]{1,1024}$/.test(value)) fail('Evaluation API key assignment is empty or has unsupported characters.');
  return value;
}
function validateDataset(data) {
  if (!data || data.schemaVersion !== 1 || data.labelSource !== 'assistant_independent_reasoning' || data.teacherCertified !== false ||
      !Array.isArray(data.cases) || !data.cases.length || data.cases.length > 1000) fail('Invalid dataset metadata or case count.');
  if (typeof data.splitPolicy !== 'string' || !data.splitPolicy.trim()) fail('Dataset must document its split policy.');
  const ids = new Set(), splitByQuestion = new Map(), counts = { cases: data.cases.length, papers: {}, types: {}, splits: {}, tags: {}, expectedReview: 0, blank: 0 };
  for (const item of data.cases) {
    if (!item || typeof item.id !== 'string' || !/^[a-z0-9_-]{1,100}$/.test(item.id) || ids.has(item.id)) fail('Invalid or duplicate case ID.');
    ids.add(item.id);
    if (!['development', 'held_out'].includes(item.split) || !Array.isArray(item.tags) || !item.tags.length || item.tags.some(tag => typeof tag !== 'string' || !/^[a-z0-9_]{1,60}$/.test(tag))) fail(item.id + ': invalid split or tags.');
    let prepared;
    try { prepared = prepare(item.request); } catch (_) { fail(item.id + ': canonical input rejected.'); }
    const source = item.source, expected = item.expected;
    const canonicalType = loadBanks().find(bank => bank.id === item.request.bankId).qs[item.request.questionNumber - 1].it[item.request.partIndex].t;
    if (!source || source.type !== canonicalType || source.questionVersion !== prepared.questionVersion || source.rubricVersion !== prepared.rubricVersion || source.maxMarks !== prepared.input.maxMarks || !['tx', 'py', 'ps', 'sq', 'ft', 'dr'].includes(source.type)) fail(item.id + ': canonical question/rubric changed; independently relabel this case.');
    if (!expected || !['marked', 'needs_review'].includes(expected.status) || typeof expected.rationale !== 'string' || expected.rationale.length < 30 ||
        !Array.isArray(expected.criterionIds) || JSON.stringify(expected.criterionIds) !== JSON.stringify(prepared.input.criteria.map(c => c.id)) ||
        !Array.isArray(expected.feedbackExpectations) || !expected.feedbackExpectations.length || expected.feedbackExpectations.some(v => typeof v !== 'string' || !v.trim())) fail(item.id + ': missing criterion-anchored label or feedback expectation.');
    if (expected.status === 'marked') {
      if (!integer(expected.mark, 0, source.maxMarks) || !Array.isArray(expected.range) || expected.range.length !== 2 ||
          !integer(expected.range[0], 0, expected.mark) || !integer(expected.range[1], expected.mark, source.maxMarks)) fail(item.id + ': invalid mark/range.');
    } else if (expected.mark !== null || expected.range !== null) fail(item.id + ': review labels must not contain a score.');
    if (expected.qualityExpectations && (!Array.isArray(expected.qualityExpectations) || expected.qualityExpectations.some(q => !feedback.QUALITY_FACTORS.includes(q.factor) || !Array.isArray(q.range) || q.range.length !== 2 || !integer(q.range[0], 0, 10) || !integer(q.range[1], q.range[0], 10) || typeof q.basis !== 'string' || !q.basis.trim()))) fail(item.id + ': invalid quality expectation.');
    const question = [item.request.bankId, item.request.questionNumber, item.request.partIndex].join('/');
    if (splitByQuestion.has(question) && splitByQuestion.get(question) !== item.split) fail(item.id + ': question variants leak across dataset splits.');
    splitByQuestion.set(question, item.split);
    for (const [group, value] of [['papers', item.request.bankId], ['types', source.type], ['splits', item.split]]) counts[group][value] = (counts[group][value] || 0) + 1;
    item.tags.forEach(tag => { counts.tags[tag] = (counts.tags[tag] || 0) + 1; });
    counts.expectedReview += expected.status === 'needs_review' ? 1 : 0;
    counts.blank += prepared.blank ? 1 : 0;
  }
  counts.questionParts = splitByQuestion.size;
  return counts;
}
function deterministicResult(prepared) {
  if (!prepared.blank && !prepared.reviewReason) return null;
  return { status: prepared.reviewReason ? 'needs_review' : 'marked', mark: prepared.reviewReason ? null : 0,
    summary: prepared.reviewReason || 'No answer was given for this part.', strengths: [], improve: [], advice: [], criteria: [],
    ...(prepared.reviewReason ? feedback.unavailableFeedback() : feedback.blankFeedback(prepared.input)),
    audit: { calls: [], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, reasons: [prepared.reviewReason ? 'evidence_requires_review' : 'blank_answer'] } };
}
function feedbackIssues(result, input, expected, deterministic) {
  if (!['marked', 'provisional'].includes(result.status)) return [];
  const issues = [];
  if (!deterministic) {
    if (result.status === 'marked') {
      if (result.mark === input.maxMarks && result.improve && result.improve.length) issues.push('full_marks_with_scored_improvement');
      if (result.mark < input.maxMarks && (!Array.isArray(result.improve) || !result.improve.length)) issues.push('missing_scored_improvement');
      if (result.mark === 0 && result.strengths && result.strengths.length) issues.push('zero_with_credited_strength');
    }
    const policy = feedback.feedbackProblem(result, input);
    if (policy) issues.push(policy);
    for (const criterion of result.criteria || []) {
      if (['met', 'partial'].includes(criterion.assessment) && (!criterion.evidence || !criterion.evidence.length)) issues.push('missing_criterion_evidence');
      if ((criterion.evidence || []).some(quote => input.type === 'diagram' ? !input.diagramScene.elements.some(el => el.id === quote) : !input.answer.includes(quote))) issues.push('unsupported_criterion_evidence');
    }
  }
  // Provisional results deliberately withhold losses/quality and educational
  // feedback. Absence there is not a failed quality rating or a confirmed audit.
  for (const expectation of result.status === 'marked' ? expected.qualityExpectations || [] : []) {
    const actual = (result.quality || []).find(item => item.id === expectation.factor);
    if (!actual || actual.rating === null || actual.rating < expectation.range[0] || actual.rating > expectation.range[1]) issues.push('quality_expectation_' + expectation.factor);
  }
  return [...new Set(issues)];
}
function compareTrial(item, result, durationMs, deterministic = false) {
  const expected = item.expected, input = prepare(item.request).input;
  const scored = result.status === 'marked' && integer(result.mark, 0, input.maxMarks);
  const provisional = result.status === 'provisional' && integer(result.mark, 0, input.maxMarks);
  const numeric = expected.status === 'marked' && scored;
  const provisionalNumeric = expected.status === 'marked' && provisional;
  const outsideRange = mark => mark < expected.range[0] ? 'under' : mark > expected.range[1] ? 'over' : null;
  return { id: item.id, split: item.split, paper: item.request.bankId, type: item.source.type, tags: item.tags,
    expectedStatus: expected.status, expectedMark: expected.mark, expectedRange: expected.range,
    status: result.status, mark: scored || provisional ? result.mark : null, deterministic, durationMs,
    confirmedScore: scored, provisionalScore: provisional, numericReleased: scored || provisional,
    exactAgreement: expected.status === 'marked' ? (scored ? result.mark === expected.mark : false) : result.status === 'needs_review',
    rangeAgreement: expected.status === 'marked' ? (scored ? result.mark >= expected.range[0] && result.mark <= expected.range[1] : false) : result.status === 'needs_review',
    signedError: numeric ? result.mark - expected.mark : null,
    outsideRange: numeric ? outsideRange(result.mark) : null,
    provisionalExactAgreement: provisionalNumeric ? result.mark === expected.mark : null,
    provisionalRangeAgreement: provisionalNumeric ? outsideRange(result.mark) === null : null,
    provisionalSignedError: provisionalNumeric ? result.mark - expected.mark : null,
    provisionalOutsideRange: provisionalNumeric ? outsideRange(result.mark) : null,
    feedbackAssessment: result.status === 'provisional' ? 'unavailable_provisional' : scored ? 'mechanical_only' : 'not_assessed',
    feedbackIssues: feedbackIssues(result, input, expected, deterministic), result };
}
function metrics(trials, prices) {
  const labelled = trials.filter(t => t.expectedStatus === 'marked');
  const scored = labelled.filter(t => t.status === 'marked' && Number.isFinite(t.signedError));
  const provisional = labelled.filter(t => t.status === 'provisional' && Number.isFinite(t.provisionalSignedError));
  const reviews = trials.filter(t => t.expectedStatus === 'needs_review');
  const latencies = trials.map(t => t.durationMs).sort((a, b) => a - b);
  const rate = (n, d) => d ? n / d : null;
  const calls = trials.flatMap(t => t.result && t.result.audit && t.result.audit.calls || []);
  const tokens = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let incompleteUsageCalls = 0;
  calls.forEach(call => {
    if (!call.usage || !integer(call.usage.prompt_tokens, 0, Number.MAX_SAFE_INTEGER) || !integer(call.usage.completion_tokens, 0, Number.MAX_SAFE_INTEGER)) incompleteUsageCalls++;
    for (const key of Object.keys(tokens)) if (call.usage && integer(call.usage[key], 0, Number.MAX_SAFE_INTEGER)) tokens[key] += call.usage[key];
  });
  const groups = new Map();
  trials.forEach(t => { const key = t.status + ':' + t.mark; if (!groups.has(t.id)) groups.set(t.id, new Set()); groups.get(t.id).add(key); });
  const repeatedIds = [...groups.keys()].filter(id => trials.filter(t => t.id === id).length > 1);
  return {
    trials: trials.length, scoreLabelledTrials: labelled.length, confirmedScores: scored.length,
    scoreCoverage: rate(scored.length, labelled.length),
    provisionalScores: provisional.length, releasedScores: scored.length + provisional.length,
    releasedRate: rate(scored.length + provisional.length, labelled.length),
    unscoredLabelledTrials: labelled.length - scored.length - provisional.length,
    unexpectedNumericReleases: trials.filter(t => t.expectedStatus !== 'marked' && t.numericReleased).length,
    provisionalRate: rate(provisional.length, labelled.length),
    provisionalExactAgreement: rate(provisional.filter(t => t.provisionalExactAgreement).length, provisional.length),
    provisionalRangeAgreement: rate(provisional.filter(t => t.provisionalRangeAgreement).length, provisional.length),
    provisionalMeanAbsoluteError: rate(provisional.reduce((sum, t) => sum + Math.abs(t.provisionalSignedError), 0), provisional.length),
    provisionalSignedBias: rate(provisional.reduce((sum, t) => sum + t.provisionalSignedError, 0), provisional.length),
    provisionalOverAwards: provisional.filter(t => t.provisionalOutsideRange === 'over').length,
    provisionalUnderAwards: provisional.filter(t => t.provisionalOutsideRange === 'under').length,
    unscoredProvisionalResults: trials.filter(t => t.status === 'provisional' && t.mark === null).length,
    exactAgreementAmongScored: rate(scored.filter(t => t.exactAgreement).length, scored.length),
    rangeAgreementAmongScored: rate(scored.filter(t => t.rangeAgreement).length, scored.length),
    rangeAgreementIncludingAbstentions: rate(labelled.filter(t => t.rangeAgreement).length, labelled.length),
    meanAbsoluteErrorAmongScored: rate(scored.reduce((sum, t) => sum + Math.abs(t.signedError), 0), scored.length),
    signedBiasAmongScored: rate(scored.reduce((sum, t) => sum + t.signedError, 0), scored.length),
    overAwards: scored.filter(t => t.outsideRange === 'over').length, underAwards: scored.filter(t => t.outsideRange === 'under').length,
    abstentions: labelled.filter(t => t.status === 'needs_review').length, failures: trials.filter(t => t.status === 'error').length,
    expectedReviews: reviews.length, expectedReviewAgreement: rate(reviews.filter(t => t.status === 'needs_review').length, reviews.length),
    feedbackIssueTrials: trials.filter(t => t.feedbackIssues.length).length,
    feedbackIssueCodes: Object.fromEntries([...new Set(trials.flatMap(t => t.feedbackIssues))].map(code => [code, trials.filter(t => t.feedbackIssues.includes(code)).length])),
    repeatedCases: repeatedIds.length, unstableRepeatedCases: repeatedIds.filter(id => groups.get(id).size > 1).length,
    latencyMs: { median: latencies.length ? latencies[Math.floor(latencies.length * .5)] : null, p95: latencies.length ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * .95) - 1)] : null },
    harnessCalls: calls.length, providerCalls: trials.reduce((sum, trial) => sum + (trial.result && trial.result.audit && Number.isInteger(trial.result.audit.evaluatorProviderCalls) ? trial.result.audit.evaluatorProviderCalls : (trial.result && trial.result.audit && trial.result.audit.calls || []).length), 0), reportedTokens: tokens, incompleteUsageCalls,
    estimatedReportedUsageUsd: prices && !incompleteUsageCalls ? (tokens.prompt_tokens * prices.input + tokens.completion_tokens * prices.output) / 1000000 : null,
    costNote: 'Estimate uses user-supplied rates and reported usage, without cache discounts. Missing/failed usage is not zero and cannot establish the total bill.'
  };
}
function budgetedFetch(fetcher, options) {
  const state = { calls: 0, reservedOutputTokens: 0, reservedUsd: 0 };
  function deny() { throw Object.assign(new Error('Evaluation budget exhausted.'), { status: 429, code: 'evaluation_budget' }); }
  return { state, fetch: async (url, request) => {
    if (url !== ENDPOINT) throw Object.assign(new Error('Unexpected evaluation endpoint.'), { status: 400, code: 'evaluation_endpoint' });
    const body = JSON.parse(request.body), output = body.max_tokens;
    if (!integer(output, 1, engine.LIMITS.maxTokens)) deny();
    // Prompt-token estimate deliberately exceeds UTF-8 request bytes. It is a
    // conservative reservation, not a measured provider token count.
    const promptUpperEstimate = Buffer.byteLength(request.body, 'utf8') + 4096;
    const reserveUsd = options.prices ? (promptUpperEstimate * options.prices.input + output * options.prices.output) / 1000000 : 0;
    if (state.calls + 1 > options.maxCalls || state.reservedOutputTokens + output > options.maxOutputTokens ||
        options.maxUsd != null && state.reservedUsd + reserveUsd > options.maxUsd) deny();
    state.calls++; state.reservedOutputTokens += output; state.reservedUsd += reserveUsd;
    return fetcher(url, { ...request, redirect: 'error' });
  } };
}
function parseArgs(args) {
  const options = { fixture: DEFAULT_FIXTURE, split: 'development', repeats: 1, limit: 1000, concurrency: 1, live: false, validate: false };
  const names = { '--concurrency': 'concurrency', '--fixture': 'fixture', '--env-file': 'envFile', '--cases': 'caseIds', '--split': 'split', '--limit': 'limit', '--repeats': 'repeats', '--max-calls': 'maxCalls', '--max-output-tokens': 'maxOutputTokens', '--max-usd': 'maxUsd', '--input-usd-per-million': 'inputPrice', '--output-usd-per-million': 'outputPrice', '--output': 'output', '--replay': 'replay' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--live') options.live = true;
    else if (args[i] === '--validate') options.validate = true;
    else if (names[args[i]] && args[i + 1] && !args[i + 1].startsWith('--')) options[names[args[i]]] = args[++i];
    else fail('Unknown option or missing option value.');
  }
  for (const name of ['limit', 'repeats', 'concurrency', 'maxCalls', 'maxOutputTokens', 'maxUsd', 'inputPrice', 'outputPrice']) if (options[name] != null) options[name] = Number(options[name]);
  if (!['all', 'development', 'held_out'].includes(options.split) || !integer(options.limit, 1, 1000) || !integer(options.repeats, 1, 10)) fail('Invalid split, limit or repeat count.');
  if (!integer(options.concurrency, 1, 3)) fail('Concurrency must be between 1 and 3.');
  if (options.caseIds) {
    options.caseIds = options.caseIds.split(',');
    if (options.caseIds.some(id => !/^[a-z0-9_-]{1,100}$/.test(id)) || new Set(options.caseIds).size !== options.caseIds.length) fail('Invalid or duplicate --cases IDs.');
  }
  if (options.envFile && !options.live) fail('--env-file is only used in explicit live mode.');
  if (options.live && (options.validate || options.replay)) fail('Choose live, validation or replay mode separately.');
  if (options.live && (!integer(options.maxCalls, 1, 10000) || !integer(options.maxOutputTokens, 1, 1000000000))) fail('Live mode requires explicit --max-calls and --max-output-tokens budgets.');
  if (options.inputPrice != null || options.outputPrice != null) {
    if (![options.inputPrice, options.outputPrice].every(value => Number.isFinite(value) && value >= 0 && value <= 1000)) fail('Supply both finite nonnegative token prices.');
    options.prices = { input: options.inputPrice, output: options.outputPrice };
  }
  if (options.maxUsd != null && (!Number.isFinite(options.maxUsd) || options.maxUsd <= 0 || !options.prices)) fail('--max-usd requires a positive amount and both token prices.');
  if (options.output && [options.fixture, options.replay, options.envFile].filter(Boolean).some(file => path.resolve(file) === path.resolve(options.output))) fail('Output must not overwrite the fixture, replay input or environment file.');
  return options;
}
function reportBase(data, coverage, mode) {
  return { schemaVersion: 1, mode, labelSource: data.labelSource, teacherCertified: false, fixtureDigest: digest(data),
    harnessVersion: engine.HARNESS_VERSION, requestedModel: engine.MODEL, coverage,
    limitations: ['Labels are assistant-authored hypotheses, not teacher-certified marks.', 'Mechanical feedback checks do not judge educational usefulness or factual accuracy.', 'Same-model blind agreement is not independent human adjudication.', 'Provisional numeric results are separate from confirmed-score coverage and agreement; they withhold educational diagnostics and may under-award.', 'Five complete PNG/scene diagrams are synthetic development cases; live visual accuracy requires measured provider results.'], trials: [] };
}
async function run(options, dependencies = {}) {
  const data = readJson(options.fixture), coverage = validateDataset(data);
  if (options.caseIds && options.caseIds.some(id => !data.cases.some(item => item.id === id))) fail('Unknown --cases ID.');
  if (options.caseIds && options.split !== 'all' && data.cases.some(item => options.caseIds.includes(item.id) && item.split !== options.split)) fail('A selected case is outside the requested split; use the intended split or --split all.');
  const selected = data.cases.filter(item => (options.split === 'all' || item.split === options.split) && (!options.caseIds || options.caseIds.includes(item.id))).slice(0, options.limit);
  const report = reportBase(data, coverage, options.live ? 'live' : options.replay ? 'replay' : 'offline_validation');
  function checkpoint() { if (options.output) fs.writeFileSync(options.output, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 }); }
  if (options.replay) {
    const prior = readJson(options.replay);
    if (prior.fixtureDigest !== report.fixtureDigest || !Array.isArray(prior.trials)) fail('Replay fixture digest does not match or trials are missing.');
    const byId = new Map(selected.map(item => [item.id, item]));
    for (const trial of prior.trials) if (byId.has(trial.id)) report.trials.push(compareTrial(byId.get(trial.id), trial.result, trial.durationMs, trial.deterministic));
    report.sourceHarnessVersion = prior.harnessVersion;
  } else if (!options.live) {
    for (const item of selected) {
      const result = deterministicResult(prepare(item.request));
      if (result) report.trials.push(compareTrial(item, result, 0, true));
    }
    report.liveMetrics = null;
    report.liveEvaluation = 'Not run. No provider requests were made. Nonblank responses were labelled by reasoning, not measured against the live model.';
  } else {
    const key = dependencies.apiKey || (options.envFile ? readEvaluationKey(options.envFile) : process.env.DEEPSEEK_API_KEY);
    if (!key) fail('DEEPSEEK_API_KEY is absent; live evaluation was not run.');
    const bounded = budgetedFetch(dependencies.fetch || globalThis.fetch, options);
    report.budget = { maxCalls: options.maxCalls, maxOutputTokens: options.maxOutputTokens, maxUsd: options.maxUsd == null ? null : options.maxUsd, prices: options.prices || null,
      perJobLogicalCalls: MAX_LOGICAL_CALLS, perJobMaxNetworkAttempts: MAX_NETWORK_ATTEMPTS };
    const concurrency = options.concurrency || 1;
    report.concurrency = concurrency;
    const jobs = selected.flatMap(item => Array.from({ length: options.repeats }, (_, repetition) => ({ item, repetition, prepared: prepare(item.request) })));
    const running = new Set();
    let stopped = false, next = 0, pendingCalls = 0, pendingOutputTokens = 0;
    function capacityAvailable() {
      return bounded.state.calls + pendingCalls + MAX_LOGICAL_CALLS <= options.maxCalls &&
        bounded.state.reservedOutputTokens + pendingOutputTokens + MAX_LOGICAL_CALLS * engine.LIMITS.maxTokens <= options.maxOutputTokens;
    }
    function reserve() {
      const reservation = { calls: MAX_LOGICAL_CALLS, outputTokens: MAX_LOGICAL_CALLS * engine.LIMITS.maxTokens, sent: 0 };
      pendingCalls += reservation.calls; pendingOutputTokens += reservation.outputTokens;
      return reservation;
    }
    async function execute(job, reservation) {
      const { item, repetition, prepared } = job, initial = deterministicResult(prepared), began = Date.now();
      function jobFetch(url, request) {
        const generated = JSON.parse(request.body).max_tokens;
        // A connection-only recovery may need a sixth physical request. Use
        // only spare explicit budget, never another active job's reservation.
        // Every logical stage is reserved; neither CLI ceiling is increased.
        if (reservation && reservation.calls === 0 && reservation.sent < MAX_NETWORK_ATTEMPTS && integer(generated, 1, engine.LIMITS.maxTokens) &&
            bounded.state.calls + pendingCalls + 1 <= options.maxCalls &&
            bounded.state.reservedOutputTokens + pendingOutputTokens + generated <= options.maxOutputTokens) {
          reservation.calls++; pendingCalls++; reservation.outputTokens += generated; pendingOutputTokens += generated;
        }
        if (!reservation || reservation.calls < 1 || !integer(generated, 1, engine.LIMITS.maxTokens) || generated > reservation.outputTokens) {
          throw Object.assign(new Error('Evaluation job reservation exhausted.'), { status: 429, code: 'evaluation_budget' });
        }
        // Release this request's pending allocation and consume it in the
        // shared transport synchronously, before any other job can interleave.
        reservation.calls--; pendingCalls--;
        reservation.outputTokens -= generated; pendingOutputTokens -= generated;
        const before = bounded.state.calls, response = bounded.fetch(url, request);
        reservation.sent += bounded.state.calls - before;
        return response;
      }
      let result;
      try { result = initial || await (dependencies.mark || engine.mark)(prepared.input, { apiKey: key, fetch: jobFetch }); }
      catch (error) { result = { status: 'error', mark: null, errorCode: safeCode(error.code), audit: error.audit || { calls: [] } }; }
      finally {
        // A disagreement may skip audit; release only its unused capacity.
        // Actual sent-request reservations stay consumed for this run.
        if (reservation) { pendingCalls -= reservation.calls; pendingOutputTokens -= reservation.outputTokens; }
      }
      result.audit = result.audit || { calls: [] };
      result.audit.evaluatorProviderCalls = reservation ? reservation.sent : 0;
      const trial = compareTrial(item, result, Date.now() - began, !!initial);
      trial.repetition = repetition + 1; report.trials.push(trial);
      report.budgetUsage = { ...bounded.state };
      report.metrics = metrics(report.trials, options.prices); checkpoint();
      if (result.errorCode === 'evaluation_budget') stopped = true;
    }
    while (next < jobs.length || running.size) {
      while (!stopped && next < jobs.length && running.size < concurrency) {
        const job = jobs[next], initial = deterministicResult(job.prepared);
        if (!initial && !capacityAvailable()) {
          // Active jobs can release unused audit reservations on completion.
          // Wait for that event rather than launching a partially funded job.
          if (!running.size) stopped = true;
          break;
        }
        const reservation = initial ? null : reserve();
        next++;
        const task = execute(job, reservation);
        running.add(task);
        task.then(() => running.delete(task), () => running.delete(task));
      }
      if (running.size) await Promise.race(running);
      else if (stopped || next >= jobs.length) break;
    }
    report.stoppedAtBudget = stopped;
    report.budgetUsage = { ...bounded.state };
  }
  report.metrics = metrics(report.trials, options.prices);
  report.providerOnlyMetrics = metrics(report.trials.filter(trial => !trial.deterministic), options.prices);
  report.metricsByType = Object.fromEntries([...new Set(report.trials.map(t => t.type))].map(type => [type, metrics(report.trials.filter(t => t.type === type), options.prices)]));
  checkpoint(); return report;
}
if (require.main === module) {
  (async () => {
    try {
      const report = await run(parseArgs(process.argv.slice(2)));
      const compact = { ...report, trials: report.trials.map(t => ({ id: t.id, status: t.status, mark: t.mark, expectedMark: t.expectedMark, exactAgreement: t.exactAgreement, feedbackIssues: t.feedbackIssues })) };
      process.stdout.write(JSON.stringify(compact, null, 2) + '\n');
    } catch (error) {
      // No provider bodies, headers, credentials or raw transport messages.
      const safe = error && typeof error.message === 'string' && !error.audit ? error.message.slice(0, 200) : 'Evaluation failed; no provider detail was printed.';
      process.stderr.write(safe + '\n'); process.exitCode = 1;
    }
  })();
}
module.exports = { readEvaluationKey, validateDataset, deterministicResult, compareTrial, metrics, budgetedFetch, parseArgs, run };
