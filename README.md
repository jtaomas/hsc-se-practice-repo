# HSC Software Engineering practice exams

Unofficial practice site for NSW HSC Software Engineering. Seven original 80-mark papers, 27 questions each, laid out like the 2025 HSC online exam. Not affiliated with NESA.

Live site: https://hsc-software-engineering-practice-andrew-b92c.vercel.app

## What it does

- Exam mode (2 h 20 min countdown) and practice mode (no timer). Exit or submit at any question.
- Question types: multiple choice, multi-select, dropdown, match, tick-grid, written (word counts), Python (Pyodide), pseudocode, SQL (sql.js), diagram (Excalidraw).
- Closed questions are auto-marked. Written, code and diagram answers are marked by DeepSeek via `/api/mark`. Students can override any mark.
- Papers page, My mistakes page.
- Accounts (email and password). Progress is saved to the account through `/api/auth`.
- Submitted answers are read-only. Use **Start again** for another attempt.
- Python runs in a separate worker with a **Stop** button and a 10-second execution limit. Enter `input()` values in **Program input**, one per line, before pressing Run.
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
  ace-editor.js    Ace code editor for the Python, pseudocode and SQL boxes (falls back to a textarea if Ace cannot load)
  ai.js            builds the AI-marking request, mistakes helpers
  sync.js          account UI and progress sync (talks to /api/auth)
  pages.js         header, routes, click handlers, exam / finish / results pages
  pages2.js        Papers and My mistakes pages
  boot.js          render()
  style.css
api/
  mark.js          POST: marks one answer with DeepSeek (needs DEEPSEEK_API_KEY)
  auth.js          POST: signup, login, load, save (needs BLOB_READ_WRITE_TOKEN)
tests/
  run_auth_test.sh API test against an in-memory stand-in for Vercel Blob
  check_banks.js   checks every paper: 27 questions, 80 marks, well-formed questions
  ui_test.py       Playwright test of modes, exit/submit, signup, login, sync (mocked /api/auth)
```

Routes are hash based: `#/`, `#/N`, `#/N/q/n`, `#/N/finish`, `#/N/results`, `#/N/review/n`, `#/papers`, `#/mistakes[/N]`, `#/account`.

## Run and test locally

```
python3 -m http.server 8767 --directory public     # then open http://localhost:8767
sh tests/run_auth_test.sh                           # API logic, no network
node tests/sync_test.js                             # concurrency and account-isolation regressions
pip install playwright && playwright install chromium
python3 tests/run_ui_test.py                        # starts its own local server, mocks APIs
```

The static site works with the simple server. `/api/*` does not, so the account and AI-marking features need `vercel dev` (see below) or the preview deployment of a pull request.

To include the real Python worker tests, install `pyodide@0.26.4` into a temporary directory and set `PYODIDE_DIR` to its package directory when running `tests/run_ui_test.py`. It serves the runtime locally and checks infinite-loop cancellation, timeout recovery and all 42 Python model cases. `CHROME` can specify an existing Chrome executable instead of Playwright's bundled Chromium.

Account storage uses the Blob SDK's ETag conditional writes. Login attempts reserve their slot atomically before password hashing. Progress writes update only explicitly changed papers, using per-paper revisions and an ETag retry for concurrent changes to other papers. Older browser clients are asked to reload instead of being allowed to overwrite the entire account. No new environment variables are required.

## Environment variables (set in Vercel, never in git)

| Name | Used by | Notes |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | `api/mark.js` | Production only. Each AI-marked answer spends DeepSeek balance. |
| `BLOB_READ_WRITE_TOKEN` | `api/auth.js` | Private Vercel Blob store holding hashed accounts and progress. |

Only the project owner needs these. Contributors do not need them: tests use mocks.

## Contributing

Everyone with access works directly on `main`.

1. `git pull` to get the latest version.
2. Make the change and run the tests above.
3. `git commit` and `git push`. Vercel deploys `main` to production within about a minute.

See `AUTHORING.md` for how to write questions and papers, and `AGENTS.md` for rules that apply to AI coding assistants (Claude, ChatGPT and others).

Access check: edited by Claude on 2026-10-24.
