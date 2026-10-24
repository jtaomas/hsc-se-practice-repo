# Evaluation provenance and interpretation

These notes record the evaluation design and limitations established before the 105-case `blind-marking-v3-feedback` run, followed by case reviews during that frozen run. The v3 run has now completed; its final performance figures are in [the generated review](MARKING_REVIEW.md), with fixture digest, harness version and returned provider identity in the companion JSON. Do not replace a completed report's provenance with the current working-tree state.

## Labels and development exposure

The corpus contains 105 synthetic, assistant-authored responses, not independently teacher-adjudicated student work. Labels were reasoned through from the original practice questions and criteria before comparison with the live model. Another assistant reviewed selected ambiguous labels and all five complete PNG/scene diagrams. The same team developed the harness and curated the examples. This supports a development evaluation, not a claim of external or official HSC calibration.

The JSON split field originally reserved 31 cases by question part. That prevents variants crossing split labels, but does **not** establish an untouched held-out evaluation after the pilot. The saved v2 pilot report, `review-artifacts/marking-smoke-live.json` in the workspace parent, contains these three nominal held-out cases:

| Pilot case | Entire question part | Number of final cases exposed by that question part |
| --- | --- | ---: |
| `p2-q18-0-partial` | Paper 2 Q18, part 0 | 7 |
| `p7-q13-0-wrong_boundary_output` | Paper 7 Q13, part 0 | 5 |
| `p7-q27-0-evaluative_full` | Paper 7 Q27, part 0 | 6 |

Consequently, **18 of the 31 nominal held-out cases share a question part with a pilot case**. The remaining 13 are Paper 7 Q14 part 0 (eight variants), Paper 4 Q19 part 0 (three variants) and Paper 6 Q17 part 0 (two variants). Call these *question parts not in the initial pilot*, not untouched or externally blinded hold-out data. Their labels and source material were still available to the developers.

There was also explicit pre-benchmark label/content review. Paper 7 Q27's mid-band answer was revised to remove an ambiguity that could reward verbosity; its sample was corrected to avoid unsupported cost, timing and breach-cause claims. Paper 2 Q18's sample was corrected to distinguish validation detecting overfitting from interventions reducing it; its seven answer labels did not change. Other reviewed labels included the development-set feedback-difference, factual-error and contradiction examples. These reviews improve the benchmark's defensibility, but their questions cannot be represented as unseen adjudication data.

No fixture, prompt or source question should change while the final run is active. Discoveries from that run belong in a separately versioned next iteration; do not silently relabel a disagreement to improve the reported score.

## Recommended groups

Report the full fixed corpus and provider-only results first, then split by **question-level pilot exposure**, because another variant of the same question is not a new independent context.

| Conservative group | Question parts | Final cases |
| --- | ---: | ---: |
| Question parts in the initial pilot | 8 | 43 |
| Question parts not in the initial pilot | 15 | 62 |

The eight pilot question parts are `1/18/0`, `2/18/0`, `3/19/0`, `4/17/0`, `7/18/0`, `7/13/0`, `7/25/0` and `7/27/0`, written as bank/question/part. This conservative definition includes a deterministic missing-preview diagram pilot. The pilot made no provider request for `7/25/0`; if measuring strictly *paid-provider question exposure*, show that as a separate sensitivity analysis: seven question parts / 35 cases assessed by the provider in the initial pilot, and 16 question parts / 70 cases not assessed by the provider in that pilot.

These groups remain relative to the **initial pilot only**. The planned v4 evaluation follows the complete v3 run and development review; all 105 cases and all 23 question parts have already appeared in v3. It is a development rerun, not a fresh held-out benchmark. The 62-case group must not be described as new or previously unrun for v4. Historical JSON group keys retain their original names only for compatibility and explicitly record this narrower meaning.

Ten exact case IDs appeared in the pilot, but grouping only those ten as exposed understates the shared-question context of the other variants. The five complete visual diagrams were added after the pilot and independently reviewed; they share Paper 7 Q25 with its deterministic missing-preview pilot case. Describe their first live visual assessment separately from that input-routing check.

## Reading the final results

Keep the following distinctions explicit:

- Confirmed marks versus deliberate review decisions versus transport failures. An abstention is not a zero mark and is not an accurate numeric prediction.
- Score coverage beside exact/range agreement and error among released scores. A system can improve apparent agreement by withholding difficult answers.
- Preferred exact labels versus predeclared acceptable bands. Holistic ranges reflect the rubric's judgement interval; do not widen them after seeing results.
- Nine deterministic blank answers and two deterministic review guards versus the 94 cases eligible for provider assessment. Deterministic cases do not establish model marking skill.
- Individual case results versus independent questions. Variants within 23 question parts are correlated, and repeated runs are not additional independent student examples.
- Marking correctness versus feedback quality. Mechanically valid exact quotes do not prove that a diagnosis is semantically justified or useful.
- Independent response-quality observations versus repeated restatements of a missing rubric point. Missing content can justify a knowledge or explanation action without proving poor structure, imprecise terminology or weak writing style.
- Same-model double marking plus an audit versus independent human marking. Agreement reduces some inconsistency but leaves correlated model errors possible.

The rolling provider alias and returned identity/fingerprint should be retained in reports. No teacher-certified accuracy, official HSC equivalence, population-wide fairness, or stable future accuracy follows from this small synthetic development corpus. Final live measurements should remain traceable to the original fixed labels, and any later adjudicated corrections should be reported transparently as a separate analysis.

## Case-level review during the frozen v3 run

The following observations were made from completed checkpoints while the run remained active. They are qualitative reviews, not final aggregate performance figures. Original labels and all live outputs remain unchanged.

| Case | Observed result | Independent review |
| --- | --- | --- |
| `p3-q18-0-partial` | Released 1/3 against fixed gold 2/3 | **Disputed label/rubric boundary.** The answer correctly explains excess input being copied beyond a buffer into adjacent memory, but gives no consequence or prevention. The 2-mark descriptor says “describes the overflow with limited effect or prevention”; that can reasonably require some such content. The original gold treated a developed mechanism as exceeding mere identification. Keep the raw discrepancy and seek teacher/rubric adjudication; do not present it as a proven under-award. |
| `p3-q18-0-contradiction` | Released 2/3, agreeing with gold; consistency 8/10 triggers the fixture's 0–4 expectation | **Likely quality-label false positive.** Denying crash/security consequences is a factual error, correctly identified by the model's technical-accuracy feedback. The statements are not necessarily internally contradictory merely because one is false. A high internal-consistency rating is defensible; the frozen expectation should not be treated as a validated feedback failure. |
| `p1-q18-0-minimal` | Withheld after proposals of 0 and 1 | The one-mark identification descriptor supports the preferred 1 for “Use hashing.” The disagreement exposes sensitivity at the minimal-credit boundary, although no unsupported numeric mark was released. |
| `p1-q18-0-zero` | Withheld with `loss_schema` | The saved report lacks the rejected field path or payload, so the exact schema fault cannot be diagnosed from that code alone. Do not speculate about the model's invalid field. |
| `p2-q18-0-zero` | Both proposals gave 0; audit withheld the result | The auditor identified one proposal's concision rating of 4 as confusing content error/irrelevance with wordiness. That is an appropriate feedback veto, while illustrating how response-quality generation can reduce mark coverage even when both marks are correct. |
| `p2-q18-0-partial` | Released 2/3, agreeing with gold | Main scored feedback correctly requests a second method. One optional factor action suggests “reducing model complexity” as a second-method example even though the answer already uses simplification. That advice could lead a learner to repeat the credited method instead of supplying a distinct one. |
| `p1-q18-0-beyond_full` | Released 3/3, agreeing with gold | The concision feedback calls every distinct idea “required”, although the KDF extension is optional. The score and empty scored-improvement list are correct; wording should avoid making enrichment sound compulsory. |

A recurring minor refinement in otherwise correct full-credit feedback is optional advice to add a generic introductory sentence. Such advice should identify an actual clarity benefit before encouraging extra text in a short answer. The labels and scores must remain separate from these pedagogical-quality observations.

Further checkpoint review identified the following distinctions:

- `p4-q18-0-contradiction` received 2/3 against frozen gold 1/3. The 2-mark descriptor requires describing one approach well and identifying the other. The response correctly describes top-down and names bottom-up, then incorrectly describes bottom-up. The model treats the correct description and the other approach's name as sufficient for that middle band; the original gold treated the incorrect definition as defeating identification. The model's 2 is defensible under a literal reading. Record the nominal over-award but classify it as a disputed identification/contradiction boundary requiring rubric adjudication, not a proven marking error.
- `p3-q18-0-zero` correctly receives 0/3, yet its accepted clarity, concision and consistency ratings are each 6/10 even though their own feedback describes the wording as unambiguous, without padding, and internally consistent. These ratings appear depressed by the factual error rather than by weaknesses in those separate factors. The technical-accuracy rating correctly identifies the false premise.
- `p3-q18-0-minimal` correctly receives 1/3, but `evidence_examples` is rated 1/10 solely because no example is supplied. This is a substantive factor-assessment problem: the question does not require an illustrative example, and insufficient evidence should be unassessed rather than scored as poor examples. Its technical-accuracy feedback also admits the claim is not false while reducing the rating for missing detail, illustrating the need to separate correctness from completeness.
- `p3-q18-0-contradiction` has an additional accepted structure comment criticising where the effect statement appears, although the answer already follows mechanism → effect → prevention. The effect is technically false; its position is not the problem. This is a clearer feedback defect than the frozen consistency-range flag.
- `p7-q18-0-alternative` correctly receives 3/3 for `USING (ArtistID)` and default ascending order. Its SQL feedback explicitly recognises these as valid alternatives. The boundary-defect SQL and wrong-boundary-output table both produce agreed numeric proposals of 2/3, but v3 withholds them because one marker labels the failed one-mark criterion `partial` while the other uses `not_met`. This is a criterion-label disagreement, not a numeric disagreement; a later harness version should enforce the indivisible one-mark label contract without changing awarded points.
- `p7-q13-0-branches_only` correctly receives 2/3 and identifies the missing boundary tests. Its action says to add four boundary rows to three existing branch rows, although the interface supplies five rows. A more usable action would replace or consolidate existing rows so that a final five-test set covers all branches and boundaries. This is a feedback feasibility issue, not a scoring error.
- Paper 7 Q27's full and beyond-full responses both receive 8/8, with the top band selected, lower bands treated as context and no scored improvements demanded. The extra verification and uncertainty discussion does not become a condition of full credit for the shorter answer. The features-only response is withheld after proposals of 1 and 2, even though both fall inside its predeclared 1–2 interval. This shows the coverage cost of exact blind-marker agreement on holistic bands. The descriptive answer is withheld after proposals of 2 and 3, which cross a descriptor boundary.
- Of the five complete visual diagrams, the full diagram receives 4/4 and the no-attributes diagram receives 3/4, both matching the original labels. Beyond-full and irrelevant diagrams are withheld with `unsupported_evidence`; reversed multiplicity is withheld with `unsupported_feedback_evidence`. The report does not preserve the rejected evidence field, so these codes establish conservative withholding, not the precise source of each invalid reference. No incorrect numeric diagram mark was released in these five cases, but three of five received no score.
- `p7-q25-0-visual_no_attributes` triggers the second mechanical quality flag: diagram quality is 6/10 against an original 7–10 expectation. Feedback partly attributes the reduction to missing attributes, a content omission already identified by the rubric, and partly to large gaps. The full diagram uses the same layout and receives diagram quality 9/10. Its structure feedback also calls the empty compartments visually underdeveloped. This is a construct-separation and consistency concern; the exact numeric rating remains subjective, and a mechanical threshold alone does not settle it.
- A broader review of low style-factor ratings confirms the absence-versus-poor-quality distinction: `p6-q19-0-comment_only` gives code quality 1/10 while admitting there is no Python content to assess for organisation, and `p1-q19-0-comment_only` gives terminology 1/10 solely for absent programming terms. Unassessed is more appropriate when the relevant construct is absent. `p5-q19-0-one_defect` mixes an absent withdrawal guard (functional correctness) into code-quality feedback alongside a real formatting suggestion. Conversely, `p1-q18-0-repetition` correctly retains 3/3 while concision 2/10 and structure 4/10 identify the same two sentences duplicated three times. These are selected semantic observations, not an exhaustive or teacher-certified error-rate estimate.

These cases show why a mechanical feedback-issue count is neither a complete quality assessment nor a validated error count: it can miss semantic factor confusion and also flag a defensible rating when an assistant-authored expectation is flawed. The original corpus and raw metrics remain the primary reproducible record; any independently adjudicated interpretation should be presented alongside them, with its reasons and without retroactively erasing discrepancies.

## Reproduce the compact public report

The summarizer accepts multiple labelled versions and the exact historical fixtures named by their recorded digests. It does not call a model or read credentials. It exports only whitelisted metadata: fixed labels, awarded outcomes, abstention/error codes, mechanical flags, reported usage, provider identity/fingerprint, and source hashes. Original answers, student-facing feedback and model/auditor prose remain in the full workspace reports.

```sh
node scripts/summarize-marking-evaluations.js \
  --report v1=../review-artifacts/marking-baseline-live.json \
  --report v2=../review-artifacts/marking-smoke-live.json \
  --report v3=../review-artifacts/marking-final-live.json \
  --report v4_preflight=../review-artifacts/marking-v4-preflight-live.json \
  --report v5=../review-artifacts/marking-v5-live.json \
  --report v5_repeat=../review-artifacts/marking-v5-repeat-live.json \
  --report v6_focus=../review-artifacts/marking-v6-probe-live.json \
  --fixture ../review-artifacts/marking-smoke-fixture.json \
  --fixture tests/fixtures/marking-calibration.json \
  --pilot v2 --match v5:v6_focus --planned v1=10 --planned v2=10 --planned v3=105 \
  --planned v4_preflight=10 --planned v5=105 --planned v5_repeat=18 --planned v6_focus=22 \
  --json docs/data/marking-evaluation-summary.json \
  --markdown docs/MARKING_REVIEW.md
node tests/marking_summary_test.js
```

Add another `--report version=path` and its `--planned version=count` for later runs. If its fixture changes, supply that exact fixture too. The generated report explicitly marks unfinished checkpoints and keeps provider-only, deterministic, type, overlapping-tag and question-exposure groups separate. Matched pilot comparisons require the same answer and fixed label; a separate unchanged-source subset excludes changed question/sample fingerprints. Recorded source SHA-256 values identify the precise report bytes used for each generated snapshot.

## Independent execution checks for reference answers

After the initial manual labelling, the root agent independently executed **27 reviewed synthetic Python/SQL cases across 117 behavioural checks** using the workspace verification script and bounded local execution. The checks cover canonical examples and relevant edge cases: negative-only largest-value input, sentinels, binary zero, uppercase vowels, invalid code formats, account balance conditions, unknown movement characters, SQL filtering/order, and a track exactly 200 seconds long.

All ten valid-alternative cases pass their applicable checks. Every one of the 17 deliberately defective or comment-only cases fails at least one relevant check, as intended. This validates the claimed functional distinctions; it does **not** mean all 117 executions produced correct student output, nor does a failed execution determine a partial-credit score. Allocation of independent rubric points and any follow-through remain judgement questions. Numeric gold labels were not changed.

Evidence is in the workspace parent: `review-artifacts/calibration-code-checks.json` (SHA-256 `b3d9f7519b2aeceb8ec819fb8337076d525a0648d5ef65940b7203feef705560`), `verify-calibration-code.py`, and `executable-calibration-cases.json`. No production student-code executor was added; the live marker still performs static assessment. Written-response, pseudocode, table and visual-diagram judgements were not validated by these runtime checks.

## V5 source identity and separate coach work

The v5 marker evaluations include the upstream changes merged from `866d952`. The v1 baseline is the historical implementation present at the beginning of this review; it is not a separate measurement of the subsequently merged upstream positive-audit implementation. Main-corpus and repeatability runs are separate experiments and must retain separate denominators.

The frozen source manifest is `review-artifacts/marking-v5-source-manifest.json`. During the running v5 marker evaluation, independent improvement-coach work changed only `AIIMPROVEMENT_VERSION` in the shared `public/marking-config.js`, from `post-exam-coach-v5` to `post-exam-coach-v6`. `AIMARKING_VERSION` and the marker's exported version stayed unchanged. The already-running main and repeatability processes had loaded the original configuration; the marker uses its marking version, not the coach version. No marking policy, schema, model, input evidence or fixture changed.

An independent byte/hash check confirmed that the other six manifest entries still matched, and that the shared configuration diff contained only that coach-version line. The original shared configuration is preserved as `review-artifacts/marking-v5-original-shared-config.js`, SHA-256 `6e4c19a2bbe93cc000488ecdf050bdf2c2e8b88f14b9b22bcfe5ad2abdd801ed`. The explicit change record is `review-artifacts/marking-v5-coach-only-config-change.json`. It would be inaccurate to claim that all seven current on-disk file hashes still match the original manifest.

## Frozen early v5 semantic review

A deliberately focused review compares 12 completed v5 cases with the same v3 answers. It uses the immutable 22-trial snapshot `review-artifacts/marking-v5-semantic-snapshot-2026-10-24T10-42-48-807Z.json`, SHA-256 `7bd0c6582644f5856101cdf1eb5353cd15398c28fc97a3669d37143223f83fd1`. The table and exact observed factor feedback are retained in `review-artifacts/marking-v5-semantic-review.md` and `.json`. This is a checkpoint semantic review, not a final aggregate or a random sample.

The same zero-mark buffer-overflow answer now has clarity/concision/consistency ratings of 9/9/8, versus 6/6/6 in v3, while technical accuracy remains 0. The revised feedback explicitly separates its false premise from its clear, concise expression. The partly correct overfitting answer likewise retains its content error while no longer losing concision or structure quality merely because the second recommendation is wrong. Several absent optional-example factors are now null.

Residual concerns include a terminology rating justified chiefly by absent technique names and inconsistent assessability decisions for equally short answers. The minimal buffer answer is withheld in the v5 snapshot, so its earlier problematic diagnostics cannot be claimed corrected. The frozen consistency expectation for the buffer consequence-error case remains a likely reference-label false positive; raw mechanical flags and numeric labels are unchanged. This semantic review does not establish quality on repetition, dense writing or visual diagrams, which were absent from the reviewed checkpoint selection.

## Completed v5 repeatability experiment

The separate `review-artifacts/marking-v5-repeat-live.json` run completed all **18 attempts across six existing cases**, three attempts per case, without stopping at its budget. Source SHA-256: `bcd9f5b715ea5b3f8a2ca174d77904ef006b595992170c92416b315a34f6dc9f`. The compact independently recomputed record is `review-artifacts/marking-v5-repeat-summary.json`. These are six examples, not 18 independent examples, and they are not pooled with the main 105-case run.

| Case | Attempt 1 | Attempt 2 | Attempt 3 |
| --- | --- | --- | --- |
| `p1-q18-0-full` | 3/3 | 3/3 | 3/3 |
| `p1-q18-0-minimal` | 1/3 | Withheld: `invalid_json` | Withheld: `blind_score_disagreement` |
| `p1-q18-0-zero` | 0/3 | 0/3 | 0/3 |
| `p7-q18-0-alternative` | 3/3 | 3/3 | 3/3 |
| `p7-q27-0-evaluative_full` | 8/8 | 8/8 | 8/8 |
| `p7-q25-0-visual_full` | Error: `marking_timeout` | 4/4 | 4/4 |

All **15 released scores match the preferred fixed reference exactly**. Release coverage and agreement including withheld/error attempts are both **15/18 (83.3%)**; there are two withheld attempts and one error. Four of six cases release the same score in all three attempts. Two cases vary in release status. No case shows different released numeric scores, but the minimal answer has only one released score, so this does not demonstrate stable numeric marking for that answer. Withheld and failed attempts are never converted to zero.

The visual timeout occurs in the auditor stage after both blind proposals gave 4/4. The auditor ran for 90,005 ms before failure; those two proposals do not constitute a released result. There are 52 provider calls and 547,408 reported tokens (323,317 prompt and 224,091 completion), but the failed auditor call supplies no usage. The total token consumption and total cost are therefore unknown; budget reservations are not billed spend. Median attempt latency is 58.185 seconds and the 95th percentile is 102.822 seconds. No mechanical feedback flags occurred in these repeats, which does not establish complete semantic feedback quality.

## Completed broad v5 evaluation

The broad v5 run completed **105/105 cases** without stopping at its budget. Its source report is `review-artifacts/marking-v5-live.json`, SHA-256 `6057d9dc96278a4639182d9391a32359f1ebcba3751e242969a6d8d0a114ae41`. Eleven cases are deterministic input handling: nine blanks receive zero and two incomplete diagrams require review. These are excluded from the following provider-only figures.

Of **94 provider-assessed cases, 78 released a score (83.0%)**. All 78 fall within the fixed predeclared ranges; 77 match the preferred exact mark (98.7% of released scores). Eleven cases were withheld and five failed with `marking_timeout`, all at the auditor stage. Agreement including withheld and failed cases is 78/94 (83.0%), not 100%. There are no released scores outside the acceptable ranges. Preferred-mark MAE is 1/78 (0.013), with the same positive signed bias. The one non-exact result is `p7-q27-0-evaluative_features`: 2/8 versus preferred 1/8, within its original 1–2 band. Its fixed label was not changed.

The only mechanical feedback flag is the previously documented consistency-range caution on `p3-q18-0-contradiction`; it is not an independently established error. Main-run totals include 274 provider calls and 2,736,663 reported tokens, with usage missing from five failed auditor calls. Total consumption and cost are unknown. The separate repeatability results above must not be added to the count of independent examples.

| Complete visual fixture | v5 outcome | Interpretation |
| --- | --- | --- |
| `p7-q25-0-visual_full` | 4/4 | Matches the fixed reference. Diagram quality and structure both receive 10, with comments about legibility, clear bindings and association-end labels. |
| `p7-q25-0-visual_beyond_full` | 4/4 | Matches the fixed reference; extra detail does not earn a bonus or become required for the simpler full-credit answer. |
| `p7-q25-0-visual_reversed_multiplicity` | Error: `marking_timeout` | No score or feedback was released. |
| `p7-q25-0-visual_no_attributes` | Error: `marking_timeout` | No score or feedback was released; the v3 diagram-quality/content-confusion concern cannot be declared resolved for this case. |
| `p7-q25-0-visual_irrelevant` | Withheld: `proposal_schema` | No score or feedback was released. The saved report does not identify the malformed field; do not infer the specific cause from this code. |

The three other diagram cases are deterministic routing checks: blank → zero, missing preview → review, unresolved connector → review. Thus only **two of five complete visual fixtures release a v5 mark**. Both agree with the reference, but this is limited visual coverage, not evidence of reliable diagram marking across quality levels.

All six released comment-only Python cases (`p1-q19-0-comment_only`, `p2-q19-0-comment_only`, `p3-q19-0-comment_only`, `p5-q19-0-comment_only`, `p6-q19-0-comment_only`, `p7-q19-1-comment_only`) receive zero marks and null terminology/code-quality ratings, with explicit insufficient-evidence explanations. This directly addresses the v3 absence-versus-poor-quality issue for the Paper 6 case, whose code-quality rating was previously 1. The Paper 4 comment-only case times out and supplies no feedback to assess. These selected observations do not establish a broad semantic-quality error rate.

The v4 preflight consists of ten targeted cases, not a full-corpus evaluation. A later v6 probe has a separate declared selection and budget in `review-artifacts/marking-v6-probe-plan.json`; its results must remain separate from this broad v5 run and from the repeats. It is development regression testing on known questions, not an unseen holdout or a new broad benchmark.

## Completed focused v6 probe

The separate v6 probe completed all **22 declared cases** without stopping at its budget. Source report: `review-artifacts/marking-v6-probe-live.json`, SHA-256 `51d108d4a6b624c65698b7d32ad5c6243a8941bc894922aaedd79a5d8d7c3452`. The selection plan's SHA-256 is `5eb4db1217afcc7073448942f93429980d9af85103a9d99d70f35201c8989b9f`; it includes the original 20-case selection plus two explicitly recorded timeout-regression additions. All cases come from the existing development corpus, across its seven papers and six response formats. The other **83 reference cases were not rerun under v6**.

Seventeen of 22 attempts released scores (**77.3% coverage**); all 17 lie in the original acceptable ranges and 16 match the preferred exact mark (**94.1% of released scores**). The sole preferred-mark difference is again `p7-q27-0-evaluative_features`, receiving 2 within its original 1–2 interval. Two cases are withheld and three time out. Agreement including withholding/errors is 17/22 (77.3%); preferred-mark MAE is 1/17 (0.059), with no score outside its acceptable range. Zero mechanical quality flags does not mean that all feedback is educationally correct or complete.

The generated report includes an exact-source comparison of **the same 22 cases** under v5 and v6. Both release 17 scores, with 16 preferred-exact and 17 range-agreeing results. V6 therefore shows **no aggregate release-coverage improvement on this matched subset**. Four prior v5 failures now release: `p3-q19-0-one_defect`, `p4-q19-0-comment_only`, `p7-q18-0-one_defect` and `p7-q25-0-visual_no_attributes`. Four previously released v5 cases now withhold or fail: `p1-q18-0-minimal`, `p3-q18-0-zero`, `p7-q27-0-evaluative_full` and `p7-q13-0-branches_only`. Different failure types and model variability limit causal conclusions from a single attempt per version.

| v6 case requiring review | Observed outcome |
| --- | --- |
| `p1-q18-0-minimal` | Withheld: `blind_score_disagreement` |
| `p7-q27-0-evaluative_full` | Withheld: `unsupported_evidence` |
| `p3-q18-0-zero` | Error: `marking_timeout` |
| `p7-q13-0-branches_only` | Error: `marking_timeout` |
| `p7-q25-0-visual_irrelevant` | Error: `marking_timeout` |

Of the three visual cases selected for v6, the full diagram releases 4/4 and the missing-attributes diagram releases 3/4; the unrelated diagram times out. The missing-attributes report now separates the absent content from drawing quality: its legible, aligned boxes and clear endpoint labels receive diagram quality 9, while the missing attribute point remains unearned. Its accurate explicit associations receive technical accuracy 10 rather than being treated as false claims because attributes are absent. This is a useful observed correction of the v3 diagnostic concern, not a guarantee that the subjective ratings are universally calibrated. Beyond-full and reversed-multiplicity diagrams were not selected for v6.

The probe uses 64 provider calls and records 682,543 tokens. Three failed calls have no reported usage, so total consumption and cost remain unknown. Median attempt latency is 78.598 seconds and the 95th percentile is 123.611 seconds. Bounded final-message captures remain in the private workspace for failure diagnosis; the committed compact summary excludes model prose, credentials and hidden reasoning. The offline browser defaults to v6 and offers v5/v3 history, retaining all 105 references while explicitly marking unselected cases without substituting historical scores.

## Final v6 semantic findings and remaining weaknesses

An independent assistant review inspected all 17 released v6 reports against their canonical questions and submitted answers, and inspected the three selected diagram images with their scenes. Its full record is `review-artifacts/marking-v6-semantic-review.md`, SHA-256 `b4c8d92eaa097cac8d1ec20e023a625159eee7a8b1fe94c739388fe390f50ec1`. It uses the completed report identified above and final-message capture SHA-256 `39ec1051db135889c20515bfc5bab7974a2efe10906faa8d35f8454cca9722b0`. This is semantic review, not teacher adjudication, and the following weaknesses remain visible despite all released marks falling within their predeclared ranges.

| Case / area | Observed remaining issue |
| --- | --- |
| `p3-q19-0-one_defect` | The correct 2/3 retains the sentinel and sum credit, but feedback offers initialising `largest` from the first input **or using `None`**, then updating with `max` or a comparison. The submitted program calls `max(largest, n)` directly; merely replacing its initial zero with `None` raises `TypeError`. A reviewer-authored `max(None, -3)` check reproduced this. The first-input alternative is sound; the `None` alternative is incomplete. This is a teaching defect accepted by the auditor, not a numeric-score correction. |
| `p7-q27-0-evaluative_full` | Both blind proposals give 8, but one cites rubric descriptor phrases as evidence for unselected context bands, including “identifies some features”, instead of quoting the student. The strict source check correctly withholds with `unsupported_evidence`. Source handles did not eliminate source-role confusion. No score or feedback was released. |
| Factor applicability | Full hashing rates examples 8 while the beyond-full response gives null for the same precomputed-table context. Several code-only responses rate terminology 8–10, while binary conversion gives null. The full diagram gives reasoning null, while the same relationships with attributes omitted receive reasoning 8. These are inconsistent assessability decisions, not merely adjacent subjective ratings. |
| Separation of quality from completeness/correctness | Overfitting reasoning 8 refers to giving only one method; heater concision 8 chiefly criticises the wrong ELSE branch; the feature-list structure rating of 7 refers to absent evaluation despite clear A/B/C ordering. Those content shortfalls are already represented by the marks and do not independently prove weak reasoning, wordiness or poor organisation. |
| Feedback usability and precision | Strong/null factors often repeat maintenance text; some exact catalog evidence chunks split words. The SQL boundary-error answer's optional advice repeats existing alias/layout guidance. The injection-only loss action says the mechanisms “prevent recovery”, which can overstate salting: unique salts defeat reuse/precomputation but do not prevent every offline guess. Main scored repairs use the narrower correct mechanisms. |

A safe independent repair for the maximum-value answer is to place `largest = n` after the first `n = int(input())` and before the existing loop. Alternatively, initialise `largest = None` and replace the unguarded update inside the loop with:

```python
if largest is None or n > largest:
    largest = n
```

The existing sentinel and sum logic should remain unchanged. This repair is reviewer guidance; the stored live feedback and original labels have not been rewritten to make the result appear better.

All three v6 errors occur at the auditor's 105-second limit: buffer-zero, branch-only table and irrelevant diagram. The increased deadline did not eliminate timeouts. Unreleased proposals do not demonstrate successful table advice or zero-mark diagram feedback. On the matched 22-case subset, release coverage is unchanged from v5; this single development run supports no causal claim of better availability. Further work should use independently adjudicated examples to calibrate factor applicability and technical repair completeness, alongside score accuracy.

## Late integration of two supplied trial papers

After the final paid marker and coach runs completed, upstream commit `d18aa24c65b78ae118b19a55683c6d61f845c145` added the supplied PEM and DoE trial papers, their separate marking registries and canonical loader dependencies. The current product therefore has nine papers and 149 open parts; the completed marking corpus still contains **105 synthetic cases from the original seven papers**. No AI marking-accuracy claim in these evaluations extends to the two added trial papers. Published marking text was not relabelled or reinterpreted for this compatibility work.

The loader's source bytes changed, so the earlier frozen source manifests describe the code that ran those evaluations, not every file byte in the final integrated checkout. An independent comparison against `review-artifacts/pre-trial-bank-integration-inputs.json` confirms that all **105 full prepared-input digests and review reasons are unchanged**. Every original question/rubric fingerprint still matches its frozen fixture, all 105 deterministic/provider routing decisions agree with the broad v5 record, and the eleven deterministic outcomes retain their original status and mark. Evidence: `review-artifacts/post-trial-bank-integration-proof.json`, SHA-256 `c3c07d4c0feb36612187adecc40051c3214e9d53e6282993dcb9b6486bf5c990`.

Compatibility checks pass for all nine paper totals and declared question counts, all 149 open-answer inputs, 441 coach objective-scoring parity cases and 424 comparison-scoring parity cases. All three AI API bundles include the 16 canonical runtime scripts, including nested rubric files and the shared version configuration. The frozen 105-case evaluator and report-summary regressions pass unchanged. These are software integration checks, not new paid marking-quality measurements.
