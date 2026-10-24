# HSC Software Engineering practice exams

Unofficial practice site for NSW HSC Software Engineering. Seven original 80-mark papers, 27 questions each, laid out like the 2025 HSC online exam, plus two school trial papers (PEM 2026 and NSW DoE 2026) converted to the same format. Not affiliated with NESA.

Live site: https://hsc-se-practice-repo.vercel.app

## What it does

- Exam mode (2 h 20 min countdown) and practice mode (no timer). Exit or submit at any question.
- Question types: multiple choice, multi-select, dropdown, match, tick-grid, written (word counts), Python (Pyodide), pseudocode, SQL (sql.js), diagram (Excalidraw).
- Closed questions are auto-marked. Signed-in students can use DeepSeek Flash for written, code and diagram answers: two simultaneous blind assessments must agree, then a third call audits the evidence and feedback. Unconfirmed answers remain unscored for review. Students can set their own marks.
- Papers page, My mistakes page, and opt-in **Compare responses**. Students export signed evidence from a submitted paper; an organiser imports 2–8 individuals’ files to compare verified common questions, strengths, error types and specific next steps.
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
  bank1..7.js      the seven papers (push into BANKS)
  formats.js       hidden demo paper of every format, at #/formats
  python.js        worker queue, cancellation and execution timeout
  python-worker.js isolated Pyodide execution (loaded by python.js)
  widgets.js       renderers and marking for each question type
  qtypes.js        plug-in question types registered with regType(); drag-and-drop engine
  xd.js            Excalidraw drawing question
  marking-config.js shared marking-policy version for browser and server
  ace-editor.js    Ace code editor for the Python, pseudocode and SQL boxes (falls back to a textarea if Ace cannot load)
  marking-config.js shared marking-policy version for browser and server
  ai.js            builds the AI-marking request, mistakes helpers
  sync.js          account UI and progress sync (talks to /api/auth)
  pages.js         header, routes, click handlers, exam / finish / results pages
  pages2.js        Papers and My mistakes pages
  boot.js          render()
  style.css
api/
  compare.js       signed evidence exports and bounded cohort comparison
  mark.js          authenticated POST: canonical input, cache, quota and marking orchestration
  auth.js          POST: signup, login, load, save (needs BLOB_READ_WRITE_TOKEN)
server/
  comparison-*.js  verified snapshots, blind profiles, matched comparison and audit
  marking-input.js loads authoritative question banks and validates text / diagram evidence
  marking-engine.js two blind marks, strict evidence checks and independent audit
  marking-json.js  strict JSON parser, including duplicate-key rejection
  marking-store.js private cached decisions, distributed leases and atomic quotas
tests/
  run_auth_test.sh API test against an in-memory stand-in for Vercel Blob
  check_banks.js   checks every paper: question count, 80 marks, well-formed questions
  ui_test.py       Playwright test of modes, exit/submit, signup, login, sync (mocked /api/auth)
```

Routes are hash based: `#/`, `#/N`, `#/N/q/n`, `#/N/finish`, `#/N/results`, `#/N/review/n`, `#/papers`, `#/mistakes[/N]`, `#/compare`, `#/account`.

## Run and test locally

```
python3 -m http.server 8767 --directory public     # then open http://localhost:8767
sh tests/run_auth_test.sh                           # API logic, no network
npm run test:comparison                             # comparison regressions and calibration fixtures, no network
node tests/sync_test.js                             # concurrency and account-isolation regressions
node tests/check_banks.js                           # question structure and paper totals
node tests/marking_input_test.js                     # canonical questions and diagram evidence
node tests/marking_engine_test.js                    # blind marks, audit, validation and deadlines
node tests/marking_api_test.js                       # API integration with mocked provider
node tests/marking_client_test.js                    # stale results, abstention and totals
sh tests/run_marking_store_test.sh                   # mocked storage, leases, quotas and caching
pip install playwright && playwright install chromium
python3 tests/run_ui_test.py                        # starts its own local server, mocks APIs
```

The static site works with the simple server. `/api/*` does not, so the account and AI-marking features need `vercel dev` (see below) or the preview deployment of a pull request.

To include the real Python worker tests, install `pyodide@0.26.4` into a temporary directory and set `PYODIDE_DIR` to its package directory when running `tests/run_ui_test.py`. It serves the runtime locally and checks infinite-loop cancellation, timeout recovery and every supplied Python model case. Set `ACE_DIR` to a local `ace-builds@1.32.9` package to exercise the real code editor. `CHROME` can specify an existing Chrome executable instead of Playwright's bundled Chromium.

Account storage uses the Blob SDK's ETag conditional writes. Login attempts reserve their slot atomically before password hashing. Progress writes update only explicitly changed papers, using per-paper revisions and an ETag retry for concurrent changes to other papers. Older browser clients are asked to reload instead of being allowed to overwrite the entire account. No new environment variables are required.

## Environment variables (set in Vercel, never in git)

| Name | Used by | Notes |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | `api/mark.js`, `api/compare.js` | Production only. Each AI-marked answer spends DeepSeek balance. |
| `BLOB_READ_WRITE_TOKEN` | accounts, marking and comparison storage | Private Vercel Blob store holding hashed accounts, progress, marking results and quotas. |

Only the project owner needs these. Contributors do not need them: tests use mocks.

The marking harness uses `deepseek-flash` with thinking enabled, high reasoning effort and a 32,768-token allowance per call. This is a rolling provider alias, so results record the requested and returned model identities and available provider fingerprint. New paid jobs are limited to 120 per account and 600 across the site per UTC day; each successful job uses three calls. Cached decisions use no new model calls. Failed paid attempts still consume an allowance slot.

See [AI marking design and verification](docs/AI_MARKING.md) for prompts, budgets, review states, privacy, limitations and the teacher-calibration checklist. `vercel.json` requests Fluid compute and a 300-second function limit; the deployment must support that limit. No live API calls are part of the test suite.

## Comparing submitted work

Open **Papers → Compare responses**. Each participant signs in, submits and syncs a paper, completes agentic marking, then explicitly exports their responses and feedback. The organiser imports 2–8 signed files for the same current paper and consents to send that evidence to DeepSeek. Files expire after seven days and identify accounts with opaque signatures, without exporting email addresses or session tokens. Treat the files as private student work. A downloaded copy cannot be recalled.

The comparison uses `deepseek-flash`, documented by DeepSeek on 24 October 2026 as DeepSeek-V4.1-Flash-1017. It runs independent participant profiles, a matched comparison, and an audit; an unsupported report is withheld for review. Totals are calculated from common verified parts only. Diagrams, self-awarded marks, legacy feedback and unconfirmed results are excluded. Style and concision coaching is separate from rubric shortfalls. Reports do not award marks, rank lasting ability or predict HSC bands.

Comparison jobs have separate durable limits of 12 per account and 40 site-wide per UTC day (up to 10 calls each). Duplicate requests share one job, cached results do not spend again, and failed paid attempts consume their slot. Exporting does not call the model. No extra environment variable is needed: a dedicated signing key is created atomically in private Blob storage. Report caches are private to the requesting account. Source exports/imports remain in browser memory until downloaded; account changes clear them.

See [comparison design, research and teacher calibration](docs/AI_COMPARISON.md). Offline tests verify software safeguards; the supplied synthetic calibration labels are provisional and are not evidence of live-model accuracy. Run the documented opt-in evaluation against teacher-reviewed held-out responses before treating the feature as validated educational advice.

## Contributing

Everyone with access works directly on `main`.

1. `git pull` to get the latest version.
2. Make the change and run the tests above.
3. `git commit` and `git push`. Vercel deploys `main` to production within about a minute.

See `AUTHORING.md` for how to write questions and papers, and `AGENTS.md` for rules that apply to AI coding assistants (Claude, ChatGPT and others).

