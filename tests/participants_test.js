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

// Ordering: active ('In progress', current: true) participant first, completed ('Submitted') participant after
const mixedPaper = { id: 'order-test', name: 'Order Paper' };
c.CV.over.papers['order-test'] = [
  { id: 'sub-user', name: 'Submitted User', mine: false, status: 'Submitted' },
  { id: 'live-user', name: 'Active User', mine: false, status: 'In progress', current: true }
];
const ordered = c.getPaperStudents(mixedPaper);
assert.equal(ordered.length, 2, 'mixed paper should have 2 participants');
assert.equal(ordered[0].status, 'In progress', 'active participant must be ordered first');
assert.equal(ordered[0].name, 'Active User');
assert.equal(ordered[1].status, 'Submitted', 'completed participant must be ordered after');
assert.equal(ordered[1].name, 'Submitted User');

// Avatar styling: active participant has av-live, completed has av-done, av-live appears before av-done
const mixedHtml = c.trialAvatarsHTML(mixedPaper);
assert.ok(mixedHtml.includes('av-live'), 'active participant avatar must have class av-live');
assert.ok(mixedHtml.includes('av-done'), 'completed participant avatar must have class av-done');
const livePos = mixedHtml.indexOf('av-live');
const donePos = mixedHtml.indexOf('av-done');
assert.ok(livePos >= 0 && donePos >= 0 && livePos < donePos, 'av-live must appear before av-done');

// Untouched started paper must not falsely show user when a newer active paper exists
c.S.u['9'] = { start: 1, mode: 'practice', ans: {} };
c.S.u['8'] = { start: 2, upd: 10, mode: 'practice', ans: { '1.0': 1 } };
const p9Students = c.getPaperStudents({ id: '9', name: 'Old' });
assert.equal(p9Students.some(s => s.isMe), false, 'untouched old started paper must not falsely show user on paper 9');
assert.equal(p9Students.length, 0, 'untouched old paper without other participants must have 0 students');
console.log('Participant ordering and presence filtering tests passed');

