'use strict';

// JSON.parse accepts duplicate keys. Reject them (including escaped aliases)
// before using a model response as a marking decision.
function parse(text) {
  const result = JSON.parse(text);
  let at = 0;
  function space() { while (/\s/.test(text[at] || '') && at < text.length) at++; }
  function string() {
    const start = at++;
    while (at < text.length) {
      const char = text[at++];
      if (char === '\\') at++;
      else if (char === '"') return JSON.parse(text.slice(start, at));
    }
    throw new SyntaxError('Unterminated JSON string');
  }
  function value(depth) {
    if (depth > 64) throw new SyntaxError('JSON nesting is too deep');
    space();
    if (text[at] === '"') { string(); return; }
    if (text[at] === '{') {
      at++; space();
      const keys = new Set();
      if (text[at] === '}') { at++; return; }
      for (;;) {
        space(); const key = string();
        if (keys.has(key)) throw new SyntaxError('Duplicate JSON key');
        keys.add(key); space(); at++; value(depth + 1); space();
        if (text[at++] === '}') return;
      }
    }
    if (text[at] === '[') {
      at++; space();
      if (text[at] === ']') { at++; return; }
      for (;;) { value(depth + 1); space(); if (text[at++] === ']') return; }
    }
    while (at < text.length && !/[\s,}\]]/.test(text[at])) at++;
  }
  value(0);
  return result;
}

module.exports = { parse };
