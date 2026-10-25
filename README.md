# HSC Software Engineering practice exams

Unofficial practice site for NSW HSC Software Engineering. Five original Syllabus Mocks (27 questions and 80 marks each, laid out like the 2025 HSC online exam) that together cover the whole Year 12 syllabus, school trial papers converted to the same format, an SQL practice paper and a three-question mini paper. The seven earlier original papers are archived. Not affiliated with NESA.

Live site: https://hsc-se-practice-repo.vercel.app

## What it does

- Exam mode (2 h 20 min countdown for full papers; 30 min for Mini Paper 1) and practice mode (no timer). Exit or submit at any question.
- Question types: multiple choice, multi-select, dropdown, match, tick-grid, written (word counts), Python (Pyodide), pseudocode, SQL (sql.js), diagram (Excalidraw).
- Closed questions are auto-marked. Signed-in students can use DeepSeek Flash for written, code and diagram answers: two simultaneous blind assessments must agree, then a third call audits the evidence and feedback. Up to ten answers are marked concurrently in one browser page, shared across practice and whole-paper marking. Unconfirmed answers remain unscored for review. Students can set their own marks.
- **Class page** (`#/class`): everyone who joins with the class code sees classmates' submitted written answers by name, and can run an AI analysis that pulls the best syllabus-aligned points into one combined answer. See `docs/HANDOFF.md`.
- Papers page, My mistakes page, and the older file-based **Compare responses** (now unlinked). Students export signed evidence from a submitted paper; an organiser imports 2–8 individuals’ files to compare verified common questions, strengths, error types and specific next steps.
- Evidence-linked feedback separates rubric shortfalls from 11 response-quality ratings. Lost marks are categorised where the rubric supports exact attribution; holistic shortfalls remain clearly labelled.
- After submission, **Create my improvement plan** on the results page reviews verified feedback across the paper, identifies supported knowledge/writing patterns and gives prioritised exercises and success checks. A separate AI audit checks the plan; it never changes marks.
- Accounts (email and password). Progress is saved to the account through `/api/auth`.
- Submitted answers are read-only. Use **Start again** for another attempt.
- Python runs in a separate worker with a **Stop** button and a 10-second execution limit. When a program calls `input()`, a dialog asks for the value, as in the HSC exam. Like the exam, it cannot be closed (Cancel enters an empty value), so `while True: input()` traps you until you reload. Time spent at the dialog does not count towards the limit.
- Saves preserve other devices' papers. If the same paper changed on both devices, the Account page lets you choose which complete version to keep; the unsaved local draft is retained until you choose.
- Expired sessions hide account progress. Unsynced drafts are restored only after signing back into the same account. Creating an account carries over guest work; signing into an existing account loads that account's work.

## Layout

```
public/            static site, served as-is (no build step)
  index.html       loads the scripts below IN THIS ORDER (they share globals)
  helpers.js       state S (localStorage key sehsc-nesa-v2), save(), BS(id), question constructors mc/ms/dd/mt/gd/tk/tx/py/ps/sq/dr
  kit.js           more constructors (od drag-order, dm drag-match, ft typed table) and stimulus panels (fig, files, sbs, ctbl, slides)
  marking/marking.js shared registry and criterion formatter
  marking/pem2026.js PEM trial marking entries (loaded before banks)
  marking/doe2026.js DoE trial marking entries (loaded before banks)
  bank1..10.js     papers 1 to 7 are archived (hidden in the app, content in archive/); 8 and 9 are the converted trials, 10 the mini paper (push into BANKS)
  bank14..18.js    Syllabus Mocks 1 to 5; docs/SYLLABUS_MOCKS.md maps every syllabus point to its questions
  formats.js       hidden demo paper of every format, at #/formats
  python.js        worker queue, cancellation and execution timeout
  python-worker.js isolated Pyodide execution (loaded by python.js)
  widgets.js       renderers and marking for each question type
  qtypes.js        plug-in question types registered with regType(); drag-and-drop engine
  xd.js            Excalidraw drawing question
  ace-editor.js    Ace code editor for the Python, pseudocode and SQL boxes (falls back to a textarea if Ace cannot load)
  marking-config.js shared marking-policy version for browser and server
  ai.js            builds the AI-marking request, mistakes helpers
  feedback.js      detailed feedback, quality ratings and post-exam improvement UI
  sync.js          account UI and progress sync (talks to /api/auth)
  pages.js         header, routes, click handlers, exam / finish / results pages
  pages2.js        Papers and My mistakes pages
  boot.js          render()
  style.css
api/
  compare.js       signed evidence exports and bounded cohort comparison
  mark.js          authenticated POST: canonical input, cache, quota and marking orchestration
  improve.js       authenticated post-exam coaching using verified marking evidence
  auth.js          POST: signup, login, load, save (needs the three Cloudflare D1 settings below)
server/
  comparison-*.js  verified snapshots, blind profiles, matched comparison and audit
  marking-input.js loads authoritative question banks and validates text / diagram evidence
  marking-engine.js blind marks, bounded format recovery and independent resolution
  marking-json.js  strict JSON parser, including duplicate-key rejection
  marking-store.js private cached decisions, distributed leases and atomic quotas
  feedback-policy.js loss attribution, quality-factor contract and validation
  improvement-input.js canonical whole-paper evidence and deterministic aggregates
  improvement-engine.js bounded coach plus independent evidence audit
tests/
  run_auth_test.sh API test against an in-memory stand-in for the D1 storage module
  check_banks.js   checks every paper: question count, declared mini-paper or 80-mark totals, well-formed questions
  ui_test.py       Playwright test of modes, exit/submit, signup, login, sync (mocked /api/auth)
```

Mini Paper 1 (`#/10`) contains exactly three original questions worth 5 marks each (15 marks total), with sample answers and marking criteria. Allow 30 minutes in exam mode, or use untimed practice. It is a short practice set, not a full HSC examination.

The inventory also has nine 80-mark papers: the seven originals have 27 questions each, the PEM trial has 33, and the DoE trial has 27. Trial source documents, attribution and marking notes are described in [`marking/README.md`](marking/README.md). The marking evaluation corpus remains 105 synthetic cases from the original seven papers; adding the trial papers does not establish their AI marking accuracy.

Routes are hash based: `#/`, `#/N`, `#/N/q/n`, `#/N/finish`, `#/N/results`, `#/N/review/n`, `#/papers`, `#/mistakes[/N]`, `#/compare`, `#/class`, `#/account`.

## Run and test locally

```
python3 -m http.server 8767 --directory public     # then open http://localhost:8767
sh tests/run_auth_test.sh                           # API logic, no network
npm run test:comparison                             # comparison regressions and calibration fixtures, no network
node tests/sync_test.js                             # concurrency and account-isolation regressions
for f in public/*.js public/marking/*.js api/*.js server/*.js scripts/*.js; do node --check "$f"; done
node tests/check_banks.js                           # question structure and paper totals
node tests/marking_input_test.js                     # canonical questions and diagram evidence
node tests/deployment_bundle_test.js                 # dynamic question/rubric assets in all AI API bundles
node tests/marking_engine_test.js                    # blind marks, audit, validation and deadlines
node tests/marking_api_test.js                       # API integration with mocked provider
node tests/marking_client_test.js                    # stale results, abstention and totals
node tests/feedback_client_test.js                   # feedback display and stale coaching results
node tests/improvement_input_test.js                 # verified evidence and objective scoring parity
node tests/improvement_engine_test.js                # grounded patterns, bounded coach and audit
node tests/improvement_api_test.js                   # coaching auth/cache/quota/persistence
node tests/improvement_evaluator_test.js             # isolated live-coach evaluation controls
node tests/marking_evaluator_test.js                 # calibration dataset and evaluation budgets
node scripts/evaluate-marking.js --validate --split all # offline reference-set validation
sh tests/run_marking_store_test.sh                   # mocked storage, leases, quotas and caching
node tests/marking_storage_transport_test.js          # version conflicts, compression and retry deadlines
npm ci --ignore-scripts --no-audit --no-fund           # install the locked server SDK for the next test
node tests/d1_adapter_test.js                          # real D1 adapter against a fake Cloudflare endpoint (SQLite); network disabled
pip install playwright && playwright install chromium
python3 tests/run_ui_test.py                        # starts its own local server, mocks APIs
```

The static site works with the simple server. `/api/*` does not, so the account and AI-marking features need `vercel dev` (see below) or the preview deployment of a pull request.

To include the real Python worker tests, install `pyodide@0.26.4` into a temporary directory and set `PYODIDE_DIR` to its package directory when running `tests/run_ui_test.py`. It serves the runtime locally and checks infinite-loop cancellation, timeout recovery and every supplied Python model case. Set `ACE_DIR` to a local `ace-builds@1.32.9` package to exercise the real code editor. `CHROME` can specify an existing Chrome executable instead of Playwright's bundled Chromium.

Account storage (`server/d1-blob.js`, Cloudflare D1) uses ETag conditional writes. Login attempts reserve their slot atomically before password hashing. Progress writes update only explicitly changed papers, using per-paper revisions and a bounded ETag retry for concurrent changes to other papers. The browser bounds account requests, including response-body reads, and preserves pending local work on timeout or an invalid save acknowledgement. Older browser clients are asked to reload instead of being allowed to overwrite the entire account. No new environment variables are required.

## Environment variables (set in Vercel, never in git)

| Name | Used by | Notes |
| --- | --- | --- |
| `CLASS_CODE` | `api/class.js`, `api/auth.js` | The one class code students use to join the class. Set in Vercel, never commit it. |
| `OPENCODE_API_KEY` | all AI features (`api/mark.js`, `api/improve.js`, `api/compare.js`, `api/class.js`) | Server-side only. When set, every AI call goes to OpenCode Go (`deepseek-v4.1-flash`) and spends the OpenCode Go subscription instead of DeepSeek balance. Check a new key with `node scripts/check-ai-provider.js` (one tiny request). |
| `AI_PROVIDER`, `OPENCODE_THINKING` | `server/ai-provider.js` | Optional. `AI_PROVIDER=deepseek` forces DeepSeek even when an OpenCode key exists. `OPENCODE_THINKING=off` drops the thinking fields if OpenCode ever rejects them. |
| `DEEPSEEK_API_KEY` | same features | Server-side only. Used only when `OPENCODE_API_KEY` is not set (or `AI_PROVIDER=deepseek`); jobs then spend DeepSeek balance. Explicit local evaluations can load a separate ignored `.env.eval` file. |
| `CF_ACCOUNT_ID` | accounts, marking and comparison storage | Cloudflare account ID that owns the D1 database. |
| `D1_DATABASE_ID` | same | ID of the D1 database (the table is created automatically). |
| `CF_API_TOKEN` | same | Cloudflare API token with **D1 Edit** permission only. Never commit it. |

Only the project owner needs these. Contributors do not need them: tests use mocks.

The marking harness uses DeepSeek-V4.1-Flash, through OpenCode Go (`deepseek-v4.1-flash`) when `OPENCODE_API_KEY` is set and DeepSeek's own API (`deepseek-flash`) otherwise; `server/ai-provider.js` makes that choice for every AI feature. Marks confirmed through either service remain valid evidence. It runs with thinking enabled, high reasoning effort for the two blind markers, low effort for the auditor/adjudicator, and a 32,768-token allowance per call. This is a rolling provider alias, so results record the requested and returned model identities and available provider fingerprint. New paid jobs are limited to 120 per account and 600 across the site per UTC day; each successful job normally uses three calls. A structurally unusable proposal gets at most one blind format replacement per marker (five logical calls maximum). One shared connection-establishment retry permits at most six physical attempts, all within the original deadline. Valid disagreement goes to an independent adjudicator; unresolved decisions receive an explicitly provisional lower proposed mark, excluded from confirmed improvement/comparison evidence. If no valid score survives, the answer stays unscored with an explicit retry. Cached decisions use no new model calls. Failed paid attempts still consume an allowance slot.

See [AI marking design and verification](docs/AI_MARKING.md) for prompts, budgets, review states, privacy, limitations and the teacher-calibration checklist. `vercel.json` requests Fluid compute and a 300-second function limit; the deployment must support that limit. No live API calls are part of the test suite.

See [the improvement coach](docs/AI_IMPROVEMENT.md) for its evidence requirements and two-call budget, and [marking calibration](docs/MARKING_CALIBRATION.md) for the assistant-labelled reference answers and opt-in direct-provider evaluation. Unit/browser tests use mocks and do not establish live marking accuracy. A local `.env.eval` file is ignored by Git; `--env-file .env.eval` safely loads its `DEEPSEEK_API_KEY` for explicitly budgeted live evaluations. Never commit credentials or paste them into an issue.

## Comparing submitted work

Open **Papers → Compare responses**. Each participant signs in, submits and syncs a paper, completes agentic marking, then exports their responses and feedback. The organiser imports 2–8 signed files for the same current paper and consents to send that evidence to DeepSeek. Files expire after seven days and identify accounts with opaque signatures, without exporting email addresses or session tokens. Treat the files as private student work. A downloaded copy cannot be recalled.

The comparison uses the same service and model (DeepSeek's `deepseek-flash` alias is on 24 October 2026 as DeepSeek-V4.1-Flash-1017). It runs independent participant profiles, a matched comparison, and an audit; an unsupported report is withheld for review. Totals are calculated from common verified parts only. Diagrams, self-awarded marks, legacy feedback and unconfirmed results are excluded. Style and concision coaching is separate from rubric shortfalls. Reports do not award marks, rank lasting ability or predict HSC bands.

Comparison jobs have separate durable limits of 12 per account and 40 site-wide per UTC day (up to 10 calls each). Duplicate requests share one job, cached results do not spend again, and failed paid attempts consume their slot. Exporting does not call the model. No extra environment variable is needed: a dedicated signing key is created atomically in private D1 storage. Report caches are private to the requesting account. Source exports/imports remain in browser memory until downloaded; account changes clear them.

See [comparison design, research and teacher calibration](docs/AI_COMPARISON.md). Offline tests verify software safeguards; the supplied synthetic calibration labels are provisional and are not evidence of live-model accuracy. Run the documented opt-in evaluation against teacher-reviewed held-out responses before treating the feature as validated educational advice.

## Contributing

Everyone with access works directly on `main`.

1. `git pull` to get the latest version.
2. Make the change and run the tests above.
3. `git commit` and `git push`. Vercel deploys `main` to production within about a minute.

See `AUTHORING.md` for how to write questions and papers, and `AGENTS.md` for rules that apply to AI coding assistants (Claude, ChatGPT and others).

## Backups

- On the first save of each UTC day, `api/auth.js` copies the previous progress to `backup/<id>/<day>.json` in the same D1 database and deletes copies older than 7 days. This is one extra write per active account per day.
- Signed-in users can list and restore those copies from the Account page. A restore first saves the current state as `before-restore-<time>`, and gives every paper a new revision so other devices see a conflict instead of overwriting it.
- Anyone can download a backup file and restore from it on the Account page. That copy lives with the user, outside Vercel.
- The backups live in the same store as the data, so they protect against bugs and bad overwrites, not against losing the store or hitting Hobby plan limits. Hobby includes 1 GB of storage and 2,000 write operations a month; going over blocks the store for 30 days.
