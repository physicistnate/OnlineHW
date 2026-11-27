import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-d3-parallel-wires',
  version: 1,
  title: 'Forces between parallel currents in a substation',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    I1: { choices: [500, 1000, 2000, 2500], base: 2000 },
    I2: { choices: [500, 1000, 2000], base: 1000 },
    r: { choices: [5, 10, 20, 25], base: 20 },
    L: { choices: [2, 3, 5], base: 3 },
  },

  compute: (p, c) => {
    const perL = (IB.mu0 * p.I1 * p.I2) / (2 * Math.PI * (p.r / 100));
    const F = c.carry(perL, 'perL', 3) * p.L;
    const perL2 = c.carry(perL, 'perL', 3) / 2;
    return { perL, F, perL2 };
  },

  stem: ({ d }) =>
    `In an electrical substation, two long straight parallel copper bars ${Q(d.r, 'cm')} apart carry currents of ${Q(d.I1, 'A')} and ${Q(d.I2, 'A')} in the same direction. $\\mu_0 = 4\\pi \\times 10^{-7}\\ \\mathrm{T\\,m\\,A^{-1}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the force per unit length between the bars.',
      response: { kind: 'numeric', answer: 'perL', symbol: 'F/L', unit: 'N m-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`\frac{F}{L} = \frac{\mu_0 I_1 I_2}{2\pi r} = \frac{4\pi \times 10^{-7} \times ${d.I1} \times ${d.I2}}{2\pi \times ${Number(d.r) / 100}} = ${fmtA(r.perL)}\ ${u('N m-1')}` }],
      markscheme: ({ r }) => [{ mark: '$F/L = \\mu_0I_1I_2/2\\pi r$ with $r$ in metres' }, { mark: tex`$F/L = ${fmtA(r.perL)}\ ${u('N m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) => `Calculate the force on a ${Q(d.L, 'm')} length of one bar.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [{ math: tex`F = ${fmtW(r.perL)} \times ${d.L} = ${fmtA(r.F)}\ ${u('N')}` }],
      markscheme: ({ r }) => [{ mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Do the bars attract or repel, and how do the forces on the two bars compare?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They attract, and the forces on the two bars are always equal in size, whatever the two currents are.', correct: true },
          { text: 'They attract, but the forces on the two bars are equal in size only when the two currents are equal.' },
          { text: 'They repel, and the forces on the two bars are always equal in size, whatever the two currents are.' },
          { text: 'They repel, but the forces on the two bars are equal in size only when the two currents are equal.' },
        ],
      },
      solution: () => [{ text: 'Currents in the same direction attract. Each bar sits in the field of the other, and the two forces are a Newton’s third law pair: equal and opposite, whatever the currents.' }],
      markscheme: () => [{ note: 'Attract; equal and opposite forces (Newton’s third law).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The bars are moved to twice their original separation. Calculate the new force per unit length.',
      response: { kind: 'numeric', answer: 'perL2', symbol: 'F/L', unit: 'N m-1', positive: true },
      solution: ({ r }) => [{ text: 'The force is inversely proportional to the separation:', math: tex`\frac{F}{L} = \frac{${fmtW(r.perL)}}{2} = ${fmtA(r.perL2)}\ ${u('N m-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.perL2)}\ ${u('N m-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
  ],
});
