/**
 * Source check: no string or template in the site's code has a lone backslash before a
 * letter or LaTeX punctuation, unless the template is raw (tagged tex`…`). In an ordinary
 * string, "\times" is a tab and "imes", "\frac" a form feed and "rac", and "\sqrt" just
 * "sqrt". Nested templates inside tex`…${ … }…` are ordinary templates, so
 * `${v} \times ${p}` there is broken: write tex`${v} \times ${p}` (or "\\times").
 * latex-text.test.ts checks the rendered questions; this finds the cause in any file.
 */
import { describe, expect, it } from 'vitest';

const SOURCES = import.meta.glob('../src/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Escapes that are fine in ordinary strings: \n, quotes, \$, \\ and \u. */
const OK_AFTER = new Set(['n', "'", '"', '`', '$', '\\', 'u']);
const SUSPECT = /[A-Za-z,;!%{} ]/;

/** Lone backslashes in non-raw strings and templates: [line, snippet] for each. */
export function loneBackslashes(src: string): [number, string][] {
  const found: [number, string][] = [];
  const report = (pos: number) => found.push([src.slice(0, pos).split('\n').length, src.slice(pos, pos + 30).split('\n')[0]]);
  const suspect = (next: string) => !OK_AFTER.has(next) && SUSPECT.test(next || 'x');
  // Contexts: code (with brace depth, to find the end of a ${…}) or a template (raw or not).
  const stack: ({ kind: 'code'; depth: number } | { kind: 'tpl'; raw: boolean })[] = [{ kind: 'code', depth: 0 }];
  let prev = ''; // last significant token in code, to tell a regex from a division
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ctx = stack[stack.length - 1];
    const ch = src[i];
    if (ctx.kind === 'tpl') {
      if (ch === '\\') {
        if (!ctx.raw && suspect(src[i + 1] ?? '')) report(i);
        i += 2;
      } else if (ch === '`') {
        stack.pop();
        prev = 'x';
        i++;
      } else if (src.startsWith('${', i)) {
        stack.push({ kind: 'code', depth: 0 });
        prev = '';
        i += 2;
      } else i++;
      continue;
    }
    if (src.startsWith('//', i)) {
      const j = src.indexOf('\n', i);
      i = j < 0 ? n : j;
      continue;
    }
    if (src.startsWith('/*', i)) {
      const j = src.indexOf('*/', i + 2);
      i = j < 0 ? n : j + 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < n && src[j] !== ch && src[j] !== '\n') {
        if (src[j] === '\\') {
          if (suspect(src[j + 1] ?? '')) report(j);
          j += 2;
        } else j++;
      }
      i = j + 1;
      prev = 'x';
      continue;
    }
    if (ch === '/' && ['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', 'return'].includes(prev)) {
      // A regular expression literal: skip it (backslashes are meant there).
      let j = i + 1;
      let inClass = false;
      while (j < n && src[j] !== '\n') {
        const c = src[j];
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) break;
        j++;
      }
      i = j + 1;
      prev = 'x';
      continue;
    }
    if (ch === '`') {
      stack.push({ kind: 'tpl', raw: src.slice(Math.max(0, i - 3), i) === 'tex' || src.slice(Math.max(0, i - 10), i) === 'String.raw' });
      i++;
      continue;
    }
    if (ch === '{') ctx.depth++;
    else if (ch === '}') {
      if (ctx.depth === 0 && stack.length > 1) {
        stack.pop(); // the end of ${…}: back inside the template
        i++;
        continue;
      }
      ctx.depth--;
    }
    if (!/\s/.test(ch)) {
      if (src.startsWith('return', i) && !/[\w$]/.test(src[i + 6] ?? '')) {
        prev = 'return';
        i += 6;
        continue;
      }
      prev = /[\w$]/.test(ch) ? 'x' : ch;
    }
    i++;
  }
  return found;
}

describe('the scanner', () => {
  it('finds \\times in a nested template and \\tfrac in a quoted string, and nothing in raw or doubled ones', () => {
    expect(loneBackslashes('const a = tex`E = ${xs.map((v) => `${v} \\times 2`).join(" + ")}`;')).toHaveLength(1);
    expect(loneBackslashes("const b = 'energy $\\tfrac{1}{2}mv^2$';")).toHaveLength(1);
    expect(loneBackslashes('const c = tex`E = ${xs.map((v) => tex`${v} \\times 2`).join(" + ")} \\quad x`;')).toEqual([]);
    expect(loneBackslashes("const d = 'energy $\\\\tfrac{1}{2}$\\n'; const r = /\\d+\\s/g;")).toEqual([]);
  });
});

describe('site source', () => {
  it('has no lone backslash in an ordinary string or template', () => {
    const problems = Object.entries(SOURCES).flatMap(([file, src]) => loneBackslashes(src).map(([line, snippet]) => `${file.replace('../', '')}:${line}: ${snippet}`));
    expect(problems).toEqual([]);
  });
});
