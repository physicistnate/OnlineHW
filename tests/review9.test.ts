/**
 * Review 9 (the Codex review of round 9): the velocity selector's band of speeds and its
 * follow-through, equal currents, field lines of unequal charges, the comet's constant
 * areal rate, follow-through by both methods for orbital speed, Millikan magnitudes,
 * work done by an external force, the one capacitor problem, and an unanswered
 * assignment that a later build had re-pinned.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ALL_QUESTIONS, getQuestion, resolveQuestion } from '../src/content/registry';
import { IB } from '../src/content/ib-physics/constants';
import { normalCdf } from '../src/content/ibpp/helpers';
import { gradePart } from '../src/engine/grading';
import { buildInstance, instantiate, partId } from '../src/engine/instance';
import type { ParamSpecs } from '../src/engine/params';
import type { AnyTemplate, McqOptionInstance, PartInstance, PartResponse, QuestionInstance } from '../src/engine/types';
import { DEFAULT_SETTINGS, listAssignments, type Assignment } from '../src/store/assignments';
import { migrateStorage } from '../src/store/migrate';
import { loadPinnedParams, savePinnedParams, saveWork, type QuestionWork } from '../src/store/progress';
import { assignmentTemplates, studentInstance } from '../src/store/studentData';
import { everyCombo } from './helpers';

const num = (value: string): PartResponse => ({ kind: 'numeric', value });
const allowed = (t: AnyTemplate) => [...everyCombo(t.params as ParamSpecs)].filter((p) => !t.constraint || t.constraint(p as never));
const options = (part: PartInstance) => (part.response.kind === 'mcq' ? part.response.options : []) as McqOptionInstance[];
const correctText = (part: PartInstance) => options(part).find((o) => o.correct)?.text ?? '';
const solutionText = (part: PartInstance) => part.solution.map((s) => `${s.text ?? ''} ${s.math ?? ''}`).join(' ');
const stemText = (inst: QuestionInstance) => inst.stem ?? '';

describe('question fixes', () => {
  it('velocity selector: a slightly faster ion still passes, and (b) follows on from a wrong speed in (a)', () => {
    const t = getQuestion('ibpp-d4-selector-normal')!;
    const inst = instantiate(t, null); // base: E = 5 × 10⁴ V/m, B = 0.2 T, mean 2.5 × 10⁵, σ = 3 × 10⁴, half-width 5 × 10³
    const [a, b, , , e] = inst.parts;
    expect(e.prompt).not.toMatch(/miss/);
    expect(solutionText(e)).toMatch(/still reaches the slit/);
    expect(solutionText(e)).not.toMatch(/misses the slit/);
    // A wrong selected speed of 2.0 × 10⁵ m/s in (a), used correctly in (b).
    const p = normalCdf(2.05e5, 2.5e5, 3e4) - normalCdf(1.95e5, 2.5e5, 3e4);
    const res = gradePart(t, inst, b, { [a.id]: num('2.0e5'), [b.id]: num(p.toFixed(4)) });
    expect(res.status).toBe('correct');
    expect(res.ecf).toBe(true);
    expect(JSON.stringify(b.markscheme)).toMatch(/ECF from \(a\)/);
  });

  it('parallel currents: the keyed answer is true when the currents are equal too', () => {
    const t = getQuestion('ibp-d3-parallel-wires')!;
    let equal = 0;
    for (const p of allowed(t)) {
      const inst = buildInstance(t, p);
      const c = inst.parts[2];
      if (p.I1 === p.I2) equal++;
      expect(correctText(c)).toMatch(/always equal in size, whatever the two currents are/);
      expect(correctText(c)).not.toMatch(/currents are different/);
      expect(options(c).filter((o) => o.correct)).toHaveLength(1);
    }
    expect(equal).toBe(36); // a quarter of the 144 versions
  });

  it('field lines: the keyed statement holds for unequal charges, and the solution says where the extra lines go', () => {
    const t = getQuestion('ibp-d2-field-two-charges')!;
    for (const p of allowed(t)) {
      const d = buildInstance(t, p).parts[3];
      expect(correctText(d)).not.toMatch(/start on the positive charge and end on the negative/);
      expect(correctText(d)).toMatch(/away from the positive charge and towards the negative charge/);
      const sol = solutionText(d);
      if (p.Q1 > p.Q2) expect(sol).toMatch(/go off to infinity/);
      else if (p.Q1 < p.Q2) expect(sol).toMatch(/come in from infinity/);
      else expect(sol).toMatch(/every line that leaves the positive charge ends on the negative charge/);
    }
  });

  it('comet: area is swept at a constant rate, and the question is labelled an extension', () => {
    const t = getQuestion('ibp-d1-comet-kepler')!;
    const inst = instantiate(t, null);
    const sol = solutionText(inst.parts[3]);
    expect(sol).toMatch(/constant rate/);
    expect(sol).not.toMatch(/swept slowly|swept more slowly/);
    expect(t.title).toMatch(/extension/);
    expect(stemText(inst)).toMatch(/goes beyond the IB guide/);
  });

  it('orbital speed: follow-through from the student’s radius by v = 2πr/T and by v = √(GM/r)', () => {
    const t = getQuestion('ibp-d1-satellite-orbits')!;
    const inst = instantiate(t, null); // base: the Earth, T = 6 h
    const [a, , c] = inst.parts;
    const r = 1e7;
    const byPeriod = (2 * Math.PI * r) / (6 * 3600); // 2909 m/s
    const byGravity = Math.sqrt((IB.G * IB.ME) / r); // 6310 m/s
    for (const v of [byPeriod, byGravity]) {
      const res = gradePart(t, inst, c, { [a.id]: num('1.0e7'), [c.id]: num(v.toPrecision(4)) });
      expect(res.status, `v = ${v.toPrecision(4)}`).toBe('correct');
      expect(res.ecf).toBe(true);
    }
    expect(JSON.stringify(c.markscheme)).toMatch(/ECF from \(a\), by either method/);
  });

  it('Millikan statistics: the table gives magnitudes, and the e/2 argument names its assumption', () => {
    const t = getQuestion('ibpp-d4-millikan-statistics')!;
    const inst = instantiate(t, null);
    expect(stemText(inst)).toMatch(/magnitudes \$\|q\|\$/);
    expect(stemText(inst)).toMatch(/\|q\|\\ \/\\ 10\^\{-19\}/);
    const e = inst.parts[4];
    expect(correctText(e)).toMatch(/at random/);
    expect(solutionText(e)).not.toMatch(/about half/);
    expect(solutionText(e)).toMatch(/rests on that assumption/);
  });

  it('screened charge: (c) asks for the work done by the external force', () => {
    const inst = instantiate(getQuestion('ibpp-d5-debye-field')!, null);
    expect(inst.parts[2].prompt).toMatch(/work done by the external force/);
  });
});

describe('capacitors: one IB++ problem, where the differential equation is the point', () => {
  it('the RC problem is the only question that mentions capacitors, and it says they are not in the IB guide', () => {
    const mentions = ALL_QUESTIONS.filter((q) => /capacitor/i.test(JSON.stringify(instantiate(q, null)))).map((q) => q.id);
    expect(mentions).toEqual(['ibpp-d5-rc-plates']);
    const t = getQuestion('ibpp-d5-rc-plates')!;
    expect(t.courses).toEqual(['ibpp-physics-math']);
    expect(t.math?.standards).toContain('ibm.5.18');
    expect(stemText(instantiate(t, null))).toMatch(/not in the IB Physics guide/);
  });

  it('works out the base version: τ = 48.4 ms, V after 10 ms, the time to a quarter, the spot’s first speed', () => {
    const t = getQuestion('ibpp-d5-rc-plates')!;
    const inst = instantiate(t, null);
    const answer = (i: number, v: string) => gradePart(t, inst, inst.parts[i], { [inst.parts[i].id]: num(v) }).status;
    expect(answer(1, (300 * Math.exp(-10 / 48.4)).toPrecision(3))).toBe('correct');
    expect(answer(2, (48.4 * Math.log(4)).toPrecision(3))).toBe('correct');
    expect(answer(3, (24 / 48.4).toPrecision(3))).toBe('correct');
  });
});

// ---------- An unanswered assignment from build 59f80b0 that build e6066f1 re-pinned ----------

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

describe('an unanswered assignment that a later build re-pinned', () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
    (globalThis as { window?: unknown }).window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
  });

  const STUDENT = 'PHYS1:alex';
  const HR = 'ibp-e5-hr-diagram';
  const r6 = (id: string) => resolveQuestion(id, 1, 'r6')!.template;
  const plain = (id: string) => resolveQuestion(id, 1)!.template;
  const baseParams = (t: AnyTemplate) => Object.fromEntries(Object.entries(t.params as ParamSpecs).map(([k, s]) => [k, s.base])) as Record<string, string | number>;
  const assignment = (id: string, createdAt: string, ids: string[]): Assignment => ({
    id,
    title: id,
    courseId: 'ib-physics-hl',
    items: ids.map((q) => ({ id: q, version: 1 })),
    createdAt,
    settings: { ...DEFAULT_SETTINGS },
  });
  const items = (id: string) => listAssignments().find((x) => x.id === id)!.items.map((i) => i.build);

  it('the two revisions of the HR question have different parameters (so a build that opens one re-pins the other)', () => {
    expect(Object.keys(r6(HR).params).sort()).not.toEqual(Object.keys(plain(HR).params).sort());
  });

  it('goes by the date, not by numbers that e6066f1 re-pinned, and gives the student back their numbers', () => {
    // Made while 59f80b0 was the latest build; opened (not answered) on e6066f1, which pinned the plain revision's numbers.
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-repinned', '2026-11-26T00:30:00.000Z', [HR])]));
    savePinnedParams(STUDENT, 'hw-repinned', `${HR}@v1`, baseParams(plain(HR)));
    migrateStorage();
    expect(items('hw-repinned')).toEqual(['r6']);
    const a = listAssignments().find((x) => x.id === 'hw-repinned')!;
    const [{ template }] = assignmentTemplates(a);
    expect(template).toBe(r6(HR));
    // The student's numbers come from the same seed as on 59f80b0, so they are the ones first given.
    const fresh = studentInstance(template, STUDENT, 'hw-repinned');
    expect(Object.keys(loadPinnedParams(STUDENT, 'hw-repinned', `${HR}@v1`)!).sort()).toEqual(Object.keys(r6(HR).params).sort());
    expect(fresh.parts.length).toBe(r6(HR).parts.length);
  });

  it('still keeps answers given on the plain revision on that revision', () => {
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-answered-later', '2026-11-26T00:30:00.000Z', [HR])]));
    savePinnedParams(STUDENT, 'hw-answered-later', `${HR}@v1`, baseParams(plain(HR)));
    const work: QuestionWork = Object.fromEntries(
      plain(HR).parts.map((p) => {
        const response = p.response.kind === 'mcq' ? { kind: 'mcq' as const, choice: 'A' } : { kind: 'numeric' as const, value: '1' };
        return [partId(p.label), { response, checked: response, last: { status: 'correct' as const, score: p.marks, max: p.marks, attempts: 1 }, attempts: 1 }];
      }),
    );
    saveWork(STUDENT, 'hw-answered-later', `${HR}@v1`, work);
    migrateStorage();
    expect(items('hw-answered-later')).toEqual([undefined]);
  });

  it('runs again in browsers where the first version of the repair already ran', () => {
    storage.setItem('rice-hw:repaired-builds:r6', '1');
    storage.setItem('rice-hw:assignments', JSON.stringify([assignment('hw-second-pass', '2026-11-26T01:00:00.000Z', [HR])]));
    savePinnedParams(STUDENT, 'hw-second-pass', `${HR}@v1`, baseParams(plain(HR)));
    migrateStorage();
    expect(items('hw-second-pass')).toEqual(['r6']);
  });
});
