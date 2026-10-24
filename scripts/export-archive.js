#!/usr/bin/env node
'use strict';
// Writes archive/banks-1-7.json: the question content of the archived papers as plain data.
// Run again only if public/bank1.js to bank7.js change. Usage: node scripts/export-archive.js
const fs = require('fs');
const path = require('path');
const { loadBanks } = require('../server/marking-input');
const banks = loadBanks().filter(b => b.archived).sort((a, b) => Number(a.id) - Number(b.id));
const out = {
  about: 'Archived practice papers (banks 1 to 7). Original questions written for this site. Field meanings are in archive/README.md.',
  papers: banks.map(b => ({
    id: b.id, name: b.name, subtitle: b.sub,
    questionCount: b.qs.length,
    totalMarks: b.qs.reduce((n, q) => n + q.it.reduce((m, it) => m + (it.m || 0), 0), 0),
    questions: b.qs.map((q, i) => Object.assign({ number: i + 1 }, q))
  }))
};
const file = path.join(__dirname, '..', 'archive', 'banks-1-7.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log('Wrote', path.relative(process.cwd(), file), out.papers.map(p => p.id + ':' + p.questionCount + 'q/' + p.totalMarks + 'm').join(' '));
