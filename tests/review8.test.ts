/**
 * Review 8: work saved on build 59f80b0, which changed four questions without raising
 * their versions; the IB++ fixes (the valley turns the block back, the wall misses the
 * orbit, drawn graphs marked point by point, impossible probabilities give no
 * follow-through); and content corrections.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_QUESTIONS, getQuestion, resolveQuestion } from '../src/content/registry';
import { paperLabel } from '../src/components/QuestionView';
import { RADIUS_LINES, radiusInSolarRadii, radiusLinesAround } from '../src/engine/hr';
import { gradePart } from '../src/engine/grading';
import { buildInstance, instantiate, partId } from '../src/engine/instance';
import type { PartResponse } from '../src/engine/types';
import { everyCombo } from './helpers';
import { DEFAULT_SETTINGS, listAssignments, type Assignment } from '../src/store/assignments';
import { migrateStorage } from '../src/store/migrate';
import { saveWork, savePinnedParams, workIdFor, type QuestionWork } from '../src/store/progress';
import { assignmentSummary, assignmentTemplates, studentInstance } from '../src/store/studentData';
import type { AnyTemplate } from '../src/engine/types';
import type { ParamSpecs } from '../src/engine/params';

class MemoryStorage {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
});

const STUDENT = 'PHYS1:alex';
const HR = 'ibp-e5-hr-diagram';
const GEN = 'ump-t5-isotope-generator';
const KH = 'ump-t7-kelvin-helmholtz';
const COMPTON = 'ibp-e2-compton-scattering';

const baseParams = (t: AnyTemplate) => Object.fromEntries(Object.entries(t.params as ParamSpecs).map(([k, s]) => [k, s.base]));

function assignment(id: string, createdAt: string, ids: string[], courseId = 'ib-physics-hl'): Assignment {
  return { id, title: id, courseId, items: ids.map((q) => ({ id: q, version: 1 })), createdAt, settings: { ...DEFAULT_SETTINGS } };
}

/** Full marks on every online part of a revision, as that build would have saved them. */
function fullMarks(t: AnyTemplate): QuestionWork {
  return Object.fromEntries(
    t.parts.map((p) => {
      const response = p.response.kind === 'mcq' ? { kind: 'mcq' as const, choice: 'A' } : { kind: 'numeric' as const, value: '1' };
      return [partId(p.label), { response, checked: response, last: { status: 'correct' as const, score: p.marks, max: p.marks, attempts: 1 }, attempts: 1 }];
    }),
  );
}

const r6 = (id: string) => resolveQuestion(id, 1, 'r6')!.template;
const plain = (id: string) => resolveQuestion(id, 1)!.template;

describe('work saved on build 59f80b0 (four questions changed without a new version)', () => {
  it('archives that build’s revisions as version 1, build r6, apart from the first version 1', () => {
    for (const id of [HR, GEN, KH, COMPTON]) {
      const t = r6(id);
      expect(t.build, id).toBe('r6');
      expect(t.version, id).toBe(1);
      expect(t).not.toBe(plain(id));
      expect(workIdFor(t), id).toBe(`${id}@v1`); // the key its work was saved under
      expect(() => instantiate(t, 'TEST:student1'), id).not.toThrow();
    }
    expect(Object.keys(r6(HR).params).sort()).toEqual(['order', 'pair', 'set']);
    expect(Object.keys(plain(HR).params).sort()).toEqual(['k', 'q']);
    expect(r6(GEN).parts[0].marks).toBe(2);
    expect(plain(GEN).parts[0].marks).toBe(4);
  });

  it('puts the HR answers saved then back on the multiple-choice parts they were given for', () => {
    const t = r6(HR);
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-hr', '2026-11-25T22:15:00.000Z', [HR])]));
    savePinnedParams(STUDENT, 'hw-hr', `${HR}@v1`, baseParams(t) as Record<string, string | number>);
    const b = { kind: 'mcq' as const, choice: 'B' };
    saveWork(STUDENT, 'hw-hr', `${HR}@v1`, { b: { response: b, checked: b, last: { status: 'correct', score: 1, max: 1, attempts: 1 }, attempts: 1 } });

    migrateStorage();
    const a = listAssignments().find((x) => x.id === 'hw-hr')!;
    expect(a.items[0]).toEqual({ id: HR, version: 1, build: 'r6' });
    const [{ template, exact }] = assignmentTemplates(a);
    expect(exact).toBe(true);
    expect(template.build).toBe('r6');
    expect(template.parts[1].response.kind).toBe('mcq'); // (b) was multiple choice on that build
    // The student keeps the numbers they were given.
    expect(studentInstance(template, STUDENT, 'hw-hr').params).toEqual(baseParams(t));
    expect(assignmentSummary(a, STUDENT)).toMatchObject({ ibMarks: 1, ibMax: 6 });
  });

  it('shows a completed university assignment from that build as 13/13 again (not 13/16)', () => {
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-uni', '2026-11-25T23:40:00.000Z', [GEN, KH], 'university-modern-physics')]));
    saveWork(STUDENT, 'hw-uni', `${GEN}@v1`, fullMarks(r6(GEN)));
    saveWork(STUDENT, 'hw-uni', `${KH}@v1`, fullMarks(r6(KH)));
    // What the previous build showed: (a) of each question marked out of its earlier, larger total.
    const before = assignment('hw-uni', '2026-11-25T23:40:00.000Z', [GEN, KH], 'university-modern-physics');
    expect(assignmentSummary(before, STUDENT)).toMatchObject({ ibMarks: 13, ibMax: 16 });

    migrateStorage();
    const a = listAssignments().find((x) => x.id === 'hw-uni')!;
    expect(a.items.map((i) => i.build)).toEqual(['r6', 'r6']);
    expect(assignmentSummary(a, STUDENT)).toMatchObject({ ibMarks: 13, ibMax: 13 });
  });

  it('leaves assignments from before that build on the first version 1', () => {
    const t = plain(HR);
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-early', '2026-11-25T20:30:00.000Z', [HR, GEN])]));
    savePinnedParams(STUDENT, 'hw-early', `${HR}@v1`, baseParams(t) as Record<string, string | number>);
    saveWork(STUDENT, 'hw-early', `${GEN}@v1`, fullMarks(plain(GEN)));
    migrateStorage();
    const a = listAssignments().find((x) => x.id === 'hw-early')!;
    expect(a.items.map((i) => i.build)).toEqual([undefined, undefined]);
    expect(assignmentTemplates(a).map((r) => r.template)).toEqual([plain(HR), plain(GEN)]);
  });

  it('goes by saved work over the date, and by the date when nothing is saved', () => {
    storage.setItem(
      'rice-hw:assignments',
      JSON.stringify([
        assignment('hw-in-window', '2026-11-26T00:30:00.000Z', [COMPTON, HR]),
        assignment('hw-before', '2026-11-25T19:00:00.000Z', [COMPTON]),
        // Made in that build's time but answered on the earlier revision: the work decides.
        assignment('hw-work-wins', '2026-11-26T00:45:00.000Z', [GEN]),
      ]),
    );
    saveWork(STUDENT, 'hw-work-wins', `${GEN}@v1`, fullMarks(plain(GEN)));
    migrateStorage();
    const items = (id: string) => listAssignments().find((x) => x.id === id)!.items.map((i) => i.build);
    expect(items('hw-in-window')).toEqual(['r6', 'r6']);
    expect(items('hw-before')).toEqual([undefined]);
    expect(items('hw-work-wins')).toEqual([undefined]);
  });

  it('runs once, and never touches current revisions', () => {
    const current = getQuestion(HR)!;
    storage.setItem(
      'rice-hw:assignments',
      JSON.stringify([{ ...assignment('hw-now', '2026-11-26T02:00:00.000Z', []), items: [{ id: HR, version: current.version }] }]),
    );
    migrateStorage();
    expect(listAssignments().find((x) => x.id === 'hw-now')!.items).toEqual([{ id: HR, version: current.version }]);
    // A version-1 assignment saved afterwards is not repaired again (the repair has run).
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-later', '2026-11-25T22:00:00.000Z', [HR])]));
    migrateStorage();
    expect(listAssignments().find((x) => x.id === 'hw-later')!.items[0].build).toBeUndefined();
  });
});

const num = (value: string): PartResponse => ({ kind: 'numeric', value });
const allowed = (t: AnyTemplate) => [...everyCombo(t.params as ParamSpecs)].filter((p) => !t.constraint || t.constraint(p as never));

describe('IB++ variants that made physical sense only some of the time', () => {
  it('valley and hill: the block always turns back below the crest, whichever g is used', () => {
    const t = getQuestion('ibpp-a5-valley-linearization')!;
    expect(t.version).toBe(2);
    expect(resolveQuestion(t.id, 1)!.template.version).toBe(1); // earlier assignments keep version 1
    const combos = allowed(t);
    expect(combos.length).toBeGreaterThan(10);
    for (const p of combos) {
      const P = p as { a: number; b: number; v0: number };
      const crest = 4 * P.a * P.b ** 2 * Math.exp(-2);
      for (const g of [9.8, 9.81]) expect(P.v0 ** 2 / (2 * g), JSON.stringify(p)).toBeLessThan(crest);
    }
    // The case in the review (hill 0.217 m, block able to rise 0.459 m) is no longer offered.
    expect(combos.some((p) => p.a === 0.1 && p.b === 2 && p.v0 === 3)).toBe(false);
  });

  it('cutting the string: the wall is always outside the circle', () => {
    const t = getQuestion('ibpp-a5-cut-string-tangent')!;
    expect(t.version).toBe(2);
    expect(resolveQuestion(t.id, 1)!.template.version).toBe(1);
    for (const p of allowed(t)) {
      const inst = buildInstance(t, p);
      const r = Number((inst.stem ?? '').match(/radius \$([\d.]+)/)?.[1]);
      const wall = Number((inst.stem ?? '').match(/y = ([\d.]+)\$/)?.[1]);
      expect(wall - r, JSON.stringify(p)).toBeGreaterThanOrEqual(0.1 - 1e-9);
    }
  });

  it('drone: the drawn line earns one mark for each correct end, online as on paper', () => {
    const q = getQuestion('ibpp-a5-drone-height')!;
    const inst = instantiate(q, null); // a = 8 − 6t from (0, 8) to (4, −16)
    const e = inst.parts[4];
    expect(e.prompt).not.toMatch(/drag/i);
    expect(e.markscheme.filter((l) => 'mark' in l)).toHaveLength(2);
    const draw = (points: [number, number][]) => gradePart(q, inst, e, { [e.id]: { kind: 'graph', points } });
    expect(draw([[0, 8], [4, -16]])).toMatchObject({ status: 'correct', score: 2 });
    expect(draw([[0, 8], [4, -12]])).toMatchObject({ status: 'partial', score: 1 });
    expect(draw([[0, 6], [4, -16]])).toMatchObject({ status: 'partial', score: 1 });
    expect(draw([[1, 8], [3, -12]])).toMatchObject({ status: 'incorrect', score: 0 });
  });

  it('a handful of nuclei: a wrong probability carries forward, an impossible one does not', () => {
    const q = getQuestion('ibpp-e4-decay-binomial')!;
    const inst = instantiate(q, null); // n = 10, two half-lives
    const [a, , , d] = inst.parts;
    // From P(decayed) = 0.8: P(Y ≤ 1) = 0.8¹⁰ + 10 × 0.2 × 0.8⁹.
    const from08 = 0.8 ** 10 + 10 * 0.2 * 0.8 ** 9;
    const ecf = gradePart(q, inst, d, { [a.id]: num('0.8'), [d.id]: num(from08.toFixed(4)) });
    expect(ecf).toMatchObject({ status: 'correct', ecf: true });
    // The review's case: 1.01 in (a) and the number it leads to in (d).
    expect(gradePart(q, inst, d, { [a.id]: num('1.01'), [d.id]: num('0.99525') }).status).toBe('incorrect');
    expect(gradePart(q, inst, d, { [a.id]: num('-0.2'), [d.id]: num('0.5') }).status).toBe('incorrect');
  });
});

describe('content corrections', () => {
  it('binding energy asks for the maximum of the continuous model', () => {
    const inst = instantiate(getQuestion('ibpp-e5-binding-energy-peak')!, null);
    expect(inst.parts[1].prompt).toMatch(/continuous variable/);
  });

  it('the bismuth-212 chain reaches stable lead-208 through a short-lived nuclide', () => {
    const q = getQuestion('ibpp-e5-decay-chain-ode')!;
    const stem = buildInstance(q, { pair: 'pbBi', N0: 4e10 }).stem;
    expect(stem).toMatch(/stable lead-208 through a short-lived nuclide \(thallium-208 or polonium-212\)/);
    expect(buildInstance(q, { pair: 'baLa', N0: 4e10 }).stem).toMatch(/stable cerium-140/);
    expect(buildInstance(q, { pair: 'teI', N0: 4e10 }).stem).toMatch(/stable xenon-132/);
  });

  it('HR (d) names the dashed lines the largest star really lies between', () => {
    expect(radiusLinesAround(426)).toBe('between the lines for 100 and 1000 solar radii');
    expect(radiusLinesAround(106)).toBe('between the lines for 100 and 1000 solar radii');
    expect(radiusLinesAround(1500)).toBe('beyond the line for 1000 solar radii');
    expect(RADIUS_LINES[RADIUS_LINES.length - 1]).toBe(1000);
    const q = getQuestion('ibp-e5-hr-diagram')!;
    for (const p of allowed(q)) {
      const text = buildInstance(q, p).parts[3].solution.map((s) => s.text ?? '').join(' ');
      expect(text, JSON.stringify(p)).not.toMatch(/beyond the highest dashed line/);
      const radii = [...text.matchAll(/[A-D] ([\d.]+(?:\\times 10\^\{\d+\})?)/g)].map((m) => Number(m[1]));
      expect(radii.length, JSON.stringify(p)).toBe(4);
      expect(text).toContain(radiusLinesAround(Math.max(...radii.filter(Number.isFinite))));
    }
    expect(radiusInSolarRadii(5800, 1)).toBe(1);
  });

  it('labels questions with multiple-choice parts honestly (IB Paper 2 has none)', () => {
    for (const q of ALL_QUESTIONS.filter((x) => x.paper === 'Paper 2 style')) {
      const mcq = q.parts.some((p) => p.response.kind === 'mcq');
      expect(paperLabel(q), q.id).toBe(mcq ? 'Paper 2 style, explanations as multiple choice' : 'Paper 2 style');
    }
    expect(paperLabel(getQuestion('ibpp-e5-activity-tangent')!)).toBe('Paper 2 style');
    expect(paperLabel(getQuestion('ibpp-a5-riemann-work')!)).toBe('Paper 2 style, explanations as multiple choice');
  });
});
