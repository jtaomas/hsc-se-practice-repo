# Instructions for AI coding assistants

Read README.md first. Then follow these rules.

## Stack and constraints
- Plain browser JavaScript (ES5 style, `var`, `function`) in global scope. No framework, no bundler, no build step. Do not introduce one without the owner's approval.
- Script order in `public/index.html` matters. If you add a file, add its tag in the right place.
- Keep new code in the same style as the file you edit. Small edits beat rewrites.
- Serverless functions in `api/` are CommonJS. All storage goes through `server/d1-blob.js` (Cloudflare D1).

## Never do these
- Never commit secrets, tokens, `.env` files or API keys. Never print them.
- Do not break the live site. Every push to `main` deploys to production within about a minute, so test before you push.
- Never call the live `/api/auth` or `/api/mark` from tests or scripts. Do not create accounts on the live site. Use the mocks in `tests/`.
- Never store or log plain-text passwords. `api/auth.js` keeps a random salt and a scrypt hash only. Changes to that file need a passing `tests/run_auth_test.sh` and a note in the PR describing the security effect.
- Do not copy real HSC or NESA exam text into the question banks. Questions here are original. The one exception is the school trial papers that the owner supplied and asked to have converted (PEM 2026 Trial in `bank8.js` and NSW DoE 2026 Trial in `bank9.js`). Do not add other published papers without the owner's say-so and a licence that allows it.
- Marking criteria for those two papers live in `public/marking/` and `marking/`. Read `marking/README.md` before changing how they are marked.

## How to add or change a question
Read AUTHORING.md: it lists every constructor and stimulus panel, with examples. `public/formats.js` (open `#/formats`) is a working demo of each format.
Banks 1 to 7 are archived: hidden from students, kept as data in `archive/` (read `archive/README.md` before touching them; do not edit or re-surface them, and start new papers at bank 11). Banks are in `public/bank1.js` to `bank10.js`. Each question is an object with `tp` (syllabus topic), `st` (stimulus HTML), `it` (parts) built from the constructors in `helpers.js`. Closed types (`mc`, `ms`, `dd`, `mt`, `gd`, `tk`, `od`, `dm`) carry the correct answer and are marked in the browser. `tx`, `py`, `ps`, `sq`, `dr`, `ft` carry `model` (sample answer) and `crit` (marking criteria strings) that are sent to the AI marker. Full-length original papers total 80 marks across 27 questions. Explicitly requested mini papers use the `mini`, `questions`, `marks` and `duration` metadata described in AUTHORING.md; Mini Paper 1 has three questions and 15 marks. Look at an existing question of the same type and copy its shape.

## Working on main
Everyone works directly on `main`. No pull request and no side branch is needed.
1. Run `git pull` before you start, and again right before you push.
2. Keep each change small and push it as soon as it works.
3. If the push is rejected because someone else pushed first, run `git pull --rebase`, resolve any conflict, and push again.
4. Tell the other contributors which file you are changing if it is a big edit.

## Before you push
1. `for f in public/*.js api/*.js; do node --check $f; done`
2. `node tests/check_banks.js` (full-length or declared mini-paper totals, and every question well formed)
3. `sh tests/run_auth_test.sh`
4. Run `tests/ui_test.py` against a local server if you touched anything in `public/`.
5. In the PR description, say what changed and how you tested it.
2. `sh tests/run_auth_test.sh`
3. Run `tests/ui_test.py` against a local server if you touched anything in `public/`.
4. Write a commit message that says what changed.

## Deploying
Pushing to `main` deploys to production through Vercel. If a push breaks the site, tell the owner. They can roll back in Vercel under Deployments.
