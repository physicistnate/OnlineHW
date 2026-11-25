/**
 * Every allowed combination of given data for every question (a seeded sample for
 * very large grids; see helpers.ts). Checks that answers are finite and inside their
 * accepted ranges, that positive quantities are positive, that zero answers are a
 * clean 0, that alternative methods agree at full precision, that MCQs have one
 * correct and no duplicate options, that graph points sit on the grid, and that a
 * worked solution's displayed working (intermediate values with a guard digit)
 * reproduces its displayed answer, typed the ways a student would type it.
 */
import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS } from '../src/content/registry';
import { answerRanges, computeAnswerRanges, computeDisplayPath } from '../src/engine/calc';
import { buildInstance } from '../src/engine/instance';
import { checkNumeric, rangesOf } from '../src/engine/grading';
import { exponentOf, fmtA, roundSig } from '../src/engine/numbers';
import type { ParamSpecs } from '../src/engine/params';
import { EXHAUSTIVE_LIMIT, SAMPLE_SIZE, combosToCheck, everyCombo, gridSize, sampleCombos, typedForms } from './helpers';

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

describe('combinations of given data', () => {
  const specs: ParamSpecs = {
    a: { min: 1, max: 3, step: 1, base: 1 },
    b: { choices: ['x', 'y'], base: 'x' },
  };
  it('walks every combination one at a time', () => {
    const all = [...everyCombo(specs)];
    expect(all).toHaveLength(gridSize(specs));
    expect(new Set(all.map((c) => JSON.stringify(c))).size).toBe(6);
  });
  it('samples a huge grid instead of building it, including the corners', () => {
    const huge: ParamSpecs = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`p${i}`, { min: 0, max: 99, step: 1, base: 0 }]));
    expect(gridSize(huge)).toBe(1e16);
    const start = Date.now();
    const sample = sampleCombos(huge, SAMPLE_SIZE);
    expect(Date.now() - start).toBeLessThan(2000);
    expect(sample.length).toBe(256 + SAMPLE_SIZE);
    expect(sample[0]).toEqual(Object.fromEntries(Object.keys(huge).map((k) => [k, 0])));
    expect(sample[255]).toEqual(Object.fromEntries(Object.keys(huge).map((k) => [k, 99])));
    expect(sampleCombos(huge, 10)).toEqual(sampleCombos(huge, 10)); // seeded: the same every run
    expect([...combosToCheck(huge)].length).toBe(256 + SAMPLE_SIZE);
    expect(gridSize(specs)).toBeLessThanOrEqual(EXHAUSTIVE_LIMIT);
  });
});

describe.each(ALL_QUESTIONS.map((t) => [t.id, t] as const))('%s', (_id, t) => {
  it('is valid for every allowed combination of given data', () => {
    let checked = 0;
    for (const p of combosToCheck(t.params as ParamSpecs)) {
      if (t.constraint && !t.constraint(p as never)) continue;
      checked++;
      const inst = buildInstance(t, p);
      const report = computeAnswerRanges(t.compute, p, t.style);
      const shown = computeDisplayPath(t.compute, p, t.style);
      for (const part of inst.parts) {
        const r = part.response;
        const at = `${t.id} ${JSON.stringify(p)} ${part.label || 'main'}`;
        const shownText = [...part.solution.flatMap((s) => [s.text, s.math]), ...part.markscheme.map((l) => ('mark' in l ? l.mark : l.note))];
        const bad = shownText.flatMap(arithmeticErrors);
        expect(bad, `${at}: displayed arithmetic does not add up`).toEqual([]);
        switch (r.kind) {
          case 'numeric': {
            const { exact, lo, hi } = r.range;
            expect(Number.isFinite(exact), `${at}: answer not finite`).toBe(true);
            expect(lo <= exact && exact <= hi, `${at}: answer outside its range`).toBe(true);
            if (r.positive) expect(exact > 0, `${at}: positive quantity is not positive`).toBe(true);
            // A zero answer must be a clean 0, not floating-point noise such as 1e-15
            // (which would be shown as "1.11 × 10^-15"): use snapZero() in compute().
            expect(exact === 0 || Math.abs(exact) > 1e-9 * Math.max(Math.abs(lo), Math.abs(hi)), `${at}: answer ${exact} looks like rounding noise around zero`).toBe(true);
            // Alternative methods are other routes to the same quantity: at full precision they must agree.
            for (const alt of answerRanges(report, r.answer).slice(1)) {
              expect(Math.abs(alt.exact - exact) <= 1e-9 * Math.max(Math.abs(exact), Math.abs(alt.exact)), `${at}: an alternative method gives ${alt.exact}, not ${exact}`).toBe(true);
            }
            // The worked solution shows the answer its displayed working produces; that
            // answer, typed in any of the usual ways, must be accepted by the grader.
            for (const typed of typedForms(fmtA(shown[r.answer]))) {
              expect(checkNumeric(typed, rangesOf(r), { unit: r.unit }).status, `${at}: the worked solution's own answer, typed "${typed}", would be marked wrong`).toBe('correct');
            }
            // And it differs from the full-precision answer by at most one in the last digit.
            expect(Math.abs(roundSig(shown[r.answer], 3) - roundSig(exact, 3)) <= 1.0001 * 10 ** (exponentOf(exact) - 2), `${at}: displayed answer drifts`).toBe(true);
            break;
          }
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
    expect(checked, 'no combination of given data satisfies the constraint').toBeGreaterThan(0);
  });
});
