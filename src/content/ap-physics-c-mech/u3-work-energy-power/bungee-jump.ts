import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-bungee-jump',
  version: 1,
  title: 'Elastic potential energy in a bungee jump',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.3', 'apcm.3.4', 'apcm.3.1'],
  style: 'AP',
  paper: 'AP-style problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { min: 50, max: 100, step: 5, base: 70 },
    L: { min: 10, max: 30, step: 1, base: 20 },
    k: { min: 40, max: 200, step: 10, base: 100 },
  },
  // A survivable jump: the greatest upward acceleration is at most 3.5g, and the total drop at most 80 m.
  constraint: (p) => {
    const W = p.m * 9.81;
    const x = (W + Math.sqrt(W * W + 2 * p.k * W * p.L)) / p.k;
    return (p.k * x - W) / p.m <= 3.5 * 9.81 && p.L + x <= 80;
  },

  compute: (p, c) => {
    const vL = Math.sqrt(2 * c.g * p.L);
    const W = p.m * c.g;
    const Wc = c.carry(W);
    // ½kx² = mg(L + x): the positive root of ½kx² − mgx − mgL = 0.
    const x = (Wc + Math.sqrt(Wc ** 2 + 2 * p.k * Wc * p.L)) / p.k;
    const Us = 0.5 * p.k * c.carry(x, 'x') ** 2;
    // Or the gravitational potential energy lost over the whole fall.
    const Us__gravity = Wc * (p.L + c.carry(x, 'x'));
    const xe = W / p.k;
    const vmax = Math.sqrt(2 * c.g * p.L + (p.m * c.g ** 2) / p.k);
    return { vL, W, x, Us, Us__gravity, xe, vmax };
  },

  stem: ({ d }) =>
    `A bungee jumper of mass ${Q(d.m, 'kg')} steps off a high bridge. The bungee cord has an unstretched length of ${Q(d.L, 'm')}. Once it is taut, it behaves like an ideal spring with spring constant ${Q(d.k, 'N/m')}. Treat the jumper as a particle, and ignore air resistance and the mass of the cord.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the speed of the jumper at the instant the cord becomes taut.',
      response: { kind: 'numeric', answer: 'vL', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Until the cord is taut, the jumper is in free fall through a height equal to the cord’s length.',
          math: tex`\tfrac{1}{2}mv^2 = mgL \quad\Rightarrow\quad v = \sqrt{2gL} = \sqrt{2 \times ${g} \times ${d.L}} = ${fmtA(r.vL)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v = \sqrt{2gL} = ${fmtA(r.vL)}\ ${u('m/s')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'Calculate the maximum extension of the cord.',
      response: { kind: 'numeric', answer: 'x', symbol: 'x_{\\max}', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'At the lowest point the jumper is momentarily at rest. All the gravitational potential energy lost over the whole fall, $L + x$, is stored as elastic potential energy in the cord.',
          math: tex`mg(L + x) = \tfrac{1}{2}kx^2 \quad\Rightarrow\quad \tfrac{1}{2}kx^2 - mgx - mgL = 0`,
        },
        {
          text: 'Solve the quadratic and take the positive root.',
          math: tex`mg = ${d.m} \times ${g} = ${fmtW(r.W)}\ ${u('N')}, \qquad x = \frac{mg + \sqrt{(mg)^2 + 2k\,mg\,L}}{k} = \frac{${fmtW(r.W)} + \sqrt{${fmtW(r.W)}^2 + 2 \times ${d.k} \times ${fmtW(r.W)} \times ${d.L}}}{${d.k}} = ${fmtA(r.x)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Loss of gravitational potential energy over $L + x$' },
        { mark: 'Equated to $\\tfrac{1}{2}kx^2$' },
        { mark: tex`$x = ${fmtA(r.x)}\ ${u('m')}$` },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the elastic potential energy stored in the cord at the lowest point.',
      response: { kind: 'numeric', answer: 'Us', symbol: 'U_s', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`U_s = \tfrac{1}{2}kx^2 = \tfrac{1}{2} \times ${d.k} \times ${fmtW(r.x)}^2 = ${fmtWA(r.Us)}\ ${u('J')}`,
        },
        { text: 'This equals the gravitational potential energy lost, $mg(L + x)$.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$U_s = ${fmtA(r.Us)}\ ${u('J')}$` }, { note: 'Allow credit for an answer consistent with (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the maximum speed of the jumper during the fall.',
      response: { kind: 'numeric', answer: 'vmax', symbol: 'v_{\\max}', unit: 'm/s', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'The jumper keeps speeding up after the cord becomes taut, until the cord’s tension equals the weight: $kx = mg$.',
          math: tex`x = \frac{mg}{k} = \frac{${fmtW(r.W)}}{${d.k}} = ${fmtW(r.xe)}\ ${u('m')}`,
        },
        {
          text: 'Energy from the bridge to that point: $\\tfrac{1}{2}mv^2 = mg(L + x) - \\tfrac{1}{2}kx^2$. With $x = mg/k$ this simplifies to $v^2 = 2gL + mg^2/k$.',
          math: tex`v_{\max} = \sqrt{2 \times ${g} \times ${d.L} + \frac{${d.m} \times ${g}^2}{${d.k}}} = ${fmtA(r.vmax)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Maximum speed where $kx = mg$' }, { mark: tex`$v_{\max} = ${fmtA(r.vmax)}\ ${u('m/s')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Where is the jumper’s acceleration greatest in magnitude?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'At the lowest point, where it is directed upward', correct: true },
          { text: 'Where the cord first becomes taut, where it is directed downward' },
          { text: 'Where the speed is greatest' },
          { text: 'It is the same everywhere: $g$ downward' },
        ],
      },
      solution: () => [
        {
          text: 'Before the cord is taut the acceleration is $g$ downward. Once it is taut the net force is $mg - kx$: it is zero where the speed is greatest, then points upward and grows as $x$ increases, so it is largest at the lowest point. There, from (b), $kx_{\\max} = 2mg(L + x_{\\max})/x_{\\max} > 2mg$, so the upward acceleration $(kx_{\\max} - mg)/m$ is greater than $g$.',
        },
      ],
      markscheme: () => [{ note: 'Greatest at the lowest point, upward.' }],
    },
  ],
});
