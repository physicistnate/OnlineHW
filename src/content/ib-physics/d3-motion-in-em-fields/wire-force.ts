import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-d3-wire-force',
  version: 1,
  title: 'The force on a current-carrying wire, and a current balance',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    B: { choices: [0.05, 0.08, 0.1, 0.2], base: 0.08, dp: 2 },
    I: { choices: [2, 3, 5, 8], base: 5 },
    L: { choices: [5, 8, 10, 15], base: 8 },
    th: { choices: [30, 45, 60], base: 30 },
    m: { choices: [0.5, 1, 2], base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const F = p.B * p.I * (p.L / 100);
    const Fth = c.carry(F, 'F', 3) * sinD(p.th);
    const Ibal = (p.m * 1e-3 * c.g) / (p.B * (p.L / 100));
    return { F, Fth, Ibal };
  },

  stem: ({ d }) =>
    `A straight wire of length ${Q(d.L, 'cm')} carries a current of ${Q(d.I, 'A')} in a uniform horizontal magnetic field of ${Q(d.B, 'T')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the magnetic force on the wire when it is perpendicular to the field.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [{ math: tex`F = BIL = ${d.B} \times ${d.I} \times ${Number(d.L) / 100} = ${fmtA(r.F)}\ ${u('N')}` }],
      markscheme: ({ r }) => [{ mark: tex`$F = BIL = ${fmtA(r.F)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `The wire is turned so that it makes an angle of ${d.th}° with the field. Calculate the force on it now.`,
      response: { kind: 'numeric', answer: 'Fth', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [{ text: 'Only the component of the field perpendicular to the wire produces a force:', math: tex`F = BIL\sin\theta = ${fmtW(r.F)} \times \sin ${d.th}^{\circ} = ${fmtA(r.Fth)}\ ${u('N')}` }],
      markscheme: ({ r }) => [{ mark: '$F = BIL\\sin\\theta$' }, { mark: tex`$F = ${fmtA(r.Fth)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'The wire is horizontal and perpendicular to the field. The current flows east and the field points north. In which direction is the force on the wire?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: () => [{ text: 'Vertically upwards', correct: true }, { text: 'Vertically downwards' }, { text: 'East' }, { text: 'West' }],
      },
      solution: () => [{ text: 'Fleming’s left-hand rule (or $\\vec F = I\\vec L \\times \\vec B$): first finger along the field (north), second finger along the current (east), thumb gives the force: upwards. The force is perpendicular to both the current and the field.' }],
      markscheme: () => [{ note: 'Upwards (perpendicular to both I and B).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `In a current balance, the force on the wire (perpendicular to the field) must support a small mass of ${Q(d.m, 'g')}. Calculate the current needed.`,
      response: { kind: 'numeric', answer: 'Ibal', symbol: 'I', unit: 'A', positive: true },
      solution: ({ d, r, g }) => [{ text: 'The magnetic force balances the weight:', math: tex`BIL = mg \;\Rightarrow\; I = \frac{mg}{BL} = \frac{${d.m} \times 10^{-3} \times ${g}}{${d.B} \times ${Number(d.L) / 100}} = ${fmtA(r.Ibal)}\ ${u('A')}` }],
      markscheme: ({ r }) => [{ mark: '$BIL = mg$ with the mass in kg' }, { mark: tex`$I = ${fmtA(r.Ibal)}\ ${u('A')}$` }],
    },
  ],
});
