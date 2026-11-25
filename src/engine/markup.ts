/**
 * Question text format: plain text with $inline maths$, $$display maths$$,
 * **bold**, and blank lines between paragraphs. Shared by the renderer and the tests.
 */

export type Segment = { type: 'text'; value: string } | { type: 'math'; value: string; display: boolean };

export function splitMath(text: string): Segment[] {
  const out: Segment[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: 'math', value: m[1], display: true });
    else out.push({ type: 'math', value: m[2], display: false });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) });
  return out;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escapes text and applies **bold** and line breaks. */
export function formatText(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}
