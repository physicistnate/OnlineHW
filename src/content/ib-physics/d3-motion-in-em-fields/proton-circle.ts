import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-d3-proton-circle',
  version: 1,
  title: 'A proton moving in a circle in a magnetic field',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    B: { choices: [0.2, 0.3, 0.5, 0.8], base: 0.5, dp: 1 },
    v: { choices: [1, 2, 3, 5], base: 3 },
  },

  compute: (p, c) => {
    const F = IB.e * p.v * 1e6 * p.B;
    const r = (IB.mp * p.v * 1e6) / (IB.e * p.B);
    const T = (2 * Math.PI * c.carry(r, 'r', 3)) / (p.v * 1e6);
    return { F, r, T };
  },

  stem: ({ d }) =>
    `A proton moves at $${d.v} \\times 10^{6}\\ \\mathrm{m\\,s^{-1}}$ at right angles to a uniform magnetic field of ${Q(d.B, 'T')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the magnetic force on the proton.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [{ math: tex`F = qvB = 1.60 \times 10^{-19} \times ${d.v} \times 10^{6} \times ${d.B} = ${fmtA(r.F)}\ ${u('N')}` }],
      markscheme: ({ r }) => [{ mark: tex`$F = qvB = ${fmtA(r.F)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the radius of the proton’s circular path.',
      response: { kind: 'numeric', answer: 'r', symbol: 'r', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'The magnetic force is the centripetal force:', math: tex`qvB = \frac{mv^2}{r} \;\Rightarrow\; r = \frac{mv}{qB} = \frac{1.673 \times 10^{-27} \times ${d.v} \times 10^{6}}{1.60 \times 10^{-19} \times ${d.B}} = ${fmtA(r.r)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$qvB = mv^2/r$' }, { mark: tex`$r = ${fmtA(r.r)}\ ${u('m')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the time the proton takes to go once round the circle.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T', unit: 's', positive: true },
      solution: ({ d, r }) => [
        { math: tex`T = \frac{2\pi r}{v} = \frac{2\pi \times ${fmtW(r.r)}}{${d.v} \times 10^{6}} = ${fmtA(r.T)}\ ${u('s')}` },
        { text: 'Substituting $r = mv/qB$ gives $T = 2\\pi m/qB$: the period does not depend on the speed.' },
      ],
      markscheme: ({ r }) => [{ mark: '$T = 2\\pi r/v$ or $2\\pi m/qB$' }, { mark: tex`$T = ${fmtA(r.T)}\ ${u('s')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does the proton’s kinetic energy stay the same?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The magnetic force is always perpendicular to the velocity, so it does no work on the proton.', correct: true },
          { text: 'The magnetic force is too small to change the kinetic energy.' },
          { text: 'The magnetic force acts along the direction of motion and is balanced by air resistance.' },
          { text: 'The proton’s charge is too small for the field to affect its speed.' },
        ],
      },
      solution: () => [{ text: 'Work is $Fs\\cos\\theta$ with $\\theta = 90°$ at every moment, so no work is done: the speed is constant and only the direction changes.' }],
      markscheme: () => [{ note: 'Force ⟂ velocity: no work done, constant speed.' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'A second proton moves at twice the speed in the same field. Compared with the first proton, which is correct?',
      response: {
        kind: 'mcq',
        columns: ['Radius', 'Period'],
        options: () => [
          { cells: ['doubled', 'unchanged'], correct: true },
          { cells: ['doubled', 'doubled'] },
          { cells: ['halved', 'unchanged'] },
          { cells: ['unchanged', 'halved'] },
        ],
      },
      solution: () => [{ text: '$r = mv/qB$ doubles with $v$, while $T = 2\\pi m/qB$ does not depend on $v$: the faster proton goes round a larger circle in the same time. (This is why a cyclotron works.)' }],
      markscheme: () => [{ note: 'r ∝ v; T independent of v.' }],
    },
  ],
});
