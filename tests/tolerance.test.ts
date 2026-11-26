import { describe, expect, it } from 'vitest';
import { computeAnswerRanges, padRange } from '../src/engine/calc';
import { checkNumeric, gradePart, markGraph, remarkLaterParts } from '../src/engine/grading';
import { buildInstance, instantiate } from '../src/engine/instance';
import { getQuestion } from '../src/content/registry';
import type { AnswerRange, PartResponse, PartResult } from '../src/engine/types';

const range = (exact: number, lo: number, hi: number): AnswerRange => ({ exact, lo, hi });

describe('accepting typed answers (cell rule)', () => {
  // Accepted range 13.7 – 13.9 (e.g. from intermediate rounding).
  const r = range(13.81, 13.7, 13.9);

  it.each(['13.8', '13.81', '13.808', '13.75', '14', '1.38e1'])('accepts %s', (s) => {
    expect(checkNumeric(s, r).status).toBe('correct');
  });

  it.each(['13.8 m', '13.8m', '13.8 m '])('accepts the expected unit typed after the number: %j', (s) => {
    expect(checkNumeric(s, r, { unit: 'm' }).status).toBe('correct');
  });

  it.each([
    ['4 m/s', 'm s-1'],
    ['4 m s^-1', 'm s-1'],
    ['4 m s⁻¹', 'm s-1'],
    ['4 ms-1', 'm s-1'],
    ['0.48 m/s^2', 'm s-2'],
    ['0.48 m/s2', 'm s-2'],
    ['0.48 m·s⁻²', 'm s-2'],
    ['0.48 m*s^-2', 'm s-2'],
    // Expected units written with a slash (AP and university questions): both forms match.
    ['4 m/s', 'm/s'],
    ['4 m s-1', 'm/s'],
    ['4 m s⁻¹', 'm/s'],
    ['250 N/m', 'N/m'],
    ['250 N m-1', 'N/m'],
    ['3.2 kW h', 'kW h'],
    ['3.2 kWh', 'kW h'],
    ['64 %', '%'],
    ['13.8 °C', '°C'],
    ['13.8 C', '°C'],
    ['13.8 ℃', '°C'],
  ])('recognises %j as the unit %j', (s, unit) => {
    const value = Number.parseFloat(s);
    expect(checkNumeric(s, range(value, value, value), { unit }).status).toBe('correct');
  });

  it.each([
    ['13.8 km', 'm'],
    ['13.8 ms', 's'],
    ['13.8 m', undefined],
    ['13.8 m/s', 'm/s^2'],
    ['13.8 s/m', 'm/s'],
  ])('rejects a wrong or unexpected unit %j (expected %j) as unreadable, not wrong', (s, unit) => {
    expect(checkNumeric(s, r, { unit }).status).toBe('invalid');
  });

  it.each(['0.48e', '0.48e-', '0.48x2', '0.48m+999', '0.48 = x'])('rejects malformed input %j', (s) => {
    expect(checkNumeric(s, range(0.48, 0.4776, 0.4824), { unit: 'm s-2' }).status).toBe('invalid');
  });

  it('never accepts a negative value for a positive-only quantity', () => {
    const v = checkNumeric('-13.8', r, { positive: true });
    expect(v.status).toBe('incorrect');
  });

  it.each(['13.5', '13.6', '13.95', '10', '15'])('rejects %s', (s) => {
    expect(checkNumeric(s, r).status).toBe('incorrect');
  });

  it('accepts a right answer padded with zeros (2.0000000000 for 2.0)', () => {
    const r = range(2, 1.99, 2.01);
    for (const typed of ['2', '2.0', '2.00', '2.0000000000', '2.00000000000000000000', '02.0', '+2.0', '2.', '2.0000e0', '2.000000 m']) {
      expect(checkNumeric(typed, r, { unit: 'm' }).status, typed).toBe('correct');
    }
    // An answer that rounds to 2.0 (exact 2.04, written to 2 s.f.) may be padded with zeros too.
    const r2 = range(2.04, 2.03, 2.05);
    expect(checkNumeric('2.0', r2).status).toBe('correct');
    expect(checkNumeric('2.000000', r2).status).toBe('correct');
    // Zeros do not rescue a wrong answer.
    expect(checkNumeric('2.2000000', r2).status).toBe('incorrect');
    expect(checkNumeric('0.000000', range(0, 0, 0)).status).toBe('correct');
    // Large and small answers written out in full, with or without trailing zeros.
    expect(checkNumeric('300000000.0000', range(3e8, 2.99e8, 3.01e8)).status).toBe('correct');
    expect(checkNumeric('0.00000000200000', range(2e-9, 1.99e-9, 2.01e-9)).status).toBe('correct');
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

  it('takes the ECF credit away again when (a) is corrected', () => {
    // (b) = 32 earned ECF from (a) = 0.5. Correcting (a) to 0.48 must re-mark (b).
    const before: Record<string, PartResponse> = { a: { kind: 'numeric', value: '0.5' }, b: { kind: 'numeric', value: '32' } };
    const results: Record<string, PartResult> = { b: gradePart(t, inst, partB, before) };
    expect(results.b.status).toBe('correct');
    const after = { ...before, a: { kind: 'numeric', value: '0.48' } as PartResponse };
    const remarked = remarkLaterParts(t, inst, 'a', after, results);
    expect(remarked.b.status).toBe('incorrect');
  });

  it('gives no ECF credit for a physically impossible answer (negative time)', () => {
    const responses: Record<string, PartResponse> = { a: { kind: 'numeric', value: '-0.50' }, b: { kind: 'numeric', value: '-32' } };
    expect(gradePart(t, inst, partB, responses).status).toBe('incorrect');
  });

  it('accepts the alternative (average-speed) method with its own rounding', () => {
    // u = 5.5, v = 24, s = 660: average speed 14.75 → 15 (2 s.f.) gives t = 660/15 = 44 s.
    const v = buildInstance(t, { u: 5.5, v: 24, s: 660 });
    const b = v.parts[1];
    expect(gradePart(t, v, b, { b: { kind: 'numeric', value: '44' } }).status).toBe('correct');
    expect(gradePart(t, v, b, { b: { kind: 'numeric', value: '44.7' } }).status).toBe('correct');
    expect(gradePart(t, v, b, { b: { kind: 'numeric', value: '42' } }).status).toBe('incorrect');
  });
});

describe('graph drawing', () => {
  const lift = getQuestion('ibp-a1-lift-vt-draw')!;
  const inst = instantiate(lift, null); // base: vertices (0,0) (3,3) (8,3) (10,0)
  const [graphPart, distPart] = inst.parts;
  const graph = (points: [number, number][]): PartResponse => ({ kind: 'graph', points });

  it('marks a fully correct graph 3/3, in any point order', () => {
    const res = gradePart(lift, inst, graphPart, { a: graph([[8, 3], [0, 0], [10, 0], [3, 3]]) });
    expect(res.score).toBe(3);
  });

  it('keeps credit for the correct segments when one point is misplaced', () => {
    // Only the origin is wrong: the plateau and the descent are still right → 2/3 (was 0/3).
    const pts: [number, number][] = [[11, 4], [3, 3], [8, 3], [10, 0]];
    expect(gradePart(lift, inst, graphPart, { a: graph(pts) }).score).toBe(2);
    expect(markGraph(pts, [[0, 0], [3, 3], [8, 3], [10, 0]], { x: 0.5, y: 0.25 }).pointOk).toEqual([false, true, true, true]);
  });

  it('does not credit a segment whose line is kinked by a point in between', () => {
    // Plateau ends are right, but a wrong point sits between them in time.
    const pts: [number, number][] = [[3, 3], [5, 1], [8, 3], [10, 0]];
    const res = gradePart(lift, inst, graphPart, { a: graph(pts) });
    expect(res.score).toBe(1); // only the descent (8,3)→(10,0) is right
  });

  it('gives ECF in (b) for the area under the student’s own graph', () => {
    // A plateau at 4 m/s instead of 3: area = ½·3·4 + 5·4 + ½·2·4 = 30 m.
    const responses = { a: graph([[0, 0], [3, 4], [8, 4], [10, 0]]), b: { kind: 'numeric', value: '30' } as PartResponse };
    const res = gradePart(lift, inst, distPart, responses);
    expect(res.status).toBe('correct');
    expect(res.ecf).toBe(true);
    // Every answer within 2 % is accepted, so 30.5 would pass; 32 is too far from 30.
    expect(gradePart(lift, inst, distPart, { ...responses, b: { kind: 'numeric', value: '32' } }).status).toBe('incorrect');
    expect(gradePart(lift, inst, distPart, { ...responses, b: { kind: 'numeric', value: '22.5' } }).status).toBe('correct');
  });

  it('gives no follow-through credit when there is no drawn graph (e.g. after Reset points)', () => {
    // With the preset points saved as a "drawing", 32 m (their area) used to earn 2/2.
    expect(gradePart(lift, inst, distPart, { b: { kind: 'numeric', value: '32' } }).status).toBe('incorrect');
  });
});

describe('review round 2 regressions', () => {
  const train = getQuestion('ibp-a1-train-acceleration')!;
  const kick = getQuestion('ibp-a1-projectile-kick')!;
  const num = (value: string): PartResponse => ({ kind: 'numeric', value });

  it('never accepts an answer in the gap between two methods', () => {
    // Base train: a = 0.10 (wrong) → t = 160 by follow-through; the average-speed method gives 33.3.
    const inst = instantiate(train, null);
    const b = inst.parts[1];
    expect(gradePart(train, inst, b, { a: num('0.10'), b: num('100') }).status).toBe('incorrect');
    expect(gradePart(train, inst, b, { a: num('0.10'), b: num('160') }).ecf).toBe(true);
    expect(gradePart(train, inst, b, { a: num('0.10'), b: num('33.3') }).status).toBe('correct');
  });

  it('follows through from an accepted rounded answer', () => {
    // u = 5.0, v = 15, s = 800: a = 0.125 exactly; 0.13 is accepted, so 10/0.13 = 77 must be too,
    // although 77 is more than 2 % from the exact 80 s.
    const inst = buildInstance(train, { u: 5, v: 15, s: 800 });
    const [a, b] = inst.parts;
    expect(gradePart(train, inst, a, { a: num('0.13') }).status).toBe('correct');
    expect(gradePart(train, inst, b, { b: num('77') }).status).toBe('incorrect');
    const res = gradePart(train, inst, b, { a: num('0.13'), b: num('77') });
    expect(res.status).toBe('correct');
    expect(res.ecf).toBeFalsy();
    expect(res.message).toMatch(/rounded answer/);
    expect(gradePart(train, inst, b, { a: num('0.13'), b: num('73') }).status).toBe('incorrect');
  });

  it('accepts every answer within 2 % of the exact value', () => {
    // A one-step answer: exact 0.4068 accepts 0.40 to 0.41 to 2 s.f., and 0.399 to 0.415 to 3 s.f.
    const r = padRange({ exact: 0.406807, min: 0.406807, max: 0.406807 });
    expect(r.lo).toBeCloseTo(0.406807 * 0.98, 12);
    expect(r.hi).toBeCloseTo(0.406807 * 1.02, 12);
    for (const typed of ['0.40', '0.41', '0.4', '0.399', '0.403', '0.410', '0.414']) expect(checkNumeric(typed, r).status, typed).toBe('correct');
    for (const typed of ['0.39', '0.42', '0.397', '0.416']) expect(checkNumeric(typed, r).status, typed).toBe('incorrect');
    // A wider range from rounding in the working is kept as it is.
    const wide = padRange({ exact: 10, min: 9.5, max: 10.6 });
    expect(wide.lo).toBeCloseTo(9.45, 12);
    expect(wide.hi).toBeCloseTo(10.65, 12);
    // Zero stays exact.
    expect(padRange({ exact: 0, min: 0, max: 0 })).toEqual({ exact: 0, lo: 0, hi: 0 });
  });

  it('does not carry forward inadmissible inputs or break the method’s assumptions', () => {
    // Base projectile: components −10 and −10 would give a "flight time" of −2.04 s and R = 20.4 m.
    const inst = instantiate(kick, null);
    const R = inst.parts.find((p) => p.id === 'c')!;
    expect(gradePart(kick, inst, R, { 'a-i': num('-10'), 'a-ii': num('-10'), c: num('20.4') }).status).toBe('incorrect');
    // Positive (but wrong) components still earn normal follow-through: 10 × (2 × 10 / 9.8) = 20.4 m.
    expect(gradePart(kick, inst, R, { 'a-i': num('10'), 'a-ii': num('10'), c: num('20.4') }).ecf).toBe(true);
  });

  it('states the positive axes in the projectile stem', () => {
    expect(instantiate(kick, null).stem).toMatch(/upwards and the direction of the kick as positive/);
  });
});
