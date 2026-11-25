import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-spring-friction',
  version: 1,
  title: 'A block compresses a spring on a rough surface',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.3', 'apcm.3.4', 'apcm.3.1'],
  uses: ['apcm.2'],
  style: 'AP',
  paper: 'Free-response style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { min: 0.5, max: 3, step: 0.25, base: 1.5, dp: 2 },
    v0: { min: 2, max: 6, step: 0.5, base: 4, dp: 1 },
    k: { min: 100, max: 800, step: 50, base: 400 },
    mu: { min: 0.1, max: 0.5, step: 0.05, base: 0.3, dp: 2 },
  },
  // The block clearly moves back out (spring force at least twice the friction force) and
  // still has at least a fifth of its kinetic energy when it leaves the spring.
  constraint: (p) => {
    const f = p.mu * p.m * 9.81;
    const K0 = 0.5 * p.m * p.v0 ** 2;
    const x = (-f + Math.sqrt(f * f + 2 * p.k * K0)) / p.k;
    return p.k * x >= 2 * f && K0 - 2 * f * x >= 0.2 * K0;
  },

  compute: (p, c) => {
    const K0 = 0.5 * p.m * p.v0 ** 2;
    const f = p.mu * p.m * c.g;
    // ½kx² + fx − K0 = 0, the positive root.
    const fc = c.carry(f, undefined, 3);
    const x = (-fc + Math.sqrt(fc ** 2 + 2 * p.k * c.carry(K0))) / p.k;
    const Wf = -c.carry(f) * c.carry(x, 'x');
    // Back at the free end of the spring: friction has done work over 2x in total.
    const loss = 2 * c.carry(f, undefined, 3) * c.carry(x, 'x', 3);
    const Kb = c.carry(K0) - c.carry(loss, undefined, 3);
    c.assume(Kb > 0);
    const vb = Math.sqrt((2 * Kb) / p.m);
    return { K0, f, x, Wf, loss, Kb, vb };
  },

  stem: ({ d }) =>
    `A block of mass ${Q(d.m, 'kg')} slides on a horizontal surface toward a spring of spring constant ${Q(d.k, 'N/m')}. The block reaches the free end of the spring with speed ${Q(d.v0, 'm/s')}. The coefficient of kinetic friction between the block and the surface under the spring is ${d.mu}. The spring has negligible mass.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Calculate the maximum compression of the spring.',
      response: { kind: 'numeric', answer: 'x', symbol: 'x_{\\max}', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'While the spring is compressed, friction does negative work on the block. Energy: the initial kinetic energy becomes elastic potential energy plus energy dissipated by friction, $K_0 = \\tfrac{1}{2}kx^2 + f_k x$.',
          math: tex`K_0 = \tfrac{1}{2} \times ${d.m} \times ${d.v0}^2 = ${fmtW(r.K0)}\ ${u('J')}, \qquad f_k = \mu_k mg = ${d.mu} \times ${d.m} \times ${g} = ${fmtW(r.f)}\ ${u('N')}`,
        },
        {
          text: 'This is a quadratic in $x$: $\\tfrac{1}{2}kx^2 + f_k x - K_0 = 0$. Take the positive root.',
          math: tex`x = \frac{-f_k + \sqrt{f_k^2 + 2kK_0}}{k} = \frac{-${fmtW(r.f)} + \sqrt{${fmtW(r.f)}^2 + 2 \times ${d.k} \times ${fmtW(r.K0)}}}{${d.k}} = ${fmtA(r.x)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Energy equation including the work done by friction' },
        { mark: 'Correct quadratic, or correct substitution' },
        { mark: tex`$x_{\max} = ${fmtA(r.x)}\ ${u('m')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the work done on the block by friction while the spring is being compressed.',
      response: { kind: 'numeric', answer: 'Wf', symbol: 'W_f', unit: 'J' },
      solution: ({ r }) => [
        {
          text: 'Friction is opposite to the displacement, so its work is negative: $W_f = \\vec{f}\\cdot\\vec{d} = -f_k x$.',
          math: tex`W_f = -${fmtW(r.f)} \times ${fmtW(r.x)} = ${fmtA(r.Wf)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W_f = ${fmtA(r.Wf)}\ ${u('J')}$ (negative)` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'The spring then pushes the block back. Calculate the speed of the block when it leaves the spring.',
      response: { kind: 'numeric', answer: 'vb', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The elastic potential energy returns to the block, but friction does negative work again on the way back, over the same distance. In total friction removes $2f_k x$.',
          math: tex`2f_k x = 2 \times ${fmtW(r.f)} \times ${fmtW(r.x)} = ${fmtW(r.loss)}\ ${u('J')}`,
        },
        { math: tex`K = K_0 - 2f_k x = ${fmtW(r.K0)} - ${fmtW(r.loss)} = ${fmtW(r.Kb)}\ ${u('J')}` },
        { math: tex`v = \sqrt{\frac{2K}{m}} = \sqrt{\frac{2 \times ${fmtW(r.Kb)}}{${d.m}}} = ${fmtA(r.vb)}\ ${u('m/s')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Friction does work $-f_k x$ in each direction' }, { mark: tex`$v = ${fmtA(r.vb)}\ ${u('m/s')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement correctly describes the energy of the block–spring system at the instant of maximum compression?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The elastic potential energy is less than the initial kinetic energy; the difference has been transferred to internal energy by friction.', correct: true },
          { text: 'The elastic potential energy equals the initial kinetic energy, because energy is conserved.' },
          { text: 'The elastic potential energy is greater than the initial kinetic energy, because the spring force is greater than the friction force.' },
          { text: 'The kinetic energy is at its maximum, because the spring force is at its maximum.' },
        ],
      },
      solution: () => [
        {
          text: 'Energy is conserved overall, but friction (a nonconservative force) transfers some of the mechanical energy to internal energy of the block and the surface. So $U_s = K_0 - f_k x < K_0$. At maximum compression the block is momentarily at rest, so its kinetic energy is zero.',
        },
      ],
      markscheme: () => [{ note: 'Mechanical energy decreases by the work done against friction.' }],
    },
  ],
});
