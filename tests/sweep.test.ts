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
 * Finds displayed arithmetic such as "14 + 33.33 = 47.3", "2 \times 100.6 = 201.2",
 * "\tfrac{1}{2} \times 5.4 \times 0.8333^2 = 1.87" or "9.8 + 1.5 = 11.3" (sums and
 * products of plain numbers, squares and numeric fractions) and checks that the left
 * side really gives the right side at the precision shown. Covers text as well as
 * maths. Expressions inside other fractions or roots are skipped.
 */
const NUM = String.raw`\d+(?:\.\d+)?`;
const SQ = String.raw`(?:\^2|\^\{(?:\\,)?2\})`;
const FRAC = String.raw`\\[td]?frac\{${NUM}\}\{${NUM}\}`;
const FACTOR = String.raw`(?:${FRAC}|${NUM}(?:${SQ})?)`;
const TERM = String.raw`${FACTOR}(?:\s*\\times\s*${FACTOR})*`;
const CHAIN = new RegExp(String.raw`(?<![\w.^{}\\-])(${TERM}(?:\s*\+\s*${TERM})*)\s*=\s*(${NUM})(?![\d.^]|\s*\\times)`, 'g');

function factorValue(f: string): number {
  const frac = f.match(/^\\[td]?frac\{([\d.]+)\}\{([\d.]+)\}$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const square = f.match(/^([\d.]+)(?:\^2|\^\{(?:\\,)?2\})$/);
  if (square) return Number(square[1]) ** 2;
  return Number(f);
}

export function arithmeticErrors(text: string | undefined): string[] {
  if (!text) return [];
  const errors: string[] = [];
  for (const m of text.matchAll(CHAIN)) {
    if (!/\\times|\+|\^|frac/.test(m[1])) continue; // a lone number, not a calculation
    const lhs = m[1]
      .split('+')
      .map((term) => term.split('\\times').reduce((prod, f) => prod * factorValue(f.trim()), 1))
      .reduce((a, b) => a + b, 0);
    const rhs = m[2];
    const decimals = rhs.split('.')[1]?.length ?? 0;
    // A whole number ending in zeros may be rounded to its last non-zero digit (4500 for 4503).
    const trailingZeros = decimals === 0 ? (rhs.match(/0+$/)?.[0].length ?? 0) : 0;
    const tol = 0.5 * 10 ** (trailingZeros - decimals) + 1e-9 * Math.max(1, Math.abs(lhs));
    if (Math.abs(lhs - Number(rhs)) > tol) errors.push(`"${m[0]}" (the left side is ${lhs})`);
  }
  return errors;
}

describe('displayed-arithmetic checker', () => {
  it('catches a wrong equality and accepts correct ones', () => {
    expect(arithmeticErrors('less than double ($2 \\times 100.6 = 201.3$ m)')).toHaveLength(1); // 2 × 100.6 = 201.2
    expect(arithmeticErrors('s = s_1 + s_2 = 14 + 33.33 = 47.3\\ \\mathrm{m}')).toEqual([]);
    expect(arithmeticErrors('v = u + at = 0 + 1.0 \\times 3.0 = 3.0')).toEqual([]);
    expect(arithmeticErrors('t = \\frac{2 \\times 400}{4.0 + 20} = 33.3')).toEqual([]); // fractions with working inside are skipped
  });

  it('checks squares and numeric fractions too', () => {
    // The explosion slip from review 4: ½ × 5.4 × 0.8333² is 1.875, which shows as 1.87, not 1.88.
    expect(arithmeticErrors('E_k = \\tfrac{1}{2} \\times 5.4 \\times 0.8333^2 = 1.88\\ \\mathrm{J}')).toHaveLength(1);
    expect(arithmeticErrors('E_k = \\tfrac{1}{2} \\times 5.4 \\times 0.8333^2 = 1.87\\ \\mathrm{J}')).toEqual([]);
    expect(arithmeticErrors('E_k = \\tfrac{1}{2} \\times 2 \\times 0.6^{2} = 0.36')).toEqual([]);
    expect(arithmeticErrors('a = \\frac{15^2}{60} = 3.75')).toEqual([]); // inside a fraction: skipped
    expect(arithmeticErrors('v = \\sqrt{12.0^2 + 29.69^2} = 32.0')).toEqual([]); // inside a root: skipped
    expect(arithmeticErrors('F = 1550 \\times 6.667 = 10300')).toEqual([]); // a whole number rounded to 3 s.f.
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
  }, 60_000); // up to 20,000 combinations, each with its full rounding analysis
});
