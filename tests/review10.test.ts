/**
 * Review 10 (the Codex review of Theme B): follow-through from earlier answers in the
 * internal-resistance, phone-battery and power-station questions; the effective radiating
 * temperature made explicit; a reversible adiabatic change; Kirchhoff's laws in B.5; and
 * an assignment an earlier repair had wrongly stamped with build r6.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { findStandard } from '../src/content/catalog';
import { getQuestion, resolveQuestion } from '../src/content/registry';
import { gradePart } from '../src/engine/grading';
import { buildInstance, instantiate, partId } from '../src/engine/instance';
import type { ParamSpecs } from '../src/engine/params';
import type { AnyTemplate, PartResponse } from '../src/engine/types';
import { DEFAULT_SETTINGS, listAssignments, type Assignment } from '../src/store/assignments';
import { migrateStorage } from '../src/store/migrate';
import { savePinnedParams, saveWork, type QuestionWork } from '../src/store/progress';

const num = (value: string): PartResponse => ({ kind: 'numeric', value });
const text = (parts: { text?: string; math?: string }[]) => parts.map((s) => `${s.text ?? ''} ${s.math ?? ''}`).join(' ');

describe('follow-through from earlier answers', () => {
  it('internal resistance: (c) and (d) follow on from the emf and internal resistance the student read', () => {
    const t = getQuestion('ibp-b5-internal-resistance')!;
    const inst = instantiate(t, null); // base: ε = 3.0 V, r = 1.0 Ω, R = 4 Ω
    const [a, b, c, d] = inst.parts;
    const given = { [a.id]: num('2.8'), [b.id]: num('1.2') };
    const sc = gradePart(t, inst, c, { ...given, [c.id]: num('2.33') }); // 2.8/1.2
    expect(sc.status).toBe('correct');
    expect(sc.ecf).toBe(true);
    const pw = gradePart(t, inst, d, { ...given, [d.id]: num('1.16') }); // (2.8/5.2)² × 4
    expect(pw.status).toBe('correct');
    expect(pw.ecf).toBe(true);
  });

  it('phone battery: the electron count follows on from the charge, like the energy and the time', () => {
    const t = getQuestion('ibp-b5-phone-battery')!;
    const inst = instantiate(t, null); // base: 4000 mA h → 14 400 C
    const [a, b] = inst.parts;
    // 16 400 C is clearly wrong (15 000 would pass as a 2-s.f. rounding of 14 400).
    const res = gradePart(t, inst, b, { [a.id]: num('16400'), [b.id]: num((16400 / 1.6e-19).toPrecision(3)) });
    expect(res.status).toBe('correct');
    expect(res.ecf).toBe(true);
  });

  it('power station: the entropy follows on from a wrong waste heat by either route to the heat input', () => {
    const t = getQuestion('ibp-b4-power-station-entropy')!;
    const inst = instantiate(t, null); // base: 550 °C, 25 °C, 1000 MW, η = 0.38
    const [, b, c] = inst.parts;
    for (const dS of ['1.58e5', '9.26e5']) {
      // 1000 MW of waste heat with the input P/η = 2632 MW, or with P + 1000 MW = 2000 MW.
      const res = gradePart(t, inst, c, { [b.id]: num('1000'), [c.id]: num(dS) });
      expect(res.status, dS).toBe('correct');
      expect(res.ecf).toBe(true);
    }
    expect(inst.stem).toMatch(/ideal reservoirs whose temperatures do not change/);
  });
});

describe('physics wording', () => {
  it('planet temperatures: the comparison uses the effective radiating temperature at the mean distance', () => {
    const t = getQuestion('ibp-b2-planet-temperatures')!;
    const inst = buildInstance(t, { body: 'mercury', pos: 'perihelion' });
    expect(inst.parts[1].prompt).toMatch(/emissivity 1/);
    expect(inst.parts[1].prompt).toMatch(/effective radiating temperature/);
    expect(inst.parts[2].prompt).toMatch(/mean distance/);
    // At perihelion Mercury's effective temperature is about 491 K; the comparison uses 437 K at the mean distance.
    expect(inst.parts[2].prompt).toMatch(/about 43\d K/);
    expect(text(inst.parts[2].solution)).not.toMatch(/49\d K/);
  });

  it('Earth’s energy balance: albedo kept, emissivity 1, and the surface compared with the effective radiating temperature', () => {
    const inst = instantiate(getQuestion('ibp-b2-earth-balance')!, null);
    expect(inst.parts[1].prompt).toMatch(/emissivity 1/);
    expect(inst.parts[3].prompt).toMatch(/effective radiating temperature/);
  });

  it('adiabatic compression: pV^(5/3) = constant is stated for a reversible adiabatic change', () => {
    const inst = instantiate(getQuestion('ibp-b4-adiabatic-compression')!, null);
    expect(inst.stem).toMatch(/reversible adiabatic change/);
  });
});

describe('Kirchhoff’s laws in B.5', () => {
  it('is a B.5 standard with its own question', () => {
    expect(findStandard('ibp.B.5.10')?.text).toMatch(/Kirchhoff/);
    expect(getQuestion('ibp-b5-kirchhoff-two-cells')!.standards).toContain('ibp.B.5.10');
  });

  it('marks the base version and follows on from a wrong current', () => {
    const t = getQuestion('ibp-b5-kirchhoff-two-cells')!;
    const inst = instantiate(t, null); // base: ε₁ = 9 V, ε₂ = 6.0 V, R₁ = 4 Ω, R₂ = 2 Ω, R₃ = 4 Ω → I₃ = 1.3125 A
    const [, , c, d, e] = inst.parts;
    expect(gradePart(t, inst, c, { [c.id]: num('1.31') }).status).toBe('correct');
    expect(gradePart(t, inst, e, { [e.id]: num('0.938') }).status).toBe('correct');
    const v = gradePart(t, inst, d, { [c.id]: num('1.5'), [d.id]: num('6.0') });
    expect(v.status).toBe('correct');
    expect(v.ecf).toBe(true);
    const i1 = gradePart(t, inst, e, { [c.id]: num('1.5'), [d.id]: num('6.0'), [e.id]: num('0.75') });
    expect(i1.status).toBe('correct');
    expect(i1.ecf).toBe(true);
  });
});

// ---------- An assignment an earlier repair wrongly stamped with build r6 ----------

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

describe('a version-1 assignment wrongly stamped with build r6', () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
    (globalThis as { window?: unknown }).window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
  });

  const STUDENT = 'PHYS1:alex';
  const HR = 'ibp-e5-hr-diagram';
  const r6 = (id: string) => resolveQuestion(id, 1, 'r6')!.template;
  const baseParams = (t: AnyTemplate) => Object.fromEntries(Object.entries(t.params as ParamSpecs).map(([k, s]) => [k, s.base])) as Record<string, string | number>;
  const stamped = (id: string, createdAt: string): Assignment => ({
    id,
    title: id,
    courseId: 'ib-physics-hl',
    items: [{ id: HR, version: 1, build: 'r6' }],
    createdAt,
    settings: { ...DEFAULT_SETTINGS },
  });
  const build = (id: string) => listAssignments().find((x) => x.id === id)!.items[0].build;

  it('puts an unanswered assignment made before 59f80b0 back on the first version 1, even after the second pass ran', () => {
    // Made before 59f80b0; opened (not answered) on 59f80b0, which re-pinned r6-shaped numbers; the first
    // pass then stamped it r6, and the second pass skipped it.
    storage.setItem('rice-hw:repaired-builds:r6', '1');
    storage.setItem('rice-hw:repaired-builds:r6-v2', '1');
    storage.setItem('rice-hw:assignments', JSON.stringify([stamped('hw-early-stamped', '2026-11-25T20:00:00.000Z')]));
    savePinnedParams(STUDENT, 'hw-early-stamped', `${HR}@v1`, baseParams(r6(HR)));
    migrateStorage();
    expect(build('hw-early-stamped')).toBeUndefined();
  });

  it('keeps build r6 where students answered on that revision', () => {
    storage.setItem('rice-hw:assignments', JSON.stringify([stamped('hw-early-answered', '2026-11-25T20:00:00.000Z')]));
    const work: QuestionWork = Object.fromEntries(
      r6(HR).parts.map((p) => {
        const response = p.response.kind === 'mcq' ? { kind: 'mcq' as const, choice: 'A' } : { kind: 'numeric' as const, value: '1' };
        return [partId(p.label), { response, checked: response, last: { status: 'correct' as const, score: p.marks, max: p.marks, attempts: 1 }, attempts: 1 }];
      }),
    );
    saveWork(STUDENT, 'hw-early-answered', `${HR}@v1`, work);
    migrateStorage();
    expect(build('hw-early-answered')).toBe('r6');
  });

  it('keeps build r6 on an unanswered assignment made while 59f80b0 was the latest build', () => {
    storage.setItem('rice-hw:assignments', JSON.stringify([stamped('hw-window', '2026-11-26T00:30:00.000Z')]));
    migrateStorage();
    expect(build('hw-window')).toBe('r6');
  });
});
