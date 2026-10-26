// The archive JSON must match public/bank1.js to bank7.js, and archived papers must stay hidden in the app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const file = path.join(root, 'archive', 'banks-1-7.json');
const before = fs.readFileSync(file, 'utf8');
require('child_process').execFileSync(process.execPath, [path.join(root, 'scripts', 'export-archive.js')], { stdio: 'ignore' });
const after = fs.readFileSync(file, 'utf8');
fs.writeFileSync(file, before);
assert.equal(after.replace(/\r\n/g, '\n'), before.replace(/\r\n/g, '\n'), 'archive/banks-1-7.json is out of date: run node scripts/export-archive.js');
const ids = JSON.parse(before).papers.map(p => p.id);
assert.deepEqual(ids, ['1', '2', '3', '4', '5', '6', '7']);
const boot = fs.readFileSync(path.join(root, 'public', 'boot.js'), 'utf8');
assert.match(boot, /archived/);
console.log('archive OK: 7 papers match their source and stay hidden in the app');
