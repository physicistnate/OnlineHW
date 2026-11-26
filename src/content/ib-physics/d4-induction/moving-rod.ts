import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-d4-moving-rod',
  version: 1,
  title: 'A rod moving on rails: induced emf, current, force and power',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.4',
  standards: ['ibp.D.4.2', 'ibp.D.4.3'],
  uses: ['ibp.D.3.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    B: { choices: [0.2, 0.4, 0.5, 0.8], base: 0.5, dp: 1 },
    L: { choices: [10, 20, 25], base: 20 },
    v: { choices: [2, 3, 5], base: 3 },
    R: { choices: [0.5, 1, 2], base: 0.5, dp: 1 },
  },

  compute: (p, c) => {
    const emf = p.B * p.v * (p.L / 100);
    const I = c.carry(emf, 'emf', 3) / p.R;
    const F = p.B * c.carry(I, 'I', 3) * (p.L / 100);
    const P = c.carry(F, 'F', 3) * p.v;
    return { emf, I, F, P };
  },

  stem: ({ d }) =>
    `A metal rod of length ${Q(d.L, 'cm')} slides along two parallel horizontal rails at a constant speed of ${Q(d.v, 'm s-1')}. The rails are joined at one end by a resistor of ${Q(d.R, 'Ω')}; the resistance of the rod and rails is negligible. A uniform vertical magnetic field of ${Q(d.B, 'T')} acts over the whole circuit.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the emf induced across the rod.',
      response: { kind: 'numeric', answer: 'emf', symbol: '\\varepsilon', unit: 'V', positive: true },
      solution: ({ d, r }) => [{ math: tex`\varepsilon = BvL = ${d.B} \times ${d.v} \times ${Number(d.L) / 100} = ${fmtA(r.emf)}\ ${u('V')}` }],
      markscheme: ({ r }) => [{ mark: tex`$\varepsilon = BvL = ${fmtA(r.emf)}\ ${u('V')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the current in the circuit.',
      response: { kind: 'numeric', answer: 'I', symbol: 'I', unit: 'A', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = \frac{\varepsilon}{R} = \frac{${fmtW(r.emf)}}{${d.R}} = ${fmtA(r.I)}\ ${u('A')}` }],
      markscheme: ({ r }) => [{ mark: tex`$I = ${fmtA(r.I)}\ ${u('A')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the force needed to keep the rod moving at constant speed.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        { text: 'The current in the rod feels a magnetic force $BIL$ that opposes the motion (Lenz’s law). At constant speed the applied force balances it:', math: tex`F = BIL = ${d.B} \times ${fmtW(r.I)} \times ${Number(d.L) / 100} = ${fmtA(r.F)}\ ${u('N')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Applied force = magnetic force $BIL$' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the power supplied by this force.',
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        { math: tex`P = Fv = ${fmtW(r.F)} \times ${d.v} = ${fmtA(r.P)}\ ${u('W')}` },
        { text: 'This equals the power dissipated in the resistor, $I^2R$: the work done pushing the rod becomes thermal energy in the resistor.' },
      ],
      markscheme: ({ r }) => [{ mark: '$P = Fv$ (or $I^2R$ or $\\varepsilon I$)' }, { mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why must the magnetic force on the rod oppose its motion?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'If it helped the motion, the rod would speed up with no energy supplied, and energy would not be conserved (Lenz’s law).', correct: true },
          { text: 'Because the rails exert friction on the rod.' },
          { text: 'Because the magnetic field points in the direction opposite to the velocity.' },
          { text: 'Because the induced current flows in the same direction as the rod moves.' },
        ],
      },
      solution: () => [{ text: 'Lenz’s law is a consequence of energy conservation: the induced current always opposes the change that causes it, so work must be done to keep the rod moving, and that work becomes electrical energy.' }],
      markscheme: () => [{ note: 'Lenz’s law / conservation of energy.' }],
    },
  ],
});
