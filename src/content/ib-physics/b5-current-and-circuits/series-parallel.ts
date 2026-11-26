import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-b5-series-parallel',
  version: 1,
  title: 'Resistors in series and in parallel',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.7', 'ibp.B.5.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    R1: { choices: [2, 4, 5, 10], base: 4 },
    R2: { choices: [6, 10, 12, 20], base: 12 },
    R3: { choices: [3, 10, 12, 30], base: 12 },
    E: { choices: [6, 9, 12], base: 12 },
  },

  compute: (p, c) => {
    const Rp = (p.R2 * p.R3) / (p.R2 + p.R3);
    const R = p.R1 + c.carry(Rp, undefined, 3);
    const I = p.E / c.carry(R, 'R', 3);
    const V1 = c.carry(I, 'I', 3) * p.R1;
    const V23 = p.E - c.carry(V1, 'V1', 3);
    const I2 = c.carry(V23, undefined, 3) / p.R2;
    return { Rp, R, I, V1, V23, I2 };
  },

  stem: ({ d }) =>
    `A battery of emf ${Q(d.E, 'V')} and negligible internal resistance is connected to a resistor $R_1 = ${d.R1}\\ \\Omega$ in series with two resistors in parallel with each other, $R_2 = ${d.R2}\\ \\Omega$ and $R_3 = ${d.R3}\\ \\Omega$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the total resistance of the circuit.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'Ω', positive: true },
      solution: ({ d, r }) => [
        { text: 'The parallel pair first:', math: tex`\frac{1}{R_{23}} = \frac{1}{${d.R2}} + \frac{1}{${d.R3}} \;\Rightarrow\; R_{23} = ${fmtW(r.Rp)}\ \Omega` },
        { math: tex`R = R_1 + R_{23} = ${d.R1} + ${fmtW(r.Rp)} = ${fmtA(r.R)}\ \Omega` },
      ],
      markscheme: ({ r }) => [{ mark: 'Parallel combination of $R_2$ and $R_3$' }, { mark: tex`$R = ${fmtA(r.R)}\ \Omega$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the current in the battery.',
      response: { kind: 'numeric', answer: 'I', symbol: 'I', unit: 'A', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = \frac{\varepsilon}{R} = \frac{${d.E}}{${fmtW(r.R)}} = ${fmtA(r.I)}\ ${u('A')}` }],
      markscheme: ({ r }) => [{ mark: tex`$I = ${fmtA(r.I)}\ ${u('A')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the potential difference across $R_1$.',
      response: { kind: 'numeric', answer: 'V1', symbol: 'V_1', unit: 'V', positive: true },
      solution: ({ d, r }) => [{ math: tex`V_1 = IR_1 = ${fmtW(r.I)} \times ${d.R1} = ${fmtA(r.V1)}\ ${u('V')}` }],
      markscheme: ({ r }) => [{ mark: tex`$V_1 = ${fmtA(r.V1)}\ ${u('V')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the current in $R_2$.',
      response: { kind: 'numeric', answer: 'I2', symbol: 'I_2', unit: 'A', positive: true },
      solution: ({ d, r }) => [
        { text: 'The rest of the emf is across the parallel pair:', math: tex`V_{23} = ${d.E} - ${fmtW(r.V1)} = ${fmtW(r.V23)}\ ${u('V')}` },
        { math: tex`I_2 = \frac{V_{23}}{R_2} = \frac{${fmtW(r.V23)}}{${d.R2}} = ${fmtA(r.I2)}\ ${u('A')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'p.d. across the parallel pair = emf − $V_1$' }, { mark: tex`$I_2 = ${fmtA(r.I2)}\ ${u('A')}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => '$R_3$ is disconnected. What happens to the current in the battery?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: () => [{ text: 'It increases.' }, { text: 'It decreases.', correct: true }, { text: 'It stays the same.' }, { text: 'It falls to zero.' }],
      },
      solution: () => [{ text: 'Removing a branch of a parallel combination increases its resistance (only $R_2$ is left), so the total resistance increases and the current from the battery decreases.' }],
      markscheme: () => [{ note: 'Decreases: total resistance increases.' }],
    },
  ],
});
