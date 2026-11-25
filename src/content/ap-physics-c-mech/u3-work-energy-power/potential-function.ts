import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-potential-function',
  version: 1,
  title: 'Force, equilibrium and energy from a potential energy function',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.3', 'apcm.3.4'],
  style: 'AP',
  paper: 'Free-response style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    a: { min: 0.5, max: 4, step: 0.5, base: 1.5, dp: 1 },
    b: { min: 1, max: 8, step: 1, base: 3 },
    x0: { min: 0.2, max: 2, step: 0.1, base: 0.5, dp: 1 },
    m: { min: 0.2, max: 2, step: 0.1, base: 0.5, dp: 1 },
  },
  // The two terms of the force at x0 do not nearly cancel, and the minimum speed in (d) is reasonable.
  constraint: (p) => {
    const t1 = 4 * p.a * p.x0 ** 3;
    const t2 = 2 * p.b * p.x0;
    return Math.abs(t2 - t1) >= 0.25 * (t1 + t2) && p.b / Math.sqrt(2 * p.a * p.m) <= 20;
  },

  compute: (p) => {
    const t1 = 4 * p.a * p.x0 ** 3;
    const t2 = 2 * p.b * p.x0;
    const F = t2 - t1; // F = −dU/dx = −4ax³ + 2bx
    const xe = Math.sqrt(p.b / (2 * p.a));
    const depth = p.b ** 2 / (4 * p.a); // U(0) − U(xe)
    const v = Math.sqrt((2 * depth) / p.m);
    return { t1, t2, F, xe, depth, v };
  },

  stem: ({ d }) =>
    `An object of mass ${Q(d.m, 'kg')} moves along the $x$-axis. The only force on it is conservative, and the potential energy of the system is $U(x) = ax^4 - bx^2$, where $a = ${d.a}\\ \\mathrm{J/m^4}$ and $b = ${d.b}\\ \\mathrm{J/m^2}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Calculate the force on the object when it is at $x = ${d.x0}\\ \\mathrm{m}$. Take the $+x$ direction as positive.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F_x', unit: 'N' },
      solution: ({ d, r }) => [
        {
          text: 'For a conservative force, $F_x = -\\dfrac{dU}{dx}$.',
          math: tex`F_x = -\frac{d}{dx}\left(ax^4 - bx^2\right) = -4ax^3 + 2bx`,
        },
        {
          math: tex`F_x = -4 \times ${d.a} \times ${d.x0}^3 + 2 \times ${d.b} \times ${d.x0} = -${fmtW(r.t1)} + ${fmtW(r.t2)} = ${fmtA(r.F)}\ ${u('N')}`,
        },
        {
          text: r.F > 0 ? 'The force is positive: it points in the $+x$ direction, down the slope of the $U(x)$ graph.' : 'The force is negative: it points in the $-x$ direction, down the slope of the $U(x)$ graph.',
        },
      ],
      markscheme: ({ r }) => [{ mark: '$F_x = -dU/dx = -4ax^3 + 2bx$' }, { mark: tex`$F_x = ${fmtA(r.F)}\ ${u('N')}$, with the correct sign` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'The object has a position of stable equilibrium at a positive value of $x$. Calculate this value of $x$.',
      response: { kind: 'numeric', answer: 'xe', symbol: 'x', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At an equilibrium position the force is zero, so $dU/dx = 0$: $4ax^3 - 2bx = 0$, giving $x = 0$ or $x^2 = b/2a$. The positive root is a minimum of $U$ (stable).',
          math: tex`x = \sqrt{\frac{b}{2a}} = \sqrt{\frac{${d.b}}{2 \times ${d.a}}} = ${fmtA(r.xe)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Setting $dU/dx = 0$' }, { mark: tex`$x = ${fmtA(r.xe)}\ ${u('m')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which of the following describes the position $x = 0$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'An unstable equilibrium position, because $U(x)$ has a maximum there', correct: true },
          { text: 'A stable equilibrium position, because $U(0) = 0$' },
          { text: 'Not an equilibrium position, because the potential energy is not a minimum' },
          { text: 'A stable equilibrium position, because the force there is zero' },
        ],
      },
      solution: () => [
        {
          text: 'At $x = 0$, $dU/dx = 0$, so the force is zero: it is an equilibrium position. Near $x = 0$, $U \\approx -bx^2$, which is a maximum. A small displacement either way lowers $U$, so the force pushes the object further away: the equilibrium is unstable.',
        },
      ],
      markscheme: () => [{ note: 'Zero force at a maximum of U: unstable equilibrium.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'The object passes through the stable equilibrium position found in (b). Calculate the minimum speed it must have there to reach $x = 0$.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v_{\\min}', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Mechanical energy is conserved. To just reach $x = 0$ (arriving with zero speed), the kinetic energy at the equilibrium position must equal the rise in potential energy. With $x^2 = b/2a$: $U = a\\left(\\dfrac{b}{2a}\\right)^2 - b\\left(\\dfrac{b}{2a}\\right) = -\\dfrac{b^2}{4a}$, and $U(0) = 0$.',
          math: tex`\Delta U = U(0) - U(x) = \frac{b^2}{4a} = \frac{${d.b}^2}{4 \times ${d.a}} = ${fmtW(r.depth)}\ ${u('J')}`,
        },
        { math: tex`\tfrac{1}{2}mv^2 = \Delta U \quad\Rightarrow\quad v = \sqrt{\frac{2 \times ${fmtW(r.depth)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`Energy difference $b^2/4a = ${fmtA(r.depth)}\ ${u('J')}$` }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Allow credit for an answer consistent with (b).' }],
    },
  ],
});
