'use strict';
// Live presence in the "On this paper" list: online people in colour with a dot, everyone else greyed, and no claim when unsure.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function load() {
  const c = vm.createContext({ localStorage: { getItem: () => null } });
  vm.runInContext(fs.readFileSync(require.resolve('../public/helpers.js'), 'utf8'), c);
  c.S.ae = 'me@education.nsw.gov.au';
  c.S.u['8'] = { start: 1, upd: 5, mode: 'practice', ans: { '1.0': 1 } };
  c.CV = {
    st: { name: 'Me Myself' },
    roster: { members: [
      { id: 'me', name: 'Me Myself', mine: true }, { id: 'ann', name: 'Ann', mine: false }, { id: 'bo', name: 'Bo', mine: false },
      { id: 'cy', name: 'Cy', mine: false }, { id: 'dee', name: 'Dee', mine: false }
    ] },
    over: { papers: { '8': [
      { id: 'me', name: 'Me Myself', mine: true, status: 'In progress' },
      { id: 'ann', name: 'Ann', mine: false, status: 'Submitted' },
      { id: 'bo', name: 'Bo', mine: false, status: 'Submitted' },
      { id: 'cy', name: 'Cy', mine: false, status: 'In progress', current: true }
    ] } }
  };
  return c;
}
const paper = { id: '8', name: 'Trial' };
const now = () => Date.now();
const names = c => [...c.getPaperStudents(paper).map(s => s.name)];

// 1. Live: Ann is online on this paper, Cy online elsewhere, Bo has not been seen. Order: viewing, online, offline.
let c = load();
c.PR = { list: { ann: { age: 1000, bank: '8' }, cy: { age: 2000, bank: '3' } }, recv: now(), disabled: false };
c.location = { hash: '#/8/q/1' };
assert.deepEqual(names(c), ['Me Myself', 'Ann', 'Cy', 'Bo'], 'viewing now first, then online elsewhere, then offline');
let st = c.getPaperStudents(paper);
assert.deepEqual([...st.map(s => s.online)], [true, true, true, false]);
assert.deepEqual([...st.map(s => s.here)], [true, true, false, false]);
let html = c.trialAvatarsHTML(paper);
assert(/pr-on/.test(html) && /pr-off/.test(html) && /pr-dot/.test(html), 'online and offline are styled differently');
assert(html.includes('3 online'), 'header counts online people');
assert(/Viewing now/.test(html) && />Online</.test(html), 'labels for viewing and online elsewhere');
const bo = html.split('<div class="notion-pop-row').find(r => r.includes('>Bo<'));
assert(/pr-off/.test(bo) && !/pr-dot/.test(bo), 'an offline person is greyed with no green dot');
assert(/Submitted/.test(bo), 'an offline person still shows their paper status');

// 2. Ages by the client clock: a sighting that was fresh when received expires 75s after the server saw it.
c.PR.list.ann.age = 60000; c.PR.recv = now() - 20000;
assert.equal(c.getPaperStudents(paper).find(s => s.name === 'Ann').online, false, '60s old + 20s waiting is 80s: offline');
c.PR.list.ann.age = 60000; c.PR.recv = now() - 5000;
assert.equal(c.getPaperStudents(paper).find(s => s.name === 'Ann').online, true, '65s is still online');

// 3. No trustworthy presence: no greying, no dots, no online claims either way.
for (const bad of [{ list: {}, recv: 0, disabled: false }, { list: { ann: { age: 0, bank: '8' } }, recv: now() - 100000, disabled: false }, { list: { ann: { age: 0, bank: '8' } }, recv: now(), disabled: true }]) {
  c = load(); c.PR = bad;
  html = c.trialAvatarsHTML(paper);
  assert(!/pr-on|pr-off|pr-dot|online</.test(html), 'unknown presence makes no claim');
  assert(c.getPaperStudents(paper).every(s => s.online === null));
}

// 4. A person looking at the paper who has not started it appears; one looking at another paper does not.
c = load();
c.PR = { list: { dee: { age: 500, bank: '8' }, bo: { age: 500, bank: '2' } }, recv: now(), disabled: false };
st = c.getPaperStudents(paper);
const dee = st.find(s => s.name === 'Dee');
assert(dee && dee.online && dee.here && dee.status === 'Viewing', 'a viewer is listed');
assert.equal(st.find(s => s.name === 'Bo').here, false, 'Bo is online but on another paper');
assert.equal(st.filter(s => s.name === 'Dee').length, 1);

// 5. Never invent people: ids that are not on the roster are ignored; nobody appears twice.
c = load();
c.PR = { list: { ghost: { age: 0, bank: '8' }, ann: { age: 0, bank: '8' } }, recv: now(), disabled: false };
st = c.getPaperStudents(paper);
assert(!st.some(s => s.name === 'ghost') && st.length === 4 && st.filter(s => s.name === 'Ann').length === 1);

// 6. Presence data never carries or shows emails of others.
assert(!/@/.test(html.replace(/me@education\.nsw\.gov\.au/g, '')), 'no other emails');
console.log('Presence display tests passed');
