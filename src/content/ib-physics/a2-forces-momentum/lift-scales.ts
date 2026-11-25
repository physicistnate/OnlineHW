import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-lift-scales',
  version: 1,
  title: 'Standing on scales in a lift',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.1', 'ibp.A.2.2', 'ibp.A.2.3', 'ibp.A.2.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 45, max: 85, step: 1, base: 60 },
    a1: { min: 0.5, max: 2.5, step: 0.1, base: 1.5, dp: 1 },
    a2: { min: 0.5, max: 2.5, step: 0.1, base: 1.2, dp: 1 },
  },

  compute: (p, c) => {
    const W = p.m * c.g;
    const gPlus = c.g + p.a1;
    const R1 = p.m * gPlus;
    const R2 = W;
    const gMinus = c.g - p.a2;
    const R3 = p.m * gMinus;
    return { W, gPlus, R1, R2, gMinus, R3 };
  },

  stem: ({ d }) =>
    `A student of mass ${Q(d.m, 'kg')} stands on bathroom scales in a lift. The scales show the size of the normal force that they exert on the student. The lift starts from rest and accelerates upwards at ${Q(d.a1, 'm s-2')}, then moves upwards at constant velocity, and then slows down at ${Q(d.a2, 'm s-2')} until it stops.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which row describes the forces on the student while the lift accelerates upwards?',
      response: {
        kind: 'mcq',
        columns: ['Normal force compared with weight', 'Resultant force on the student'],
        options: () => [
          { cells: ['greater', 'upwards'], correct: true },
          { cells: ['equal', 'zero'] },
          { cells: ['greater', 'downwards'] },
          { cells: ['smaller', 'upwards'] },
        ],
      },
      solution: () => [
        {
          text: 'Only two forces act on the student: the weight (down) and the normal force from the scales (up). The student accelerates upwards with the lift, so by Newton’s second law the resultant force is upwards. The upward normal force must therefore be greater than the weight.',
        },
      ],
      markscheme: () => [{ note: 'Upward acceleration needs an upward resultant force, so the normal force exceeds the weight.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the reading on the scales while the lift accelerates upwards.',
      response: { kind: 'numeric', answer: 'R1', symbol: 'F_N', unit: 'N', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Draw the free-body diagram: normal force $F_N$ upwards, weight $mg$ downwards. Take upwards as positive and apply Newton’s second law.',
          math: tex`F_N - mg = ma \quad\Rightarrow\quad F_N = m(g + a)`,
        },
        {
          text: 'Substitute and evaluate.',
          math: tex`g + a = ${g} + ${d.a1} = ${fmtW(r.gPlus)}\ ${u('m s-2')}, \qquad F_N = ${d.m} \times ${fmtW(r.gPlus)} = ${fmtWA(r.R1)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $F_N - mg = ma$' },
        { mark: tex`$F_N = ${fmtA(r.R1)}\ ${u('N')}$` },
        { note: 'Award [0] for F_N = m(g − a).' },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'State the reading on the scales while the lift moves upwards at constant velocity.',
      response: { kind: 'numeric', answer: 'R2', symbol: 'F_N', unit: 'N', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'At constant velocity the acceleration is zero, so the resultant force is zero (Newton’s first law). The normal force balances the weight.',
          math: tex`F_N = mg = ${d.m} \times ${g} = ${fmtWA(r.R2)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F_N = mg = ${fmtA(r.R2)}\ ${u('N')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the reading on the scales while the lift slows down.',
      response: { kind: 'numeric', answer: 'R3', symbol: 'F_N', unit: 'N', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: `The lift is moving up but slowing down, so its acceleration is ${d.a2} m s⁻² downwards. With upwards positive, the acceleration is $-a$.`,
          math: tex`F_N - mg = -ma \quad\Rightarrow\quad F_N = m(g - a)`,
        },
        {
          text: 'Substitute and evaluate. The scales read less than the weight, so the student feels lighter.',
          math: tex`g - a = ${g} - ${d.a2} = ${fmtW(r.gMinus)}\ ${u('m s-2')}, \qquad F_N = ${d.m} \times ${fmtW(r.gMinus)} = ${fmtWA(r.R3)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Acceleration is downwards, so $F_N = m(g - a)$' },
        { mark: tex`$F_N = ${fmtA(r.R3)}\ ${u('N')}$` },
      ],
    },
  ],
});
