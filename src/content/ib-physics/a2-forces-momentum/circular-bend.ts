import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-circular-bend',
  version: 1,
  title: 'A car going round a bend',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.9', 'ibp.A.2.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 800, max: 1600, step: 50, base: 1200 },
    v: { min: 8, max: 25, step: 1, base: 15 },
    r: { min: 30, max: 120, step: 5, base: 60 },
    mu: { min: 0.5, max: 0.9, step: 0.05, base: 0.7, dp: 2 },
  },
  // The car is safely below the speed at which it would skid.
  constraint: (p) => p.v ** 2 / p.r <= 0.8 * p.mu * 9.8,

  compute: (p, c) => {
    const a = p.v ** 2 / p.r;
    const F = p.m * c.carry(a, 'a');
    const vmax = Math.sqrt(p.mu * c.g * p.r);
    const omega = p.v / p.r;
    return { a, F, vmax, omega };
  },

  stem: ({ d }) =>
    `A car of mass ${Q(d.m, 'kg')} travels at a constant speed of ${Q(d.v, 'm s-1')} around a horizontal bend in the road. The bend is part of a circle of radius ${Q(d.r, 'm')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the centripetal acceleration of the car.',
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The speed is constant, but the direction of the velocity changes, so the car accelerates towards the centre of the circle.',
          math: tex`a = \frac{v^2}{r} = \frac{${d.v}^2}{${d.r}} = ${fmtA(r.a)}\ ${u('m s-2')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the magnitude of the resultant force on the car.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'By Newton’s second law, the resultant force is mass × acceleration. It points towards the centre of the circle (the centripetal force).',
          math: tex`F = ma = \frac{mv^2}{r} = \frac{${d.m} \times ${d.v}^2}{${d.r}} = ${fmtWA(r.F)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $F = ma = mv^2/r$' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which force provides the centripetal force on the car?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The friction force between the tyres and the road', correct: true },
          { text: 'The weight of the car' },
          { text: 'The normal force from the road on the car' },
          { text: 'A force on the car directed away from the centre of the circle' },
        ],
      },
      solution: () => [
        {
          text: 'The road is horizontal, so the weight (down) and the normal force (up) are vertical and balance each other. The only horizontal force is friction from the road on the tyres, which points towards the centre. There is no outward force on the car: "centrifugal force" is not a real force acting on it.',
        },
      ],
      markscheme: () => [{ note: 'On a level road, friction provides the centripetal force.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) =>
        `The coefficient of static friction between the tyres and the road is ${d.mu}. Calculate the maximum speed at which the car can go round the bend without skidding.`,
      response: { kind: 'numeric', answer: 'vmax', symbol: 'v_{\\max}', unit: 'm s-1', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'The friction cannot be more than $\\mu_s F_N = \\mu_s mg$. At the maximum speed, the largest possible friction just provides the centripetal force.',
          math: tex`\mu_s mg = \frac{m v_{\max}^2}{r} \quad\Rightarrow\quad v_{\max} = \sqrt{\mu_s g r}`,
        },
        {
          text: 'The mass cancels, so it does not matter how heavy the car is.',
          math: tex`v_{\max} = \sqrt{${d.mu} \times ${g} \times ${d.r}} = ${fmtA(r.vmax)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Maximum friction $\\mu_s mg$ equals $mv^2/r$' }, { mark: tex`$v_{\max} = ${fmtA(r.vmax)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: ({ d }) => `Calculate the angular velocity of the car when it travels at ${Q(d.v, 'm s-1')}.`,
      response: { kind: 'numeric', answer: 'omega', symbol: '\\omega', unit: 'rad s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Linear speed and angular velocity are related by $v = \\omega r$.',
          math: tex`\omega = \frac{v}{r} = \frac{${d.v}}{${d.r}} = ${fmtA(r.omega)}\ ${u('rad s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\omega = ${fmtA(r.omega)}\ ${u('rad s-1')}$` }],
    },
  ],
});
