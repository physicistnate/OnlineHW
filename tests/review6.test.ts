/**
 * Review round 6: follow-through in the Theme E questions (with the submissions the review
 * used), physics wording, derivations kept for paper, the HR diagram, and the course named
 * on printed papers.
 */
import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS, getQuestion } from '../src/content/registry';
import { gradePart } from '../src/engine/grading';
import { buildInstance, instantiate } from '../src/engine/instance';
import type { ParamSpecs } from '../src/engine/params';
import type { PartResponse } from '../src/engine/types';

const num = (value: string): PartResponse => ({ kind: 'numeric', value });
const base = (id: string) => {
  const q = getQuestion(id)!;
  const inst = instantiate(q, null);
  const part = (label: string) => inst.parts.find((p) => p.label === label)!;
  return { q, inst, part };
};

describe('follow-through from wrong earlier answers (the review’s submissions)', () => {
  it('Compton scattering: (c) follows from the submitted λf alone, never mixed with the original shift', () => {
    // Base: λi = 10 pm, θ = 90°, so Δλ = 2.43 pm and λf = 12.4 pm. A student who writes 20 pm in (b)
    // and uses it correctly gets 1243(1/10 − 1/20) = 62.15 keV. 15.08 keV mixes 20 pm with the
    // original shift and must not be accepted.
    const { q, inst, part } = base('ibp-e2-compton-scattering');
    const [a, b, c] = [part('(a)'), part('(b)'), part('(c)')];
    for (const withA of [{}, { [a.id]: num('2.43') }]) {
      const ecf = gradePart(q, inst, c, { ...withA, [b.id]: num('20'), [c.id]: num('62.15') });
      expect(ecf.status).toBe('correct');
      expect(ecf.ecf).toBe(true);
      expect(gradePart(q, inst, c, { ...withA, [b.id]: num('20'), [c.id]: num('15.08') }).status).toBe('incorrect');
    }
    expect(gradePart(q, inst, c, { [b.id]: num('12.4'), [c.id]: num('24.3') }).status).toBe('correct');
  });

  it('half-life graph: four half-lives of the half-life read in (a)', () => {
    const { q, inst, part } = base('ibp-e3-half-life-graph'); // base half-life 4 h
    const ecf = gradePart(q, inst, part('(c)'), { [part('(a)').id]: num('12'), [part('(c)').id]: num('48') });
    expect(ecf.status).toBe('correct');
    expect(ecf.ecf).toBe(true);
    expect(gradePart(q, inst, part('(c)'), { [part('(c)').id]: num('16') }).status).toBe('correct');
  });

  it('de Broglie electrons: the momentum uses the kinetic energy from (a)', () => {
    // √(2 × 9.11 × 10⁻³¹ × 3.20 × 10⁻¹⁷) = 7.64 × 10⁻²⁴ kg m s⁻¹.
    const { q, inst, part } = base('ibp-e2-de-broglie-electrons');
    const ecf = gradePart(q, inst, part('(b)'), { [part('(a)').id]: num('3.20e-17'), [part('(b)').id]: num('7.64e-24') });
    expect(ecf.status).toBe('correct');
    expect(ecf.ecf).toBe(true);
  });

  it('photoelectric graph: the work function uses both graph readings', () => {
    // 7.0 × 10⁻³⁴ × 8.0 × 10¹⁴ / 1.60 × 10⁻¹⁹ = 3.50 eV.
    const { q, inst, part } = base('ibp-e2-photoelectric-graph');
    const responses = { [part('(a)').id]: num('8.0e14'), [part('(b)').id]: num('7.0e-34'), [part('(c)').id]: num('3.50') };
    const ecf = gradePart(q, inst, part('(c)'), responses);
    expect(ecf.status).toBe('correct');
    expect(ecf.ecf).toBe(true);
  });

  it('sledge: the work done by friction is minus the work found in (a)', () => {
    const { q, inst, part } = base('ibp-a3-sledge-pull');
    const exact = inst.parts[0].response.kind === 'numeric' ? inst.parts[0].response.range.exact : NaN;
    const wrong = Math.round(exact * 1.2);
    const ecf = gradePart(q, inst, part('(c)'), { [part('(a)').id]: num(String(wrong)), [part('(c)').id]: num(String(-wrong)) });
    expect(ecf.status).toBe('correct');
    expect(ecf.ecf).toBe(true);
  });
});

describe('derivations are written questions on paper, not hidden inside online parts', () => {
  it('no online part asks for a derivation unless it says only the value is marked', () => {
    const asks = /\b(show that|derive|prove|solve for)\b/i;
    const offending: string[] = [];
    for (const q of ALL_QUESTIONS) {
      for (const part of instantiate(q, null).parts) {
        if (asks.test(part.prompt) && !/only the [^.]* is marked here/.test(part.prompt)) offending.push(`${q.id} ${part.label}`);
      }
    }
    expect(offending).toEqual([]);
  });

  it('the generator and Kelvin–Helmholtz derivations are paper-only written parts with rubrics', () => {
    for (const id of ['ump-t5-isotope-generator', 'ump-t7-kelvin-helmholtz']) {
      const inst = instantiate(getQuestion(id)!, null);
      expect(inst.extensions.length, id).toBe(1);
      expect(inst.extensions[0].prompt).toMatch(/^Show (by integration )?that/);
      expect(inst.extensions[0].markscheme.filter((l) => 'mark' in l).length).toBeGreaterThanOrEqual(inst.extensions[0].marks);
      expect(inst.parts[0].prompt).toMatch(/only the [^.]* is marked here/);
    }
  });
});

describe('physics wording', () => {
  const texts = (id: string) => {
    const inst = instantiate(getQuestion(id)!, null);
    return [inst.stem, ...inst.parts.flatMap((p) => [p.prompt, ...p.solution.map((s) => s.text ?? ''), ...(p.response.kind === 'mcq' ? p.response.options.map((o) => o.text ?? '') : [])])].join(' ');
  };
  it('the end of fusion is put at the iron group, not at iron alone', () => {
    const t = texts('ibp-e5-stellar-evolution');
    expect(t).toMatch(/Iron-group nuclei \(iron and nickel\) have the greatest binding energy per nucleon/);
    expect(t).toMatch(/nickel-62 is the most tightly bound/);
    expect(t).not.toMatch(/Iron has the greatest/);
  });
  it('the exoplanet reflects a fraction a and emits with emissivity 1', () => {
    const t = texts('ump-t7-planet-temperature');
    expect(t).toMatch(/reflects a fraction/);
    expect(t).toMatch(/emissivity 1/);
    expect(t).not.toMatch(/star and the planet as blackbodies/);
  });
  it('the calcium H and K lines are from singly ionized calcium, and the lab gas is the same species', () => {
    const q = getQuestion('ibp-e1-star-absorption')!;
    const baseValues = Object.fromEntries(Object.entries(q.params as ParamSpecs).map(([k, spec]) => [k, spec.base]));
    const inst = (el: string) => buildInstance(q, { ...baseValues, el }, null);
    for (const el of ['Ca-393', 'Ca-397']) {
      const i = inst(el);
      expect(i.stem).toMatch(/singly ionized calcium/);
      expect(i.parts[2].prompt).toMatch(/singly ionized calcium.*the same particles/);
    }
  });
  it('the fusion rate and the nuclear timescale say to neglect neutrino losses', () => {
    expect(texts('ibp-e5-star-fusion')).toMatch(/Neglect the small fraction of this energy carried away by neutrinos/);
    expect(texts('ump-t7-kelvin-helmholtz')).toMatch(/Neglect the small share of the energy carried away by neutrinos/);
  });
});

describe('the HR question reads an actual HR diagram', () => {
  const q = getQuestion('ibp-e5-hr-diagram')!;
  const specs = q.params as ParamSpecs;
  const choicesOf = (name: string) => (specs[name] as unknown as { choices: string[] }).choices;
  const combos = choicesOf('set').flatMap((set) =>
    choicesOf('order').flatMap((order) => choicesOf('pair').flatMap((pair) => choicesOf('peak').map((peak) => ({ set, order, pair, peak })))),
  );
  const onGrid = (T: number, L: number) => [40000, 20000, 10000, 5000, 2500].includes(T) && Number.isInteger(Math.log10(L)) && L >= 1e-4 && L <= 1e6;

  it('every version draws four lettered stars and the Sun, on gridlines, one in each region', async () => {
    const { hrRegion } = await import('../src/engine/hr');
    for (const params of combos) {
      const inst = buildInstance(q, params, null);
      const fig = inst.figure as { kind: string; stars: { label: string; T: number; L: number }[]; sun?: boolean };
      expect(fig.kind).toBe('hr');
      expect(fig.sun).toBe(true);
      expect(fig.stars.map((s) => s.label)).toEqual(['A', 'B', 'C', 'D']);
      for (const s of fig.stars) expect(onGrid(s.T, s.L), `${JSON.stringify(params)} star ${s.label}`).toBe(true);
      expect(new Set(fig.stars.map((s) => hrRegion(s.T, s.L)))).toEqual(new Set(['white dwarf', 'main sequence', 'giant', 'supergiant']));
      // The keyed answer to (b) is the star drawn in the main-sequence band.
      const b = inst.parts.find((p) => p.label === '(b)')!.response;
      const letter = b.kind === 'mcq' ? b.options.find((o) => o.correct)!.text!.slice(-1) : '';
      const ms = fig.stars.find((s) => s.label === letter)!;
      expect(hrRegion(ms.T, ms.L)).toBe('main sequence');
    }
  });

  it('the Sun is on the main sequence, and the diagram stays within its axes', async () => {
    const { hrRegion } = await import('../src/engine/hr');
    expect(hrRegion(5800, 1)).toBe('main sequence');
  });

  it('the star choices stay in order A–D for every student, while the correct letter varies', () => {
    const letters = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const inst = instantiate(q, `student${i}::hw`);
      const b = inst.parts[1].response;
      if (b.kind !== 'mcq') throw new Error('expected multiple choice');
      expect(b.options.map((o) => o.text)).toEqual(['Star A', 'Star B', 'Star C', 'Star D']);
      letters.add(b.options.find((o) => o.correct)!.text!);
    }
    expect(letters.size).toBeGreaterThan(2);
  });

  it('(a) reads a temperature and uses Wien’s law; (c) uses R ∝ √L / T²', () => {
    // Base: star C is the red giant at 5000 K, so λmax = 2.9 × 10⁻³ / 5000 = 580 nm. In (c), star C
    // (5000 K, 10² L☉) and star B (main sequence, 10 000 K, 10² L☉): ratio (10 000/5000)² = 4.
    const inst = instantiate(q, null);
    const a = inst.parts.find((p) => p.label === '(a)')!;
    expect(a.prompt).toMatch(/star C/);
    expect(a.response.kind === 'numeric' && a.response.range.exact).toBeCloseTo(580, 6);
    const c = inst.parts.find((p) => p.label === '(c)')!;
    expect(c.prompt).toMatch(/R_C.*R_B/);
    expect(c.response.kind === 'numeric' && c.response.range.exact).toBe(4);
  });
});

describe('papers and labels name the course the assignment was made for', () => {
  it('shared SL questions are named HL in an HL assignment, and keep their own course elsewhere', async () => {
    const { IB_PHYSICS_HL, IB_PHYSICS_SL, AP_PHYSICS_C_MECH, courseIncludes, courseOfQuestionIn } = await import('../src/content/catalog');
    const laser = getQuestion('ibp-e1-laser-photons')!; // an SL question, shared with HL
    const compton = getQuestion('ibp-e2-compton-scattering')!; // HL only
    const ap = getQuestion('apcm-u3-dot-product')!;
    expect(courseOfQuestionIn(laser, IB_PHYSICS_HL).name).toBe('IB Physics HL');
    expect(courseOfQuestionIn(laser, IB_PHYSICS_SL).name).toBe('IB Physics SL');
    expect(courseOfQuestionIn(laser).name).toBe('IB Physics SL');
    expect(courseOfQuestionIn(compton, IB_PHYSICS_SL).name).toBe('IB Physics HL'); // SL does not contain it
    expect(courseOfQuestionIn(ap, IB_PHYSICS_HL).name).toBe('AP Physics C: Mechanics');
    expect(courseIncludes(IB_PHYSICS_HL, laser) && !courseIncludes(IB_PHYSICS_SL, compton) && courseIncludes(AP_PHYSICS_C_MECH, ap)).toBe(true);
  });
});
