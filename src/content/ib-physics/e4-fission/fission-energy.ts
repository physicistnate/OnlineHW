import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const U235 = 235.04393;
const N = 1.008665;
/** Fission channels of uranium-235 after absorbing a neutron (atomic masses in u). */
const REACTIONS: Record<string, { a: string; ma: number; b: string; mb: number; n: number; eq: string }> = {
  BaKr: { a: 'barium-141', ma: 140.914411, b: 'krypton-92', mb: 91.926156, n: 3, eq: '{}^{141}_{56}\\mathrm{Ba} + {}^{92}_{36}\\mathrm{Kr} + 3\\,{}^{1}_{0}\\mathrm{n}' },
  XeSr: { a: 'xenon-140', ma: 139.92164, b: 'strontium-94', mb: 93.915361, n: 2, eq: '{}^{140}_{54}\\mathrm{Xe} + {}^{94}_{38}\\mathrm{Sr} + 2\\,{}^{1}_{0}\\mathrm{n}' },
  CsRb: { a: 'caesium-137', ma: 136.907089, b: 'rubidium-96', mb: 95.934273, n: 3, eq: '{}^{137}_{55}\\mathrm{Cs} + {}^{96}_{37}\\mathrm{Rb} + 3\\,{}^{1}_{0}\\mathrm{n}' },
  LaBr: { a: 'lanthanum-147', ma: 146.928235, b: 'bromine-87', mb: 86.920711, n: 2, eq: '{}^{147}_{57}\\mathrm{La} + {}^{87}_{35}\\mathrm{Br} + 2\\,{}^{1}_{0}\\mathrm{n}' },
};

export default defineQuestion({
  id: 'ibp-e4-fission-energy',
  version: 1,
  title: 'Energy released in the fission of uranium-235',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.4',
  standards: ['ibp.E.4.1'],
  uses: ['ibp.E.3.1', 'ibp.A.3.7'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 2,

  params: {
    rx: { choices: Object.keys(REACTIONS), base: 'BaKr' },
    m: { min: 0.5, max: 5, step: 0.5, base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const x = REACTIONS[p.rx as string];
    const before = U235 + N;
    const after = x.ma + x.mb + x.n * N;
    const dm = before - after;
    // A chain of four carried values: students keep 3 s.f. of each (2 s.f. at every
    // step could add up to more than 10 %).
    const E = c.carry(dm, 'dm', 3) * IB.uMeV; // MeV
    const nuclei = (p.m * 1e-3) / (U235 * IB.u);
    const EJ = c.carry(nuclei, undefined, 3) * c.carry(E, 'E', 3) * 1e6 * IB.e;
    const coal = c.carry(EJ, 'EJ') / 30e6; // kg
    return { before, after, dm, E, nuclei, EJ, coal };
  },

  stem: ({ p }) => {
    const x = REACTIONS[p.rx as string];
    return `A nucleus of uranium-235 absorbs a slow neutron and splits: $\\;{}^{235}_{92}\\mathrm{U} + {}^{1}_{0}\\mathrm{n} \\rightarrow ${x.eq}$. Atomic masses: uranium-235 ${U235} u, ${x.a} ${x.ma} u, ${x.b} ${x.mb} u; the mass of a neutron is ${N} u. 1 u is equivalent to 931.5 MeV.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the decrease in mass in this reaction, in u.',
      response: { kind: 'numeric', answer: 'dm', symbol: '\\Delta m', unit: 'u', positive: true },
      solution: ({ p, r }) => {
        const x = REACTIONS[p.rx as string];
        return [
          { text: 'Add up the masses on each side, keeping every decimal place (the difference is small).', math: tex`\text{before: } ${U235} + ${N} = ${r.before.toFixed(6)}\ ${u('u')}` },
          { math: tex`\text{after: } ${x.ma} + ${x.mb} + ${x.n} \times ${N} = ${r.after.toFixed(6)}\ ${u('u')}` },
          { math: tex`\Delta m = ${r.before.toFixed(6)} - ${r.after.toFixed(6)} = ${fmtA(r.dm)}\ ${u('u')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Total masses before and after' }, { mark: tex`$\Delta m = ${fmtA(r.dm)}\ ${u('u')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the energy released, in MeV.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'MeV', positive: true },
      solution: ({ r }) => [{ text: 'The lost mass is released as energy (mostly kinetic energy of the fragments).', math: tex`E = ${fmtW(r.dm)} \times 931.5 = ${fmtA(r.E)}\ ${u('MeV')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('MeV')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Calculate the energy released when ${Q(d.m, 'g')} of uranium-235 undergoes this fission.`,
      response: { kind: 'numeric', answer: 'EJ', symbol: 'E', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'Number of nuclei = mass ÷ mass of one atom.', math: tex`N = \frac{${d.m} \times 10^{-3}}{235.04 \times 1.661 \times 10^{-27}} = ${fmtW(r.nuclei)}` },
        { math: tex`E = ${fmtW(r.nuclei)} \times ${fmtW(r.E)} \times 1.60 \times 10^{-13} = ${fmtA(r.EJ)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Number of nuclei in the sample' }, { mark: tex`$E = ${fmtA(r.EJ)}\ ${u('J')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Coal releases about 30 MJ of energy per kilogram when it burns. Calculate the mass of coal that releases the same energy as in (c).',
      response: { kind: 'numeric', answer: 'coal', symbol: 'm', unit: 'kg', positive: true },
      solution: ({ r }) => [
        { math: tex`m = \frac{${fmtW(r.EJ)}}{30 \times 10^{6}} = ${fmtA(r.coal)}\ ${u('kg')}` },
        { text: 'A few grams of uranium release as much energy as tonnes of coal: the energy density of nuclear fuel is millions of times greater.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.coal)}\ ${u('kg')}$` }, { note: 'Allow ECF from (c).' }],
    },
  ],
});
