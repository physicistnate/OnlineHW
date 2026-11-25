/**
 * Third review round: method-aware follow-through, tries and grades, courses (SL/HL),
 * question revisions, zero answers and scientific notation.
 */
import { describe, expect, it } from 'vitest';
import { COURSES, IB_PHYSICS_HL, IB_PHYSICS_SL, allTopics, courseOrDefault, courseTopic, findTopic } from '../src/content/catalog';
import { ALL_QUESTIONS, getQuestion, questionsForCourse, questionsForTopic, resolveQuestion } from '../src/content/registry';
import { defineQuestion } from '../src/engine/define';
import { attemptLimit, combineSummaries, partClassPercent, summarizeGrades, type GradingPolicy } from '../src/engine/gradebook';
import { checkNumeric, gradePart, rangesOf } from '../src/engine/grading';
import { buildInstance, instantiate } from '../src/engine/instance';
import { fmtA, snapZero } from '../src/engine/numbers';
import { displayParams, rangeIsAligned, rangeValues } from '../src/engine/params';
import type { PartResponse } from '../src/engine/types';
import { Q } from '../src/engine/units';
import { typedForms } from './helpers';

const num = (value: string): PartResponse => ({ kind: 'numeric', value });

describe('method-aware follow-through', () => {
  const stopping = getQuestion('ibp-a1-stopping-distance')!;
  const kick = getQuestion('ibp-a1-projectile-kick')!;

  it('accepts (c) = 43.3 after (a) = 10 (wrong) and (b) = 33 (rounded)', () => {
    // Base: v = 20, tr = 0.7, a = 6 -> s1 = 14, s2 = 33.33, s = 47.3. The student used
    // their own 10 for s1 and the unrounded 33.3 for s2: 10 + 33.3 = 43.3.
    const inst = instantiate(stopping, null);
    const [a, b, c] = inst.parts;
    const responses = { a: num('10'), b: num('33'), c: num('43.3') };
    expect(gradePart(stopping, inst, a, responses).status).toBe('incorrect');
    expect(gradePart(stopping, inst, b, responses).status).toBe('correct');
    const res = gradePart(stopping, inst, c, responses);
    expect(res.status).toBe('correct');
    expect(res.ecf).toBe(true);
    expect(res.message).toMatch(/your answer to \(a\)/);
    expect(res.message).not.toMatch(/\(b\)/);
    // Using both of their own answers (10 + 33 = 43) is fine too; a value that follows from neither is not.
    expect(gradePart(stopping, inst, c, { ...responses, c: num('43') }).status).toBe('correct');
    expect(gradePart(stopping, inst, c, { ...responses, c: num('45') }).status).toBe('incorrect');
  });

  it('does not credit or mention earlier parts the method does not use', () => {
    // Base kick: v = 18 at 40° -> vx = 13.8, vy = 11.6, h = 6.83, R = 32.6.
    const inst = instantiate(kick, null);
    const H = inst.parts.find((p) => p.id === 'b')!;
    const R = inst.parts.find((p) => p.id === 'c')!;
    // A wrong horizontal component has nothing to do with the height.
    const right = gradePart(kick, inst, H, { 'a-i': num('5'), 'a-ii': num('11.6'), b: num('6.83') });
    expect(right.status).toBe('correct');
    expect(right.ecf).toBeFalsy();
    expect(right.message ?? '').not.toMatch(/\(a\)\(i\)/);
    // ... so a "height" worked out from it is not credited.
    expect(gradePart(kick, inst, H, { 'a-i': num('5'), b: num(String(5 ** 2 / (2 * 9.8))) }).status).toBe('incorrect');
    // The range uses both components; only the wrong one is named.
    const range = gradePart(kick, inst, R, { 'a-i': num('13.8'), 'a-ii': num('10'), c: num('28.1') });
    expect(range.status).toBe('correct');
    expect(range.ecf).toBe(true);
    expect(range.message).toMatch(/\(a\)\(ii\)/);
    expect(range.message).not.toMatch(/\(a\)\(i\) /);
  });
});

describe('tries', () => {
  it('gives multiple choice half its choices, rounded up, capped by the limit', () => {
    expect(attemptLimit('mcq', 4, 3)).toBe(2);
    expect(attemptLimit('mcq', 5, 3)).toBe(3);
    expect(attemptLimit('mcq', 3, 3)).toBe(2);
    expect(attemptLimit('mcq', 2, 3)).toBe(1);
    expect(attemptLimit('mcq', 4, 10)).toBe(2);
    expect(attemptLimit('mcq', 4, 1)).toBe(1);
    expect(attemptLimit('mcq', 4, null)).toBeNull();
  });
  it('gives other parts the assignment’s limit', () => {
    expect(attemptLimit('numeric', 0, 3)).toBe(3);
    expect(attemptLimit('graph', 0, 2)).toBe(2);
    expect(attemptLimit('numeric', 0, null)).toBeNull();
  });
});

describe('class grade and IB marks', () => {
  const policy: GradingPolicy = { maxAttempts: 3, lowestScore: 0, penaltyPerTry: 7 };
  const correct = (attempts: number) => ({ status: 'correct' as const, score: 1, max: 1, attempts });

  it('takes 7 percentage points off per extra try: 100 → 93 → 86', () => {
    expect(partClassPercent({ marks: 1, last: correct(1) }, policy)).toBe(100);
    expect(partClassPercent({ marks: 1, last: correct(2) }, policy)).toBe(93);
    expect(partClassPercent({ marks: 1, last: correct(3) }, policy)).toBe(86);
  });
  it('gives a part that is still wrong (or out of tries) the lowest score, and never less', () => {
    const wrong = { status: 'incorrect' as const, score: 0, max: 1, attempts: 3 };
    expect(partClassPercent({ marks: 1, last: wrong }, policy)).toBe(0);
    expect(partClassPercent({ marks: 1, last: wrong }, { ...policy, lowestScore: 40 })).toBe(40);
    expect(partClassPercent({ marks: 1, last: correct(12) }, { ...policy, maxAttempts: null, lowestScore: 40 })).toBe(40);
    expect(partClassPercent({ marks: 1, last: correct(30) }, { ...policy, maxAttempts: null })).toBe(0);
  });
  it('gives an unattempted part 0, whatever the lowest score', () => {
    expect(partClassPercent({ marks: 2 }, { ...policy, lowestScore: 40 })).toBe(0);
  });
  it('scales partial credit (a graph with 2 of 3 segments right)', () => {
    const partial = (attempts: number) => ({ status: 'partial' as const, score: 2, max: 3, attempts });
    expect(partClassPercent({ marks: 3, last: partial(1) }, policy)).toBeCloseTo(66.667, 2);
    expect(partClassPercent({ marks: 3, last: partial(2) }, policy)).toBeCloseTo(59.667, 2);
  });
  it('weights parts by marks; IB marks are the latest marks with no penalty', () => {
    const g = summarizeGrades(
      [
        { marks: 1, last: correct(2) },
        { marks: 2, last: { status: 'correct', score: 2, max: 2, attempts: 1 } },
        { marks: 3, last: { status: 'partial', score: 2, max: 3, attempts: 1 } },
        { marks: 2 },
      ],
      policy,
    );
    expect(g.classPercent).toBeCloseTo((93 * 1 + 100 * 2 + (200 / 3) * 3 + 0) / 8, 6);
    expect(g.ibMarks).toBe(1 + 2 + 2);
    expect(g.ibMax).toBe(8);
    expect(g.partsAttempted).toBe(3);
    const both = combineSummaries([g, summarizeGrades([{ marks: 2, last: { status: 'correct', score: 2, max: 2, attempts: 1 } }], policy)]);
    expect(both.ibMax).toBe(10);
    expect(both.ibMarks).toBe(7);
    expect(both.classPercent).toBeCloseTo((g.classPercent * 8 + 100 * 2) / 10, 6);
  });
});

describe('courses and revisions', () => {
  it('HL includes every SL question and the HL-only topics; SL has no HL-only topics', () => {
    const sl = questionsForCourse(IB_PHYSICS_SL.id).map((q) => q.id);
    const hl = questionsForCourse(IB_PHYSICS_HL.id).map((q) => q.id);
    for (const id of sl) expect(hl).toContain(id);
    expect(allTopics(IB_PHYSICS_SL).some((t) => t.hlOnly)).toBe(false);
    expect(allTopics(IB_PHYSICS_HL).filter((t) => t.hlOnly).map((t) => t.code)).toEqual(['A.4', 'A.5', 'B.4', 'D.4', 'E.2']);
    expect(findTopic('ibp.A.1')!.standards.map((s) => s.code)).toEqual(['A.1.1', 'A.1.2', 'A.1.3', 'A.1.4', 'A.1.5', 'A.1.6', 'A.1.7']);
    expect(questionsForTopic('ibp.A.1', IB_PHYSICS_HL.id).length).toBe(questionsForTopic('ibp.A.1', IB_PHYSICS_SL.id).length);
    expect(courseOrDefault(null).id).toBe(IB_PHYSICS_SL.id);
    expect(courseOrDefault('no-such-course').id).toBe(IB_PHYSICS_SL.id);
    expect(COURSES.map((c) => c.id)).toEqual(['ib-physics-sl', 'ib-physics-hl']);
  });

  it('shows HL-only standards and questions in HL only (A.2: collisions in two dimensions)', () => {
    const codes = (course: typeof IB_PHYSICS_SL) => courseTopic(course, 'ibp.A.2')!.standards.map((s) => s.code);
    expect(codes(IB_PHYSICS_SL)).not.toContain('A.2.10');
    expect(codes(IB_PHYSICS_HL)).toContain('A.2.10');
    expect(findTopic('ibp.A.2')!.standards.find((s) => s.code === 'A.2.10')?.hl).toBe(true);
    const hlOnly = ALL_QUESTIONS.filter((q) => q.level === 'HL').map((q) => q.id);
    expect(hlOnly).toContain('ibp-a2-collision-2d');
    for (const id of hlOnly) {
      expect(questionsForCourse(IB_PHYSICS_SL.id).some((q) => q.id === id)).toBe(false);
      expect(questionsForCourse(IB_PHYSICS_HL.id).some((q) => q.id === id)).toBe(true);
    }
    // Every SL standard in A.1 and A.2 has at least one question.
    for (const topicId of ['ibp.A.1', 'ibp.A.2']) {
      for (const s of courseTopic(IB_PHYSICS_HL, topicId)!.standards) {
        expect(questionsForTopic(topicId, IB_PHYSICS_HL.id).some((q) => q.standards.includes(s.id)), `${s.code} has no question`).toBe(true);
      }
    }
  });

  it('resolves the version an assignment was made with, and says when it cannot', () => {
    const q = ALL_QUESTIONS[0];
    expect(resolveQuestion(q.id, q.version)).toEqual({ template: q, exact: true });
    expect(resolveQuestion(q.id)).toEqual({ template: q, exact: true });
    // An old revision that was not archived falls back to the current one, flagged.
    expect(resolveQuestion(q.id, q.version + 100)).toEqual({ template: q, exact: false });
    expect(resolveQuestion('no-such-question', 1)).toBeUndefined();
  });

  it('never steps past the end of a range (min 0, max 10, step 4 gives 0, 4, 8)', () => {
    expect(rangeValues({ min: 0, max: 10, step: 4, base: 0 })).toEqual([0, 4, 8]);
    expect(rangeIsAligned({ min: 0, max: 10, step: 4, base: 0 })).toBe(false);
    expect(rangeIsAligned({ min: 0, max: 8, step: 4, base: 0 })).toBe(true);
    expect(rangeValues({ min: 0.5, max: 1.2, step: 0.05, base: 0.7 })).toHaveLength(15);
    expect(rangeIsAligned({ min: 0.5, max: 1.2, step: 0.05, base: 0.7 })).toBe(true);
  });
});

/** A ball thrown straight up and caught at the same height: displacement 0. */
const zeroQuestion = defineQuestion({
  id: 'test-zero',
  version: 1,
  title: 'Thrown up and caught',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.2'],
  style: 'IB',
  types: ['calculation'],
  difficulty: 1,
  params: { u: { min: 5, max: 15, step: 0.5, base: 12 } },
  compute: (p, c) => {
    const t = c.carry((2 * p.u) / c.g, 't');
    const up = p.u * t;
    const down = 0.5 * c.g * t ** 2;
    return { t, s: snapZero(up - down, up, down) };
  },
  stem: ({ d }) => `A ball is thrown vertically upwards at ${Q(d.u, 'm s-1')} and caught at the height it was thrown from.`,
  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the displacement of the ball when it is caught.',
      response: { kind: 'numeric', answer: 's', symbol: 's', unit: 'm' },
      solution: ({ r }) => [{ text: `Up and down the same distance: $s = ${fmtA(r.s)}$ m.` }],
      markscheme: () => [{ mark: '$s = 0$' }],
    },
  ],
});

describe('zero answers', () => {
  it('snaps floating-point noise to a clean zero', () => {
    expect(snapZero(1e-15, 14.7, 14.7)).toBe(0);
    expect(snapZero(0.02, 14.7, 14.68)).toBe(0.02);
    expect(snapZero(5e-7, 5e-7)).toBe(5e-7); // a genuinely small answer is kept
  });

  it('accepts 0 (and the small values rounded working gives), not a real displacement', () => {
    const inst = buildInstance(zeroQuestion, { u: 12 });
    const part = inst.parts[0];
    if (part.response.kind !== 'numeric') throw new Error('expected a numeric part');
    expect(part.response.range.exact).toBe(0);
    expect(fmtA(inst.results.s)).toBe('0');
    for (const typed of ['0', '0.0', '-0', '0 m']) expect(checkNumeric(typed, rangesOf(part.response), { unit: 'm' }).status).toBe('correct');
    // Working with t rounded to 2.4 s gives 12 × 2.4 − 4.9 × 2.4² = 0.58 m: allowed by the rounding policy.
    expect(checkNumeric('0.58', rangesOf(part.response)).status).toBe('correct');
    expect(checkNumeric('7.3', rangesOf(part.response)).status).toBe('incorrect');
    expect(checkNumeric('-7.3', rangesOf(part.response)).status).toBe('incorrect');
  });
});

/** Scientific notation in given data and answers. */
const sciQuestion = defineQuestion({
  id: 'test-sci',
  version: 1,
  title: 'Light from the Moon',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.3'],
  style: 'IB',
  types: ['calculation'],
  difficulty: 1,
  params: {
    d: { min: 3.6e8, max: 4.0e8, step: 0.02e8, base: 3.84e8, sci: 3 },
    lambda: { min: 400, max: 700, step: 10, base: 500 },
  },
  compute: (p) => ({ t: p.d / 3.0e8, f: 3.0e8 / (p.lambda * 1e-9) }),
  stem: ({ d }) => `The Moon is ${Q(d.d, 'm')} from the Earth. Light has a wavelength of ${Q(d.lambda, 'nm')}.`,
  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the time light takes to travel from the Moon to the Earth.',
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ r }) => [{ text: `$t = ${fmtA(r.t)}$ s` }],
      markscheme: () => [{ mark: 'time' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the frequency of the light.',
      response: { kind: 'numeric', answer: 'f', symbol: 'f', unit: 'Hz', positive: true },
      solution: ({ r }) => [{ text: `$f = ${fmtA(r.f)}$ Hz` }],
      markscheme: () => [{ mark: 'frequency' }],
    },
  ],
});

describe('scientific notation', () => {
  it('shows given data in scientific notation, exactly as used', () => {
    expect(displayParams(sciQuestion.params, { d: 3.84e8, lambda: 500 })).toEqual({ d: '3.84\\times 10^{8}', lambda: '500' });
    const values = rangeValues(sciQuestion.params.d);
    expect(values[0]).toBe(3.6e8);
    expect(values.at(-1)).toBe(4.0e8);
  });

  it('accepts every usual way of typing a large answer, with a power-of-ten hint for slips', () => {
    const inst = buildInstance(sciQuestion, { d: 3.84e8, lambda: 500 });
    const f = inst.parts[1].response;
    if (f.kind !== 'numeric') throw new Error('expected a numeric part');
    expect(fmtA(inst.results.f)).toBe('6.0\\times 10^{14}'); // 2 s.f. at least in scientific notation
    for (const typed of [...typedForms('6.0\\times 10^{14}'), ...typedForms('6.00\\times 10^{14}'), '600000000000000', '6e14 Hz']) {
      expect(checkNumeric(typed, rangesOf(f), { unit: 'Hz', positive: true }).status, typed).toBe('correct');
    }
    const slip = checkNumeric('6.0e13', rangesOf(f), { unit: 'Hz' });
    expect(slip.status).toBe('incorrect');
    expect(slip.status === 'incorrect' && slip.hint).toMatch(/power of ten/);
    const t = inst.parts[0].response;
    if (t.kind !== 'numeric') throw new Error('expected a numeric part');
    expect(checkNumeric('1.28', rangesOf(t)).status).toBe('correct');
  });
});
