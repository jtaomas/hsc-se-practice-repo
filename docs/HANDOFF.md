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
| AI marking | `api/mark.js`, `api/improve.js`, `api/compare.js`, `api/class.js` call DeepSeek-V4.1-Flash via `server/ai-provider.js` | Set `OPENCODE_API_KEY` in Vercel to use OpenCode Go; otherwise `DEEPSEEK_API_KEY` is used. Check a key with `node scripts/check-ai-provider.js`. |

Storage moved from Vercel Blob to D1 on 24 October (commit `2d249ce`). The owner wanted a free tier that hard-caps and needs no card. The old Vercel Blob store and an older Vercel project (`andrew-b92c`) still exist. Do not delete either unless the owner says so in plain words.

D1 free plan (checked on Cloudflare's pricing page on 25 October): 5 million rows read per day, 100,000 rows written per day, 5 GB storage. Going over blocks queries until 00:00 UTC; nothing is billed. An earlier page mentioned 500 MB per database; the pricing page does not, so treat it as unconfirmed. For ten users this is effectively unlimited.

### Tool accounts that will mislead you

- The Cloudflare and Vercel MCP tools available in the session belong to a different account from the owner's. A D1 database `9e2acfff-bba2-46a8-bd24-ccd73a8e49f9` that an earlier session created through the Cloudflare MCP is in the wrong account. Ignore it.
- The Vercel MCP returned "not authorized" for `jtaomas-projects`, and the shell cannot reach the live site. So nobody on the agent side has seen the live site run against D1.

## What is verified and what is not

Verified by tests (all pass at `f001457`): auth, marking store, comparison, sync, client marking, the D1 adapter against a fake Cloudflare endpoint, and the browser tests.

**Not verified:** a real sign-up on the live site writing to the real D1 database. Ask the owner to create a test account and check the D1 Overview page in Cloudflare (Total queries above 0, one table). If sign-up shows "Account storage is not connected", a variable is missing or misspelled in Vercel. Variables only take effect after a new deployment.

## Class page (automatic sharing) added 25 October

Replaces the old opt-in file comparison for day-to-day use. There is no consent step: everyone who joins the class sees each other's **submitted written answers** (types `tx`, `py`, `ps`, `sq`) with names. Single and multiple choice parts (`mc`, `ms`) are shared too (26 October): the panel shows how many classmates picked each option and who (`choiceOf` in `api/class.js`, `cvChoiceBody` in `public/classview.js`), under the correct answer in review and under the question on the Class page. It carries no marks and no model answer. The same applies to every other closed type (`dd`, `gd`, `mt`, `tk`, `od`, `dm`, 27 October): the server shares one option number per answer slot (`CLOSED` in `api/class.js`) and the client lays them out per slot with `closedRows` (`public/widgets.js`, `cvClosedBody`). The My mistakes page now lists the class under these parts too. Typed tables (`ft`) share only the cells the student filled in (`tableCells`, shown by `cvTableBody`). Drawn diagrams (`dr`) share a whitelisted copy of the shapes (`cleanDrawing`): the answers list only says who has a drawing, and each one is fetched on click with `action: 'drawing'` (checked for class membership and a submitted or practice paper) and drawn as plain SVG by `cvDrawSVG`, so the Excalidraw library is not needed to view it. Unsubmitted work never leaves its owner (`paper.done` must be true).

- **Setup the owner must do:** add the Vercel environment variable `CLASS_CODE` (long random phrase, 10+ characters, never in chat or GitHub), then redeploy. Share it with the class. Without it the Class page says the class is not set up and sign-up with a code fails with `class_not_configured`.
- **Joining:** sign-up asks for a name (required) and a class code (optional). Existing accounts join from `#/class` with name and code. Wrong codes are counted per hour for the whole site (60 an hour, then locked for the hour). Max 200 members.
- **Visibility:** after you submit a paper its class answers show. A switch on the page (stored only in the browser) shows them earlier. Both are client-side choices; the server returns submitted answers to any member.
- **AI analysis:** `POST /api/class {action:'analyse'}`. One DeepSeek call per question part (`server/class-synthesis.js`) with the syllabus and NESA key word glossary (`server/syllabus-context.js`) always in the prompt. It returns the directing word, main points (each tagged yes/partly/no for answering the question, who made it, syllabus link, verbatim quotes that the server checks against the real answers), what the class missed, and one combined best answer. Target length is about 32 words a mark up to 3 marks and 45 a mark above that. The printed word guides are not used because the owner says they run short. Needs 2 or more submitted answers. Results are cached class-wide by a digest of the question and answers, so unchanged answers cost no extra call.
- **Limits:** 30 analyses per student and 150 for the site each UTC day (`QUOTA` in `server/class-store.js`).
- **Data in D1:** `class/members/<id>.json`, `class/attempts/<hour>.json`, `class/quota/<day>/<id|site>.json`, `class/synth/<digest>.json`. Answers themselves are read from each member's existing `progress/<id>.json`.
- **Files:** `api/class.js`, `server/class-store.js`, `server/class-synthesis.js`, `server/syllabus-context.js`, `public/classview.js`. Tests: `tests/class_test.js`, `tests/class_ui_test.py`, signup cases in `tests/auth_test.js`.
- **Review hub, practice marking and exam lock (added later on 25 October):**
  - `#/review` (linked in the header and on the home page) lists every paper and opens it straight in `#/N/review/1`. Under each written part in review there is a class panel (`.cvslot`, built in `public/classview.js`) with the shared answers and the analysis button.
  - Practice mode: each question has a "Mark this question" button (`pqMark` in `public/pages.js`). It runs the code or SQL check for that question (`runChecks(b, n)`) and AI marking for that question only (`runAIQuestion` in `public/ai.js`), then shows the normal marking guide under each part. `paper.pq[n]=1` records that a question was revealed. Results use the same stamps as whole-paper marking, so submitting later does not re-mark unchanged answers.
  - Exam lock: `examLock()` in `public/pages.js` returns the paper being sat in exam mode (started, not done, inside its working time). While it is set, `#/class`, `#/review`, any review or results route, `#/mistakes` and `#/compare` show a locked page. The page is a warning with Continue anyway (see below), not a hard lock. The server does not check exam state.
  - Time up: when an exam-mode paper's working time ends it is submitted automatically (`expireExams` in `public/pages.js`, run every second and on every page change, including when the student comes back after closing the tab). Before this, the lock lifted at time up while the paper stayed open for answering.
  - Sharing rule (`sharedPaper` in `api/class.js`): a paper's written answers are shared if it is submitted or was sat in practice mode. An exam still being sat is not shared. To share that too, change `sharedPaper`.
- **Exam notice and My mistakes redesign (later still on 25 October):**
  - The exam lock is now a warning, not a wall. `lockedPage()` shows the paper, mode and time left, with "Return to the exam" and "Continue anyway" (`data-act="examgo"` sets `EXAMOK`). After that a yellow banner (`examBanner()`) shows on every page until the student returns to the exam page, which re-arms the warning. Archived papers never count as an exam in progress (an old test attempt on one used to trigger a false "you are in an exam"). The server no longer holds back class answers during an exam; the warning is browser side only.
  - `#/mistakes[/<bankId|all>[/<bank>.<q>.<part>]]` is a two-pane page: a vertical list of every mistake on the left (`.mk-item`, grouped by paper, red or amber bar for score) and the chosen one on the right in the exam's own styling (question title, navy-bar box, "What you did wrong" card, class panel). `public/pages2.js` `mistakesPage()`, `mkDetail()`. Beware the CSS class `.mk` is the header logo; the page wrapper is `.mkpage`.
- **Legacy:** `#/compare` (signed export files) and the earlier per-account class-code feature in `server/comparison-sharing.js` still exist but are no longer linked from the nav. Leave or remove them in a later clean-up; do not mix them with the new class.
- **Not done:** the existing marking engine (`api/mark.js`) does not yet receive the syllabus text. The owner asked that AI marking always has the syllabus. Adding it means bumping the marking harness version and re-checking the marking tests and cached marks, so it was left for a deliberate change.

## Changes made in this session, newest first

- Class code response sharing and daily save caps implemented: students can enter a class code to share and compare responses directly without downloading files. Daily save cap of 1000 saves per account in `api/auth.js` protects D1 storage (raised from 150, which a single full exam could exceed). See rollback instructions below.
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

## Mark a whole paper from the Papers page (25 October)
- Each submitted paper on `#/papers` now has "Mark N unmarked answers" (only when some answers have no mark; keeps finished marks) and "Re-mark entire paper" (clears every AI mark and marks again). Signed-out students see "Sign in to AI mark" instead. Both use `data-act="paperremark"` with `data-id` (bank id) and, for the first, `data-only="missing"`; the handler in `public/pages.js` falls back to the open paper when there is no `data-id`, and ignores papers that are not submitted.
- While a paper is being marked, its row shows "Marking: n of m answers" with the progress bar and timer (`paperRunBox`, `paperMarkBtns` in `public/pages2.js`). `refreshMarking` redraws the Papers page as each answer finishes.
- Why this was needed: marking only starts when a student opens a paper's results or a review page. A paper submitted while signed out, or one where the tab was closed before marking ran, stayed unmarked until it was opened. The Papers page now offers the same action without opening it.
- Test: the "Papers page" block in `tests/marking_client_test.js`.

## Built features and rollback steps

1. **Automatic sharing of classmates' answers via class code:**
   Students enter an optional class code (on Account or Compare page). Clicking "Share with my class" publishes their signed, verified export to their class roster. Classmates with the same code see them listed and can compare with one click.
   - **Rollback in Vercel:** Go to Vercel Deployments, find commit `75b516d`, click the three dots, and click **Promote to Production**.
   - **Disable via env var:** Set `DISABLE_CLASS_SHARING=1` in Vercel Environment Variables.
   - **Rollback in Git:** Run `git revert HEAD` and push to `main`.
   - **Live presence ("On this paper"):** each open tab of a class member sends a heartbeat (`action: presence`, about every 25s, visible tabs only) that rewrites `class/presence/<id>.json`. The server returns who was seen in the last 75s with ages from its own clock; the browser never trusts cached data for online state, and shows no online/offline claim at all if it has had no reply for 90s. Switch off with `DISABLE_PRESENCE=1` (the list then behaves as before). Tests: `tests/presence_test.js`, presence block in `tests/class_test.js`.

2. **Daily save caps:**
   Limits each account to 1000 progress saves per UTC day (`MAX_DAILY_SAVES` overrides it) to protect Cloudflare D1 free tier limits. Stored directly on the user record at zero extra write cost.
   - **Disable via env var:** Set `DISABLE_SAVE_CAPS=1` in Vercel Environment Variables.

3. **The odd nav box** the owner reported is fixed (see `11b6125`), but they have not confirmed it on the live site.
4. **Old Vercel Blob store, old Vercel project and an accidental Cloudflare Workers project** may still exist. The owner was told the Workers project is unnecessary. Do not delete anything without explicit confirmation.
5. **Existing accounts:** nothing was copied from Blob to D1. Only test data existed when the move happened.

## Owner preferences

- Plain, short replies. Say exactly what to click when giving steps.
- In prose written for the owner, avoid em dashes, three-item lists and inflated claims.
- The owner is a Year 12 student. Explain results, not internals, and say clearly when something could not be checked.
- Tell the owner before doing anything that touches their accounts or deletes data.

## Concise marking and class boxes
- AI marking block (`aiBlock` in `public/ai.js`) shows one sentence of summary, up to 2 "Earned" and 2 "To gain" bullets. Advice, criterion evidence, losses, quality, provenance and re-mark sit in one collapsed "Details" drawer. It no longer repeats the score; the score shows once in the part header (or the question badge in My mistakes).
- My mistakes shows the sample answer open by default, tighter list and detail spacing (CSS block "Concise My mistakes" at the end of `style.css`).
- Class model answer builds automatically (`cvAutoBuild` in `public/classview.js`) for any part in view with 2+ shared answers, once per visit (cached server-side). It sits above the class answers; main points and gaps are in a collapsed drawer.

## Retries, "What's wrong" first, red and yellow (25 October)
- Any part that lost marks on a submitted paper can be retried from My mistakes (button beside the score) or from review (button in the marking guide header). `#/<bank>/retry/<n>.<i>[/mk|/rv]` opens just that part in the exam's own layout with the guide hidden, then "Check my answer" marks it. Code is in `public/retry.js`.
- Retry answers and results are kept in `paper.rt` (`rt.a` answers, `rt.r` results). The page edits them through `ANS()` and `canEdit()` in `helpers.js`, which every answer handler (pages.js, qtypes.js, xd.js, ace-editor.js) now uses. Submitted answers, marks, totals and class sharing are never changed by a retry.
- Closed questions are checked in the browser and the feedback lists what is still wrong without showing the correct answer. Written, code and diagram parts go to `/api/mark` with the retry answer (signed in) or are self-marked against the guide (guests).
- Colours are the same everywhere (`partCls`/`qCls` in `widgets.js`): green full marks, red any lost marks (partial marks are red now, not amber), yellow a mistake whose retry earned full marks. `rt.r[key].full` stays set once reached.
- No retries while any paper is being sat in exam mode, even after "Continue anyway": the buttons disappear and the route refuses.
- Marking feedback now leads with a red "What's wrong" box (each lost mark, why, and how to fix it, from `losses` or else `improve`), then the summary, then "What earned marks". The Details drawer keeps the evidence behind each lost mark. Closed questions show the same box in review and My mistakes.
- Test: `tests/retry_ui_test.py` (added to `run_ui_test.py`).

## Original answer on the retry page (25 October)
- Inside the answer box of a retry there is a small "Original answer" button (in the editor toolbar for written parts, in the box header for code and diagram parts, and as a small link under the part for other typed answers; closed questions do not get one). It opens the submitted answer under the box with "Restore to the box" and "Close". Restore copies the submitted answer into `paper.rt.a[key]` and redraws the retry page; the submitted answer and mark never change. Code: `rtOrigBtn`, `rtOrigHTML`, `rtOrigToggle`, `rtRestore` in `public/retry.js`; the button is added by `itemHTML` renderers in `public/widgets.js` only when `CUR.rt` is set. Test: "Original answer" steps in `tests/retry_ui_test.py`.

## Classmates' marks on class answers (25 October)
- Each answer in the class panel shows its author's mark for that part as a small pill next to the word count (green full marks, red less, grey "Unmarked"). `classAnswers` in `api/class.js` adds `mark` and `max` to every entry through `partMark`: the author's own mark (`paper.self`) first, else a confirmed AI mark (`paper.ai[key].status==='marked'`). Provisional, needs-review and out-of-range values give `null`. Marks are not sent to the AI analysis (it reads only the letter and text). Client: `cvMarkHTML` in `public/classview.js`. Tests: `tests/class_test.js` and `tests/class_ui_test.py`.

## Account profile pictures

Account page uploads JPEG/PNG/WebP (up to 10 MB), crops and re-encodes to a 128×128 JPEG in the browser. Authenticated `profile` requests store only the session owner’s picture at `profiles/<id>.json`; an empty picture removes it. The server caps the data URL at 44,000 characters and rejects external URLs, SVG and non-JPEG payloads. No credentials or progress are changed. Account load returns the picture; class membership reads attach it to overview and answer rows. Browser account epochs and the sync queue protect against stale uploads after sign-out or account changes. Tests cover authentication, validation, isolation, sharing, upload, reload and removal.

## Class roster and admin
- Class page lists everyone in the class with avatars (`roster` action in `api/class.js`, `cvRosterHTML` in `public/classview.js`).
- Class admins (emails in env `CLASS_ADMINS`, comma separated; default `thomas.luu@education.nsw.gov.au`) see a "Progress" button on every class member (`progress` action in `api/class.js`, `memberProgress` in `server/class-store.js`) that expands an inline report of their active/submitted papers, question/part completion, words written, individual responses and marks, earlier attempts (`hist`), and direct links to each question in Class and Review.

## Admin remark (25 October)
- Why: marking runs in the browser of whoever opens the paper, so an answer submitted while signed out, or with the tab closed before marking finished, can stay unmarked for good. Admins can now mark a student's saved answers from the class Progress report.
- Where: Class page, "Progress" on a person (class admins and system admins) or on an account under "All accounts" (system admins). Each submitted paper shows "Mark N unmarked" (only when some are unmarked) and "Re-mark paper" (asks first). Each answered written, code, SQL or diagram part has a "Remark" button. The summary line counts unmarked answers. Closed questions are never listed. Papers still being sat are not offered.
- "Unmarked" means the student has no usable AI mark for the part: none, one from an older marking process (stamp mismatch), provisional, or needs review. A part where the student set their own mark is left out of "Mark N unmarked" but is included in "Re-mark paper".
- How: `cvRemark` in `public/classview.js` builds the same request as the student's browser (`aiPayload`, `aiStamp`, `aiDispatch` in `public/ai.js`) from the student's stored answers, sends it to `/api/mark` with the admin's own sign-in, then saves the results with `remark_save` (class admins, class members only) or `admin_remark_save` (system admins, any account) in `api/class.js`. `cleanMarks` and `saveMarks` in `server/class-store.js` check the shape, keep only known fields, require a submitted paper, require `doneAt` to match the attempt the admin was looking at, set a new paper revision and clear the part's `aiErr`. The student's browser takes the marks on its next sync; if they changed that paper at the same moment they get the usual "changed on another device" choice.
- Limits to know: it uses the admin's own daily marking allowance (120 a day, 600 for the site, in `server/marking-store.js`), not the student's. `/api/mark` caches a result per account and answer. "Re-mark paper", and re-marking a part that already has a provisional or needs-review result, send `remark:true` so the server marks it afresh (see "Marking reliability" below); a part with no result at all can still return a saved result instantly. The marking cannot run unless an AI key is set.
- Tests: `tests/class_test.js` (permissions, validation, what is written) and `tests/class_remark_client_test.js` (the browser side, with mocked marking and saving). The browser test `tests/class_ui_test.py` was not changed and was not run for this change because no browser could be installed in the session that made it.

## Platform admin
- `thomas.luu@education.nsw.gov.au` (env `SYSTEM_ADMINS`, defaulting to `CLASS_ADMINS`) is an admin of the whole site, not only the class. The Class page shows an "All accounts" list for admins (actions `admin_users`, `admin_progress`, `admin_name`, `admin_photo`, `admin_class`, `admin_delete` in `api/class.js`, store functions `admin*` in `server/class-store.js`).
- System admins can inspect the full progress report ("Progress" button) for any account on the site whether in the class or not, and can rename, change photo, add/remove from the class, and delete any non-admin account (deletes user, progress, profile, backups, membership; needs the account email typed to confirm). Email and password changes are not supported (the account id is a hash of the email).

## My mistakes list redesign
- Rows are now `Q#`, a one-line snippet of what the part asks, and a score pill. Red = still wrong (exam mark, e.g. 0 / 4); yellow = fixed by a retry (full marks, e.g. 4 / 4, with the exam mark in the tooltip). Right-first-time parts are green elsewhere (review/results) and are not in this list.
- Type and topic are shown once per run as a sub-heading (`.mk-sub`) under the paper heading (`.mk-grp`, with a count) instead of on every row.
- List pane widened 320px to 380px (`.mkpage`), one column under 860px.
- "marks lost" in the summary counts only marks still lost (retry-fixed parts excluded).

## Marking reliability (25 October)
Roger reported that "Mark N unmarked answers" finished instantly without marking, gave confusing "provisional" marks, showed no sign of which answers were being marked, and seemed to get stuck. Causes and fixes:
- **Runs stopped part-way after a sync.** `aiRunCurrent` required the paper to be the same object. Account sync (`mergeRemote` in `sync.js`) can swap in an identical copy, which silently abandoned the run; results the server had finished were dropped, and the next click returned them from the server cache instantly. A run is now tied to the account, attempt and answers, and results are written into the current `BS(b.id)`.
- **"Already being marked" failed instantly.** A 409 `marking_busy` (an earlier request for the same answer still holds its five-minute lease) is now waited out: `aiCall` polls every ~15 s, up to 24 times, then picks up the saved result. The answer shows "Waiting for an earlier marking request".
- **Re-mark did not re-mark.** The server returned the cached decision for an unchanged answer. Explicit re-marks (`airemark`, `qremark`, `paperremark`, and the new "Mark N unconfirmed answers again") send `remark:true`; `api/mark.js` passes `{replace:true}` to `getOrReserve`, which reserves a fresh job over the saved one. The saved decision is kept as `job.previous` and restored if the fresh attempt fails or its lease expires. Re-marks spend the daily allowance like any new job.
- **Provisional marks.** A provisional result (markers disagreed, audit could not settle it) is marked afresh once automatically (`aiMarkOne` in `ai.js`) before it is accepted. Students now see it as an "Unconfirmed mark" with a plain explanation and a "Mark this answer again" button; needs-review answers also get that button.
- **What is being marked.** Run boxes (results banner, Papers page, practice panel) list "Marking now", "Waiting on an earlier request" and "Next up" chips (`aiActHTML`), refreshed every second by `aiProgTick`. The question-number strip shows a pulsing dot on questions being marked and a grey dot on queued ones (`aiNavState`).
- Tests: `tests/marking_client_test.js` (busy wait, give-up, sync replacement, provisional retry), `tests/marking_api_test.js` and `tests/marking_store_test.js` (re-mark replace and restore), `tests/marking_ui_test.py`.
- Pre-existing, not from this change: `tests/archive_test.js` fails because `archive/banks-1-7.json` is out of date; `tests/ui_test.py` needs CDN access.


## Image questions are marked from their alt text
- `server/marking-input.js`: the marker cannot see pictures, so each `<img>` alt description (40+ characters) is sent as "SOURCE IMAGE DESCRIPTION" and the part is marked normally (DoE 2026 Trial Q27 was stuck on "Needs review").
- A picture whose alt is only a heading (bank 13 Q25, screenshots of an article) still goes to manual review, as before.
- Answers already stored as "Needs review" are not re-marked automatically; use "Re-mark entire paper" on the Papers page.


## Diagram Practice Paper (bank 19)
- `public/bank19.js`: 15 original drawing questions, 51 marks, 90 minutes, mini paper. It covers every diagram the course specifications ask students to draw: Level 0 and full data flow diagrams, structure charts (with refinement, data and control couples, selection and repetition), class diagrams (including one from code), storyboards, decision trees (read, create and simplify), flowcharts (sequence, selection, pre-test, post-test, FOR NEXT, subroutines), Gantt charts and a neural network. Wiring diagrams are left out because they are Year 11 mechatronics and not examined.
- Wording follows the HSC style ("Draw...", "Create...", "Redraw..."); each question has its own scenario and one-mark-per-line criteria that the AI marker reads from the Excalidraw scene plus PNG.
- Every symbol can be drawn with the exam toolbar (rectangle, diamond, circle, arrow, line, pencil, text, eraser). Flowchart parallelograms may be drawn with the line tool or as a rectangle labelled Get/Display; the criteria say so.
- Stimulus figures are inline SVG built with the helpers at the top of `bank19.js` (`sv`, `cls`, `screen`, `tnode`, `fT/fP/fIO/fD` and so on). Inline SVG reaches the marker as SOURCE DIAGRAM DATA.
- Sample answers are drawn too: `drf()` sets `it.fig`, and `modelHTML(it)` in `helpers.js` puts the picture before the written model in the review page (`widgets.js`), retry (`retry.js`) and My mistakes (`pages2.js`).
- Tested with the local Excalidraw build: all 15 questions mount the drawing tool; review pages show the drawn answers. `tests/check_banks.js` and the eight UI suites pass.

## Pseudocode Practice Paper (bank 20)
- `public/bank20.js`: 25 original questions, 80 marks, 160 minutes, mini paper. One scenario runs through it (Kookaburra Creek Kayak Hire). It covers every pseudocode structure in the course specifications: sequence, binary selection, CASEWHERE with OTHERWISE, nested IF with ELSEIF, WHILE, REPEAT / UNTIL, FOR / NEXT with STEP (including a negative step), AND / OR / NOT, arrays, nested loops, subroutines with one and several parameters, a value passed back through a parameter, functions with RETURN, and a mainline that refers to subroutines (including from a structure chart and a flowchart).
- Question styles follow the HSC exam: write the algorithm (`ps`), drag the steps into order (`od`), dropdown output and Python to pseudocode (`dd`), trace tables, test data and error finding (`ft`), classify structures (`mt`), match terms (`dm`), and describe or explain (`tx`).
- The two stimulus figures (a structure chart and a flowchart) are inline SVG built with the small kit at the top of the file.
- Every sample algorithm was run through a small pseudocode interpreter against test cases, and every traced value was checked, before the paper was added. The interpreter is not in the repo.
- `tests/check_banks.js` passes (25 questions, 80 marks) and the eight UI suites pass. `tests/archive_test.js` already failed on a clean `main` before this change (`archive/banks-1-7.json` out of date); it was left alone.

## HTML and CSS questions and practice paper (26 October)
- New AI-marked question type `wb` (constructor in `public/kit.js`, behaviour in `public/qtypes.js`, styles at the end of `public/style.css`). Students edit `index.html` and/or `style.css` in tabs (Ace HTML and CSS modes) and see the page rendered beside the editor. AUTHORING.md describes how to write one.
- Rendering: `webDoc()` in `public/kit.js` builds the page; it is shown in an `<iframe sandbox="" srcdoc>` with a Content-Security-Policy that blocks scripts and all network loads. The style sheet applies only when the HTML links to it. The same frame shows the sample answer in the marking guide and the student's answer on review pages. `webview()` shows a rendered page in a stimulus.
- Saved answer: `{filename: text}` for editable files only (`pages.js` input handler, `data-f` on the textarea). Gutters and Ace editors are keyed `k:filename`.
- Marking: `wbPayload()` in `public/ai.js`; `webEvidence()` in `server/marking-input.js` validates filenames, lengths and types, sends given files as question context and the source of any `webview` pages as SOURCE WEB PAGE DATA. The type label is "HTML and CSS code" (added to `server/marking-engine.js`, `server/feedback-policy.js` code_quality, `server/comparison-engine.js`, `server/class-store.js`, `server/improvement-input.js`). `wb` parts are not shared on the class page yet (`cvOpenItem` and `server/class-synthesis.js` OPEN_TYPES do not include them); `classview.js` can already display one with `QT.wb.preview` if they are added.
- Paper: `public/bank21.js`, HTML and CSS Practice Paper, 10 questions, 40 marks, 60 minutes, mini paper.
- Paper ids for saved progress now accept 1 to 99 (were 1 to 19) in `api/auth.js`, `api/class.js` and `public/sync.js`. Before this, progress on bank 20 (Pseudocode Practice Paper) was not being saved to accounts. Security effect: the save request still only accepts a list of one- or two-digit paper ids with no leading zero, so no other keys (paths, `__proto__`) can be written; storage size and daily save caps are unchanged. `tests/auth_test.js` now uses "100" as its out-of-range example.

## Drawing tool shape library (26 October)
- `public/xdlib.js` defines `XDLIB`, the Excalidraw library passed in by `xdMount` (`public/xd.js`). The first 16 items (`XDLIB_EXAM`) copy the library in the 2025 HSC exam drawing tool, in the same order: DFD process, data store, external entity and data flow; data and control couples; subprogram; parallelogram; decision; terminator; process; structure chart decision; repetition; the relational database ∞ end; a database table; a class box. After them come the other symbols in the Course Specifications: class inheritance and relationship arrows, a one-to-many link, Gantt bar, milestone and dependency, storyboard screen, button and link, decision tree node, neural network node, layer and thick weighting, MLOps stages, and the 14 wiring diagram symbols.
- Every shape uses only rectangles, ellipses, diamonds, lines and arrows (the primitives the marker accepts) and has no text. Each element carries `customData.hsc` with the symbol name; Excalidraw keeps it when a shape is dragged out. `xdText` uses it to describe a library shape as one named shape ("Flowchart subprogram", "DFD data store") in the drawing summary. The server strips `customData` from the marking scene, so marking input is unchanged.
- The library is a popup behind the Library button (as in the exam) and closes when a shape is picked; it holds only the 16 exam shapes and is reset if Excalidraw tries to add to it.
- Excalidraw keeps one library for every canvas on a page, so a read-only canvas passes no `libraryItems` at all. Passing an empty list emptied the library of an editable canvas open beside it.
- Tested in a real browser with Excalidraw 0.17.6 from the CDN: 44 items load, both headings show, dragged shapes keep their group and `customData`, narrow and read-only canvases behave as above. The workspace cannot reach the CDN, so this was not part of the automated suites. A leftover branch `claude/xdlib-test` was used for that test and can be deleted.

## Complete Diagram Mock (bank 22)
- `public/bank22.js`: 25 original questions, 80 marks, 150 minutes, mini paper. It tests every drawing activity in the syllabus and Course Specifications: Level 0 DFD, full DFD, correcting a faulty DFD, structure chart from pseudocode, refinement, class diagram removing redundant attributes, class diagram with multiplicity, class diagram from code, relational database diagrams from a flat file, from SQL and from ORM code, storyboard, screen design with annotations, decision trees in both forms, flowcharts (CASEWHERE, post-test with nested IF, mainline with a function), Gantt chart with team members and progress, wiring diagram, neural network, MLOps, regression sketch, web request sequence with TLS, and a data dictionary (`ft`).
- Every part has a drawn sample answer, built with the SVG kit copied from bank 19 (marker ids renamed `dgka`/`dgkt` so both papers can be open together; the class-box helper is `ucls` so it does not hide the global `cls`).
- `tests/check_banks.js`, the server bank loader and the UI suites pass (`tests/ui_test.py` still needs CDN access, as before).
