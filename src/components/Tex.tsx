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

/** Renders question text: $inline$, $$display$$, **bold**, blank-line paragraphs. */
export function renderTex(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((para) =>
      splitMath(para)
        .map((seg) => (seg.type === 'text' ? formatText(seg.value) : renderMath(seg.value, seg.display)))
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

/** Display-mode maths (no $ delimiters needed). */
export function MathBlock({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(() => renderMath(tex, true), [tex]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
