import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-projectile-kick',
  version: 2,
  title: 'Ball kicked across level ground',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.6', 'ibp.A.1.7'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['long-response', 'calculation', 'short-answer'],
  difficulty: 3,

  params: {
    v: { min: 12, max: 28, step: 1, base: 18 },
    theta: { min: 20, max: 70, step: 5, base: 40 },
  },

  compute: (p, c) => {
    const vx = p.v * cosD(p.theta);
    const vy = p.v * sinD(p.theta);
    const H = c.carry(vy, 'vy') ** 2 / (2 * c.g);
    const tf = (2 * c.carry(vy, 'vy')) / c.g;
    const R = c.carry(vx, 'vx') * c.carry(tf, 'tf');
    return { vx, vy, H, tf, R, tUp: tf / 2 };
  },

  stem: ({ d }) =>
    `A ball is kicked from ground level with an initial velocity of ${Q(d.v, 'm s-1')} at ${Q(d.theta, 'deg')} above the horizontal. The ground is horizontal and air resistance is negligible.`,

  parts: [
    {
      label: '(a)(i)',
      marks: 1,
      prompt: () => 'Calculate the horizontal component of the initial velocity.',
      response: { kind: 'numeric', answer: 'vx', symbol: 'v_x', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Resolve the initial velocity. The horizontal component is adjacent to the angle, so use cosine.',
          math: tex`v_x = v\cos\theta = ${d.v}\cos ${d.theta}^{\circ} = ${fmtW(r.vx)} \approx ${fmtA(r.vx)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_x = ${fmtA(r.vx)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(a)(ii)',
      marks: 1,
      prompt: () => 'Calculate the vertical component of the initial velocity.',
      response: { kind: 'numeric', answer: 'vy', symbol: 'v_y', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The vertical component is opposite the angle, so use sine.',
          math: tex`v_y = v\sin\theta = ${d.v}\sin ${d.theta}^{\circ} = ${fmtW(r.vy)} \approx ${fmtA(r.vy)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_y = ${fmtA(r.vy)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the maximum height reached by the ball.',
      response: { kind: 'numeric', answer: 'H', symbol: 'h', unit: 'm', positive: true },
      solution: ({ r, g }) => [
        {
          text: 'Consider the vertical motion only. Taking upwards as positive, the vertical velocity falls from $v_y$ to zero at the top, with acceleration $-g$. Keep an extra significant figure in $v_y$ so the final answer is not affected by rounding.',
          math: knowns([['u', fmtW(r.vy), 'm s-1'], ['v', '0'], ['a', `-${g}`, 'm s-2'], ['s', 'h = ?']]),
        },
        {
          text: 'Use the equation of motion without $t$ and rearrange for $h$.',
          math: tex`v^2 = u^2 + 2as \quad\Rightarrow\quad h = \frac{v_y^{\,2}}{2g}`,
        },
        {
          text: 'Substitute and evaluate.',
          math: tex`h = \frac{${fmtW(r.vy)}^2}{2 \times ${g}} = ${fmtA(r.H)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $v^2 = u^2 + 2as$ with the vertical component and $v = 0$ at the top' },
        { mark: tex`$h = ${fmtA(r.H)}\ ${u('m')}$` },
        { note: 'Allow ECF from (a)(ii).' },
      ],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Determine the horizontal distance travelled by the ball before it lands.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'm', positive: true },
      solution: ({ r, g }) => [
        {
          text: 'First find the time of flight from the vertical motion. The ball lands at the same height it started from, so its vertical displacement is zero. The equation has two roots: $t = 0$ is the moment of the kick, and the non-zero root is the landing time.',
          math: tex`0 = v_y t - \tfrac{1}{2}g t^2 = t\left(v_y - \tfrac{1}{2}g t\right) \;\Rightarrow\; t = \frac{2v_y}{g}`,
        },
        {
          text: 'Substitute, keeping an extra significant figure.',
          math: tex`t = \frac{2 \times ${fmtW(r.vy)}}{${g}} = ${fmtW(r.tf)}\ ${u('s')}`,
        },
        {
          text: 'The horizontal velocity is constant (no horizontal force), so horizontal distance = horizontal velocity × time.',
          math: tex`R = v_x t = ${fmtW(r.vx)} \times ${fmtW(r.tf)} = ${fmtA(r.R)}\ ${u('m')}`,
        },
        {
          text: `Check: by symmetry the ball takes half the flight time, ${Q(fmtA(r.tUp), 's')}, to reach its highest point.`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Time of flight from the vertical motion, $t = 2v_y / g$ (or twice the time to the top)' },
        { mark: tex`$t = ${fmtA(r.tf)}\ ${u('s')}$` },
        { mark: tex`$R = ${fmtA(r.R)}\ ${u('m')}$` },
        { note: 'Allow ECF from (a). Award [3] for a bald correct answer.' },
      ],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () =>
        'In practice, air resistance acting on the ball is not negligible. Explain how air resistance affects the maximum height reached and the horizontal distance travelled by the ball.',
      response: { kind: 'text', lines: 5 },
      solution: () => [
        {
          text: 'Air resistance (drag) acts opposite to the velocity of the ball, and it increases with speed.',
        },
        {
          text: 'While the ball rises, drag has a downward component. The vertical deceleration is greater than $g$, so the ball stops rising sooner and the **maximum height is smaller**.',
        },
        {
          text: 'Drag also has a horizontal component opposite to the motion, so the horizontal velocity decreases instead of staying constant. Together with the shorter time of flight, this means the **horizontal distance is smaller**.',
        },
        {
          text: 'The path is no longer a symmetrical parabola: the descent is steeper than the ascent.',
        },
      ],
      markscheme: () => [
        { mark: 'Maximum height is lower, because drag has a downward component while rising / increases the vertical deceleration' },
        { mark: 'Horizontal distance is shorter, because the horizontal velocity decreases / is not constant' },
        { note: 'Award [1 max] for "both are smaller" with no reasons. OWTTE.' },
      ],
    },
  ],
});
