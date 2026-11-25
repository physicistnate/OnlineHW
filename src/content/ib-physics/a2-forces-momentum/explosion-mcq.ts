import { defineQuestion } from '../../../engine/define';
import { fmt, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-explosion-mcq',
  version: 1,
  title: 'Kinetic energy after an explosion',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.8', 'ibp.A.2.6'],
  uses: ['ibp.A.3.3'],
  style: 'IB',
  paper: 'Paper 1A style (multiple choice)',
  types: ['multiple-choice'],
  difficulty: 2,

  params: {
    m1: { min: 0.5, max: 3.0, step: 0.1, base: 1.2, dp: 1 },
    n: { choices: [2, 3, 4, 5], base: 3 },
    v: { min: 2.0, max: 12.0, step: 0.5, base: 6.0, dp: 1 },
  },

  compute: (p) => {
    const m2 = p.n * p.m1;
    const mom = p.m1 * p.v;
    const v2 = mom / m2;
    const KE1 = 0.5 * p.m1 * p.v ** 2;
    const KE2 = 0.5 * m2 * v2 ** 2;
    return { m2, mom, v2, KE1, KE2, sameSpeed: 0.5 * m2 * p.v ** 2, lightMassSlow: 0.5 * p.m1 * v2 ** 2 };
  },

  stem: ({ d, r }) =>
    `An object at rest on a frictionless horizontal surface explodes into two fragments of masses ${Q(d.m1, 'kg')} and ${Q(fmtW(r.m2), 'kg')}. The lighter fragment moves off at ${Q(d.v, 'm s-1')}. What is the kinetic energy of the heavier fragment?`,

  parts: [
    {
      label: '',
      marks: 1,
      prompt: () => '',
      response: {
        kind: 'mcq',
        options: ({ r }) => [
          { text: Q(fmt(r.KE2), 'J'), correct: true },
          { text: Q(fmt(r.KE1), 'J') },
          { text: Q(fmt(r.sameSpeed), 'J') },
          { text: Q(fmt(r.lightMassSlow), 'J') },
        ],
      },
      solution: ({ p, d, r }) => [
        {
          text: 'The object starts at rest, so the total momentum is zero before and after the explosion. The fragments move in opposite directions with momenta of equal size.',
          math: tex`p = m_1 v_1 = ${d.m1} \times ${d.v} = ${fmtW(r.mom)}\ ${u('kg m s-1')}`,
        },
        {
          text: 'The heavier fragment has the same size of momentum, so it moves more slowly.',
          math: tex`v_2 = \frac{p}{m_2} = \frac{${fmtW(r.mom)}}{${fmtW(r.m2)}} = ${fmtW(r.v2)}\ ${u('m s-1')}`,
        },
        {
          text: 'Its kinetic energy is $\tfrac{1}{2}m_2 v_2^{\,2}$, which is the same as $p^2/2m_2$. Using the momentum avoids rounding the speed.',
          math: tex`E_k = \frac{p^2}{2m_2} = \frac{${fmtW(r.mom)}^2}{2 \times ${fmtW(r.m2)}} = ${fmt(r.KE2)}\ ${u('J')}`,
        },
        {
          text: `The heavier fragment has ${p.n} times the mass of the lighter one but only $\\tfrac{1}{${p.n}}$ of its kinetic energy: with equal momenta, $E_k = p^2/2m$. The other options come from giving it the same kinetic energy as the lighter fragment, the same speed as the lighter fragment, or the lighter fragment’s mass with the heavier fragment’s speed.`,
        },
      ],
      markscheme: () => [],
    },
  ],
});
