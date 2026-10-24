# Handoff for the next agent

Written 25 October 2026 by the Claude session that worked with the owner (Andrew) on 24 and 25 October. Read `README.md` and `AGENTS.md` first. This file adds the context that is not in them: what changed recently, how the live system is wired, what is unverified, and what the owner has not decided yet.

## The project in one paragraph

An unofficial HSC Software Engineering practice site for NSW Year 12 students. Plain ES5 browser JavaScript served from `public/`, serverless functions in `api/` (CommonJS), shared server code in `server/`. Every push to `main` deploys to Vercel production in about a minute. The owner's GitHub account is `jtaomas`. Other contributors push straight to `main` too, including one who probably uses OpenAI Codex (`N7bula`, branches named `codex/...`). Always `git pull --rebase origin main` right before pushing.

## How the live system is wired

| Piece | Where | Notes |
|---|---|---|
| Hosting | Vercel, team `jtaomas-projects`, project `hsc-se-practice-repo`, Hobby plan | Auto-deploys from `main`. Production address is the project's main domain. Branch URLs such as `...-git-main-...vercel.app` are behind Vercel login, so give students the main domain. |
| Storage | Cloudflare D1, database named `hsc-se-practice`, database ID `0eef12ae-ddaf-422a-9687-c08f2ca4af9a` | In the owner's own Cloudflare account (shown as `Icescreambobcat@...` in the dashboard). The table `blobs` is created automatically by the code. |
| Storage code | `server/d1-blob.js` | Blob-style `get`, `put`, `list`, `del` over the D1 REST API. Bodies are gzipped and base64 encoded to fit D1's 2 MB row limit. Every write gets a fresh random etag; `ifMatch` is a compare-and-swap. |
| Storage settings | Vercel environment variables `CF_ACCOUNT_ID`, `D1_DATABASE_ID`, `CF_API_TOKEN` | The token has Account, D1, Edit permission only. Never print or commit it. `BLOB_READ_WRITE_TOKEN` is no longer used. |
| AI marking | `api/mark.js`, `api/improve.js`, `api/compare.js` use DeepSeek | Key is `DEEPSEEK_API_KEY` in Vercel. |

Storage moved from Vercel Blob to D1 on 24 October (commit `2d249ce`). The owner wanted a free tier that hard-caps and needs no card. The old Vercel Blob store and an older Vercel project (`andrew-b92c`) still exist. Do not delete either unless the owner says so in plain words.

D1 free plan (checked on Cloudflare's pricing page on 25 October): 5 million rows read per day, 100,000 rows written per day, 5 GB storage. Going over blocks queries until 00:00 UTC; nothing is billed. An earlier page mentioned 500 MB per database; the pricing page does not, so treat it as unconfirmed. For ten users this is effectively unlimited.

### Tool accounts that will mislead you

- The Cloudflare and Vercel MCP tools available in the session belong to a different account from the owner's. A D1 database `9e2acfff-bba2-46a8-bd24-ccd73a8e49f9` that an earlier session created through the Cloudflare MCP is in the wrong account. Ignore it.
- The Vercel MCP returned "not authorized" for `jtaomas-projects`, and the shell cannot reach the live site. So nobody on the agent side has seen the live site run against D1.

## What is verified and what is not

Verified by tests (all pass at `f001457`): auth, marking store, comparison, sync, client marking, the D1 adapter against a fake Cloudflare endpoint, and the browser tests.

**Not verified:** a real sign-up on the live site writing to the real D1 database. Ask the owner to create a test account and check the D1 Overview page in Cloudflare (Total queries above 0, one table). If sign-up shows "Account storage is not connected", a variable is missing or misspelled in Vercel. Variables only take effect after a new deployment.

## Changes made in this session, newest first

- `f001457` Removed the two consent tick boxes from Compare responses. Plain notices replace them. See "Open decisions".
- `11b6125` Banks 1 to 7 archived: `archived:true` on their `BANKS.push` line, hidden at load by `public/boot.js`, content exported to `archive/banks-1-7.json` with `archive/README.md`. `?archive=1` on the site address shows them again, and the browser tests use it. Also fixed the review-page bug where question box 2 sat lower than its neighbours: the rule `.part+.part` (spacing between parts of a question) also matched the orange `nav-elem part` box; it is now `.part+.part:not(.nav-elem)`, with a regression check in `tests/ui_test.py`.
- `2579592` Marking no longer stops on "This answer is already being marked". The client waits and asks again, up to about six minutes (24 tries). The status panel, results totals and open review question update as each answer finishes (`aiLive` in `public/ai.js`).
- `2d249ce` and `b89903a` Storage moved to D1. Progress saves now wait 20 seconds (was 3) and flush when the page is hidden or closed.
- `0ae0829` Daily server backups (7 days, one extra write per active account per day), plus a backup file download, upload and restore on the Account page.
- `d18aa24` Two converted school trial papers: PEM 2026 Trial (`bank8.js`) and DoE 2026 Trial (`bank9.js`), with a separate marking-criteria area in `public/marking/`. Read `marking/README.md` before changing how they are marked; it records data problems in the official materials (DoE Q22a sample SQL is wrong, PEM Q30 key is inconsistent, PEM Q28(ii) criteria were missing). PEM Q32(ii) is deliberately a drag-the-steps question (`od`).

## Rules that bit this session

- Never run `pkill -f "http.server <port>"` in the same command as other work. It matched and killed the shell itself (exit 144). Run it alone, or skip it.
- Test runners copy specific files into temp folders. `tests/run_auth_test.sh` and `tests/run_marking_store_test.sh` copy `tests/stub/d1-blob.js` over `server/d1-blob.js`. If you add a new server file that these modules require, copy it in those scripts too.
- Many tests use Bank 1 as fixture data, so do not delete `public/bank1.js` to `bank7.js`.
- Part prompts must not use `bl()` (a list) inside `<p class="hoa-q">`; use `<br>&bull;` text bullets.
- `public/pages.js.rej` is a stray file from an earlier contributor commit. It is not ours and has been left alone.
- Run the whole set before pushing: `node tests/check_banks.js`, `sh tests/run_auth_test.sh`, `sh tests/run_marking_store_test.sh`, `node tests/d1_adapter_test.js`, `node tests/archive_test.js`, `node tests/sync_test.js`, `npm run test:comparison`, the marking and improvement tests listed in `.github/workflows/check.yml`, and `ACE_DIR=<path to ace-builds> python3 tests/run_ui_test.py`.

## Open decisions and loose ends

1. **Automatic sharing of classmates' answers.** The owner asked for answers to be viewable automatically because "it's a class". Only the consent tick boxes are gone; the flow still needs file export and import. The site has no concept of a class and anyone can sign up, so automatic visibility would expose students' written work to strangers. Recommended design, not yet approved: a class code that students enter, scoping visibility to people with the same code. Two alternatives were offered: visible to everyone on the site with a notice at submission, or leave as is. Wait for the owner's answer before building.
2. **Save caps not built.** A per-account and a site-wide daily save limit were discussed but held back because D1's free tier already hard-caps. Build only if asked.
3. **The odd nav box** the owner reported is fixed (see `11b6125`), but they have not confirmed it on the live site.
4. **Old Vercel Blob store, old Vercel project and an accidental Cloudflare Workers project** may still exist. The owner was told the Workers project is unnecessary. Do not delete anything without explicit confirmation.
5. **Existing accounts:** nothing was copied from Blob to D1. Only test data existed when the move happened.

## Owner preferences

- Plain, short replies. Say exactly what to click when giving steps.
- In prose written for the owner, avoid em dashes, three-item lists and inflated claims.
- The owner is a Year 12 student. Explain results, not internals, and say clearly when something could not be checked.
- Tell the owner before doing anything that touches their accounts or deletes data.
