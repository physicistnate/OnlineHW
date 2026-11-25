import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'up1-t3-nonlinear-spring',
  version: 1,
  title: 'Elastic potential energy of a stiffening spring',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.2', 'up1.3.4'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    k: { min: 50, max: 400, step: 10, base: 200 },
    beta: { min: 500, max: 20000, step: 500, base: 5000 },
    x1: { min: 0.05, max: 0.3, step: 0.01, base: 0.15, dp: 2 },
    m: { min: 0.2, max: 2, step: 0.1, base: 0.5, dp: 1 },
  },
  // The cubic term matters (10% to 60% of the stored energy), and the speed in (c) is at most 20 m/s.
  constraint: (p) => {
    const lin = 0.5 * p.k * p.x1 ** 2;
    const cub = 0.25 * p.beta * p.x1 ** 4;
    const f = cub / (lin + cub);
    return f >= 0.1 && f <= 0.6 && Math.sqrt((2 * (lin + cub)) / p.m) <= 20;
  },

  compute: (p, c) => {
    const lin = 0.5 * p.k * p.x1 ** 2;
    const cub = 0.25 * p.beta * p.x1 ** 4;
    const W = c.carry(lin) + c.carry(cub);
    const frac = (c.carry(cub) / c.carry(W, 'W')) * 100;
    const v = Math.sqrt((2 * c.carry(W, 'W')) / p.m);
    return { lin, cub, W, frac, v };
  },

  stem: ({ d }) =>
    `A spring stiffens as it is stretched. When its extension is $x$, the force it exerts is $F(x) = -kx - \\beta x^3$, where $k = ${d.k}\\ \\mathrm{N/m}$ and $\\beta = ${d.beta}\\ \\mathrm{N/m^3}$. One end is fixed and the other is attached to a block of mass ${Q(d.m, 'kg')} on a horizontal, frictionless surface.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Find the work needed to stretch the spring slowly from its natural length to an extension of ${Q(d.x1, 'm')}.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'To stretch the spring slowly, the applied force must balance the spring force: $F_{\\text{applied}} = kx + \\beta x^3$. Integrate it over the extension.',
          math: tex`W = \int_0^{x_1} \left(kx + \beta x^3\right)dx = \tfrac{1}{2}kx_1^2 + \tfrac{1}{4}\beta x_1^4`,
        },
        {
          math: tex`\tfrac{1}{2}kx_1^2 = \tfrac{1}{2} \times ${d.k} \times ${d.x1}^2 = ${fmtW(r.lin)}\ ${u('J')}, \qquad \tfrac{1}{4}\beta x_1^4 = \tfrac{1}{4} \times ${d.beta} \times (${d.x1})^4 = ${fmtW(r.cub)}\ ${u('J')}`,
        },
        { math: tex`W = ${fmtW(r.lin)} + ${fmtW(r.cub)} = ${fmtA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$W = \\tfrac{1}{2}kx_1^2 + \\tfrac{1}{4}\\beta x_1^4$' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'What percentage of the stored energy comes from the $\\beta x^3$ term?',
      response: { kind: 'numeric', answer: 'frac', symbol: '\\text{percentage}', unit: '%', positive: true },
      solution: ({ r }) => [
        {
          math: tex`\frac{\tfrac{1}{4}\beta x_1^4}{W} = \frac{${fmtW(r.cub)}}{${fmtW(r.W)}} = ${fmtW(r.frac / 100)} = ${fmtA(r.frac)}\ ${u('%')}`,
        },
        { text: 'An ideal (Hooke’s law) spring with the same $k$ would store only $\\tfrac{1}{2}kx_1^2$.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.frac)}\ ${u('%')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'The block is released from rest at this extension. Find its speed as it passes through the natural length of the spring.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The spring force is conservative, so the stored elastic potential energy $U(x_1) = W$ becomes kinetic energy at $x = 0$, where $U = 0$.',
          math: tex`v = \sqrt{\frac{2W}{m}} = \sqrt{\frac{2 \times ${fmtW(r.W)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Conservation of energy, $U(x_1) = \\tfrac{1}{2}mv^2$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which function is the potential energy $U(x)$ of the spring, taking $U(0) = 0$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$U(x) = \\tfrac{1}{2}kx^2 + \\tfrac{1}{4}\\beta x^4$', correct: true },
          { text: '$U(x) = \\tfrac{1}{2}kx^2 + \\tfrac{1}{3}\\beta x^3$' },
          { text: '$U(x) = -\\tfrac{1}{2}kx^2 - \\tfrac{1}{4}\\beta x^4$' },
          { text: '$U(x) = kx + \\beta x^3$' },
        ],
      },
      solution: () => [
        {
          text: 'For a conservative force, $U(x) = -\\int_0^x F\\,dx\' = \\int_0^x (kx\' + \\beta x\'^3)\\,dx\' = \\tfrac{1}{2}kx^2 + \\tfrac{1}{4}\\beta x^4$. Check: $F = -dU/dx = -kx - \\beta x^3$.',
        },
      ],
      markscheme: () => [{ note: 'U = −∫F dx.' }],
    },
  ],
});
