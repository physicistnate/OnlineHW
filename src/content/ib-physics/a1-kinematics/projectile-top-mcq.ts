import { defineQuestion } from '../../../engine/define';
import { cosD, fmt, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-projectile-top-mcq',
  version: 1,
  title: 'Projectile at the highest point',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.6'],
  style: 'IB',
  paper: 'Paper 1A style (multiple choice)',
  types: ['multiple-choice'],
  difficulty: 2,

  params: {
    v: { min: 10, max: 25, step: 1, base: 16 },
    theta: { min: 25, max: 65, step: 5, base: 35 },
  },
  constraint: (p) => p.theta !== 45,

  compute: (p) => ({
    vx: p.v * cosD(p.theta),
    vy: p.v * sinD(p.theta),
  }),

  stem: ({ d }) =>
    `A ball is thrown with a speed of ${Q(d.v, 'm s-1')} at an angle of ${Q(d.theta, 'deg')} above the horizontal. Air resistance is negligible. Which row gives the velocity and the acceleration of the ball at the highest point of its path?`,

  parts: [
    {
      label: '',
      marks: 1,
      prompt: () => '',
      response: {
        kind: 'mcq',
        columns: ['Velocity', 'Acceleration'],
        options: ({ r, g }) => {
          const down = `${Q(g, 'm s-2')} downwards`;
          return [
            { cells: ['$0$', down] },
            { cells: [`${Q(fmt(r.vx), 'm s-1')} horizontally`, '$0$'] },
            { cells: [`${Q(fmt(r.vx), 'm s-1')} horizontally`, down], correct: true },
            { cells: [`${Q(fmt(r.vy), 'm s-1')} horizontally`, down] },
          ];
        },
      },
      solution: ({ d, r, g }) => [
        {
          text: 'Treat the horizontal and vertical motions separately. With no air resistance there is no horizontal force, so the horizontal component of velocity never changes.',
          math: tex`v_x = v\cos\theta = ${d.v}\cos ${d.theta}^{\circ} = ${fmt(r.vx)}\ ${u('m s-1')}`,
        },
        {
          text: 'At the highest point the vertical component of velocity is momentarily zero, so the velocity is entirely horizontal: it is $v_x$, not zero.',
        },
        {
          text: `The only force on the ball is its weight, so its acceleration is ${Q(g, 'm s-2')} downwards at every point of the flight, including the top.`,
        },
        {
          text: `The distractors: "velocity zero" forgets the horizontal motion; "acceleration zero" confuses zero vertical velocity with zero acceleration; ${Q(fmt(r.vy), 'm s-1')} is the initial vertical component, $v\\sin\\theta$.`,
        },
      ],
      markscheme: () => [],
    },
  ],
});
