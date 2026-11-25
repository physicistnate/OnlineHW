import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Nuclear masses (u): atomic masses minus Z electron masses. */
const NUCLIDES: Record<string, { name: string; sym: string; Z: number; A: number; M: number }> = {
  He4: { name: 'helium-4', sym: 'He', Z: 2, A: 4, M: 4.001505 },
  Li7: { name: 'lithium-7', sym: 'Li', Z: 3, A: 7, M: 7.014356 },
  Be9: { name: 'beryllium-9', sym: 'Be', Z: 4, A: 9, M: 9.009987 },
  C12: { name: 'carbon-12', sym: 'C', Z: 6, A: 12, M: 11.996706 },
  N14: { name: 'nitrogen-14', sym: 'N', Z: 7, A: 14, M: 13.999231 },
  O16: { name: 'oxygen-16', sym: 'O', Z: 8, A: 16, M: 15.990523 },
  Ne20: { name: 'neon-20', sym: 'Ne', Z: 10, A: 20, M: 19.98695 },
  Mg24: { name: 'magnesium-24', sym: 'Mg', Z: 12, A: 24, M: 23.978454 },
  Si28: { name: 'silicon-28', sym: 'Si', Z: 14, A: 28, M: 27.969241 },
  Ca40: { name: 'calcium-40', sym: 'Ca', Z: 20, A: 40, M: 39.951611 },
  Fe56: { name: 'iron-56', sym: 'Fe', Z: 26, A: 56, M: 55.920662 },
  Ni62: { name: 'nickel-62', sym: 'Ni', Z: 28, A: 62, M: 61.912973 },
  U235: { name: 'uranium-235', sym: 'U', Z: 92, A: 235, M: 234.99342 },
  U238: { name: 'uranium-238', sym: 'U', Z: 92, A: 238, M: 238.000279 },
};

export default defineQuestion({
  id: 'ibp-e3-binding-energy',
  version: 1,
  title: 'Mass defect and binding energy of a nucleus',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.1', 'ibp.E.3.2', 'ibp.E.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    n: { choices: Object.keys(NUCLIDES), base: 'Fe56' },
  },

  compute: (p, c) => {
    const x = NUCLIDES[p.n as string];
    const N = x.A - x.Z;
    const parts = x.Z * IB.mpU + N * IB.mnU;
    const dm = parts - x.M;
    const BE = c.carry(dm, 'dm') * IB.uMeV;
    const perNucleon = c.carry(BE, 'BE') / x.A;
    return { N, parts, dm, BE, perNucleon, A: x.A, Z: x.Z };
  },

  stem: ({ p }) => {
    const x = NUCLIDES[p.n as string];
    return `The mass of a nucleus of ${x.name}, $\\,{}^{${x.A}}_{${x.Z}}\\mathrm{${x.sym}}$, is ${x.M} u. The mass of a proton is 1.007276 u, the mass of a neutron is 1.008665 u, and 1 u is equivalent to 931.5 MeV.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the mass defect of the nucleus, in u.',
      response: { kind: 'numeric', answer: 'dm', symbol: '\\Delta m', unit: 'u', positive: true },
      solution: ({ p, r }) => {
        const x = NUCLIDES[p.n as string];
        return [
          {
            text: `The nucleus contains ${x.Z} protons and ${x.A} − ${x.Z} = ${r.N} neutrons. The mass defect is the mass of the separate nucleons minus the mass of the nucleus (keep all the decimal places: the difference is small).`,
            math: tex`\Delta m = Zm_p + Nm_n - M = ${x.Z} \times 1.007276 + ${r.N} \times 1.008665 - ${x.M} = ${fmtA(r.dm)}\ ${u('u')}`,
          },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Total mass of the separate nucleons' }, { mark: tex`$\Delta m = ${fmtA(r.dm)}\ ${u('u')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the binding energy of the nucleus, in MeV.',
      response: { kind: 'numeric', answer: 'BE', symbol: 'E_B', unit: 'MeV', positive: true },
      solution: ({ r }) => [
        {
          text: 'The binding energy is the energy equivalent of the mass defect ($E = mc^2$): the energy needed to separate the nucleus completely into its nucleons.',
          math: tex`E_B = ${fmtW(r.dm)} \times 931.5 = ${fmtA(r.BE)}\ ${u('MeV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E_B = ${fmtA(r.BE)}\ ${u('MeV')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the binding energy per nucleon.',
      response: { kind: 'numeric', answer: 'perNucleon', symbol: '\\dfrac{E_B}{A}', unit: 'MeV', positive: true },
      solution: ({ r }) => [
        { math: tex`\frac{E_B}{A} = \frac{${fmtW(r.BE)}}{${r.A}} = ${fmtA(r.perNucleon)}\ ${u('MeV')}` },
        { text: 'The binding energy per nucleon is greatest, about 8.8 MeV, near iron-56 and nickel-62: the most tightly bound nuclei.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.perNucleon)}\ ${u('MeV')}$ per nucleon` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which property of the strong nuclear force explains why nuclei hold together?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is attractive between all nucleons, stronger than the electric repulsion between protons, but acts only over about $10^{-15}$ m.', correct: true },
          { text: 'It acts only between protons and has an infinite range.' },
          { text: 'It is a repulsive force between neutrons that balances gravity.' },
          { text: 'It is the gravitational attraction between the very dense nucleons.' },
        ],
      },
      solution: () => [
        {
          text: 'The strong nuclear force attracts protons and neutrons alike. At nuclear distances it is much stronger than the electric repulsion between protons, but it becomes negligible beyond a few femtometres.',
        },
      ],
      markscheme: () => [{ note: 'Short-range attractive force between nucleons.' }],
    },
  ],
});
