# Marking criteria area

This folder and `public/marking/` are where the official marking material for the two converted trial papers lives. It is kept apart from the questions so that whoever builds the marking system can work here without touching question text.

## What is where

| Path | What it holds |
| --- | --- |
| `public/marking/marking.js` | `MARKING` object and `critOf()`, which turns an entry into the criteria strings the marker uses |
| `public/marking/pem2026.js` | PEM 2026 Trial HSC criteria, sample answers, official keys for the closed questions, mapping grid |
| `public/marking/doe2026.js` | NSW DoE Trial Exam 2026 criteria, sample answers, official keys for the closed questions, mapping grid |
| `marking/source/` | The original files as supplied: the PEM paper and criteria PDFs, the DoE exam and marking rubric Word files, and the DoE sample data flow diagram image |
| `public/bank8.js` | PEM 2026 Trial paper (id `8`, 33 questions, 80 marks) |
| `public/bank9.js` | DoE 2026 Trial paper (id `9`, 27 questions, 80 marks) |

The banks read each written part's sample answer and criteria from `MARKING.<paper>.entries`, so editing a criterion changes what the AI marker sees with no change to the question.

## Entry shape

```js
'22a': {
  kind: 'bands',                  // 'bands' = award one band; 'additive' = add the marks up
  bands: [[4, '...'], [3, '...']],// [marks, descriptor]; marks can be a range such as '5–6'
  sample: '...',                  // the official sample answer (or a corrected one, see note)
  official: '...',                // only when the sample here differs from the official one
  note: '...'                     // anything the marking developer should know
}
```

Keys are the question number, with `i`/`ii` (PEM) or `a`/`b`/`c` (DoE) for parts. `closed` holds the official answers for the browser-marked questions as text, for reference. The live answers for those are in the bank constructors (`mc`, `ms`, `gd`, `tk`, `od`), which the browser marks.

## Things the marking developer should know

PEM 2026
- Question 28 has one official 3-mark table and one sample answer for both parts. The part (ii) bands are written to fit the sample and the 2 marks on the paper (see the `note`).
- Question 30 has no official marking table. Three additive criteria were derived from the 3 marks. The official key lists `price` as `int` and `order_status` as `boolean`, which do not suit the example values. The sample uses `float` and `str`.
- Question 15: the official key puts "transfers data in plain text by default" under FTP only. The site marks it as printed in the key.
- Question 32 (ii) is the refactored question: on the site it is a drag-the-steps pseudocode question (`od`, marked in the browser) instead of typed Python. The official criteria for the typed version are still in `pem2026.js` under `32ii`.

DoE 2026
- Question 22 Part A: the official sample query does not produce the report shown in the question (no grouping or monthly summary). `doe2026.js` keeps the official text under `official` and a query that does produce the printed report under `sample`. The site's SQL check compares against `sample`.
- Question 27 shows a raster image (`public/doe2026-q27.jpg`). The AI marker cannot see images, so that part is routed to review until image support or a text description is added.
- The official grid lists Question 23 as 23.A (parts A and B, 5 marks) and 23.B (part C, 3 marks).
- Question 12 and Question 20 Part B print 2 marks. The official rubric lists 1 mark for matching all of 20 Part B. The paper's printed marks are used.
- Question 11 (numbering the steps) is a dropdown grid and Question 16 (desk check) is a written response, kept as the paper presents them.

## Licences

- The PEM paper says it is supplied copyright free, and may be copied for educational purposes within the school or college.
- The DoE material is (c) State of New South Wales (Department of Education), 2025, licensed under CC BY 4.0. Keep the attribution in `bank9.js` and on the paper page.
