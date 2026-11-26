import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Gases: name and molar mass (kg mol⁻¹), as given in the question. */
const GASES: Record<string, { name: string; particle: string; M: number; Mg: string }> = {
  helium: { name: 'helium', particle: 'atom', M: 0.004, Mg: '4.0' },
  nitrogen: { name: 'nitrogen', particle: 'molecule', M: 0.028, Mg: '28' },
  oxygen: { name: 'oxygen', particle: 'molecule', M: 0.032, Mg: '32' },
  argon: { name: 'argon', particle: 'atom', M: 0.04, Mg: '40' },
};

export default defineQuestion({
  id: 'ibp-b3-molecular-speeds',
  version: 1,
  title: 'How fast do gas molecules move? The kinetic model',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.3',
  standards: ['ibp.B.3.6', 'ibp.B.3.5', 'ibp.B.3.2', 'ibp.B.3.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    gas: { choices: Object.keys(GASES), base: 'nitrogen' },
    T: { choices: [0, 20, 100], base: 20 },
  },

  compute: (p, c) => {
    const g = GASES[p.gas];
    const TK = p.T + IB.zeroC;
    const Ek = 1.5 * IB.kB * TK;
    const m = g.M / IB.NA;
    const vrms = Math.sqrt((2 * c.carry(Ek, 'Ek', 3)) / c.carry(m, undefined, 3));
    const rho = (3 * 1.01e5) / c.carry(vrms, 'vrms', 3) ** 2;
    return { TK, Ek, m, vrms, rho };
  },

  stem: ({ p, d }) => {
    const g = GASES[p.gas];
    return `A sample of ${g.name} gas is at ${Q(d.T, '°C')} and a pressure of $1.01 \\times 10^{5}$ Pa. The molar mass of ${g.name} is $${g.Mg}\\ \\mathrm{g\\,mol^{-1}}$. $k_B = 1.38 \\times 10^{-23}\\ \\mathrm{J\\,K^{-1}}$ and $N_A = 6.02 \\times 10^{23}\\ \\mathrm{mol^{-1}}$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the average kinetic energy of a ${GASES[p.gas].name} ${GASES[p.gas].particle}.`,
      response: { kind: 'numeric', answer: 'Ek', symbol: '\\bar{E}_k', unit: 'J', positive: true },
      solution: ({ r }) => [{ math: tex`\bar{E}_k = \tfrac{3}{2}k_BT = \tfrac{3}{2} \times 1.38 \times 10^{-23} \times ${r.TK} = ${fmtA(r.Ek)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$\bar{E}_k = ${fmtA(r.Ek)}\ ${u('J')}$ (temperature in kelvin)` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Calculate the root mean square speed of the ${GASES[p.gas].particle}s.`,
      response: { kind: 'numeric', answer: 'vrms', symbol: 'v_{rms}', unit: 'm s-1', positive: true },
      solution: ({ p, r }) => [
        { text: `The mass of one ${GASES[p.gas].particle}:`, math: tex`m = \frac{M}{N_A} = \frac{${GASES[p.gas].M}}{6.02 \times 10^{23}} = ${fmtW(r.m)}\ ${u('kg')}` },
        { math: tex`\tfrac{1}{2}mv_{rms}^{\,2} = \bar{E}_k \;\Rightarrow\; v_{rms} = \sqrt{\frac{2 \times ${fmtW(r.Ek)}}{${fmtW(r.m)}}} = ${fmtA(r.vrms)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Mass of one particle, $M/N_A$, in kg' }, { mark: tex`$v_{rms} = ${fmtA(r.vrms)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Use $p = \\tfrac{1}{3}\\rho\\bar{v^2}$ to calculate the density of the gas.',
      response: { kind: 'numeric', answer: 'rho', symbol: '\\rho', unit: 'kg m-3', positive: true },
      solution: ({ r }) => [{ text: 'The mean square speed is $v_{rms}^{\\,2}$:', math: tex`\rho = \frac{3p}{\bar{v^2}} = \frac{3 \times 1.01 \times 10^{5}}{(${fmtW(r.vrms)})^2} = ${fmtA(r.rho)}\ ${u('kg m-3')}` }],
      markscheme: ({ r }) => [{ mark: '$\\rho = 3p/v_{rms}^2$' }, { mark: tex`$\rho = ${fmtA(r.rho)}\ ${u('kg m-3')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'At the same temperature, how do helium atoms compare with nitrogen molecules?',
      response: {
        kind: 'mcq',
        columns: ['Average kinetic energy', 'rms speed'],
        options: () => [
          { cells: ['the same', 'greater'], correct: true },
          { cells: ['the same', 'the same'] },
          { cells: ['greater', 'greater'] },
          { cells: ['smaller', 'greater'] },
        ],
      },
      solution: () => [{ text: 'The average kinetic energy depends only on the temperature, $\\tfrac{3}{2}k_BT$. Helium atoms have a much smaller mass, so to have the same kinetic energy they must move faster: $v_{rms} \\propto 1/\\sqrt{m}$.' }],
      markscheme: () => [{ note: 'Same average kinetic energy; greater rms speed.' }],
    },
  ],
});
