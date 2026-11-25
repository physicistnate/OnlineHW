import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const NUCLEI: Record<string, { name: string; sym: string; Z: number; A: number }> = {
  C: { name: 'carbon-12', sym: 'C', Z: 6, A: 12 },
  O: { name: 'oxygen-16', sym: 'O', Z: 8, A: 16 },
  Ne: { name: 'neon-20', sym: 'Ne', Z: 10, A: 20 },
  Si: { name: 'silicon-28', sym: 'Si', Z: 14, A: 28 },
  Ca: { name: 'calcium-40', sym: 'Ca', Z: 20, A: 40 },
  Fe: { name: 'iron-56', sym: 'Fe', Z: 26, A: 56 },
  Ni: { name: 'nickel-58', sym: 'Ni', Z: 28, A: 58 },
  Ag: { name: 'silver-107', sym: 'Ag', Z: 47, A: 107 },
  Sn: { name: 'tin-120', sym: 'Sn', Z: 50, A: 120 },
  Ba: { name: 'barium-138', sym: 'Ba', Z: 56, A: 138 },
  Au: { name: 'gold-197', sym: 'Au', Z: 79, A: 197 },
  Pb: { name: 'lead-208', sym: 'Pb', Z: 82, A: 208 },
  U: { name: 'uranium-238', sym: 'U', Z: 92, A: 238 },
};

export default defineQuestion({
  id: 'ibp-e1-nuclear-radius',
  version: 1,
  title: 'Nuclear radius and nuclear density',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    n: { choices: Object.keys(NUCLEI), base: 'Au' },
  },

  compute: (p, c) => {
    const A = NUCLEI[p.n as string].A;
    const R = IB.R0 * Math.cbrt(A);
    const mass = A * 1.66e-27;
    // R is cubed next, so students keep 3 s.f. of it.
    const V = (4 / 3) * Math.PI * c.carry(R, 'R', 3) ** 3;
    const rho = mass / c.carry(V, undefined, 3);
    const ratio = Math.cbrt(A / 4);
    return { A, R, mass, V, rho, ratio };
  },

  stem: ({ p }) => {
    const x = NUCLEI[p.n as string];
    return `This question is about the nucleus of ${x.name}, $\\,{}^{${x.A}}_{${x.Z}}\\mathrm{${x.sym}}$. The radius of a nucleus is given by $R = R_0A^{1/3}$, where $R_0 = 1.20 \\times 10^{-15}\\ \\mathrm{m}$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the radius of the nucleus.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'm', positive: true },
      solution: ({ r }) => [{ math: tex`R = R_0A^{1/3} = 1.20 \times 10^{-15} \times ${r.A}^{1/3} = ${fmtA(r.R)}\ ${u('m')}` }],
      markscheme: ({ r }) => [{ mark: tex`$R = ${fmtA(r.R)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'Estimate the density of the nucleus. Take the mass of each nucleon to be $1.66 \\times 10^{-27}\\ \\mathrm{kg}$.',
      response: { kind: 'numeric', answer: 'rho', symbol: '\\rho', unit: 'kg m-3', positive: true },
      solution: ({ r }) => [
        {
          text: 'The mass is approximately $A$ nucleon masses.',
          math: tex`m \approx ${r.A} \times 1.66 \times 10^{-27} = ${fmtW(r.mass)}\ ${u('kg')}`,
        },
        { math: tex`V = \tfrac{4}{3}\pi R^3 = \tfrac{4}{3}\pi \times (${fmtW(r.R)})^3 = ${fmtW(r.V)}\ ${u('m3')}` },
        { math: tex`\rho = \frac{m}{V} = \frac{${fmtW(r.mass)}}{${fmtW(r.V)}} = ${fmtA(r.rho)}\ ${u('kg m-3')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Mass $\\approx A \\times 1.66 \\times 10^{-27}$ kg' },
        { mark: 'Volume $\\tfrac{4}{3}\\pi R^3$' },
        { mark: tex`$\rho \approx ${fmtA(r.rho)}\ ${u('kg m-3')}$` },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'How does the density of a uranium-238 nucleus compare with the density of a carbon-12 nucleus?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They are about the same.', correct: true },
          { text: 'Uranium-238 is about 20 times denser.' },
          { text: 'Uranium-238 is about 20 times less dense.' },
          { text: 'Uranium-238 is about 2.7 times denser.' },
        ],
      },
      solution: () => [
        {
          text: 'The mass is proportional to $A$, and the volume to $R^3 = R_0^3A$, which is also proportional to $A$. So the density $\\rho = \\dfrac{Au}{\\tfrac{4}{3}\\pi R_0^3A} = \\dfrac{u}{\\tfrac{4}{3}\\pi R_0^3}$ does not depend on $A$: all nuclei have about the same density, roughly $2 \\times 10^{17}\\ \\mathrm{kg\\,m^{-3}}$.',
        },
      ],
      markscheme: () => [{ note: 'Volume ∝ A and mass ∝ A, so density is the same.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Calculate the ratio $\\dfrac{\\text{radius of this nucleus}}{\\text{radius of a helium-4 nucleus}}$.',
      response: { kind: 'numeric', answer: 'ratio', symbol: '\\dfrac{R}{R_{\\text{He}}}', positive: true },
      solution: ({ r }) => [{ math: tex`\frac{R}{R_{\text{He}}} = \left(\frac{${r.A}}{4}\right)^{1/3} = ${fmtA(r.ratio)}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.ratio)}$` }],
    },
  ],
});
