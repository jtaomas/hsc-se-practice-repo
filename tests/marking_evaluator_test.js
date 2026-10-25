'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readEvaluationKey, validateDataset, deterministicResult, compareTrial, metrics, budgetedFetch, parseArgs, run } = require('../scripts/evaluate-marking');
const { prepare } = require('../server/marking-input');
const fixture = require('./fixtures/marking-calibration.json');
const clone = value => JSON.parse(JSON.stringify(value));
const endpoint = 'https://api.deepseek.com/chat/completions';
async function main() {
  const coverage = validateDataset(fixture);
  assert.equal(coverage.cases, 105);
  assert.equal(Object.keys(coverage.papers).length, 7);
  assert.deepEqual(Object.keys(coverage.types).sort(), ['dr', 'ft', 'ps', 'py', 'sq', 'tx']);
  assert(coverage.splits.held_out >= 20);
  for (const tag of ['beyond_full', 'full', 'partial', 'minimal', 'zero', 'blank', 'contradiction', 'prompt_injection', 'repetition', 'dense_writing', 'valid_alternative', 'band_range']) assert(coverage.tags[tag] > 0, tag);
  const duplicate = clone(fixture); duplicate.cases.push(duplicate.cases[0]); assert.throws(() => validateDataset(duplicate), /duplicate/);
  const stale = clone(fixture); stale.cases[0].source.questionVersion = 'stale'; assert.throws(() => validateDataset(stale), /relabel/);
  const leaked = clone(fixture); leaked.cases[1].split = leaked.cases[0].split === 'development' ? 'held_out' : 'development'; assert.throws(() => validateDataset(leaked), /leak/);
  const beyond = clone(fixture); beyond.cases[0].expected.range = [0, 99]; assert.throws(() => validateDataset(beyond), /range/);
  const teacher = clone(fixture); teacher.teacherCertified = true; assert.throws(() => validateDataset(teacher), /metadata/);

  let deterministic = 0;
  for (const item of fixture.cases) {
    const result = deterministicResult(prepare(item.request));
    if (result) { const comparison = compareTrial(item, result, 0, true); assert(comparison.exactAgreement, item.id); deterministic++; }
  }
  assert.equal(deterministic, 11);
  const visual = fixture.cases.filter(item => item.tags.includes('visual_diagram'));
  assert.equal(visual.length, 5);
  assert.deepEqual(visual.map(item => item.expected.mark), [4, 4, 3, 3, 0]);
  for (const item of visual) {
    const prepared = prepare(item.request);
    assert.equal(prepared.reviewReason, null, item.id); assert.equal(prepared.blank, false);
    assert.equal(deterministicResult(prepared), null);
    const png = Buffer.from(item.request.diagramPng.split(',')[1], 'base64');
    assert.equal(png.readUInt32BE(16), 960); assert.equal(png.readUInt32BE(20), 740);
    assert.equal(png[24], 8); assert.equal(png[25], 2); // 8-bit RGB, Pillow's selected mode.
    const idat = [];
    for (let offset = 8; offset < png.length;) {
      const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
      if (type === 'IDAT') idat.push(png.subarray(offset + 8, offset + 8 + length));
      offset += length + 12;
    }
    assert.equal(require('node:zlib').inflateSync(Buffer.concat(idat)).length, (960 * 3 + 1) * 740);
    const elements = new Map(prepared.input.diagramScene.elements.map(el => [el.id, el]));
    for (const el of elements.values()) {
      assert(el.x >= 0 && el.y >= 0 && el.x + el.width <= 960 && el.y + el.height <= 740, item.id + ': canvas bounds');
      if (el.type === 'text') assert.equal(el.originalText, el.text);
      if (el.type === 'arrow') {
        for (const [binding, point] of [[el.startBinding, el.points[0]], [el.endBinding, el.points[el.points.length - 1]]]) {
          const box = elements.get(binding.elementId);
          assert.equal(el.x + point[0], box.x + box.width * binding.fixedPoint[0]);
          assert.equal(el.y + point[1], box.y + box.height * binding.fixedPoint[1]);
          assert(box.boundElements.some(bound => bound.id === el.id && bound.type === 'arrow'));
        }
        assert.equal(el.startArrowhead, null); assert.equal(el.endArrowhead, null);
      }
    }
  }
  const diagramMessages = [];
  await assert.rejects(require('../server/marking-engine').mark(prepare(visual[0].request).input, {
    apiKey: 'TEST_ONLY', fetch: async (_url, request) => {
      diagramMessages.push(JSON.parse(request.body));
      return new Response('{}', { status: 401 });
    }
  }), error => error.code === 'provider_auth');
  assert.equal(diagramMessages.length, 2);
  diagramMessages.forEach(request => {
    const content = request.messages.find(message => message.role === 'user').content;
    assert.equal(content.find(part => part.type === 'image_url').image_url.url, visual[0].request.diagramPng);
    assert.equal(JSON.parse(content.find(part => part.type === 'text').text).studentSubmission.diagramScene.elements.length, 22);
  });
  assert.throws(() => parseArgs(['--live']), /budgets/);
  assert.throws(() => parseArgs(['--live', '--max-calls', '3', '--max-output-tokens', '-1']), /budgets/);
  assert.throws(() => parseArgs(['--repeats', '11']), /repeat/);
  assert.throws(() => parseArgs(['--concurrency', '4']), /Concurrency/);
  assert.throws(() => parseArgs(['--live', '--validate']), /separately/);
  assert.throws(() => parseArgs(['--max-usd', '1']), /token prices/);
  assert.throws(() => parseArgs(['--output', 'same.json', '--fixture', 'same.json']), /overwrite/);
  const liveOptions = parseArgs(['--live', '--max-calls', '3', '--max-output-tokens', '98304', '--repeats', '2']); assert.equal(liveOptions.maxCalls, 3);

  let requests = 0;
  const request = { body: JSON.stringify({ max_tokens: 10 }), headers: { Authorization: 'Bearer DO_NOT_LOG' } };
  const limited = budgetedFetch(async (_url, options) => { assert.equal(options.redirect, 'error'); requests++; return { ok: true }; }, { maxCalls: 2, maxOutputTokens: 20 });
  await Promise.all([limited.fetch(endpoint, request), limited.fetch(endpoint, request)]);
  await assert.rejects(limited.fetch(endpoint, request), error => error.code === 'evaluation_budget');
  assert.equal(requests, 2); assert.equal(limited.state.reservedOutputTokens, 20);
  await assert.rejects(limited.fetch('https://example.com/api/mark', request), error => error.code === 'evaluation_endpoint');
  const tokenLimited = budgetedFetch(async () => { throw Error('must not call'); }, { maxCalls: 10, maxOutputTokens: 9 });
  await assert.rejects(tokenLimited.fetch(endpoint, request), error => error.code === 'evaluation_budget');
  const usdLimited = budgetedFetch(async () => { throw Error('must not call'); }, { maxCalls: 10, maxOutputTokens: 100, prices: { input: 1, output: 1 }, maxUsd: .000001 });
  await assert.rejects(usdLimited.fetch(endpoint, request), error => error.code === 'evaluation_budget');

  const sample = fixture.cases.find(item => item.id === 'p7-q14-0-blank');
  const blank = deterministicResult(prepare(sample.request));
  const correct = compareTrial(sample, blank, 10, true);
  const abstain = compareTrial(sample, { status: 'needs_review', mark: null }, 30);
  const error = compareTrial(sample, { status: 'error', mark: null }, 50);
  const summary = metrics([correct, abstain, error]);
  assert.equal(summary.scoreCoverage, 1 / 3);
  assert.equal(summary.exactAgreementAmongScored, 1);
  assert.equal(summary.rangeAgreementIncludingAbstentions, 1 / 3);
  assert.equal(summary.meanAbsoluteErrorAmongScored, 0);
  assert.equal(summary.abstentions, 1); assert.equal(summary.failures, 1);
  assert.equal(summary.unstableRepeatedCases, 1);
  assert.equal(summary.estimatedReportedUsageUsd, null);
  const tokenSummary = metrics([{ ...correct, result: { audit: { calls: [{ usage: { prompt_tokens: 1000, completion_tokens: 500, total_tokens: 1500 } }] } } }], { input: 1, output: 2 });
  assert.equal(tokenSummary.estimatedReportedUsageUsd, .002);
  const unknown = metrics([{ ...correct, result: { audit: { calls: [{ status: 'failed' }] } } }], { input: 1, output: 2 });
  assert.equal(unknown.estimatedReportedUsageUsd, null); assert.equal(unknown.incompleteUsageCalls, 1);

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'marking-evaluator-'));
  try {
    const output = path.join(temp, 'offline.json');
    const envFile = path.join(temp, 'evaluation.env');
    fs.writeFileSync(envFile, '# Fixture credential, never a real key\nDEEPSEEK_API_KEY="TEST_ONLY_KEY"\n');
    assert.equal(readEvaluationKey(envFile), 'TEST_ONLY_KEY');
    assert.throws(() => parseArgs(['--env-file', envFile]), /explicit live/);
    assert.throws(() => parseArgs(['--cases', 'id,id']), /duplicate/);
    fs.writeFileSync(envFile, 'DEEPSEEK_API_KEY=$(echo should_never_execute)\n');
    assert.throws(() => readEvaluationKey(envFile), /unsupported/);
    fs.writeFileSync(envFile, 'DEEPSEEK_API_KEY=TEST_ONLY_KEY\n');
    const selected = await run(parseArgs(['--validate', '--split', 'all', '--cases', 'p7-q14-0-blank']));
    assert.equal(selected.trials.length, 1);
    await assert.rejects(run(parseArgs(['--validate', '--cases', 'not-a-case'])), /Unknown/);
    const simulated = await run(parseArgs(['--live', '--limit', '1', '--env-file', envFile, '--max-calls', '3', '--max-output-tokens', '98304']), {
      fetch: async () => ({ ok: true }),
      mark: async (input, options) => {
        assert.equal(options.apiKey, 'TEST_ONLY_KEY');
        assert.equal(input.expected, undefined); assert.equal(input.rationale, undefined);
        await options.fetch(endpoint, { body: JSON.stringify({ max_tokens: 10 }), headers: {} });
        return { status: 'needs_review', mark: null, audit: { calls: [] } };
      }
    });
    assert.equal(simulated.budgetUsage.calls, 1); assert.equal(simulated.metrics.providerCalls, 1);
    assert.equal(simulated.metrics.abstentions, 1);
    assert(!JSON.stringify(simulated).includes('TEST_ONLY_KEY'));
    let activeJobs = 0, peakJobs = 0, startedJobs = 0;
    const concurrent = await run(parseArgs(['--live', '--limit', '3', '--concurrency', '3', '--max-calls', '6', '--max-output-tokens', '196608']), {
      apiKey: 'TEST_ONLY', fetch: async () => { await new Promise(resolve => setTimeout(resolve, 2)); return { ok: true }; },
      mark: async (input, options) => {
        startedJobs++; activeJobs++; peakJobs = Math.max(peakJobs, activeJobs);
        assert.equal(input.expected, undefined); assert.equal(input.rationale, undefined);
        try {
          for (let stage = 0; stage < 3; stage++) await options.fetch(endpoint, { body: JSON.stringify({ max_tokens: 32768 }), headers: {} });
          return { status: 'needs_review', mark: null, audit: { calls: [] } };
        } finally { activeJobs--; }
      }
    });
    assert.equal(startedJobs, 2); assert.equal(peakJobs, 2);
    assert.equal(concurrent.budgetUsage.calls, 6); assert.equal(concurrent.budgetUsage.reservedOutputTokens, 196608);
    assert.equal(concurrent.stoppedAtBudget, true); assert.equal(concurrent.trials.length, 2);
    assert(concurrent.trials.every(trial => trial.result.audit.evaluatorProviderCalls === 3));
    assert.equal(concurrent.metrics.providerCalls, 6);
    let shortJobs = 0;
    const released = await run(parseArgs(['--live', '--limit', '3', '--concurrency', '3', '--max-calls', '5', '--max-output-tokens', '163840']), {
      apiKey: 'TEST_ONLY', fetch: async () => ({ ok: true }),
      mark: async (_input, options) => {
        shortJobs++;
        await options.fetch(endpoint, { body: JSON.stringify({ max_tokens: 32768 }), headers: {} });
        return { status: 'needs_review', mark: null, audit: { calls: [] } };
      }
    });
    assert.equal(shortJobs, 3); assert.equal(released.budgetUsage.calls, 3); assert.equal(released.stoppedAtBudget, false);
    let tokenJobs = 0;
    const outputLimited = await run(parseArgs(['--live', '--limit', '3', '--concurrency', '3', '--max-calls', '99', '--max-output-tokens', '98304']), {
      apiKey: 'TEST_ONLY', fetch: async () => ({ ok: true }),
      mark: async (_input, options) => {
        tokenJobs++;
        for (let stage = 0; stage < 3; stage++) await options.fetch(endpoint, { body: JSON.stringify({ max_tokens: 32768 }), headers: {} });
        return { status: 'needs_review', mark: null, audit: { calls: [] } };
      }
    });
    assert.equal(tokenJobs, 1); assert.equal(outputLimited.stoppedAtBudget, true);

    // Recovery cannot silently increase explicit budgets or consume an active
    // neighbour's reserved calls. Even an injected engine is capped at four.
    for (const [maxCalls, maxTokens, requested, sent, failed] of [[3, 131072, 4, 3, true], [4, 131072, 4, 4, false], [5, 163840, 5, 4, true], [4, 98304, 4, 3, true]]) {
      let physical = 0;
      const recovery = await run(parseArgs(['--live', '--limit', '1', '--max-calls', String(maxCalls), '--max-output-tokens', String(maxTokens)]), {
        apiKey: 'TEST_ONLY', fetch: async () => { physical++; return { ok: true }; },
        mark: async (_input, options) => {
          for (let call = 0; call < requested; call++) await options.fetch(endpoint, { body: JSON.stringify({ max_tokens: 32768 }), headers: {} });
          return { status: 'needs_review', mark: null, audit: { calls: [] } };
        }
      });
      assert.equal(physical, sent); assert.equal(recovery.budgetUsage.calls, sent);
      assert.equal(recovery.trials[0].result.audit.evaluatorProviderCalls, sent);
      assert.equal(recovery.trials[0].result.errorCode === 'evaluation_budget', failed);
    }
    let runningJobs = 0, firstJobExtraRejected = false, releaseOther;
    const otherWaiting = new Promise(resolve => { releaseOther = resolve; });
    const neighbours = await run(parseArgs(['--live', '--limit', '2', '--concurrency', '2', '--max-calls', '6', '--max-output-tokens', '196608']), {
      apiKey: 'TEST_ONLY', fetch: async () => ({ ok: true }),
      mark: async (_input, options) => {
        const index = runningJobs++;
        if (index === 1) await otherWaiting;
        try {
          for (let call = 0; call < (index === 0 ? 4 : 3); call++) await options.fetch(endpoint, { body: JSON.stringify({ max_tokens: 32768 }), headers: {} });
        } catch (error) { if (index === 0 && error.code === 'evaluation_budget') firstJobExtraRejected = true; throw error; }
        finally { if (index === 0) releaseOther(); }
        return { status: 'needs_review', mark: null, audit: { calls: [] } };
      }
    });
    assert(firstJobExtraRejected); assert.equal(neighbours.budgetUsage.calls, 6);
    assert(neighbours.trials.every(trial => trial.result.audit.evaluatorProviderCalls === 3));

    const offline = await run(parseArgs(['--validate', '--split', 'all', '--output', output]), { fetch: () => { throw Error('offline must not request provider'); } });
    assert.equal(offline.mode, 'offline_validation'); assert.equal(offline.liveMetrics, null); assert.equal(offline.metrics.providerCalls, 0); assert.equal(offline.trials.length, 11);
    const replay = await run(parseArgs(['--replay', output, '--split', 'all'])); assert.equal(replay.trials.length, 11);
    // Even an injected engine must receive the bounded transport; budget exit
    // precedes any model call when a full three-call attempt does not fit.
    const none = await run(parseArgs(['--live', '--limit', '1', '--max-calls', '2', '--max-output-tokens', '98304']), { apiKey: 'TEST_ONLY', mark: () => { throw Error('must not start'); } });
    assert.equal(none.stoppedAtBudget, true); assert.equal(none.trials.length, 0); assert.equal(none.budgetUsage.calls, 0);
    assert(!fs.readFileSync(output, 'utf8').includes('DO_NOT_LOG'));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
  console.log('marking evaluator: 105 fixture cases, 11 deterministic checks, 5 matching visual cases, budget/split/metric/replay regressions passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
