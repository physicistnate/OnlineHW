import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-sledge-pull',
  version: 1,
  title: 'Pulling a sledge with a rope at an angle',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.2', 'ibp.A.3.1', 'ibp.A.3.5'],
  uses: ['ibp.A.2.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    F: { min: 20, max: 80, step: 1, base: 45 },
    theta: { min: 15, max: 45, step: 5, base: 30 },
    s: { min: 10, max: 50, step: 1, base: 25 },
    t: { min: 10, max: 60, step: 1, base: 20 },
  },
  // A walking pace (0.5 to 2.5 m/s).
  constraint: (p) => p.s / p.t >= 0.5 && p.s / p.t <= 2.5,

  compute: (p, c) => {
    const Fx = p.F * cosD(p.theta);
    const W = p.F * p.s * cosD(p.theta);
    // Friction does the negative of the student's work in (a) (follow-through).
    const Wf = -c.carry(W, 'W');
    const P = c.carry(W, 'W') / p.t;
    return { Fx, W, Wf, P };
  },

  stem: ({ d }) =>
    `A child pulls a sledge across horizontal snow using a rope at ${Q(d.theta, 'deg')} above the horizontal. The tension in the rope is ${Q(d.F, 'N')}. The sledge moves ${Q(d.s, 'm')} at constant speed.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the work done on the sledge by the tension in the rope.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Only the component of the force along the displacement does work. The rope pulls partly upwards, and that part does no work because the sledge does not move upwards. This is what the dot product $W = \\vec{F}\\cdot\\vec{s} = Fs\\cos\\theta$ means.',
          math: tex`F\cos\theta = ${d.F}\cos ${d.theta}^{\circ} = ${fmtW(r.Fx)}\ ${u('N')}\ \text{(along the motion)}`,
        },
        {
          text: 'Work = force component along the displacement × distance.',
          math: tex`W = Fs\cos\theta = ${d.F} \times ${d.s} \times \cos ${d.theta}^{\circ} = ${fmtWA(r.W)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $W = Fs\\cos\\theta$' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which forces do no work on the sledge as it moves?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The weight and the normal force, because they are perpendicular to the displacement', correct: true },
          { text: 'The tension in the rope, because the sledge moves at constant speed' },
          { text: 'The friction force, because it acts against the motion' },
          { text: 'All of the forces, because the kinetic energy does not change' },
        ],
      },
      solution: () => [
        {
          text: 'A force does no work when it is perpendicular to the displacement ($\\cos 90^{\\circ} = 0$). The weight acts down and the normal force acts up, while the sledge moves horizontally, so neither does work. The tension does positive work and friction does negative work; together they add to zero, which is why the kinetic energy stays the same.',
        },
      ],
      markscheme: () => [{ note: 'Forces perpendicular to the displacement do no work.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'State the work done on the sledge by the friction force.',
      response: { kind: 'numeric', answer: 'Wf', symbol: 'W_f', unit: 'J' },
      solution: ({ r }) => [
        {
          text: 'The speed is constant, so the kinetic energy does not change and the total work done on the sledge is zero. Friction must therefore do as much negative work as the rope does positive work: friction acts opposite to the displacement ($\\theta = 180^{\\circ}$, $\\cos\\theta = -1$).',
          math: tex`W_f = -${fmtW(r.W)} = ${fmtA(r.Wf)}\ ${u('J')}`,
        },
        { text: 'This energy is transferred to internal energy of the sledge and the snow (they warm up slightly).' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W_f = ${fmtA(r.Wf)}\ ${u('J')}$ (negative)` }, { note: 'Allow ECF from (a). Accept the magnitude with a statement that the work is negative.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ d }) => `The sledge takes ${Q(d.t, 's')} to move the ${Q(d.s, 'm')}. Calculate the average power developed by the child in pulling the sledge.`,
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Power is the rate of doing work.',
          math: tex`P = \frac{W}{t} = \frac{${fmtW(r.W)}}{${d.t}} = ${fmtA(r.P)}\ ${u('W')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }, { note: 'Allow ECF from (a).' }],
    },
  ],
});
