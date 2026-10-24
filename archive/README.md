# Archive: practice papers 1 to 7

Banks 1 to 7 (seven original full-length papers, 27 questions and 80 marks each) are archived. Students no longer see them: they are hidden from the paper list, results, mistakes, comparison and coaching, and `#/1` to `#/7` open the home page.

## For agents: what to do and not do

- **Do not** add, edit, rename or re-surface these papers, and do not use them as models for new questions unless the owner asks. New papers start at bank 11.
- **Read the content from `archive/banks-1-7.json`.** It is plain data, one object per paper, generated from `public/bank1.js` to `bank7.js`.
- The source files stay in `public/` because the tests use them as fixtures, and so the papers can be switched back on. To switch one back on, remove `archived:true` from its `BANKS.push` line.
- `?archive=1` on the site address (`index.html?archive=1`) shows the papers for maintainers and tests. Students' saved progress for these papers is left untouched.
- If the bank source changes, run `node scripts/export-archive.js`. `tests/archive_test.js` fails when the JSON is out of date.

## JSON layout

`papers[]` each has `id`, `name`, `subtitle`, `questionCount`, `totalMarks` and `questions[]`.

A question has `number`, `tp` (syllabus topic), `st` (stimulus HTML), `it` (the parts), `db` (SQL tables for `sq` parts, else null), `m` (marks) and `two` (two-column layout flag).

A part has `t` (type), `q` (prompt HTML) and `m` (marks), plus the fields below. Field names are short because they are used directly by the site. `AUTHORING.md` lists every constructor in the same terms.

| `t` | Kind | Answer and key fields |
|---|---|---|
| `mc` | multiple choice | `o` options, `a` index of the right one, `why` |
| `ms` | choose several | `o` options, `a` list of right indexes, `why` |
| `dd` | dropdown gaps | `tpl` text with `{0}` gaps, `b` list of `[options, rightIndex]`, `why` |
| `mt`, `gd`, `tk` | match, grid or tick table | `h` column headings, `r` rows with the right answers, `why` |
| `tx` | written response | `model` sample answer, `crit` marking criteria, `w` word guide |
| `py`, `ps`, `sq` | Python, pseudocode, SQL | `model` sample answer, `crit` criteria, `tests` (Python), `ord` (SQL) |
| `dr` | diagram | `model` sample, `crit` criteria, `tools` allowed shapes |
| `od`, `dm`, `ft` | ordering, drag-match, form table | `lines`/`pool`, `tok`/`r`, `h`/`r`/`wd` |

Exact rules for checking each closed type are in `public/qtypes.js` and `server/marking-input.js`.

## Counts

Seven papers, 189 questions, 560 marks. Part types: 48 multiple choice, 76 written, 19 choose-several, 19 grid, 14 Python, 13 dropdown, 9 match, 8 diagram, 7 pseudocode, 7 SQL, and 6 others.
