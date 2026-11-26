/**
 * Review round 7: revised questions keep their old revisions for old assignments, the HR
 * question's wording, and the generator derivation's two routes to full marks.
 */
import { describe, expect, it } from 'vitest';
import { ARCHIVED_REVISIONS } from '../src/content/archive';
import { getQuestion, resolveQuestion } from '../src/content/registry';
import { buildInstance, instantiate } from '../src/engine/instance';
import type { ParamSpecs } from '../src/engine/params';
import { workIdFor } from '../src/store/progress';

describe('revised questions keep their earlier revisions', () => {
  const revised = ['ibp-e5-hr-diagram', 'ump-t5-isotope-generator', 'ump-t7-kelvin-helmholtz', 'ibp-e2-compton-scattering'];

  it('each revised question is at version 2, and version 1 is archived for old assignments', () => {
    for (const id of revised) {
      expect(getQuestion(id)!.version, id).toBe(2);
      const old = resolveQuestion(id, 1)!;
      expect(old.exact, id).toBe(true);
      expect(old.template.version, id).toBe(1);
      expect(old.template).not.toBe(getQuestion(id));
      // Saved work is kept per revision, so answers to the old parts never land on the new ones.
      expect(workIdFor(old.template)).not.toBe(workIdFor(getQuestion(id)!));
    }
  });

  it('every archived revision still builds, with the marks it was assigned with', () => {
    const marks = (t: { parts: { marks: number }[] }) => t.parts.reduce((s, p) => s + p.marks, 0);
    for (const t of ARCHIVED_REVISIONS) {
      const inst = instantiate(t, null);
      expect(inst.parts.length, t.id).toBeGreaterThan(0);
      expect(getQuestion(t.id), t.id).toBeDefined();
      expect(t.version, t.id).toBeLessThan(getQuestion(t.id)!.version);
      expect(inst.totalMarks).toBe(marks(t));
    }
    // The two University questions had more online marks before their derivations moved to paper.
    expect(marks(resolveQuestion('ump-t5-isotope-generator', 1)!.template)).toBe(8);
    expect(marks(getQuestion('ump-t5-isotope-generator')!)).toBe(6);
    expect(marks(resolveQuestion('ump-t7-kelvin-helmholtz', 1)!.template)).toBe(8);
    expect(marks(getQuestion('ump-t7-kelvin-helmholtz')!)).toBe(7);
  });
});

describe('HR question wording', () => {
  const q = getQuestion('ibp-e5-hr-diagram')!;
  const specs = q.params as ParamSpecs;
  const choicesOf = (name: string) => (specs[name] as unknown as { choices: string[] }).choices;

  it('(b) asks about stars A to D, since the Sun (also on the main sequence) is drawn too', () => {
    expect(instantiate(q, null).parts[1].prompt).toBe('Which of the stars A to D is fusing hydrogen into helium in its core?');
  });

  it('(d) is explained from R ∝ √L / T² in every version, never by calling the star cool', () => {
    for (const set of choicesOf('set')) {
      for (const order of choicesOf('order')) {
        const inst = buildInstance(q, { set, order, pair: 'p1', peak: 'rg' }, null);
        const d = inst.parts[3];
        const text = d.solution.map((s) => s.text ?? '').join(' ');
        expect(text, `${set} ${order}`).toMatch(/\\sqrt\{\\dfrac\{L\}\{L_\\odot\}\}/);
        expect(text, `${set} ${order}`).not.toMatch(/\bcool\b/);
        // The keyed star is the one with the largest radius listed in the explanation.
        const radii = [...text.matchAll(/([A-D]) ([\d.]+)/g)].map((m) => ({ letter: m[1], R: Number(m[2]) }));
        const largest = radii.reduce((a, b) => (b.R > a.R ? b : a));
        const keyed = d.response.kind === 'mcq' ? d.response.options.find((o) => o.correct)!.text!.slice(-1) : '';
        expect(keyed, `${set} ${order}`).toBe(largest.letter);
      }
    }
  });
});

describe('the generator derivation gives full marks for deriving or for verifying', () => {
  it('has a complete rubric for each method', () => {
    const ext = instantiate(getQuestion('ump-t5-isotope-generator')!, null).extensions[0];
    const lines = ext.markscheme;
    const method2 = lines.findIndex((l) => 'note' in l && /Method 2, verify/.test(l.note));
    expect(method2).toBeGreaterThan(0);
    const marksIn = (from: number, to: number) => lines.slice(from, to).filter((l) => 'mark' in l).length;
    expect(marksIn(0, method2)).toBe(ext.marks);
    expect(marksIn(method2, lines.length)).toBe(ext.marks);
    expect(lines.slice(method2).map((l) => ('mark' in l ? l.mark : '')).join(' ')).toMatch(/initial condition/);
  });
});
