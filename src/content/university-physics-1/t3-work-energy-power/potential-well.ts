import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'up1-t3-potential-well',
  version: 1,
  title: 'Equilibrium, force and escape in a potential well',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.4'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    A: { min: 1, max: 10, step: 0.5, base: 2, dp: 1 },
    B: { min: 2, max: 20, step: 1, base: 4 },
    x1: { min: 0.2, max: 6, step: 0.1, base: 0.5, dp: 1 },
    m: { min: 0.5, max: 5, step: 0.5, base: 1, dp: 1 },
  },
  // Equilibrium between 0.5 m and 4 m; x1 clearly away from it (so the two terms of the
  // force do not nearly cancel); an escape speed of at most 20 m/s.
  constraint: (p) => {
    const xe = (2 * p.A) / p.B;
    const t1 = (2 * p.A) / p.x1 ** 3;
    const t2 = p.B / p.x1 ** 2;
    const v = Math.sqrt((2 * (p.B ** 2 / (4 * p.A))) / p.m);
    return xe >= 0.5 && xe <= 4 && Math.abs(t1 - t2) >= 0.25 * Math.max(t1, t2) && v <= 20;
  },

  compute: (p) => {
    const xe = (2 * p.A) / p.B;
    const t1 = (2 * p.A) / p.x1 ** 3;
    const t2 = p.B / p.x1 ** 2;
    const F = t1 - t2;
    const depth = p.B ** 2 / (4 * p.A); // −U(xe)
    const v = Math.sqrt((2 * depth) / p.m);
    return { xe, t1, t2, F, depth, v };
  },

  stem: ({ d }) =>
    `A particle of mass ${Q(d.m, 'kg')} moves along the positive $x$-axis. The only force on it is conservative, with potential energy $U(x) = \\dfrac{A}{x^2} - \\dfrac{B}{x}$ for $x > 0$, where $A = ${d.A}\\ \\mathrm{J\\,m^2}$ and $B = ${d.B}\\ \\mathrm{J\\,m}$. $U \\to 0$ as $x \\to \\infty$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the position of stable equilibrium.',
      response: { kind: 'numeric', answer: 'xe', symbol: 'x_0', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Equilibrium is where $F = -dU/dx = 0$.',
          math: tex`\frac{dU}{dx} = -\frac{2A}{x^3} + \frac{B}{x^2} = 0 \quad\Rightarrow\quad x_0 = \frac{2A}{B} = \frac{2 \times ${d.A}}{${d.B}} = ${fmtA(r.xe)}\ ${u('m')}`,
        },
        { text: '$U$ has a minimum there ($U \\to +\\infty$ as $x \\to 0$ and $U \\to 0^-$ as $x \\to \\infty$), so the equilibrium is stable.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Setting $dU/dx = 0$' }, { mark: tex`$x_0 = 2A/B = ${fmtA(r.xe)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Find the force on the particle at $x = ${d.x1}\\ \\mathrm{m}$ (positive means in the $+x$ direction).`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F_x', unit: 'N' },
      solution: ({ d, r }) => [
        {
          math: tex`F_x = -\frac{dU}{dx} = \frac{2A}{x^3} - \frac{B}{x^2} = \frac{2 \times ${d.A}}{${d.x1}^3} - \frac{${d.B}}{${d.x1}^2} = ${fmtW(r.t1)} - ${fmtW(r.t2)} = ${fmtA(r.F)}\ ${u('N')}`,
        },
        {
          text: r.F > 0 ? 'The force is positive (repulsive): the particle is inside the equilibrium position and is pushed outward.' : 'The force is negative (attractive): the particle is outside the equilibrium position and is pulled back inward.',
        },
      ],
      markscheme: ({ r }) => [{ mark: '$F_x = 2A/x^3 - B/x^2$' }, { mark: tex`$F_x = ${fmtA(r.F)}\ ${u('N')}$, with the correct sign` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'The particle passes through the equilibrium position. Find the minimum speed it must have there to escape to infinity.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v_{\\text{esc}}', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At the equilibrium position, $U(x_0) = \\dfrac{A}{(2A/B)^2} - \\dfrac{B}{2A/B} = \\dfrac{B^2}{4A} - \\dfrac{B^2}{2A} = -\\dfrac{B^2}{4A}$. To reach infinity (where $U = 0$) with zero speed, the total energy must be at least zero.',
          math: tex`\tfrac{1}{2}mv^2 = \frac{B^2}{4A} = \frac{${d.B}^2}{4 \times ${d.A}} = ${fmtW(r.depth)}\ ${u('J')}`,
        },
        { math: tex`v = \sqrt{\frac{2 \times ${fmtW(r.depth)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$U(x_0) = -B^2/4A = -${fmtA(r.depth)}\ ${u('J')}$` }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The particle’s total mechanical energy $E$ is negative but greater than the minimum potential energy: $U(x_0) < E < 0$. Which describes its motion?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It moves back and forth between two turning points on either side of $x_0$.', correct: true },
          { text: 'It eventually escapes to infinity.' },
          { text: 'It stays at rest at $x_0$.' },
          { text: 'It reaches $x = 0$.' },
        ],
      },
      solution: () => [
        {
          text: 'With $E < 0$ the particle can only be where $U(x) \\le E$. Since $U \\to +\\infty$ as $x \\to 0$ and $U \\to 0 > E$ as $x \\to \\infty$, that region is a finite interval around $x_0$. At its ends $K = 0$ (turning points), so the motion is bounded and oscillates. (It could stay at rest at $x_0$ only if $E = U(x_0)$, which is ruled out here.)',
        },
      ],
      markscheme: () => [{ note: 'Bounded motion between turning points where U = E.' }],
    },
  ],
});
