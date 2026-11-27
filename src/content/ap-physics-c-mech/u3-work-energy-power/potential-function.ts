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
  paper: 'AP-style problem set',
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

  compute: (p, c) => {
    const t1 = 4 * p.a * p.x0 ** 3;
    const t2 = 2 * p.b * p.x0;
    const F = t2 - t1; // F = −dU/dx = −4ax³ + 2bx
    const xe = Math.sqrt(p.b / (2 * p.a));
    // U(0) − U(x) at the position from (b) (equal to b²/4a at the true equilibrium), so a
    // student's own answer to (b) carries through.
    const xc = c.carry(xe, 'xe');
    const depth = p.b * xc ** 2 - p.a * xc ** 4;
    c.assume(depth > 0);
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
      prompt: () =>
        'The object passes through the stable equilibrium position found in (b), moving toward $x = 0$. Calculate the critical speed at that position: with any greater speed the object crosses $x = 0$, and with any smaller speed it turns back before reaching $x = 0$.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v_{\\text{crit}}', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Mechanical energy is conserved. On the way to $x = 0$ the potential energy rises by $U(0) - U(x)$, where $x$ is the equilibrium position. If the kinetic energy at $x$ is greater than this rise, the object crosses $x = 0$; if it is smaller, the object turns back. The critical kinetic energy equals the rise.',
          math: tex`\Delta U = U(0) - U(x) = bx^2 - ax^4 = ${d.b} \times (${fmtW(r.xe)})^2 - ${d.a} \times (${fmtW(r.xe)})^4 = ${fmtW(r.depth)}\ ${u('J')}`,
        },
        { text: 'With $x^2 = b/2a$ this is $b^2/4a$.' },
        { math: tex`\tfrac{1}{2}mv^2 = \Delta U \quad\Rightarrow\quad v = \sqrt{\frac{2 \times ${fmtW(r.depth)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}` },
        {
          text: 'At exactly the critical speed the object would only approach $x = 0$, slowing down more and more without ever arriving, because the force there is zero: it is an energy threshold, not a speed that gets the object to $x = 0$ at a definite time.',
        },
      ],
      markscheme: ({ r }) => [
        { mark: tex`$\Delta U = U(0) - U(x) = bx^2 - ax^4 = ${fmtA(r.depth)}\ ${u('J')}$ (that is, $b^2/4a$)` },
        { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` },
        { note: 'Allow credit for an answer consistent with (b).' },
      ],
    },
  ],
  extensions: [
    {
      prompt: () =>
        'Sketch $U(x)$ for $x \\ge 0$. Use your sketch to explain why the object, released from rest a little beyond the equilibrium position found in (b), oscillates about that position.',
      marks: 3,
      lines: 8,
      markscheme: () => [
        { mark: 'Sketch: $U = 0$ at $x = 0$, falling to a minimum at $x = \\sqrt{b/2a}$, then rising steeply (like $x^4$)' },
        { mark: 'The force $F = -dU/dx$ points toward the minimum on both sides of it: a restoring force' },
        { mark: 'Energy is conserved, so the object moves between two turning points where $U(x) = E$, one on each side of the minimum: it oscillates' },
      ],
    },
  ],
});
