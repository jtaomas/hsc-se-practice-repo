'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const c = vm.createContext({ localStorage: { getItem: () => null } });
vm.runInContext(fs.readFileSync(require.resolve('../public/helpers.js'), 'utf8'), c);
const paper = { id: '8', name: 'Trial' };
assert.equal(c.getPaperStudents(paper).length, 0, 'empty papers must not invent participants');
assert.equal(c.trialAvatarsHTML(paper), '');
c.S.ae = 'actual@education.nsw.gov.au';
assert.equal(c.getPaperStudents(paper).length, 0, 'signing in does not start every paper');
c.S.u['8'] = { start: 1, mode: 'practice' };
c.CV = { st: { name: 'Actual Name' }, over: { papers: { '8': [
  { id: 'self', name: 'Actual Name', mine: true, status: 'In progress' },
  { id: 'other', name: 'Actual Name', mine: false, status: 'Submitted' }
] } } };
const participants = c.getPaperStudents(paper);
assert.equal(participants.length, 2, 'deduplicate by authenticated identity, not shared names');
assert.equal(participants[0].email, 'actual@education.nsw.gov.au');
assert.equal(participants[1].email, '', 'never construct an email from a name');
assert.equal(participants[0].status, 'In progress');
const html = c.trialAvatarsHTML(paper);
assert(!/presence-pulse-dot|presence-dot|Active|student\.det|Sam|Priya|Joyce/.test(html));
console.log('Participant display regressions passed');
