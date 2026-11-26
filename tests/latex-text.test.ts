/**
 * Every piece of question text, for current and archived questions (base and many
 * student versions): no control characters, and no LaTeX command that lost its
 * backslash. A nested template string inside tex`...` is not raw, so "\times" there
 * becomes a tab followed by "imes", and "\sqrt" becomes "sqrt": KaTeX renders both
 * without an error ("4imes0.5"), so the KaTeX check in templates.test.ts cannot see them.
 */
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { splitAtRelations } from '../src/components/Tex';
import { ARCHIVED_REVISIONS } from '../src/content/archive';
import { ALL_QUESTIONS } from '../src/content/registry';
import { instantiate, seedFor } from '../src/engine/instance';
import { splitMath } from '../src/engine/markup';
import type { AnyTemplate, QuestionInstance } from '../src/engine/types';

/** Command names long or distinctive enough never to be plain letters in maths. */
const COMMANDS = [
  'times', 'frac', 'dfrac', 'tfrac', 'sqrt', 'cdot', 'left', 'right', 'mathrm', 'text', 'quad', 'qquad', 'approx', 'lambda', 'theta',
  'Delta', 'alpha', 'beta', 'gamma', 'sigma', 'varepsilon', 'epsilon', 'omega', 'Omega', 'infty', 'Rightarrow', 'odot', 'binom', 'propto',
  'circ', 'mathbf', 'operatorname', 'begin', 'end', 'array', 'hline', 'big', 'Big', 'displaystyle', 'leq', 'geq', 'neq', 'pm', 'mp',
  'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'exp', 'int', 'sum', 'prod', 'lim', 'rho', 'mu', 'nu', 'tau', 'phi', 'Phi', 'pi',
  'imes', 'rac', 'heta', 'ight', 'arepsilon', // what is left when \t, \f, \r or \v becomes a control character
];
const BARE = new RegExp(`(?<![\\\\a-zA-Z])(${COMMANDS.join('|')})(?![a-zA-Z])`);

/** Maths with the contents of \text{…}, \mathrm{…} and \operatorname{…} removed (plain words may be there). */
function mathOnly(math: string): string {
  return math.replace(/\\(?:text|mathrm|operatorname|textbf|mathbf)\{[^{}]*\}/g, '').replace(/\\(?:begin|end)\{[a-zA-Z*]+\}/g, '');
}

/** Problems in one string: control characters anywhere (newlines are allowed in text), and bare command names in maths. */
export function latexTextProblems(text: string | undefined, isMath = false): string[] {
  if (!text) return [];
  const out: string[] = [];
  const control = isMath ? /[\u0000-\u001F]/ : /[\u0000-\u0009\u000B-\u001F]/;
  const c = text.match(control);
  if (c) out.push(`control character U+${c[0].charCodeAt(0).toString(16).padStart(4, '0')} near "${text.slice(Math.max(0, c.index! - 15), c.index! + 15)}"`);
  const segments = isMath ? [text] : splitMath(text).filter((s) => s.type === 'math').map((s) => s.value);
  for (const seg of segments) {
    if (/[\n\r]/.test(seg)) out.push(`line break inside maths "${seg.slice(0, 40)}"`);
    const m = mathOnly(seg).match(BARE);
    if (m) out.push(`"${m[1]}" without a backslash in "${seg.slice(Math.max(0, m.index! - 20), m.index! + 25)}"`);
    // A lost "\," leaves "{,"; an unescaped "%" starts a comment and hides the rest of the maths.
    if (/\{,/.test(seg)) out.push(`"{," (a thin space that lost its backslash?) in "${seg.slice(0, 50)}"`);
    if (/(?<!\\)%/.test(seg)) out.push(`unescaped % in "${seg.slice(0, 50)}"`);
  }
  return out;
}

function instanceProblems(inst: QuestionInstance): string[] {
  const out: string[] = [];
  const add = (where: string, text: string | undefined, isMath = false) => latexTextProblems(text, isMath).forEach((p) => out.push(`${where}: ${p}`));
  add('stem', inst.stem);
  inst.extensions.forEach((x, i) => {
    add(`extension ${i + 1}`, x.prompt);
    x.markscheme.forEach((l) => add(`extension ${i + 1} key`, 'mark' in l ? l.mark : l.note));
  });
  for (const part of inst.parts) {
    const at = part.label || 'main';
    add(`${at} prompt`, part.prompt);
    if (part.response.kind === 'mcq') {
      for (const o of part.response.options) {
        add(`${at} option ${o.letter}`, o.text);
        (o.cells ?? []).forEach((cell) => add(`${at} option ${o.letter}`, cell));
      }
    }
    for (const step of part.solution) {
      add(`${at} solution`, step.text);
      add(`${at} solution`, step.math, true);
    }
    part.markscheme.forEach((l) => add(`${at} key`, 'mark' in l ? l.mark : l.note));
  }
  return out;
}

describe('the checker', () => {
  it('finds tabs from \\times, bare command names and line breaks in maths', () => {
    expect(latexTextProblems('$4 \times 0.5 = 2$')).toHaveLength(2); // a tab, then "imes"
    expect(latexTextProblems('$sqrt{2}$')).toHaveLength(1);
    expect(latexTextProblems('E = \\frac{1}{2}mv^2', true)).toEqual([]);
    expect(latexTextProblems('$v = \\sqrt{2gh}$, and the text says "times" out loud.')).toEqual([]);
    expect(latexTextProblems('$\\text{per time} = 3$')).toEqual([]);
    expect(latexTextProblems('A table:\n$$x$$')).toEqual([]);
  });
});

/** Display maths in an instance: lines of working and $$…$$ in any text. */
function displayMaths(inst: QuestionInstance): string[] {
  const texts = [inst.stem, ...inst.parts.flatMap((p) => [p.prompt, ...p.solution.map((s) => s.text)])];
  const fromText = texts.flatMap((t) => (t ? splitMath(t).filter((s) => s.type === 'math' && s.display).map((s) => s.value) : []));
  return [...fromText, ...inst.parts.flatMap((p) => p.solution.flatMap((s) => (s.math ? [s.math] : [])))];
}

describe('wrapping display maths', () => {
  it('splits at relations, operators and commas, but not inside groups or before a sign', () => {
    expect(splitAtRelations('a = b + c \\times d')).toEqual(['a ', '= b ', '+ c ', '\\times d']);
    expect(splitAtRelations('x = -3, y = \\frac{1 + 2}{3 - 4}')).toEqual(['x ', '= -3,', ' y ', '= \\frac{1 + 2}{3 - 4}']);
    expect(splitAtRelations('E = \\left(1 - e^{-x}\\right) \\approx x')).toEqual(['E ', '= \\left(1 - e^{-x}\\right) ', '\\approx x']);
    expect(splitAtRelations('\\begin{array}{c} a = b \\end{array}')).toEqual(['\\begin{array}{c} a = b \\end{array}']);
  });

  it('every piece of every display formula in the bank typesets on its own', () => {
    const problems: string[] = [];
    for (const t of [...ALL_QUESTIONS, ...ARCHIVED_REVISIONS]) {
      for (const math of displayMaths(instantiate(t, null))) {
        splitAtRelations(math).forEach((piece, i) => {
          try {
            katex.renderToString(`\\displaystyle ${i > 0 ? '{}' : ''}${piece}`, { throwOnError: true, strict: 'ignore' });
          } catch (e) {
            problems.push(`${t.id}: "${piece}" (${(e as Error).message.slice(0, 60)})`);
          }
        });
      }
    }
    expect(problems).toEqual([]);
  });
});

const versions = (t: AnyTemplate) => [null, ...Array.from({ length: 12 }, (_, i) => seedFor(`LATEX:student${i}`, 'hw', t.id))];

describe.each([...ALL_QUESTIONS, ...ARCHIVED_REVISIONS].map((t) => [`${t.id}@v${t.version}${t.build ? `#${t.build}` : ''}`, t] as const))('%s', (_id, t) => {
  it('has no broken LaTeX in any text', () => {
    const problems = new Set<string>();
    for (const seed of versions(t)) for (const p of instanceProblems(instantiate(t, seed))) problems.add(p);
    expect([...problems]).toEqual([]);
  });
});
