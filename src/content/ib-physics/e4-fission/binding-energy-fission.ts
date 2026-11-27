import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Binding energy per nucleon (MeV, 3 s.f.) of uranium-235 and pairs of fission fragments. */
const BE_U = 7.59;
/** Rounds to 2 decimal places, removing floating-point noise from exact totals. */
const two = (x: number) => Number(x.toFixed(2));
const PAIRS: Record<string, { a: string; Aa: number; ea: number; b: string; Ab: number; eb: number }> = {
  BaKr: { a: 'barium-141', Aa: 141, ea: 8.33, b: 'krypton-92', Ab: 92, eb: 8.51 },
  XeSr: { a: 'xenon-140', Aa: 140, ea: 8.29, b: 'strontium-94', Ab: 94, eb: 8.59 },
  CsRb: { a: 'caesium-137', Aa: 137, ea: 8.39, b: 'rubidium-96', Ab: 96, eb: 8.41 },
  LaBr: { a: 'lanthanum-147', Aa: 147, ea: 8.22, b: 'bromine-87', Ab: 87, eb: 8.61 },
};

export default defineQuestion({
  id: 'ibp-e4-binding-energy-fission',
  version: 1,
  title: 'Fission energy from binding energies per nucleon',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.4',
  standards: ['ibp.E.4.1'],
  uses: ['ibp.E.3.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    pair: { choices: Object.keys(PAIRS), base: 'BaKr' },
    P: { min: 500, max: 3000, step: 100, base: 3000 },
  },

  compute: (p, c) => {
    const x = PAIRS[p.pair as string];
    // Each total is exact to 2 decimal places (a whole number times a 3 s.f. value);
    // students write them in full because the energy released is a small difference.
    const BU = two(235 * BE_U);
    const Ba = two(x.Aa * x.ea);
    const Bb = two(x.Ab * x.eb);
    const E = Ba + Bb - BU;
    c.assume(E > 0);
    const rate = (p.P * 1e6) / (c.carry(E, 'E') * 1e6 * IB.e);
    return { BU, Ba, Bb, E, rate };
  },

  stem: ({ p }) => {
    const x = PAIRS[p.pair as string];
    return `When uranium-235 absorbs a neutron, it can split into ${x.a} and ${x.b}, releasing neutrons. The binding energies per nucleon are: uranium-235 ${BE_U} MeV, ${x.a} ${x.ea} MeV, ${x.b} ${x.eb} MeV.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the total binding energy of a uranium-235 nucleus.',
      response: { kind: 'numeric', answer: 'BU', symbol: 'E_B', unit: 'MeV', positive: true },
      solution: ({ r }) => [{ math: tex`E_B = 235 \times ${BE_U} = ${r.BU}\ ${u('MeV')} \approx ${fmtA(r.BU)}\ ${u('MeV')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.BU)}\ ${u('MeV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the energy released in this fission.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'MeV', positive: true },
      solution: ({ p, r }) => {
        const x = PAIRS[p.pair as string];
        return [
          {
            text: 'Free neutrons have no binding energy. The energy released is the increase in total binding energy: the products are more tightly bound.',
            math: tex`${x.Aa} \times ${x.ea} = ${r.Ba}\ ${u('MeV')}, \qquad ${x.Ab} \times ${x.eb} = ${r.Bb}\ ${u('MeV')}`,
          },
          { math: tex`E = ${r.Ba} + ${r.Bb} - ${r.BU} = ${fmtWA(r.E)}\ ${u('MeV')}` },
          { text: 'Keep every figure of the totals here: the energy released is a small difference between large numbers.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Energy released = binding energy of products − binding energy of uranium-235' }, { mark: tex`$E = ${fmtA(r.E)}\ ${u('MeV')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `A reactor produces thermal power of ${Q(d.P, 'MW')} from fissions like this. Calculate the number of fissions each second.`,
      response: { kind: 'numeric', answer: 'rate', symbol: '\\text{fissions per second}', unit: 's-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Convert the energy of one fission to joules ($1\\ \\mathrm{MeV} = 1.60 \\times 10^{-13}$ J).',
          math: tex`\frac{${d.P} \times 10^{6}}{${fmtW(r.E)} \times 1.60 \times 10^{-13}} = ${fmtA(r.rate)}\ ${u('s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Power ÷ energy per fission, in joules' }, { mark: tex`$${fmtA(r.rate)}\ ${u('s-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does the fission of uranium-235 release energy?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The fragments have a greater binding energy per nucleon than uranium-235, so they are more tightly bound.', correct: true },
          { text: 'The fragments have a smaller binding energy per nucleon, so energy is left over.' },
          { text: 'The neutron brings in all the energy that is released.' },
          { text: 'Mass is created when the nucleus splits.' },
        ],
      },
      solution: () => [
        {
          text: 'Binding energy per nucleon peaks near iron. Heavy nuclei such as uranium are less tightly bound than medium nuclei, so splitting them increases the total binding energy; the difference is released, and the products have less mass than the reactants.',
        },
      ],
      markscheme: () => [{ note: 'Products have greater binding energy per nucleon.' }],
    },
  ],
});
