# Writing a mock paper

Every paper is one file, `public/bankN.js`, built from small constructors. Copy the shape below, fill in your questions, add one `<script>` tag to `public/index.html`, and run `node tests/check_banks.js`.

Open `#/formats` on the local server to see every format working, including marking and review. Its source, `public/formats.js`, is the quickest place to copy from.

## A paper

```js
(function(){
var SEP='Software Engineering Project',PW='Programming for the Web',SSA='Secure Software Architecture',SA='Software Automation';
var qs=[];
qs.push(Q(SEP,'Stimulus HTML, or an empty string',[
  mc('Question text',['Option A','Option B','Option C','Option D'],1,'Why B is right.')]));
// ...26 more...
BANKS.push({id:'7',name:'Bank 7',sub:'Short description',qs:qs});
})();
```

- `Q(topic, stimulus, parts, opt)`. The topic must be one of the four above. A question's marks are the sum of its parts.
- `opt.two:true` puts the stimulus in a left column that scrolls on its own, with the parts on the right. Most longer HSC questions use this layout.
- `opt.db:{Table:{c:[columns],r:[rows]}}` gives SQL parts a database. The tables are shown under the stimulus.
- `P('(a)', part)` labels a part. Multi-part questions get "hide" toggles automatically.
- A visible paper must have **27 questions and 80 marks**. Add `hidden:true` to the bank object for a demo or draft that should stay off the paper lists (it still opens at `#/<id>`).

## Question formats

### Marked in the browser

| Constructor | HSC format | Answer |
| --- | --- | --- |
| `mc(q, options, answer, why)` | Multiple choice, 1 mark | index of the right option |
| `ms(q, options, answers, m, why)` | "More than one may be selected" | array of indexes |
| `dd(q, template, blanks, m, why)` | Dropdowns inside text, code or SQL. Write `{0}`, `{1}` in the template | `blanks = [[options, answer], ...]` |
| `mt(q, headings, rows, m, why)` | Radio grid: one choice per row | `rows = [[text, column], ...]` (column 0 is the first heading after the row label) |
| `tk(q, headings, rows, m, why)` | Tick grid: any number per row | `rows = [[text, [columns]], ...]` |
| `gd(q, headings, rows, m, why)` | Table with a dropdown in some cells | a cell is text or `[options, answer]` |
| `od(q, pseudocode, m, opt)` | **Drag steps into indented slots** (sample Q9) | see below |
| `dm(q, labels, rows, m, opt)` | **Drag labels into boxes** beside statements (sample Q5) | `rows = [[statement, label index], ...]` |

For `od` and `dm` parts worth more than 1 mark, partial credit is `floor(marks × fraction of slots right)`, the same rule the existing grids use.

#### `od`: drag steps into an algorithm

Write the finished algorithm, indented exactly as it should look. Each line becomes a slot, and its text becomes a card in the pool. Put a marker after the indentation to change a line:

```js
od('Place the following steps ... by dragging the steps into position.',`
# BEGIN SumEvens
    = Set total = 0
    FOR i = 1 TO 10
        IF i MOD 2 = 0 THEN
            Set total = total + i
        ENDIF
    NEXT i
    Display total
# END SumEvens`,2,{why:'...', extra:['Set total = i']})
```

- `#` shows the line as plain text, not a slot (BEGIN and END in the sample).
- `=` makes a slot that is already filled in.
- `extra` adds distractor cards that belong nowhere.

The cards are shuffled, but they come out in the same order every time. Identical lines (two `ENDIF`s) are fine, because marking compares text.

#### `dm`: drag labels into boxes

```js
dm('Match each implementation method to its description by dragging the labels into the boxes.',
   ['Direct','Parallel','Phased','Pilot'],
   [['The old system is switched off and the new one starts at once.',0], ...],1,{why:'...'})
```

Each label can be used once. Pass `{reuse:true}` when one label belongs in several boxes.

Students can drag with a mouse or finger. They can also click (or Tab to and press Enter) a card, then click a slot. Dragging onto a filled slot swaps the two cards. Dragging a card back to the pool removes it.

### Marked by AI (and by the student)

| Constructor | HSC format |
| --- | --- |
| `tx(q, m, wordLimit, model, criteria)` | Written response with word count |
| `py(q, m, starterCode, model, tests, criteria)` | Python editor with Run. `tests = [{i:[inputs], o:'expected output end'}]` |
| `ps(q, m, model, criteria)` | Pseudocode editor |
| `sq(q, m, model, ordered, criteria)` | SQL editor (needs `opt.db` on the question) |
| `dr(q, m, model, criteria)` | Drawing tool (class diagrams, decision trees, structure charts) |
| `ft(q, m, columns, rows, model, criteria, opt)` | **Table to type into** (sample Q11) |

#### `ft`: table to type into

```js
ft('Provide a set of test data ...',3,
   ['Test data<br>(Weight)','Expected output<br>(Cost)','Reason for inclusion'],
   4,                                     // 4 blank rows, or rows like [['Valid',null,null], ...]
   [['2500','15','Tests the first branch'], ...],   // sample rows, same shape
   ['1 mark: ...','1 mark: ...'],
   {widths:['22%','22%','56%']})
```

In `rows`, a string is fixed text and `null` is a box to type in. The server supplies the canonical column names and fixed cells separately from the student's row/column entries, so the criteria can say "for each row". Fixed question text cannot be submitted as student evidence.

## Stimulus panels

Use these inside the stimulus string. They match the panels in the HSC online exam.

| Helper | What it draws |
| --- | --- |
| `code(text)` | Monospaced code block |
| `tbl(headings, rows, caption)` | Plain table |
| `ctbl(headings, rows, colours, caption)` | Table with cells coloured by value, eg a timetable: `ctbl(h, rows, {English:'#f9c6d3', Sport:'#fde2a7'})`. A cell can also be `[text, colour]`. |
| `cls([[name, [attributes]], ...])` | Class boxes |
| `fig(caption, html)` | Bordered panel with a **zoom** button. Put SVG, images, diagrams or tables in it. |
| `sbs([[label, html], ...])` | Side-by-side cells ("Image 1", "Image 2"). Usually inside `fig()`. |
| `files([[filename, code], ...])` | Code files with filename headings in one zoomable panel (eg `index.html`, `main.css`) |
| `slides([...], caption)` | Carousel with arrows and dots (sample Q25). Build each slide with `slide(title, html, art)`. |

Images: put the file in `public/` and use `<img src="name.png" alt="...">` inside `fig()`. Inline `<svg>` also works, and it stays sharp when zoomed.

## Adding a brand-new question type

Rendering, browser scoring, review and My mistakes use a registry. Automatic AI marking also needs a server adapter so that browsers cannot choose their own rubrics:

1. Add a constructor to `public/kit.js` that returns `{t:'xx', q:..., m:..., ...}`.
2. In `public/qtypes.js`, call `regType('xx', {...})` with the hooks listed at the top of that file. A browser-marked type needs `auto:true`, `render`, `units`, `guide`, `isAns` and `compare`. An AI-marked type needs `render`, `isAns`, `sample` and `preview`.
3. Teach `tests/check_banks.js` what a valid `xx` looks like.
4. For an AI-marked type, add saved-answer serialization to `aiPayload` in `public/ai.js` and canonical validation/normalization to `server/marking-input.js`. The browser sends only bank/question/part identifiers and the answer, never trusted criteria, sample answers, marks or execution claims. Include any new bank/constructor files in the server loader and `vercel.json` bundle.
5. Add an example to `public/formats.js`, validate its canonical evidence in `tests/marking_input_test.js`, and test it at `#/formats`. Check that submitted answers cannot be edited and that an uncertain result remains unscored.

## Before a pull request

```
for f in public/*.js api/*.js; do node --check $f; done
node tests/check_banks.js
python3 -m http.server 8767 --directory public    # look at your questions
SITE=http://localhost:8767 python3 tests/ui_test.py
```

Questions must be original. Do not copy HSC or NESA exam text.

## Bullet points in a stimulus or prompt
`bl(['first point','second point'])` returns a dot-point list styled like the HSC online exam. Use it inside a stimulus string or a question prompt.
