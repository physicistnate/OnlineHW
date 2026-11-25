import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'up1-t3-spring-incline',
  version: 1,
  title: 'A spring launches a block up a rough incline',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.5', 'up1.3.4'],
  uses: ['up1.2'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 0.2, max: 2, step: 0.1, base: 0.5, dp: 1 },
    k: { min: 200, max: 2000, step: 100, base: 800 },
    x: { min: 0.05, max: 0.25, step: 0.01, base: 0.12, dp: 2 },
    theta: { min: 15, max: 40, step: 5, base: 30 },
    mu: { min: 0.1, max: 0.4, step: 0.05, base: 0.2, dp: 2 },
  },
  // The spring clearly pushes the block off (it travels at least twice the compression) and the trip is at most 10 m.
  constraint: (p) => {
    const Fres = p.m * 9.81 * (sinD(p.theta) + p.mu * cosD(p.theta));
    const s = (0.5 * p.k * p.x ** 2) / Fres;
    return s >= 2 * p.x && s <= 10 && p.k * p.x >= 2 * Fres;
  },

  compute: (p, c) => {
    const Us = 0.5 * p.k * p.x ** 2;
    const Fg = p.m * c.g * sinD(p.theta);
    const fk = p.mu * p.m * c.g * cosD(p.theta);
    const s = c.carry(Us, 'Us') / (c.carry(Fg) + c.carry(fk));
    const Wf = -c.carry(fk) * c.carry(s, 's');
    return { Us, Fg, fk, s, Wf };
  },

  stem: ({ d }) =>
    `A spring of spring constant ${Q(d.k, 'N/m')} lies along the bottom of a rough incline at ${Q(d.theta, 'deg')} to the horizontal. A block of mass ${Q(d.m, 'kg')} is pushed against the spring, compressing it by ${Q(d.x, 'm')}, and then released. The coefficient of kinetic friction between the block and the incline is ${d.mu}, and friction acts from the moment of release.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the elastic potential energy stored in the spring before release.',
      response: { kind: 'numeric', answer: 'Us', symbol: 'U_s', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'For an ideal spring, $U_s = \\int_0^x kx\'\\,dx\' = \\tfrac{1}{2}kx^2$.',
          math: tex`U_s = \tfrac{1}{2} \times ${d.k} \times ${d.x}^2 = ${fmtA(r.Us)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$U_s = ${fmtA(r.Us)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'Find how far the block travels up the incline, measured from its release point, before it stops.',
      response: { kind: 'numeric', answer: 's', symbol: 's', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Over the whole distance $s$, the spring’s energy is shared between gravitational potential energy $mgs\\sin\\theta$ and the energy dissipated by friction $\\mu_k mg\\cos\\theta\\,s$ (the block starts and ends at rest).',
          math: tex`\tfrac{1}{2}kx^2 = mgs\sin\theta + \mu_k mgs\cos\theta \quad\Rightarrow\quad s = \frac{\tfrac{1}{2}kx^2}{mg\sin\theta + \mu_k mg\cos\theta}`,
        },
        {
          math: tex`mg\sin\theta = ${d.m} \times ${g} \times \sin ${d.theta}^{\circ} = ${fmtW(r.Fg)}\ ${u('N')}, \qquad \mu_k mg\cos\theta = ${d.mu} \times ${d.m} \times ${g} \times \cos ${d.theta}^{\circ} = ${fmtW(r.fk)}\ ${u('N')}`,
        },
        { math: tex`s = \frac{${fmtW(r.Us)}}{${fmtW(r.Fg)} + ${fmtW(r.fk)}} = ${fmtA(r.s)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Energy equation with gravitational potential energy and work done by friction' },
        { mark: 'Both forces act over the whole distance from the release point' },
        { mark: tex`$s = ${fmtA(r.s)}\ ${u('m')}$` },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Find the work done on the block by friction during this motion.',
      response: { kind: 'numeric', answer: 'Wf', symbol: 'W_f', unit: 'J' },
      solution: ({ r }) => [
        {
          math: tex`W_f = -\mu_k mg\cos\theta\,s = -${fmtW(r.fk)} \times ${fmtW(r.s)} = ${fmtA(r.Wf)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W_f = ${fmtA(r.Wf)}\ ${u('J')}$ (negative)` }, { note: 'Follow through from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'If the incline were frictionless, how far would the block travel up the incline from its release point?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Farther, by a factor of $(\\sin\\theta + \\mu_k\\cos\\theta)/\\sin\\theta$', correct: true },
          { text: 'The same distance, because the spring stores the same energy' },
          { text: 'Farther, by a factor of $1/\\mu_k$' },
          { text: 'Less far, because more of the energy would become kinetic energy' },
        ],
      },
      solution: () => [
        {
          text: 'Without friction, $\\tfrac{1}{2}kx^2 = mgs\'\\sin\\theta$, so $s\' = \\tfrac{1}{2}kx^2/(mg\\sin\\theta)$. Dividing by the answer to (b): $s\'/s = (\\sin\\theta + \\mu_k\\cos\\theta)/\\sin\\theta$.',
        },
      ],
      markscheme: () => [{ note: 'Ratio of the energy-absorbing forces.' }],
    },
  ],
});
