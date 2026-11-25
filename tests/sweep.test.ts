/**
 * Every allowed combination of given data for every question (not a sample).
 * Checks that answers are finite and inside their accepted ranges, that positive
 * quantities are positive, that MCQs have one correct and no duplicate options,
 * that graph points sit on the grid, and that a worked solution's displayed
 * working (intermediate values with a guard digit) reproduces its displayed answer.
 */
import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS } from '../src/content/registry';
import { computeDisplayPath } from '../src/engine/calc';
import { buildInstance } from '../src/engine/instance';
import { checkNumeric } from '../src/engine/grading';
import { exponentOf, fmtA, roundSig } from '../src/engine/numbers';
import { isChoice, rangeValues, type ParamSpecs } from '../src/engine/params';

/**
 * Finds displayed arithmetic such as "14 + 33.33 = 47.3" or "2 \times 100.6 = 201.2"
 * (sums and products of plain numbers) and checks that the left side really gives
 * the right side at the precision shown. Covers text as well as maths, including
 * the explanations of written-answer parts.
 */
const NUM = String.raw`\d+(?:\.\d+)?`;
const CHAIN = new RegExp(String.raw`(?<![\w.^{}\\-])(${NUM}(?:\s*(?:\+|\\times)\s*${NUM})+)\s*=\s*(${NUM})(?![\d.^]|\s*\\times)`, 'g');

export function arithmeticErrors(text: string | undefined): string[] {
  if (!text) return [];
  const errors: string[] = [];
  for (const m of text.matchAll(CHAIN)) {
    const lhs = m[1]
      .split('+')
      .map((term) => term.split('\\times').reduce((prod, x) => prod * Number(x.trim()), 1))
      .reduce((a, b) => a + b, 0);
    const decimals = m[2].split('.')[1]?.length ?? 0;
    if (Math.abs(lhs - Number(m[2])) > 0.5 * 10 ** -decimals + 1e-9 * Math.max(1, Math.abs(lhs))) {
      errors.push(`"${m[0]}" (the left side is ${lhs})`);
    }
  }
  return errors;
}

function allCombos(specs: ParamSpecs): Record<string, number | string>[] {
  let combos: Record<string, number | string>[] = [{}];
  for (const [name, spec] of Object.entries(specs)) {
    const values: (number | string)[] = isChoice(spec) ? [...spec.choices] : rangeValues(spec);
    combos = combos.flatMap((c) => values.map((v) => ({ ...c, [name]: v })));
  }
  return combos;
}

describe('displayed-arithmetic checker', () => {
  it('catches a wrong equality and accepts correct ones', () => {
    expect(arithmeticErrors('less than double ($2 \\times 100.6 = 201.3$ m)')).toHaveLength(1); // 2 × 100.6 = 201.2
    expect(arithmeticErrors('s = s_1 + s_2 = 14 + 33.33 = 47.3\\ \\mathrm{m}')).toEqual([]);
    expect(arithmeticErrors('v = u + at = 0 + 1.0 \\times 3.0 = 3.0')).toEqual([]);
    expect(arithmeticErrors('t = \\frac{2 \\times 400}{4.0 + 20} = 33.3')).toEqual([]); // fractions are skipped
  });

  it('finds equalities to check in the real questions', () => {
    let found = 0;
    for (const t of ALL_QUESTIONS) {
      const inst = buildInstance(t, Object.fromEntries(Object.entries(t.params as ParamSpecs).map(([k, s]) => [k, s.base])));
      for (const part of inst.parts) for (const s of part.solution) found += [...`${s.text ?? ''} ${s.math ?? ''}`.matchAll(CHAIN)].length;
    }
    expect(found).toBeGreaterThan(5);
  });
});

describe.each(ALL_QUESTIONS.map((t) => [t.id, t] as const))('%s', (_id, t) => {
  it('is valid for every allowed combination of given data', () => {
    const combos = allCombos(t.params as ParamSpecs).filter((p) => !t.constraint || t.constraint(p as never));
    expect(combos.length).toBeGreaterThan(0);

    for (const p of combos) {
      const inst = buildInstance(t, p);
      const shown = computeDisplayPath(t.compute, p, t.style);
      for (const part of inst.parts) {
        const r = part.response;
        const at = `${t.id} ${JSON.stringify(p)} ${part.label || 'main'}`;
        const shownText = [...part.solution.flatMap((s) => [s.text, s.math]), ...part.markscheme.map((l) => ('mark' in l ? l.mark : l.note))];
        const bad = shownText.flatMap(arithmeticErrors);
        expect(bad, `${at}: displayed arithmetic does not add up`).toEqual([]);
        switch (r.kind) {
          case 'numeric':
            expect(Number.isFinite(r.range.exact), `${at}: answer not finite`).toBe(true);
            expect(r.range.lo <= r.range.exact && r.range.exact <= r.range.hi, `${at}: answer outside its range`).toBe(true);
            if (r.positive) expect(r.range.exact > 0, `${at}: positive quantity is not positive`).toBe(true);
            // The worked solution shows the answer its displayed working produces;
            // that answer, as displayed, must be accepted by the grader.
            expect(checkNumeric(fmtA(shown[r.answer]), r.range, { unit: r.unit }).status, `${at}: the worked solution's own answer (${fmtA(shown[r.answer])}) would be marked wrong`).toBe('correct');
            // And it differs from the full-precision answer by at most one in the last digit.
            expect(Math.abs(roundSig(shown[r.answer], 3) - roundSig(r.range.exact, 3)) <= 1.0001 * 10 ** (exponentOf(r.range.exact) - 2), `${at}: displayed answer drifts`).toBe(true);
            break;
          case 'mcq': {
            expect(r.options.filter((o) => o.correct).length, `${at}: one correct option`).toBe(1);
            const texts = r.options.map((o) => o.text ?? (o.cells ?? []).join('|'));
            expect(new Set(texts).size, `${at}: duplicate options ${JSON.stringify(texts)}`).toBe(texts.length);
            break;
          }
          case 'graph':
            for (const [x, y] of r.expected) {
              expect(x >= r.axes.x.min && x <= r.axes.x.max && y >= r.axes.y.min && y <= r.axes.y.max, `${at}: point off the axes`).toBe(true);
              expect(Math.abs(y / r.snap.y - Math.round(y / r.snap.y)) < 1e-9 && Math.abs(x / r.snap.x - Math.round(x / r.snap.x)) < 1e-9, `${at}: point off the grid`).toBe(true);
            }
            break;
          case 'text':
            break;
        }
      }
    }
  });
});
