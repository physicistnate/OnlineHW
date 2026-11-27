import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-variable-force',
  version: 1,
  title: 'Work done by a force that varies with position',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.2', 'apcm.3.1', 'apcm.3.5'],
  style: 'AP',
  paper: 'AP-style problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    A: { min: 2, max: 10, step: 1, base: 6 },
    B: { min: 0.5, max: 4, step: 0.5, base: 1.5, dp: 1 },
    L: { min: 1, max: 4, step: 0.5, base: 2, dp: 1 },
    m: { min: 0.5, max: 4, step: 0.5, base: 1.5, dp: 1 },
  },

  compute: (p, c) => {
    const W = p.A * p.L + (p.B * p.L ** 3) / 3;
    const v = Math.sqrt((2 * c.carry(W, 'W')) / p.m);
    const FL = p.A + p.B * p.L ** 2;
    const P = c.carry(FL) * c.carry(v, 'v');
    return { W, v, FL, P };
  },

  stem: ({ d }) =>
    `A block of mass ${Q(d.m, 'kg')} is at rest at $x = 0$ on a horizontal, frictionless surface. A horizontal force in the $+x$ direction is then applied to the block. The magnitude of the force varies with the position $x$ of the block as $F(x) = A + Bx^2$, where $A = ${d.A}\\ \\mathrm{N}$ and $B = ${d.B}\\ \\mathrm{N/m^2}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Calculate the work done by the force as the block moves from $x = 0$ to $x = ${d.L}\\ \\mathrm{m}$.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The force changes with position, so the work is the integral of the force over the displacement (the area under the $F$–$x$ graph), not force × distance.',
          math: tex`W = \int_0^{L} F\,dx = \int_0^{L} (A + Bx^2)\,dx = \Big[Ax + \tfrac{1}{3}Bx^3\Big]_0^{L} = AL + \tfrac{1}{3}BL^3`,
        },
        { math: tex`W = ${d.A} \times ${d.L} + \tfrac{1}{3} \times ${d.B} \times ${d.L}^3 = ${fmtWA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Integral of $F$ with respect to $x$, with correct limits' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Calculate the speed of the block when it reaches $x = ${d.L}\\ \\mathrm{m}$.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The applied force is the only force that does work (the surface is frictionless, and the weight and normal force are perpendicular to the motion). By the work–energy theorem, $W_{\\text{net}} = \\Delta K$, and the block starts from rest.',
          math: tex`W = \tfrac{1}{2}mv^2 \quad\Rightarrow\quad v = \sqrt{\frac{2W}{m}} = \sqrt{\frac{2 \times ${fmtW(r.W)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Work–energy theorem: $W = \\Delta K$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Calculate the power delivered to the block by the force at the instant the block reaches $x = ${d.L}\\ \\mathrm{m}$.`,
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Instantaneous power is $P = \\vec{F}\\cdot\\vec{v} = Fv$, since the force and the velocity are in the same direction. Use the force at that position.',
          math: tex`F(L) = A + BL^2 = ${d.A} + ${d.B} \times ${d.L}^2 = ${fmtW(r.FL)}\ ${u('N')}`,
        },
        { math: tex`P = Fv = ${fmtW(r.FL)} \times ${fmtW(r.v)} = ${fmtA(r.P)}\ ${u('W')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$P = Fv$ with $F$ evaluated at $x = L$' }, { mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }, { note: 'Allow credit for an answer consistent with (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ d }) => `Which of the following is equal to the work done by the force from $x = 0$ to $x = ${d.L}\\ \\mathrm{m}$?`,
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The area under the graph of $F$ as a function of $x$, between $x = 0$ and $x = L$', correct: true },
          { text: '$F(L) \\times L$, the force at $x = L$ multiplied by the distance' },
          { text: 'The slope of the graph of $F$ as a function of $x$ at $x = L$' },
          { text: '$\\tfrac{1}{2}F(L)\\,L$, half the force at $x = L$ multiplied by the distance' },
        ],
      },
      solution: () => [
        {
          text: 'The integral $\\int_0^L F\\,dx$ is the area under the $F$–$x$ graph. $F(L)\\,L$ would be correct only for a constant force (here it is too large, because the force increases). $\\tfrac{1}{2}F(L)\\,L$ would be correct only for a force proportional to $x$, such as a spring force.',
        },
      ],
      markscheme: () => [{ note: 'Work is the area under the F–x graph.' }],
    },
  ],
  extensions: [
    {
      prompt: () =>
        'Derive an expression for the speed $v$ of the block as a function of its position $x$, in terms of $A$, $B$, $m$ and $x$. Start from the work–energy theorem.',
      marks: 3,
      lines: 6,
      markscheme: () => [
        { mark: "Work done from $0$ to $x$: $W(x) = \\int_0^x (A + Bx'^2)\\,dx' = Ax + \\tfrac{1}{3}Bx^3$" },
        { mark: 'Work–energy theorem, starting from rest: $\\tfrac{1}{2}mv^2 = W(x)$' },
        { mark: '$v = \\sqrt{\\dfrac{2}{m}\\left(Ax + \\tfrac{1}{3}Bx^3\\right)}$' },
      ],
    },
  ],
});
