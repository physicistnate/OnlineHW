import { describe, expect, it } from 'vitest';
import { computeAnswerRanges } from '../src/engine/calc';
import { checkNumeric, gradePart } from '../src/engine/grading';
import { instantiate } from '../src/engine/instance';
import { getQuestion } from '../src/content/registry';
import type { AnswerRange, PartResponse } from '../src/engine/types';

const range = (exact: number, lo: number, hi: number): AnswerRange => ({ exact, lo, hi });

describe('accepting typed answers (cell rule)', () => {
  // Accepted range 13.7 – 13.9 (e.g. from intermediate rounding).
  const r = range(13.81, 13.7, 13.9);

  it.each(['13.8', '13.81', '13.808', '13.75', '14', '1.38e1', '13.8 m'])('accepts %s', (s) => {
    expect(checkNumeric(s, r).status).toBe('correct');
  });

  it.each(['13.5', '13.6', '13.95', '10', '15'])('rejects %s', (s) => {
    expect(checkNumeric(s, r).status).toBe('incorrect');
  });

  it('reads 1-s.f. answers as at least 2 s.f.', () => {
    // 0.5 is treated as 0.50, so it is not accepted for 0.48.
    expect(checkNumeric('0.5', range(0.48, 0.4776, 0.4824)).status).toBe('incorrect');
    expect(checkNumeric('0.48', range(0.48, 0.4776, 0.4824)).status).toBe('correct');
  });

  it('gives hints for a wrong sign and a power-of-ten slip', () => {
    const v = checkNumeric('-13.8', r);
    expect(v.status === 'incorrect' && v.hint).toMatch(/sign/);
    const w = checkNumeric('1380', r);
    expect(w.status === 'incorrect' && w.hint).toMatch(/power of ten/);
  });

  it('reports unreadable input as invalid, not wrong', () => {
    expect(checkNumeric('twelve', r).status).toBe('invalid');
  });
});

describe('rounding analysis', () => {
  it('widens a two-step answer to cover rounded intermediate values', () => {
    // t = (v - u) / a with a carried. a = 0.4625 exactly; 2 s.f. carry gives 0.46.
    const compute = (p: { u: number; v: number; s: number }, c: { carry: (x: number, n?: string) => number }) => {
      const a = (p.v ** 2 - p.u ** 2) / (2 * p.s);
      return { a, t: (p.v - p.u) / c.carry(a, 'a') };
    };
    const rep = computeAnswerRanges(compute, { u: 5, v: 20, s: 405.4054054054054 }, 'IB');
    expect(rep.carries).toBe(1);
    expect(rep.runs).toBe(3); // exact, 3 s.f., 2 s.f.
    // Carrying a = 0.46 (2 s.f.) gives t = 15 / 0.46, above the exact 32.43 s.
    expect(rep.ranges.t.max).toBeCloseTo(15 / 0.46, 10);
    expect(rep.ranges.t.min).toBeLessThanOrEqual(rep.ranges.t.exact);
    expect(rep.ranges.a.min).toBe(rep.ranges.a.max); // a itself is never rounded
  });

  it('includes every accepted value of g', () => {
    const rep = computeAnswerRanges((p: { h: number }, c) => ({ v: Math.sqrt(2 * c.g * p.h) }), { h: 20 }, 'IB');
    expect(rep.ranges.v.min).toBeCloseTo(Math.sqrt(2 * 9.8 * 20), 10);
    expect(rep.ranges.v.max).toBeCloseTo(Math.sqrt(2 * 9.81 * 20), 10);
  });
});

describe('error carried forward', () => {
  const t = getQuestion('ibp-a1-train-acceleration')!;
  const inst = instantiate(t, null); // base: u = 4.0, v = 20, s = 400 -> a = 0.48, t = 33.3
  const [partA, partB] = inst.parts;

  it('marks (b) correct when it follows correctly from a wrong (a)', () => {
    const responses: Record<string, PartResponse> = {
      a: { kind: 'numeric', value: '0.5' }, // wrong
      b: { kind: 'numeric', value: '32' }, // (20 - 4.0) / 0.5 = 32
    };
    expect(gradePart(t, inst, partA, responses).status).toBe('incorrect');
    const b = gradePart(t, inst, partB, responses);
    expect(b.status).toBe('correct');
    expect(b.ecf).toBe(true);
  });

  it('does not rescue a (b) that is wrong either way', () => {
    const responses: Record<string, PartResponse> = {
      a: { kind: 'numeric', value: '0.5' },
      b: { kind: 'numeric', value: '40' },
    };
    expect(gradePart(t, inst, partB, responses).status).toBe('incorrect');
  });

  it('marks the base version correctly', () => {
    expect(inst.results.a).toBeCloseTo(0.48, 10);
    expect(inst.results.t).toBeCloseTo(33.333, 2);
    const responses: Record<string, PartResponse> = { a: { kind: 'numeric', value: '0.48' }, b: { kind: 'numeric', value: '33.3' } };
    expect(gradePart(t, inst, partA, responses).status).toBe('correct');
    expect(gradePart(t, inst, partB, responses).status).toBe('correct');
  });
});
