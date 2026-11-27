import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b5-phone-battery',
  version: 1,
  title: 'A phone battery: charge, electrons, energy and charging time',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.2', 'ibp.B.5.3', 'ibp.B.5.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    C: { choices: [3000, 4000, 5000], base: 4000 },
    V: { choices: [3.7, 3.85], base: 3.85, dp: 2 },
    I: { choices: [1.5, 2, 3], base: 2, dp: 1 },
  },

  compute: (p, c) => {
    const q = p.C * 3.6; // C (1 mA h = 3.6 C)
    const N = c.carry(q, 'q', 3) / IB.e;
    const E = c.carry(q, 'q', 3) * p.V;
    const t = c.carry(q, 'q', 3) / p.I / 60; // minutes
    return { q, N, E, t };
  },

  stem: ({ d }) =>
    `A phone has a rechargeable lithium-ion battery with a capacity of ${d.C} mA h: it can deliver a current of ${d.C} mA for one hour. Its terminal p.d. is ${Q(d.V, 'V')} while it discharges. (1 mA h = 3.6 C; $e = 1.60 \\times 10^{-19}$ C.)`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the total charge the battery can deliver.',
      response: { kind: 'numeric', answer: 'q', symbol: 'Q', unit: 'C', positive: true },
      solution: ({ d, r }) => [{ math: tex`Q = It = ${Number(d.C) / 1000} \times 3600 = ${fmtA(r.q)}\ ${u('C')}` }],
      markscheme: ({ r }) => [{ mark: tex`$Q = ${fmtA(r.q)}\ ${u('C')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the number of electrons that flow round the circuit as the battery discharges completely.',
      response: { kind: 'numeric', answer: 'N', symbol: 'N', positive: true },
      solution: ({ r }) => [{ math: tex`N = \frac{Q}{e} = \frac{${fmtW(r.q)}}{1.60 \times 10^{-19}} = ${fmtA(r.N)}` }],
      markscheme: ({ r }) => [{ mark: tex`$N = ${fmtA(r.N)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the energy the battery delivers.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ text: 'Each coulomb transfers $V$ joules ($V = W/q$):', math: tex`E = QV = ${fmtW(r.q)} \times ${d.V} = ${fmtA(r.E)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = QV = ${fmtA(r.E)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ d }) => `The battery is charged with a constant current of ${Q(d.I, 'A')}. Calculate the time it takes to charge from empty, in minutes.`,
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 'min', positive: true },
      solution: ({ d, r }) => [{ math: tex`t = \frac{Q}{I} = \frac{${fmtW(r.q)}}{${d.I}} = ${fmtW(r.t * 60)}\ ${u('s')} = ${fmtA(r.t)}\ \text{minutes}` }],
      markscheme: ({ r }) => [{ mark: tex`$t = ${fmtA(r.t)}$ minutes` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'What kind of cell is this battery made of?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A secondary cell: the chemical reaction can be reversed by passing a current through it, so it can be recharged.', correct: true },
          { text: 'A primary cell: it can be recharged many times.' },
          { text: 'A secondary cell: it can be used only once.' },
          { text: 'A primary cell: its chemical reaction cannot be reversed.' },
        ],
      },
      solution: () => [{ text: 'Primary cells (such as ordinary alkaline cells) are used once. Secondary cells, such as lithium-ion cells, can be recharged: a current driven through them in the reverse direction reverses the chemical reaction.' }],
      markscheme: () => [{ note: 'Secondary (rechargeable) cell.' }],
    },
  ],
});
