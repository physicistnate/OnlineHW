import { defineQuestion } from '../../../engine/define';
import { fmt, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-circular-period-mcq',
  version: 1,
  title: 'Centripetal acceleration from the period',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.9'],
  style: 'IB',
  paper: 'Paper 1A style (multiple choice)',
  types: ['multiple-choice'],
  difficulty: 1,

  params: {
    r: { min: 0.2, max: 2.0, step: 0.05, base: 0.8, dp: 2 },
    T: { min: 0.5, max: 4.0, step: 0.1, base: 1.6, dp: 1 },
  },
  // Near T = 1 s some wrong formulas give almost the right number; leave those periods out.
  constraint: (p) => Math.abs(p.T - 1) >= 0.2 - 1e-9,

  compute: (p) => {
    const v = (2 * Math.PI * p.r) / p.T;
    const a = (4 * Math.PI ** 2 * p.r) / p.T ** 2;
    return { v, a, noSquare: (4 * Math.PI ** 2 * p.r) / p.T, noTwoPi: (2 * Math.PI * p.r) / p.T ** 2 };
  },

  stem: ({ d }) =>
    `An object moves at constant speed in a circle of radius ${Q(d.r, 'm')}. It completes one revolution in ${Q(d.T, 's')}. What is the centripetal acceleration of the object?`,

  parts: [
    {
      label: '',
      marks: 1,
      prompt: () => '',
      response: {
        kind: 'mcq',
        options: ({ r }) => [
          { text: Q(fmt(r.noTwoPi), 'm s-2') },
          { text: Q(fmt(r.v), 'm s-2') },
          { text: Q(fmt(r.a), 'm s-2'), correct: true },
          { text: Q(fmt(r.noSquare), 'm s-2') },
        ],
      },
      solution: ({ d, r }) => [
        {
          text: 'In one period the object travels once round the circumference, so its speed is $v = 2\\pi r / T$.',
          math: tex`v = \frac{2\pi \times ${d.r}}{${d.T}} = ${fmtW(r.v)}\ ${u('m s-1')}`,
        },
        {
          text: 'Centripetal acceleration is $a = v^2/r$. Substituting $v = 2\\pi r/T$ gives $a = 4\\pi^2 r / T^2$.',
          math: tex`a = \frac{4\pi^2 \times ${d.r}}{${d.T}^2} = ${fmt(r.a)}\ ${u('m s-2')}`,
        },
        {
          text: 'The other options come from common slips: giving the speed instead of the acceleration, not squaring the period, or leaving out a factor of $2\\pi$.',
        },
      ],
      markscheme: () => [],
    },
  ],
});
