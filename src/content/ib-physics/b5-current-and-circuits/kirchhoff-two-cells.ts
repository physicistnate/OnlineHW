import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

interface P {
  E1: number;
  E2: number;
  R1: number;
  R2: number;
  R3: number;
}

/** The p.d. between X and Y, from Kirchhoff's laws: (ε₁/R₁ + ε₂/R₂)/(1/R₁ + 1/R₂ + 1/R₃). */
const vXY = (p: P) => (p.E1 / p.R1 + p.E2 / p.R2) / (1 / p.R1 + 1 / p.R2 + 1 / p.R3);

export default defineQuestion({
  id: 'ibp-b5-kirchhoff-two-cells',
  version: 1,
  title: 'Kirchhoff’s laws: two cells and three branches',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.10', 'ibp.B.5.7', 'ibp.B.5.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    E1: { choices: [9, 12], base: 9 },
    E2: { choices: [4.5, 6], base: 6, dp: 1 },
    R1: { choices: [4, 6, 8], base: 4 },
    R2: { choices: [1, 2, 3], base: 2 },
    R3: { choices: [2, 4, 5], base: 4 },
  },
  // Both cells drive current towards X: I₁ and I₂ are clearly positive.
  constraint: (p) => (p.E1 - vXY(p)) / p.R1 >= 0.1 && (p.E2 - vXY(p)) / p.R2 >= 0.1,

  compute: (p, c) => {
    const I3 = (p.E1 / p.R1 + p.E2 / p.R2) / (1 + p.R3 / p.R1 + p.R3 / p.R2);
    const V3 = c.carry(I3, 'I3', 3) * p.R3;
    const I1 = (p.E1 - c.carry(V3, 'V3', 3)) / p.R1;
    return { I3, V3, I1 };
  },

  stem: ({ d }) =>
    `Two points, X and Y, are joined by three branches. Branch 1 is a cell of emf $\\varepsilon_1 = ${d.E1}$ V in series with a resistor $R_1 = ${d.R1}\\ \\Omega$. Branch 2 is a cell of emf $\\varepsilon_2 = ${d.E2}$ V in series with a resistor $R_2 = ${d.R2}\\ \\Omega$. Branch 3 is a resistor $R_3 = ${d.R3}\\ \\Omega$. Both cells have their positive terminals towards X and negligible internal resistance. The currents $I_1$ and $I_2$ flow through the cells towards X, and the current $I_3$ flows through $R_3$ from X to Y.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which equation does Kirchhoff’s first law give at junction X?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$I_3 = I_1 + I_2$', correct: true },
          { text: '$I_1 = I_2 + I_3$' },
          { text: '$I_1 + I_2 + I_3 = 0$' },
          { text: '$I_3 = I_1 - I_2$' },
        ],
      },
      solution: () => [{ text: 'Charge is conserved: the currents into X ($I_1$ and $I_2$) add up to the current out of it ($I_3$).' }],
      markscheme: () => [{ note: 'I₃ = I₁ + I₂.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which equation does Kirchhoff’s second law give for the loop made by branches 1 and 3?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$\\varepsilon_1 = I_1R_1 + I_3R_3$', correct: true },
          { text: '$\\varepsilon_1 = I_1R_1 - I_3R_3$' },
          { text: '$\\varepsilon_1 + \\varepsilon_2 = I_1R_1 + I_3R_3$' },
          { text: '$\\varepsilon_1 = I_3(R_1 + R_3)$' },
        ],
      },
      solution: () => [{ text: 'Going round the loop through cell 1, $R_1$ and $R_3$ in the direction of the currents, the emf $\\varepsilon_1$ equals the sum of the potential differences $I_1R_1$ and $I_3R_3$ (energy is conserved).' }],
      markscheme: () => [{ note: 'ε₁ = I₁R₁ + I₃R₃.' }],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Use Kirchhoff’s laws to calculate the current in $R_3$.',
      response: { kind: 'numeric', answer: 'I3', symbol: 'I_3', unit: 'A', positive: true },
      solution: ({ d, r }) => [
        { text: 'The second law for each cell’s loop with $R_3$ gives $I_1 = (\\varepsilon_1 - I_3R_3)/R_1$ and $I_2 = (\\varepsilon_2 - I_3R_3)/R_2$. Substituting into $I_3 = I_1 + I_2$:', math: String.raw`I_3\left(1 + \frac{R_3}{R_1} + \frac{R_3}{R_2}\right) = \frac{\varepsilon_1}{R_1} + \frac{\varepsilon_2}{R_2}` },
        { math: tex`I_3 = \frac{\frac{${d.E1}}{${d.R1}} + \frac{${d.E2}}{${d.R2}}}{1 + \frac{${d.R3}}{${d.R1}} + \frac{${d.R3}}{${d.R2}}} = ${fmtA(r.I3)}\ ${u('A')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Junction equation and one loop equation' }, { mark: 'A second loop equation, solved simultaneously' }, { mark: tex`$I_3 = ${fmtA(r.I3)}\ ${u('A')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Calculate the potential difference between X and Y.',
      response: { kind: 'numeric', answer: 'V3', symbol: 'V', unit: 'V', positive: true },
      solution: ({ d, r }) => [{ math: tex`V = I_3R_3 = ${fmtW(r.I3)} \times ${d.R3} = ${fmtA(r.V3)}\ ${u('V')}` }],
      markscheme: ({ r }) => [{ mark: tex`$V = ${fmtA(r.V3)}\ ${u('V')}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Calculate the current $I_1$ in cell 1.',
      response: { kind: 'numeric', answer: 'I1', symbol: 'I_1', unit: 'A', positive: true },
      solution: ({ d, r }) => [
        { text: 'Across branch 1 the p.d. between X and Y is $\\varepsilon_1 - I_1R_1$:', math: tex`I_1 = \frac{\varepsilon_1 - V}{R_1} = \frac{${d.E1} - ${fmtW(r.V3)}}{${d.R1}} = ${fmtA(r.I1)}\ ${u('A')}` },
        { text: 'Then $I_2 = I_3 - I_1$ by the first law, and it is positive here: both cells are discharging.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$I_1 = ${fmtA(r.I1)}\ ${u('A')}$` }, { note: 'Allow ECF from (d).' }],
    },
  ],
});
