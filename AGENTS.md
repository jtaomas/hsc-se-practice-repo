# Instructions for AI coding assistants

Read README.md first. Then follow these rules.

## Stack and constraints
- Plain browser JavaScript (ES5 style, `var`, `function`) in global scope. No framework, no bundler, no build step. Do not introduce one without the owner's approval.
- Script order in `public/index.html` matters. If you add a file, add its tag in the right place.
- Keep new code in the same style as the file you edit. Small edits beat rewrites.
- Serverless functions in `api/` are CommonJS and load `@vercel/blob` with dynamic `import()`.

## Never do these
- Never commit secrets, tokens, `.env` files or API keys. Never print them.
- Never call the live `/api/auth` or `/api/mark` from tests or scripts. Do not create accounts on the live site. Use the mocks in `tests/`.
- Never store or log plain-text passwords. `api/auth.js` keeps a random salt and a scrypt hash only. Changes to that file need a passing `tests/run_auth_test.sh` and a note in the PR describing the security effect.
- Never push to `main` or deploy to production. Open a pull request. The owner merges.
- Do not copy real HSC or NESA exam text into the question banks. Questions here are original.

## How to add or change a question
Read AUTHORING.md: it lists every constructor and stimulus panel, with examples. `public/formats.js` (open `#/formats`) is a working demo of each format.
Banks are in `public/bank1.js` to `bank6.js`. Each question is an object with `tp` (syllabus topic), `st` (stimulus HTML), `it` (parts) built from the constructors in `helpers.js`. Closed types (`mc`, `ms`, `dd`, `mt`, `gd`, `tk`, `od`, `dm`) carry the correct answer and are marked in the browser. `tx`, `py`, `ps`, `sq`, `dr`, `ft` carry `model` (sample answer) and `crit` (marking criteria strings) that are sent to the AI marker. Every paper must total 80 marks across 27 questions. Look at an existing question of the same type and copy its shape.

## Before opening a pull request
1. `for f in public/*.js api/*.js; do node --check $f; done`
2. `node tests/check_banks.js` (27 questions and 80 marks per paper, and every question well formed)
3. `sh tests/run_auth_test.sh`
4. Run `tests/ui_test.py` against a local server if you touched anything in `public/`.
5. In the PR description, say what changed and how you tested it.

## Deploying
Assistants do not deploy. Pull requests get a Vercel preview. Merging to `main` publishes.
