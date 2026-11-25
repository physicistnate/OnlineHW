import { defineQuestion } from '../../../engine/define';
import { fmt } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-free-fall-mcq',
  version: 1,
  title: 'Speed of a falling object',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.4'],
  style: 'IB',
  paper: 'Paper 1A style (multiple choice)',
  types: ['multiple-choice'],
  difficulty: 1,

  params: {
    h: { min: 4, max: 60, step: 1, base: 20 },
  },

  compute: (p, c) => {
    const g = c.g;
    return {
      v: Math.sqrt(2 * g * p.h),
      vHalf: Math.sqrt((g * p.h) / 2),
      vNoTwo: Math.sqrt(g * p.h),
      vFour: Math.sqrt(4 * g * p.h),
    };
  },

  stem: ({ d }) =>
    `An object is released from rest at a height of ${Q(d.h, 'm')} above the ground. Air resistance is negligible. What is the speed of the object just before it reaches the ground?`,

  parts: [
    {
      label: '',
      marks: 1,
      prompt: () => '',
      response: {
        kind: 'mcq',
        options: ({ r }) => [
          { text: Q(fmt(r.vHalf), 'm s-1') },
          { text: Q(fmt(r.vNoTwo), 'm s-1') },
          { text: Q(fmt(r.v), 'm s-1'), correct: true },
          { text: Q(fmt(r.vFour), 'm s-1') },
        ],
      },
      solution: ({ d, r, g }) => [
        {
          text: 'The object starts from rest and accelerates uniformly at $g$. The time of the fall is not needed, so use the equation of motion without $t$.',
          math: tex`v^2 = u^2 + 2as \quad\text{with}\quad u = 0,\; a = g,\; s = h`,
        },
        {
          text: 'Rearrange for $v$ and substitute.',
          math: tex`v = \sqrt{2gh} = \sqrt{2 \times ${g} \times ${d.h}} = ${fmt(r.v)}\ ${u('m s-1')}`,
        },
        {
          text: 'The other options come from common slips: leaving out the factor of 2 gives $\\sqrt{gh}$; halving instead of doubling gives $\\sqrt{gh/2}$; and $\\sqrt{4gh}$ comes from using $2h$ in place of $h$.',
        },
      ],
      markscheme: () => [],
    },
  ],
});
