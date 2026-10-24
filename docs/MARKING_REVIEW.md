# AI marking evaluation review

The supplied runs are complete. Figures below refer to their saved reports and fixed original labels.

Labels are synthetic, assistant-authored and not teacher-certified. Raw disagreements remain counted even when an independent review finds a defensible alternative interpretation. See [evaluation provenance and case notes](MARKING_EVALUATION_NOTES.md).

## Separate runs: provider-assessed cases only

| Run | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v1 | 9 | 6/9 | 100.0% | 66.7% | 0.000 | 0/0 | 3/0 |
| v2 | 9 | 4/9 | 100.0% | 44.4% | 0.000 | 0/0 | 5/0 |
| v3 | 94 | 65/94 | 96.9% | 67.0% | 0.031 | 1/1 | 29/0 |
| v4_preflight | 10 | 8/10 | 100.0% | 80.0% | 0.000 | 0/0 | 2/0 |
| v5 | 94 | 78/94 | 100.0% | 83.0% | 0.013 | 0/0 | 11/5 |
| v6_focus | 22 | 17/22 | 100.0% | 77.3% | 0.059 | 0/0 | 2/3 |

These rows cover different scopes. Compare v1/v2 on the matched pilot below; do not treat their ten-case pilot as a full-corpus baseline. The v1 baseline is the historical implementation at the start of this review. Upstream positive-audit changes later merged into v5 were not separately evaluated as that baseline. Deterministic input checks are excluded from all rows above. MAE is against the preferred exact mark; range agreement allows the predeclared holistic interval. Repeated-run experiments are reported separately below.

## Matched pilot: same answer and fixed label

| Run | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v1 | 9 | 6/9 | 100.0% | 66.7% | 0.000 | 0/0 | 3/0 |
| v2 | 9 | 4/9 | 100.0% | 44.4% | 0.000 | 0/0 | 5/0 |
| v3 | 9 | 5/9 | 100.0% | 55.6% | 0.000 | 0/0 | 4/0 |
| v4_preflight | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 | 9 | 7/9 | 100.0% | 77.8% | 0.000 | 0/0 | 0/2 |
| v6_focus | 7 | 6/7 | 100.0% | 85.7% | 0.000 | 0/0 | 1/0 |

v3: the following matched answers have changed question/sample source fingerprints and are not a pure harness-only comparison: `p2-q18-0-partial`. The compact JSON also reports the unchanged-source subset.

v5: the following matched answers have changed question/sample source fingerprints and are not a pure harness-only comparison: `p2-q18-0-partial`. The compact JSON also reports the unchanged-source subset.

v6_focus: the following matched answers have changed question/sample source fingerprints and are not a pure harness-only comparison: `p2-q18-0-partial`. The compact JSON also reports the unchanged-source subset.

## Matched development cases: v5 versus v6_focus

Same answer, question/rubric source and fixed label; provider-only. Status does not affect inclusion. These known cases do not establish unseen-question performance.

| Run | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v5 | 22 | 17/22 | 100.0% | 77.3% | 0.059 | 0/0 | 1/4 |
| v6_focus | 22 | 17/22 | 100.0% | 77.3% | 0.059 | 0/0 | 2/3 |

## Question-level exposure in the initial pilot

| Run / group | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v1 / in initial pilot | 9 | 6/9 | 100.0% | 66.7% | 0.000 | 0/0 | 3/0 |
| v2 / in initial pilot | 9 | 4/9 | 100.0% | 44.4% | 0.000 | 0/0 | 5/0 |
| v3 / in initial pilot | 37 | 22/37 | 100.0% | 59.5% | 0.000 | 0/0 | 15/0 |
| v3 / not in initial pilot | 57 | 43/57 | 95.3% | 71.9% | 0.047 | 1/1 | 14/0 |
| v4_preflight / in initial pilot | 7 | 5/7 | 100.0% | 71.4% | 0.000 | 0/0 | 2/0 |
| v4_preflight / not in initial pilot | 3 | 3/3 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / in initial pilot | 37 | 28/37 | 100.0% | 75.7% | 0.036 | 0/0 | 5/4 |
| v5 / not in initial pilot | 57 | 50/57 | 100.0% | 87.7% | 0.000 | 0/0 | 6/1 |
| v6_focus / in initial pilot | 15 | 11/15 | 100.0% | 73.3% | 0.091 | 0/0 | 2/2 |
| v6_focus / not in initial pilot | 7 | 6/7 | 100.0% | 85.7% | 0.000 | 0/0 | 0/1 |

Exposure is grouped by question part and refers only to the initial pilot. The conservative grouping includes the pilot’s deterministic missing-preview diagram. The JSON separately supplies exposure based strictly on provider calls in that pilot. Its historical group keys are defined in pilotReference.exposureSemantics. Nominal held-out labels were partly pilot-exposed; no untouched-holdout claim is made.

The v4, v5 and v6 evaluations are development reruns after reviewing the full v3 corpus. Every question part in these later runs has already appeared in v3. “Not in initial pilot” does not mean new or unseen in a later run. The v4 preflight and v6 focused probe cover selected cases; they are not replacements for the broad v5 run.

## Response formats: provider-only

| Run / format | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v1 / typed table | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v1 / pseudocode | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v1 / Python | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v1 / SQL | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v1 / written | 5 | 4/5 | 100.0% | 80.0% | 0.000 | 0/0 | 1/0 |
| v2 / typed table | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v2 / pseudocode | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v2 / Python | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v2 / SQL | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v2 / written | 5 | 3/5 | 100.0% | 60.0% | 0.000 | 0/0 | 2/0 |
| v3 / diagram | 5 | 2/5 | 100.0% | 40.0% | 0.000 | 0/0 | 3/0 |
| v3 / typed table | 4 | 2/4 | 100.0% | 50.0% | 0.000 | 0/0 | 2/0 |
| v3 / pseudocode | 6 | 3/6 | 100.0% | 50.0% | 0.000 | 0/0 | 3/0 |
| v3 / Python | 21 | 14/21 | 100.0% | 66.7% | 0.000 | 0/0 | 7/0 |
| v3 / SQL | 6 | 4/6 | 100.0% | 66.7% | 0.000 | 0/0 | 2/0 |
| v3 / written | 52 | 40/52 | 95.0% | 73.1% | 0.050 | 1/1 | 12/0 |
| v4_preflight / diagram | 5 | 3/5 | 100.0% | 60.0% | 0.000 | 0/0 | 2/0 |
| v4_preflight / Python | 2 | 2/2 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v4_preflight / written | 3 | 3/3 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / diagram | 5 | 2/5 | 100.0% | 40.0% | 0.000 | 0/0 | 1/2 |
| v5 / typed table | 4 | 4/4 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / pseudocode | 6 | 6/6 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / Python | 21 | 19/21 | 100.0% | 90.5% | 0.000 | 0/0 | 0/2 |
| v5 / SQL | 6 | 5/6 | 100.0% | 83.3% | 0.000 | 0/0 | 0/1 |
| v5 / written | 52 | 42/52 | 100.0% | 80.8% | 0.024 | 0/0 | 10/0 |
| v6_focus / diagram | 3 | 2/3 | 100.0% | 66.7% | 0.000 | 0/0 | 0/1 |
| v6_focus / typed table | 1 | 0/1 | — | 0.0% | — | 0/0 | 0/1 |
| v6_focus / pseudocode | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v6_focus / Python | 4 | 4/4 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v6_focus / SQL | 2 | 2/2 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v6_focus / written | 11 | 8/11 | 100.0% | 72.7% | 0.125 | 0/0 | 2/1 |

## Selected challenge groups: provider-only

| Run / group | Provider cases | Scored / eligible | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v1 / beyond full | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v1 / partial | 4 | 2/4 | 100.0% | 50.0% | 0.000 | 0/0 | 2/0 |
| v1 / zero | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v1 / prompt injection | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v1 / repetition | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v2 / beyond full | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v2 / partial | 4 | 1/4 | 100.0% | 25.0% | 0.000 | 0/0 | 3/0 |
| v2 / zero | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v2 / prompt injection | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v2 / repetition | 1 | 0/1 | — | 0.0% | — | 0/0 | 1/0 |
| v3 / beyond full | 9 | 8/9 | 100.0% | 88.9% | 0.000 | 0/0 | 1/0 |
| v3 / partial | 26 | 16/26 | 93.8% | 57.7% | 0.063 | 0/1 | 10/0 |
| v3 / minimal | 8 | 6/8 | 100.0% | 75.0% | 0.000 | 0/0 | 2/0 |
| v3 / zero | 19 | 11/19 | 100.0% | 57.9% | 0.000 | 0/0 | 8/0 |
| v3 / contradiction | 5 | 2/5 | 100.0% | 40.0% | 0.000 | 0/0 | 3/0 |
| v3 / prompt injection | 3 | 2/3 | 100.0% | 66.7% | 0.000 | 0/0 | 1/0 |
| v3 / repetition | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v3 / dense writing | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v3 / visual diagram | 5 | 2/5 | 100.0% | 40.0% | 0.000 | 0/0 | 3/0 |
| v4_preflight / beyond full | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v4_preflight / partial | 4 | 3/4 | 100.0% | 75.0% | 0.000 | 0/0 | 1/0 |
| v4_preflight / zero | 3 | 2/3 | 100.0% | 66.7% | 0.000 | 0/0 | 1/0 |
| v4_preflight / repetition | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v4_preflight / visual diagram | 5 | 3/5 | 100.0% | 60.0% | 0.000 | 0/0 | 2/0 |
| v5 / beyond full | 9 | 9/9 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / partial | 26 | 19/26 | 100.0% | 73.1% | 0.000 | 0/0 | 3/4 |
| v5 / minimal | 8 | 7/8 | 100.0% | 87.5% | 0.143 | 0/0 | 1/0 |
| v5 / zero | 19 | 14/19 | 100.0% | 73.7% | 0.000 | 0/0 | 4/1 |
| v5 / contradiction | 5 | 3/5 | 100.0% | 60.0% | 0.000 | 0/0 | 2/0 |
| v5 / prompt injection | 3 | 3/3 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / repetition | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / dense writing | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v5 / visual diagram | 5 | 2/5 | 100.0% | 40.0% | 0.000 | 0/0 | 1/2 |
| v6_focus / beyond full | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v6_focus / partial | 8 | 7/8 | 100.0% | 87.5% | 0.000 | 0/0 | 0/1 |
| v6_focus / minimal | 2 | 1/2 | 100.0% | 50.0% | 1.000 | 0/0 | 1/0 |
| v6_focus / zero | 4 | 2/4 | 100.0% | 50.0% | 0.000 | 0/0 | 0/2 |
| v6_focus / prompt injection | 2 | 2/2 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v6_focus / repetition | 1 | 1/1 | 100.0% | 100.0% | 0.000 | 0/0 | 0/0 |
| v6_focus / visual diagram | 3 | 2/3 | 100.0% | 66.7% | 0.000 | 0/0 | 0/1 |

Challenge tags overlap; these rows cannot be summed into a corpus total. Full tag breakdowns are in the JSON.

## Repeated-run stability: separate experiment

Repeated attempts use the same answers and do not add independent examples. Trial-level agreement below is not a larger benchmark. A withheld result is a separate outcome, never a zero; released-mark variation compares only actual numeric scores.

| Run | Distinct cases | Repeated cases | Total trials | Cases with status variation | Cases with released-mark variation | Cases with any outcome variation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| v5_repeat | 6 | 6 | 18 | 2 | 0 | 2 |

| Run | Provider trials | Scored / eligible trials | Range agreement among scored | Range agreement including abstentions | MAE | Over / under | Withheld / failed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| v5_repeat | 18 | 15/18 | 100.0% | 83.3% | 0.000 | 0/0 | 2/1 |

| Run | Case | Observed outcomes (count) |
| --- | --- | --- |
| v5_repeat | p1-q18-0-full | marked:3 × 3 |
| v5_repeat | p1-q18-0-minimal | needs_review × 2; marked:1 × 1 |
| v5_repeat | p1-q18-0-zero | marked:0 × 3 |
| v5_repeat | p7-q18-0-alternative | marked:3 × 3 |
| v5_repeat | p7-q25-0-visual_full | error × 1; marked:4 × 2 |
| v5_repeat | p7-q27-0-evaluative_full | marked:8 × 3 |

## Withholding and transport diagnostics

| Run | Code | Provider trials |
| --- | --- | ---: |
| v1 | blind_disagreement | 2 |
| v1 | auditor_veto | 1 |
| v2 | auditor_veto | 1 |
| v2 | invalid_json | 1 |
| v2 | feedback_evidence_schema | 1 |
| v2 | blind_disagreement | 1 |
| v2 | unsupported_feedback_evidence | 1 |
| v3 | loss_schema | 1 |
| v3 | blind_disagreement | 10 |
| v3 | invalid_json | 4 |
| v3 | auditor_veto | 6 |
| v3 | feedback_evidence_schema | 2 |
| v3 | quality_schema | 2 |
| v3 | invalid_json_duplicate_key | 1 |
| v3 | unsupported_evidence | 2 |
| v3 | unsupported_feedback_evidence | 1 |
| v4_preflight | unsupported_feedback_evidence | 1 |
| v4_preflight | unsupported_evidence | 1 |
| v5 | invalid_json_duplicate_key | 3 |
| v5 | auditor_veto | 3 |
| v5 | blind_score_disagreement | 1 |
| v5 | band_assessment_mismatch | 1 |
| v5 | invalid_json | 2 |
| v5 | proposal_schema | 1 |
| v5 | marking_timeout (transport/run error) | 5 |
| v5_repeat | invalid_json | 1 |
| v5_repeat | blind_score_disagreement | 1 |
| v5_repeat | marking_timeout (transport/run error) | 1 |
| v6_focus | blind_score_disagreement | 1 |
| v6_focus | unsupported_evidence | 1 |
| v6_focus | marking_timeout (transport/run error) | 3 |

## Fixed-label discrepancies and mechanical flags

| Run | Case | Expected | Observed | Raw flags / outcome | Review caution |
| --- | --- | --- | --- | --- | --- |
| v3 | p3-q18-0-partial | 2–2 | 1 | under | Fixed gold is 2. A mechanism-only answer goes beyond naming, but the 2-mark descriptor can require some effect or prevention. A score of 1 is defensible under that reading; teacher/rubric adjudication is needed. |
| v3 | p3-q18-0-contradiction | 2–2 | 2 | quality_expectation_consistency | The low-consistency expectation may conflate a false consequence claim with internal contradiction. High consistency with low technical accuracy is defensible; the mechanical quality flag is not a validated error. |
| v3 | p4-q18-0-contradiction | 1–1 | 2 | over | Fixed gold is 1. The 2-mark descriptor asks for one well-described approach and identification of the other. Crediting the correct top-down explanation plus the bottom-up name, despite its wrong description, is a defensible alternative interpretation. |
| v3 | p7-q25-0-visual_no_attributes | 3–3 | 3 | quality_expectation_diagram_quality | Historical v3 review: diagram quality was reduced partly for absent attributes, a content omission; the full diagram with the same layout received a higher visual-quality rating. The feedback also cited spacing, so the exact value is subjective. Inspect each later run separately before claiming this issue persists. |
| v5 | p3-q18-0-contradiction | 2–2 | 2 | quality_expectation_consistency | The low-consistency expectation may conflate a false consequence claim with internal contradiction. High consistency with low technical accuracy is defensible; the mechanical quality flag is not a validated error. |

Mechanical checks cannot establish pedagogical usefulness and can miss confusion between factual accuracy and other quality factors. A fixed quality expectation can also be wrong. Detailed semantic observations stay in the provenance/case notes; full student-facing feedback remains in the workspace source reports.

## Run identity and completion

| Run | Harness | Completed / planned | Finished | Deterministic cases | Source SHA-256 |
| --- | --- | ---: | --- | ---: | --- |
| v1 | blind-marking-v1 | 10/10 | yes | 1 | 77dd7861af193c3f745f9943ee773c9d77682f746b318dc84f79625f1f6f1028 |
| v2 | blind-marking-v2-feedback | 10/10 | yes | 1 | 8023fab03ca684679c783a7db3f0c42772b057a761494e0a64ea18bb9421eca8 |
| v3 | blind-marking-v3-feedback | 105/105 | yes | 11 | ba40f060eb5444e0cf56c774988ca727a07b51982bf9c8d03d0221477d20bf57 |
| v4_preflight | blind-marking-v4-feedback | 10/10 | yes | 0 | 612f419448cb88a6e14cc5fc8eefdc3f2d6b314ddab7d89a75a72636a050e9b3 |
| v5 | blind-marking-v5-feedback | 105/105 | yes | 11 | 6057d9dc96278a4639182d9391a32359f1ebcba3751e242969a6d8d0a114ae41 |
| v5_repeat | blind-marking-v5-feedback | 18/18 | yes | 0 | bcd9f5b715ea5b3f8a2ca174d77904ef006b595992170c92416b315a34f6dc9f |
| v6_focus | blind-marking-v6-feedback | 22/22 | yes | 0 | 51d108d4a6b624c65698b7d32ad5c6243a8941bc894922aaedd79a5d8d7c3452 |

The accompanying [compact case-level JSON](data/marking-evaluation-summary.json) records fixture digests, requested/returned model identities and fingerprints, type/tag breakdowns, abstention codes, latency and reported token usage. Tag groups overlap. Its optional cost values use user-supplied rates and reported usage, exclude cache discounts, and are not a provider invoice.

Changes after this snapshot require a new generated summary. Raw reports retain their original source identity; later versions must be reported separately.
