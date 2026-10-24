# HSC Software Engineering practice exams

Unofficial practice site for NSW HSC Software Engineering. Six original 80-mark papers, 27 questions each, laid out like the 2025 HSC online exam. Not affiliated with NESA.

Live site: https://hsc-software-engineering-practice-andrew-b92c.vercel.app

## What it does

- Exam mode (2 h 20 min countdown) and practice mode (no timer). Exit or submit at any question.
- Question types: multiple choice, multi-select, dropdown, match, tick-grid, written (word counts), Python (Pyodide), pseudocode, SQL (sql.js), diagram (Excalidraw).
- Closed questions are auto-marked. Written, code and diagram answers are marked by DeepSeek via `/api/mark`. Students can override any mark.
- Papers page, My mistakes page.
- Accounts (email and password). Progress is saved to the account through `/api/auth`.

## Layout

```
public/            static site, served as-is (no build step)
  index.html       loads the scripts below IN THIS ORDER (they share globals)
  helpers.js       state S (localStorage key sehsc-nesa-v2), save(), BS(id), question constructors mc/ms/dd/mt/gd/tk/tx/py/ps/sq/dr
  bank1..6.js      the six papers (push into BANKS)
  widgets.js       renderers and marking for each question type
  xd.js            Excalidraw drawing question
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
  ui_test.py       Playwright test of modes, exit/submit, signup, login, sync (mocked /api/auth)
```

Routes are hash based: `#/`, `#/N`, `#/N/q/n`, `#/N/finish`, `#/N/results`, `#/N/review/n`, `#/papers`, `#/mistakes[/N]`, `#/account`.

## Run and test locally

```
python3 -m http.server 8767 --directory public     # then open http://localhost:8767
sh tests/run_auth_test.sh                           # API logic, no network
pip install playwright && playwright install chromium
SITE=http://localhost:8767 python3 tests/ui_test.py # needs the server above
```

The static site works with the simple server. `/api/*` does not, so the account and AI-marking features need `vercel dev` (see below) or the preview deployment of a pull request.

## Environment variables (set in Vercel, never in git)

| Name | Used by | Notes |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | `api/mark.js` | Production only. Each AI-marked answer spends DeepSeek balance. |
| `BLOB_READ_WRITE_TOKEN` | `api/auth.js` | Private Vercel Blob store holding hashed accounts and progress. |

Only the project owner needs these. Contributors do not need them: tests use mocks.

## Contributing

1. Fork the repo or create a branch. Do not push to `main`.
2. Make the change. Run the tests above.
3. Open a pull request. Vercel builds a preview URL for the PR.
4. The owner checks the preview and merges. Merging to `main` deploys to production.

See `AGENTS.md` for rules that apply to AI coding assistants (Claude, ChatGPT and others).

Access check: edited by Claude on 2026-10-24.
