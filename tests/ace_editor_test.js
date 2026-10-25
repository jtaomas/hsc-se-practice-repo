'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(withObserver = true) {
  const events = [], observers = [], editors = [];
  function element() {
    return {
      dataset: {}, connected: true, parentNode: null,
      classList: { add() {}, remove() {} },
      appendChild(child) { child.parentNode = this; child.connected = this.connected; },
      remove() { this.connected = false; this.parentNode = null; },
      setAttribute() {}, getAttribute() { return ''; }
    };
  }
  const host = element(), textarea = element();
  host.appendChild(textarea);
  textarea.dataset.k = '1.0';
  textarea.value = 'print(1)';
  textarea.dispatchEvent = function () {};
  function ResizeObserver(callback) {
    this.callback = callback;
    this.disconnected = false;
    this.observe = function (target) { this.target = target; };
    this.disconnect = function () { this.disconnected = true; events.push('disconnect'); };
    // A delivery already queued before disconnect must also be harmless.
    this.deliver = function () { callback([{ target: this.target }]); };
    observers.push(this);
  }
  const context = {
    window: withObserver ? { ResizeObserver } : {}, ResizeObserver,
    document: { body: { contains(node) { return !!node && node.connected; } }, createElement: element },
    CUR: { b: { id: 1 } }, BS() { return { done: false }; },
    $$() { return [textarea]; }, itemOf() { return { t: 'py' }; },
    location: { href: 'https://test.invalid/' }, URL, Promise, setTimeout,
    loadScript() { return Promise.resolve(); },
    ace: {
      config: { set() {} },
      edit(box) {
        const editor = {
          container: box, resizeCalls: 0,
          session: { getValue() { return textarea.value; }, on() {} },
          renderer: { scroller: element() },
          textInput: { getElement: element }, clearSelection() {},
          resize() {
            assert.ok(this.session, 'resize must never run after Ace destroys its session');
            this.resizeCalls++;
          },
          destroy() { events.push('destroy'); this.session = null; },
          getValue() { return textarea.value; }
        };
        editors.push(editor);
        return editor;
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/ace-editor.js'), 'utf8'), context);
  return { context, host, textarea, observers, editors, events };
}

async function mount(f) {
  f.context.aceMount();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.host.dataset.ace, '1');
  return f.editors[f.editors.length - 1];
}

(async function () {
  const f = fixture(), editor = await mount(f), observer = f.observers[0];
  observer.deliver();
  assert.equal(editor.resizeCalls, 1, 'a live editor still follows host resizing');

  f.host.connected = false;
  observer.deliver();
  assert.equal(editor.resizeCalls, 1, 'detached hosts cannot resize an editor');
  f.host.connected = true;

  f.context.ACE_ED['1.0'] = {};
  observer.deliver();
  assert.equal(editor.resizeCalls, 1, 'an obsolete editor cannot resize its replacement');
  f.context.ACE_ED['1.0'] = editor;

  f.context.aceCleanup();
  assert.equal(observer.disconnected, true, 'cleanup disconnects the retained observer');
  assert.deepEqual(f.events, ['disconnect', 'destroy'], 'disconnect happens before session destruction');
  assert.equal(Object.keys(f.context.ACE_ED).length, 0);
  assert.equal(f.host.dataset.ace, undefined);
  assert.doesNotThrow(() => observer.deliver(), 'queued resize callbacks after cleanup are ignored');
  assert.equal(editor.resizeCalls, 1);

  const replacement = await mount(f);
  observer.deliver();
  f.observers[1].deliver();
  assert.equal(editor.resizeCalls, 1);
  assert.equal(replacement.resizeCalls, 1, 'replacement editor has its own live observer');
  f.context.aceCleanup();
  f.context.aceCleanup();
  assert.doesNotThrow(() => f.observers[1].deliver());

  const fallback = fixture(false);
  await mount(fallback);
  assert.doesNotThrow(() => fallback.context.aceCleanup(), 'browsers without ResizeObserver still clean up');
  console.log('Ace editor lifecycle OK: live resize, detached/replaced guards, disconnect-before-destroy and queued callback teardown');
})().catch(error => { console.error(error); process.exitCode = 1; });
