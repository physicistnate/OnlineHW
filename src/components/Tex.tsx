import katex from 'katex';
import { useMemo } from 'react';
import { formatText, splitMath } from '../engine/markup';

const cache = new Map<string, string>();

function renderMath(tex: string, display: boolean): string {
  const key = `${display ? 'D' : 'I'}${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore' });
    cache.set(key, html);
  }
  return html;
}

/** Commands that a line may break before: relations, binary operators and wide spaces. */
const BREAK_BEFORE = new Set(['approx', 'Rightarrow', 'le', 'leq', 'ge', 'geq', 'times', 'cdot', 'div', 'pm', 'quad', 'qquad']);

/**
 * Splits maths where a line may break, as TeX allows in running text: before top-level
 * relations (=, <, >, \approx, \Rightarrow, …), binary operators (+, binary −, \times,
 * \cdot) and wide spaces, and after commas. Never inside braces, \left…\right or an
 * environment, and never between a sign and its number.
 */
export function splitAtRelations(tex: string): string[] {
  const pieces: string[] = [];
  let depth = 0;
  let start = 0;
  const cut = (at: number) => {
    if (tex.slice(start, at).trim()) {
      pieces.push(tex.slice(start, at));
      start = at;
    }
  };
  /** The last character before `at` that is not a space, within the current piece. */
  const before = (at: number) => tex.slice(start, at).trimEnd().slice(-1);
  for (let i = 0; i < tex.length; i++) {
    const ch = tex[i];
    if (ch === '\\') {
      const name = /^\\([a-zA-Z]+)/.exec(tex.slice(i))?.[1];
      if (!name) {
        i++; // an escaped character such as \{ or \,
        continue;
      }
      if (name === 'left' || name === 'begin') depth++;
      else if (name === 'right' || name === 'end') depth--;
      else if (depth === 0 && BREAK_BEFORE.has(name)) cut(i);
      i += name.length;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth !== 0) continue;
    else if (ch === '=' || ch === '<' || ch === '>') cut(i);
    else if ((ch === '+' || ch === '-') && before(i) !== '' && !'=<>(+-[{,^_\\'.includes(before(i))) cut(i); // binary, not a sign
    else if (ch === ',') cut(i + 1);
  }
  if (tex.slice(start).trim()) pieces.push(tex.slice(start));
  return pieces.length > 0 ? pieces : [tex];
}

/**
 * Display maths that wraps: each piece is typeset at display size and the pieces flow
 * like words, so a long line of working continues on the next line instead of running
 * past the edge of its box (on screen or on paper). Every piece after the first starts
 * with an empty group, so TeX spaces its leading relation or operator as usual.
 */
function renderFlow(tex: string, centered: boolean): string {
  const key = `F${centered ? 'C' : 'L'}${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    const pieces = splitAtRelations(tex).map((piece, i) => `<span class="eq-piece">${renderMath(`\\displaystyle ${i > 0 ? '{}' : ''}${piece}`, false)}</span>`);
    html = `<span class="eq-flow${centered ? ' is-centered' : ''}">${pieces.join('')}</span>`;
    cache.set(key, html);
  }
  return html;
}

/** Renders question text: $inline$, $$display$$ (wrapping at relations), **bold**, blank-line paragraphs. */
export function renderTex(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((para) =>
      splitMath(para)
        .map((seg) => (seg.type === 'text' ? formatText(seg.value) : seg.display ? renderFlow(seg.value, true) : renderMath(seg.value, false)))
        .join(''),
    )
    .join('<span class="para-gap"></span>');
}

interface TexProps {
  text: string;
  className?: string;
  block?: boolean;
}

export function Tex({ text, className, block }: TexProps) {
  const html = useMemo(() => renderTex(text), [text]);
  return block ? (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** A line of working (no $ delimiters needed): display-size maths that wraps at relations. */
export function MathBlock({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(() => renderFlow(tex, false), [tex]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
