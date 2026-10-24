# Marking calibration and evaluation

The checked-in set contains **105 original synthetic responses**, independently labelled by an assistant against the repository's canonical question criteria. It is **not teacher-certified**, an official HSC benchmark, or evidence that the live marker achieves any particular accuracy. The labels are explicit, reviewable hypotheses: each gives the preferred mark, acceptable range, criterion IDs and a short reason for that judgement.

On 24 October 2026, all 105 cases passed offline dataset validation and the evaluator regression tests. Eleven deterministic input checks passed: nine blank responses score zero and two incomplete diagram submissions require review. **The initial offline verification made no provider requests; `DEEPSEEK_API_KEY` was absent at that stage.** Those eleven checks measure input handling, not AI marking quality. Subsequent paid evaluations must be reported from their saved live reports, separately from these offline checks. Nonblank-response labels were reasoned through before model comparison; no model metrics are inferred from their existence.

## Coverage and independent judgements

There are 59 written responses, 21 Python answers, six pseudocode algorithms, six SQL queries, five typed tables and eight diagrams, covering all seven papers and 23 distinct question parts. Cases include answers exceeding full-mark requirements, concise correct alternatives, partial answers, minimal answers, misconceptions, zero credit, blanks, contradictions, repetition, dense prose, prompt injection, code comments claiming execution, and boundary or logic defects.

The original split labels are **74 development / 31 held-out**, with every variant of a question part in the same split. These are historical labels, not an untouched test set: the initial pilot exposed some nominally held-out questions, and the later full v3 evaluation used all 105 cases. The v5 full evaluation is a development rerun after reviewing v3. The dataset author saw every label. See [evaluation provenance](MARKING_EVALUATION_NOTES.md) and [saved-run comparisons](MARKING_REVIEW.md) for exposure groups and version-specific results. A future independent evaluation needs new, separately adjudicated questions. Repeated model runs do not increase the number of independent student examples.

Some representative comparisons to the assistant's own marking are below. “Expected” is the independent label, not an observed model result.

| Case | Expected | Basis |
| --- | ---: | --- |
| Paper 1 Q18, beyond-full hashing explanation | 3/3 | One-way hashing, unique random salt and their protection satisfy the top band; KDF detail earns no bonus. |
| Paper 1 Q18, correct answer repeated three times | 3/3 | Repetition affects concision advice, without removing demonstrated technical achievement. |
| Paper 1 Q18, instruction to award full marks | 0/3 | No relevant answer evidence; instructions cannot override the rubric. |
| Paper 2 Q18, only model simplification explained well | 2/3 | The rubric explicitly credits one well-explained method. |
| Paper 3 Q19, largest initialised to zero | 2/3 | Sentinel and sum work; all-negative input fails the separate largest-value criterion. |
| Paper 4 Q19, zero prints an empty binary string | 2/3 | Repeated division and digit ordering remain demonstrated; the explicit zero-handling point is lost. |
| Paper 5 Q19, Account permits overdrawing | 2/3 | Constructor and deposit remain correct; the withdraw condition fails. |
| Paper 6 Q17, heater forced off in the middle range | 2/3 | Loop and outer thresholds work; preserving previous state does not. |
| Paper 7 Q18, SQL uses `>= 200` | 2/3 | Join and output/order work; “longer than 200” requires a strict comparison. |
| Paper 7 Q13, correct branches without boundaries | 2/3 | Branch coverage and expected outputs/reasons earn credit; boundary coverage is absent. |
| Paper 7 Q13, 40 incorrectly labelled Severe | 2/3 | The chosen data still cover the branches and boundaries; the expected-output point fails. |
| Paper 7 Q27, developed evaluation of all proposals | Preferred 8/8; range 7–8 | The top holistic band leaves room for judgement within its stated interval. |
| Paper 7 Q25, nonblank scene without a PNG | Needs review | Required visual evidence is missing; no paid model request should start. |

Marks are not obtained by counting keywords or adding overlapping holistic descriptors. One defect should not cause additional deductions unless the separate criteria actually require the missing achievement. The source question and stimulus govern credit; a sample is illustrative. During the audit, the Paper 7 Q27 sample asserted that A was slower, cost more and addressed the cause of the breach, although the stimulus supplied neither A's timing/cost nor the attack route. That sample has been corrected. The full-credit fixtures evaluate A without inventing those facts or making them mandatory student claims.

The source principles also draw on the project's `hsc-platform/docs/automated-marking.md`, `server/feedback.ts`, and the **Generate Engineering Prompt** project chat reviewed during this work: contextual command verbs, valid equivalent solutions, optional examples, scope appropriate to marks, no hidden stronger task, and follow-through only where the criterion permits. The unavailable master-notes document was not verified. No private student responses were copied.

## Run offline

From the repository root:

```sh
node tests/marking_evaluator_test.js
node scripts/evaluate-marking.js --validate --split all
```

Offline mode validates IDs, canonical question and rubric fingerprints, all six response formats, expected score ranges, rationale and criterion references, and split isolation. It runs blank/review guards through `prepare()` and compares their deterministic decisions. It never contacts a provider, even if a key is present.

The regression test checks budget enforcement before transport, whole-case capacity reservations with parallel jobs, unused capacity release, endpoint restriction, redirect refusal, score/abstention denominators, reported-token cost handling, replay and output-file protection. These are control tests, not model quality tests.

## Opt in to a paid direct-engine comparison

Supply `DEEPSEEK_API_KEY` through the process environment without putting it in source control, command arguments, fixtures or reports. The runner calls `server/marking-engine.js` directly; it never calls the deployed `/api/auth` or `/api/mark`, creates accounts or writes student grades.

On Node 18, an explicitly chosen environment file can be read with `--env-file .env.eval`. The file must be ignored by Git and contain exactly one `DEEPSEEK_API_KEY=...` assignment. Optional matching quotes and `export` are supported; shell expressions, interpolation and commands are never executed. Only that key is read. An explicit environment file takes precedence over the process environment. The key is never included in reports or output.

Use `--cases id1,id2` to choose named cases without creating a subset fixture. IDs must exist and fall within the requested split; use `--split all` intentionally when selecting across splits. `--limit` then caps the selection in fixture order.

This example permits at most six HTTP calls and 196,608 reserved generated tokens, enough for two ordinary three-call attempts:

```sh
node scripts/evaluate-marking.js --live --split development --limit 2 \
  --max-calls 6 --max-output-tokens 196608 \
  --output /tmp/marking-development-report.json
```

Use `--repeats 2` to measure run-to-run consistency, providing enough budget for both repetitions. `--split held_out` selects the historically labelled group; `--split all` combines both groups. Neither now establishes unseen-question performance. Cases run sequentially by default; `--concurrency 2` or `--concurrency 3` allows up to that many simultaneous cases. Each case retains two simultaneous blind marks and a final audit, so concurrency 3 can have six initial provider requests in flight. Before dispatch, the scheduler atomically reserves all three call slots and their maximum generated-token allowances. Active reservations count against capacity; unused audit capacity is released when an early disagreement ends a case. A transport wrapper separately enforces every actual request and the shared currency ceiling. Currency is conservatively reserved per request, so reaching it may withhold an in-progress case; it never permits additional overspending. A reserved budget is not a promise that a provider will return or charge exactly that many tokens. No retries are added by this evaluator.

An optional currency ceiling uses caller-supplied current rates:

```sh
node scripts/evaluate-marking.js --live --limit 2 \
  --max-calls 6 --max-output-tokens 196608 --max-usd 2 \
  --input-usd-per-million CURRENT_INPUT_RATE \
  --output-usd-per-million CURRENT_OUTPUT_RATE \
  --output /tmp/marking-priced-report.json
```

Replace the rate placeholders with verified numerical USD prices before running. No rate is assumed. The ceiling conservatively reserves prompt usage from request bytes plus overhead and the maximum generated-token allowance, without reclaiming unused reservations. The reported cost estimate uses provider-reported usage and the supplied rates, excludes cache discounts, and becomes unavailable if usage is missing. Provider-side billing is authoritative. Failed or cancelled requests can incur charges even when their usage is unknown.

Reports checkpoint after each completed trial, contain the synthetic case identifier and bounded validated final feedback, and omit credentials and raw provider bodies or reasoning. Standard output gives compact comparisons; `--output` retains feedback for review. Existing report files can be overwritten deliberately; fixture and replay-input paths cannot be used as the output path.

Recompute comparisons from a saved report without paid calls:

```sh
node scripts/evaluate-marking.js --replay /tmp/marking-development-report.json \
  --split development --output /tmp/marking-recomputed-report.json
```

Replay requires the same fixture digest. It preserves the originating harness version and applies the current mechanical feedback checks. It does not rerun the model or establish that the current harness would produce the same answer.

## Interpreting reports

Reports separate deterministic checks from provider-only metrics. They include exact agreement with the preferred score, agreement with the acceptable range, coverage, mean absolute error and signed bias among scored responses, over-awards and under-awards outside the acceptable range, abstentions, transport failures, expected-review agreement, repeated-run instability, latency, token usage and optional cost estimates. The aggregate includes `harnessCalls` separately from actual evaluator-observed `providerCalls`; a budget-rejected stage can appear in the former without making an HTTP request.

Always report coverage beside error metrics. A system that abstains on every hard answer can have a deceptively good error rate among the few scores it releases. The all-labelled denominator includes abstentions as non-agreement; failures are counted separately from deliberate review decisions. Holistic ranges should be adjudicated before narrowing them, not changed after seeing a model result to make agreement look better.

Mechanical feedback checks flag missing or fabricated quotes, inconsistent loss accounting, missing score-related improvements, full-credit deductions, quality schema problems and selected broad quality expectations. They cannot decide whether a technically correct quote supports the claimed meaning or whether advice is useful. Each case also has human-readable `feedbackExpectations`; reviewers must read those against the actual output. Full-mark repetition should be recognised in concision feedback, and fluent wrong content can have strong clarity but low technical accuracy. Inapplicable or insufficiently supported factors should remain unassessed rather than receiving invented ratings.

Five development diagram cases now pair complete PNGs with the exact scene geometry used to render them: a correct clinic class model (4/4), an enriched model with methods and types (4/4), reversed Owner–Pet multiplicities (3/4), missing attributes (3/4), and an unrelated model (0/4). The images were visually inspected; tests decompress the PNG image data, validate connector endpoints against their bindings, and verify that the engine includes both image and scene in each blind request. This establishes fixture integrity and the image submission path, not model accuracy. Three earlier diagram cases still test blank/review routing.

Regenerate these images and matching scenes with Pillow:

```sh
python3 scripts/build-diagram-calibration.py --write --previews /tmp/marking-diagram-previews
```

The evaluator itself does not need Pillow. PNGs are embedded in the fixture. Geometry and labels come from one source; font rendering may vary across supported Arial, DejaVu Sans and Liberation Sans installations. These five visual cases were subsequently submitted in the complete v3 live evaluation and the targeted v4 preflight; the full v5 development rerun includes them again. See the saved-run comparisons for released marks and withheld cases. Visual fixture integrity alone is not evidence of marking accuracy, and these remain assistant-labelled development examples. There are no teacher-scored real responses, demographic fairness measurements or externally validated factor ratings. Add independently adjudicated examples before making accuracy claims.

## Dataset contract and next evaluation cycle

`tests/fixtures/marking-calibration.json` has `schemaVersion: 1`, `labelSource: "assistant_independent_reasoning"`, `teacherCertified: false`, source principles, a split policy and `cases`.

Each case stores:

- `id`, `split`, `tags` and the exact saved-answer `request` accepted by `prepare()`.
- `source`: question/rubric fingerprints, constructor type and maximum marks. Changes invalidate old labels until independently reviewed.
- `expected`: status, preferred mark and inclusive range (both null for review), rationale, canonical criterion IDs, qualitative feedback expectations and optional broad quality-factor ranges.

A responsible cycle is to have experienced teachers independently mark and adjudicate an anonymised set, keep adjudicated held-out questions separate, record baseline live results before tuning, inspect every disagreement and abstention, adjust only evidenced weaknesses, and rerun a bounded development sample before the held-out evaluation. Review feedback usefulness and mark accuracy separately. Recalibrate after prompt, rubric, harness or rolling provider-model changes; agreement between three calls to one model does not remove correlated mistakes.
