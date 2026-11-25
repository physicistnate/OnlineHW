/**
 * Review round 5 and the builder changes: follow-through that the printed keys promise,
 * key names by exam style, papers that mix courses, and editing a saved assignment's
 * questions (questions it already had keep their pinned version).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { KEY_NAMES, keyNamesPhrase, sharedKeyName } from '../src/config/site';
import { AP_PHYSICS_C_MECH, IB_PHYSICS_HL, IB_PHYSICS_SL, UNIVERSITY_PHYSICS_1, courseOfQuestion, printInstructionsFor } from '../src/content/catalog';
import { getQuestion } from '../src/content/registry';
import { gradePart } from '../src/engine/grading';
import { instantiate } from '../src/engine/instance';
import type { PartResponse } from '../src/engine/types';
import { DEFAULT_SETTINGS, SAMPLE_ID, createAssignment, getAssignment, updateAssignment } from '../src/store/assignments';

const num = (value: string): PartResponse => ({ kind: 'numeric', value });

describe('follow-through promised by the printed keys', () => {
  it('AP quartic potential: (d) uses the equilibrium position the student found in (b)', () => {
    // Base: a = 1.5, b = 3, m = 0.5, so x = 1 m and the critical speed is 2.45 m/s.
    // With a wrong x = 0.50 m: ΔU = 3(0.25) − 1.5(0.0625) = 0.656 J, so v = 1.62 m/s.
    const q = getQuestion('apcm-u3-potential-function')!;
    const inst = instantiate(q, null);
    const b = inst.parts.find((p) => p.label === '(b)')!;
    const d = inst.parts.find((p) => p.label === '(d)')!;
    const ecf = gradePart(q, inst, d, { [b.id]: num('0.50'), [d.id]: num('1.62') });
    expect(ecf.status).toBe('correct');
    expect(ecf.ecf).toBe(true);
    expect(gradePart(q, inst, d, { [b.id]: num('1'), [d.id]: num('2.45') }).status).toBe('correct');
    expect(gradePart(q, inst, d, { [b.id]: num('0.50'), [d.id]: num('2.0') }).status).toBe('incorrect');
  });

  it('home load profile: the cost uses the daily total from (a) as well as the peak energy from (b)', () => {
    // Base: 28.8 kW h a day, 8.766 kW h at peak, 45 and 15 cents. With a total of 40 kW h:
    // (8.766 × 45 + 31.23 × 15) / 100 = 8.63 dollars.
    const q = getQuestion('up1-t3-home-load-profile')!;
    const inst = instantiate(q, null);
    const [a, b, c] = inst.parts;
    const ecf = gradePart(q, inst, c, { [a.id]: num('40'), [b.id]: num('8.77'), [c.id]: num('8.63') });
    expect(ecf.status).toBe('correct');
    expect(ecf.ecf).toBe(true);
    expect(gradePart(q, inst, c, { [a.id]: num('28.8'), [b.id]: num('8.77'), [c.id]: num('6.95') }).status).toBe('correct');
  });
});

describe('physics fixes', () => {
  it('the reversed ramp is compared only when the crate is pushed the whole length', () => {
    const inst = instantiate(getQuestion('up1-t3-ramp-variable-friction')!, null);
    const d = inst.parts.find((p) => p.label === '(d)')!;
    expect(d.prompt).toMatch(/push/);
    expect(d.solution.map((s) => s.text).join(' ')).toMatch(/would not start/);
  });

  it('the bounded-motion question states U(x0) < E < 0', () => {
    const inst = instantiate(getQuestion('up1-t3-potential-well')!, null);
    expect(inst.parts.find((p) => p.label === '(d)')!.prompt).toMatch(/U\(x_0\) < E < 0/);
  });

  it('the AP potential question asks for a critical speed', () => {
    const inst = instantiate(getQuestion('apcm-u3-potential-function')!, null);
    expect(inst.parts.find((p) => p.label === '(d)')!.prompt).toMatch(/critical speed/);
  });

  it('AP questions are labelled as problem sets, and some have printable derivations', () => {
    const ap = ['variable-force', 'potential-function', 'incline-friction'].map((x) => getQuestion(`apcm-u3-${x}`)!);
    for (const q of ap) {
      expect(q.paper).toBe('AP-style problem set');
      expect(q.extensions?.length).toBeGreaterThan(0);
    }
  });
});

describe('key names by exam style', () => {
  it('names each style’s key, and one name only when all the questions share it', () => {
    expect(KEY_NAMES).toEqual({ IB: 'Markscheme', AP: 'Scoring guidelines', General: 'Grading rubric' });
    expect(sharedKeyName(['AP', 'AP'])).toBe('Scoring guidelines');
    expect(sharedKeyName(['IB', 'AP'])).toBeNull();
    expect(keyNamesPhrase(['IB', 'AP', 'IB'])).toBe('markscheme and scoring guidelines');
    expect(keyNamesPhrase(['IB', 'AP', 'General'])).toBe('markscheme, scoring guidelines and grading rubric');
  });
});

describe('papers that mix courses', () => {
  it('labels questions with their course (HL-level IB questions as HL)', () => {
    expect(courseOfQuestion(getQuestion('ibp-a2-collision-2d')!).id).toBe(IB_PHYSICS_HL.id);
    expect(courseOfQuestion(getQuestion('ibp-a2-lift-scales')!).id).toBe(IB_PHYSICS_SL.id);
    expect(courseOfQuestion(getQuestion('apcm-u3-loop-the-loop')!).id).toBe(AP_PHYSICS_C_MECH.id);
  });

  it('prints one course’s instructions, or instructions that suit a mix', () => {
    expect(printInstructionsFor([IB_PHYSICS_SL, IB_PHYSICS_HL])).toBe(IB_PHYSICS_SL.printInstructions);
    expect(printInstructionsFor([AP_PHYSICS_C_MECH, AP_PHYSICS_C_MECH])).toBe(AP_PHYSICS_C_MECH.printInstructions);
    const mixed = printInstructionsFor([IB_PHYSICS_SL, AP_PHYSICS_C_MECH, UNIVERSITY_PHYSICS_1]).join(' ');
    expect(mixed).toMatch(/labelled with its course/);
    expect(mixed).toMatch(/10 for AP/);
  });
});

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
}

describe('editing a saved assignment’s questions', () => {
  beforeEach(() => {
    (globalThis as { window?: unknown }).window = { localStorage: new MemoryStorage(), addEventListener() {}, removeEventListener() {} };
  });

  it('keeps the pinned versions of questions it already had and pins new ones, in the new order', () => {
    const ib = getQuestion('ibp-a3-sledge-pull')!;
    const ap = getQuestion('apcm-u3-dot-product')!;
    const uni = getQuestion('up1-t3-pumping-tank')!;
    const a = createAssignment('Mixed', IB_PHYSICS_SL.id, [ib.id, ap.id], DEFAULT_SETTINGS)!;
    // Pretend the IB question was assigned at an older version.
    const raw = JSON.parse((globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.getItem('rice-hw:assignments')!);
    raw[0].items[0].version = 0;
    (globalThis as unknown as { window: { localStorage: MemoryStorage } }).window.localStorage.setItem('rice-hw:assignments', JSON.stringify(raw));

    expect(updateAssignment(a.id, 'Mixed set', IB_PHYSICS_SL.id, [uni.id, ib.id], { ...DEFAULT_SETTINGS, maxAttempts: 2 })).toBe(true);
    const after = getAssignment(a.id)!;
    expect(after.title).toBe('Mixed set');
    expect(after.items).toEqual([
      { id: uni.id, version: uni.version },
      { id: ib.id, version: 0 }, // kept as assigned
    ]);
    expect(after.settings.maxAttempts).toBe(2);
    expect(updateAssignment(SAMPLE_ID, 'x', IB_PHYSICS_SL.id, [ib.id], DEFAULT_SETTINGS)).toBe(false); // the sample's questions are fixed
  });
});
