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
    const v2 = (p.m1 * p.v) / m2;
    const KE1 = 0.5 * p.m1 * p.v ** 2;
    const KE2 = 0.5 * m2 * v2 ** 2;
    return { m2, v2, KE1, KE2, sameSpeed: 0.5 * m2 * p.v ** 2, lightMassSlow: 0.5 * p.m1 * v2 ** 2 };
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
          text: 'The object starts at rest, so the total momentum is zero before and after the explosion. The fragments move in opposite directions with equal and opposite momenta.',
          math: tex`m_1 v_1 = m_2 v_2 \quad\Rightarrow\quad v_2 = \frac{${d.m1} \times ${d.v}}{${fmtW(r.m2)}} = ${fmtW(r.v2)}\ ${u('m s-1')}`,
        },
        {
          text: 'Kinetic energy of the heavier fragment:',
          math: tex`E_k = \tfrac{1}{2} m_2 v_2^{\,2} = \tfrac{1}{2} \times ${fmtW(r.m2)} \times ${fmtW(r.v2)}^2 = ${fmt(r.KE2)}\ ${u('J')}`,
        },
        {
          text: `The heavier fragment has ${p.n} times the mass of the lighter one but only $\\tfrac{1}{${p.n}}$ of its kinetic energy: with equal momenta, $E_k = p^2/2m$. The other options come from giving it the same kinetic energy as the lighter fragment, the same speed as the lighter fragment, or the lighter fragment’s mass with the heavier fragment’s speed.`,
        },
      ],
      markscheme: () => [],
    },
  ],
});
