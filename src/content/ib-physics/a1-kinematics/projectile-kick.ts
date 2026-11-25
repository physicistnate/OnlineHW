import { defineQuestion } from '../../../engine/define';
import { cosD, fmt, sinD } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-projectile-kick',
  version: 1,
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
      response: { kind: 'numeric', answer: 'vx', symbol: 'v_x', unit: 'm s-1' },
      solution: ({ d, r }) => [
        {
          text: 'Resolve the initial velocity. The horizontal component is adjacent to the angle, so use cosine.',
          math: tex`v_x = v\cos\theta = ${d.v}\cos ${d.theta}^{\circ} = ${fmt(r.vx)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_x = ${fmt(r.vx)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(a)(ii)',
      marks: 1,
      prompt: () => 'Calculate the vertical component of the initial velocity.',
      response: { kind: 'numeric', answer: 'vy', symbol: 'v_y', unit: 'm s-1' },
      solution: ({ d, r }) => [
        {
          text: 'The vertical component is opposite the angle, so use sine.',
          math: tex`v_y = v\sin\theta = ${d.v}\sin ${d.theta}^{\circ} = ${fmt(r.vy)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_y = ${fmt(r.vy)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the maximum height reached by the ball.',
      response: { kind: 'numeric', answer: 'H', symbol: 'h', unit: 'm' },
      solution: ({ r, g }) => [
        {
          text: 'Consider the vertical motion only. Taking upwards as positive, the vertical velocity falls from $v_y$ to zero at the top, with acceleration $-g$.',
          math: knowns([['u', fmt(r.vy), 'm s-1'], ['v', '0'], ['a', `-${g}`, 'm s-2'], ['s', 'h = ?']]),
        },
        {
          text: 'Use the equation of motion without $t$ and rearrange for $h$.',
          math: tex`v^2 = u^2 + 2as \quad\Rightarrow\quad h = \frac{v_y^{\,2}}{2g}`,
        },
        {
          text: 'Substitute and evaluate.',
          math: tex`h = \frac{${fmt(r.vy)}^2}{2 \times ${g}} = ${fmt(r.H)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $v^2 = u^2 + 2as$ with the vertical component and $v = 0$ at the top' },
        { mark: tex`$h = ${fmt(r.H)}\ ${u('m')}$` },
        { note: 'Allow ECF from (a)(ii).' },
      ],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Determine the horizontal distance travelled by the ball before it lands.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'm' },
      solution: ({ r, g }) => [
        {
          text: 'First find the time of flight from the vertical motion. The ball lands at the same height it started from, so its vertical displacement is zero.',
          math: tex`s = ut + \tfrac{1}{2}at^2 \;\Rightarrow\; 0 = v_y t - \tfrac{1}{2}g t^2 \;\Rightarrow\; t = \frac{2v_y}{g}`,
        },
        {
          text: 'Substitute.',
          math: tex`t = \frac{2 \times ${fmt(r.vy)}}{${g}} = ${fmt(r.tf)}\ ${u('s')}`,
        },
        {
          text: 'The horizontal velocity is constant (no horizontal force), so horizontal distance = horizontal velocity × time.',
          math: tex`R = v_x t = ${fmt(r.vx)} \times ${fmt(r.tf)} = ${fmt(r.R)}\ ${u('m')}`,
        },
        {
          text: `Check: by symmetry the ball takes half the flight time, ${Q(fmt(r.tUp), 's')}, to reach its highest point.`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Time of flight from vertical motion, $t = \\frac{2v_y}{g}$ (or twice the time to the top)' },
        { mark: tex`$t = ${fmt(r.tf)}\ ${u('s')}$` },
        { mark: tex`$R = ${fmt(r.R)}\ ${u('m')}$` },
        { note: 'Allow ECF from (a). Award [3] for a bald correct answer.' },
      ],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () =>
        'In practice, air resistance acting on the ball is not negligible. Outline how air resistance affects the maximum height reached and the horizontal distance travelled by the ball.',
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
