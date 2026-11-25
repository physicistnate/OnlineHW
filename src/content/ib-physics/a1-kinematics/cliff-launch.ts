import { defineQuestion } from '../../../engine/define';
import { atanD, fmtA, fmtW } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-cliff-launch',
  version: 1,
  title: 'Stone thrown horizontally from a cliff',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.6', 'ibp.A.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['long-response', 'calculation'],
  difficulty: 2,

  params: {
    h: { min: 15, max: 60, step: 1, base: 45 },
    u: { min: 5, max: 20, step: 0.5, base: 12, dp: 1 },
  },

  compute: (p, c) => {
    const t = Math.sqrt((2 * p.h) / c.g);
    const tc = c.carry(t, 't');
    c.assume(tc > 0);
    const R = p.u * tc;
    // Method 1: vertical component from (a), v_y = g t.
    const vy = c.g * tc;
    const vyc = c.carry(vy);
    const v = Math.sqrt(p.u ** 2 + vyc ** 2);
    const theta = atanD(vyc / p.u);
    // Method 2: vertical component from v² = u² + 2as, without the time.
    const vy2 = Math.sqrt(2 * c.g * p.h);
    const vy2c = c.carry(vy2);
    const v__suvat = Math.sqrt(p.u ** 2 + vy2c ** 2);
    const theta__suvat = atanD(vy2c / p.u);
    return { t, R, vy, v, theta, vy2, v__suvat, theta__suvat };
  },

  stem: ({ d }) =>
    `A stone is thrown horizontally with a speed of ${Q(d.u, 'm s-1')} from the top of a vertical cliff. The point of release is ${Q(d.h, 'm')} above the surface of the sea. Air resistance is negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the time taken for the stone to reach the sea.',
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'The horizontal and vertical motions are independent. Vertically, the stone starts with zero velocity (it is thrown horizontally) and accelerates at $g$. Take downwards as positive.',
          math: knowns([['u_y', '0'], ['a', g, 'm s-2'], ['s', d.h, 'm'], ['t', '?']]),
        },
        {
          text: 'Use $s = ut + \\tfrac{1}{2}at^2$ with $u_y = 0$, and rearrange for $t$.',
          math: tex`h = \tfrac{1}{2}g t^2 \quad\Rightarrow\quad t = \sqrt{\frac{2h}{g}}`,
        },
        {
          text: 'Substitute and evaluate.',
          math: tex`t = \sqrt{\frac{2 \times ${d.h}}{${g}}} = ${fmtA(r.t)}\ ${u('s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $h = \\tfrac{1}{2}gt^2$' }, { mark: tex`$t = ${fmtA(r.t)}\ ${u('s')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the horizontal distance from the foot of the cliff to the point where the stone enters the sea.',
      response: { kind: 'numeric', answer: 'R', symbol: 'd', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'There is no horizontal force on the stone, so its horizontal velocity stays at its initial value for the whole flight. Distance = horizontal velocity × time of flight.',
          math: tex`d = u\,t = ${d.u} \times ${fmtW(r.t)} = ${fmtA(r.R)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Horizontal velocity is constant, so $d = ut$' },
        { mark: tex`$d = ${fmtA(r.R)}\ ${u('m')}$` },
        { note: 'Allow ECF from (a).' },
      ],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: () => 'Determine the speed of the stone just before it enters the sea.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'First find the vertical component of the velocity at impact, using the time from (a). Keep an extra significant figure.',
          math: tex`v_y = g\,t = ${g} \times ${fmtW(r.t)} = ${fmtW(r.vy)}\ ${u('m s-1')}`,
        },
        {
          text: 'The horizontal component is still the launch speed. The two components are perpendicular, so combine them with Pythagoras.',
          math: tex`v = \sqrt{v_x^{\,2} + v_y^{\,2}} = \sqrt{${d.u}^2 + ${fmtW(r.vy)}^2} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
        {
          text: 'Check with a method that does not use the time: $v^2 = u^2 + 2as$ for the vertical motion gives the same vertical component.',
          math: tex`v_y = \sqrt{2gh} = \sqrt{2 \times ${g} \times ${d.h}} = ${fmtW(r.vy2)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: tex`$v_y = gt$ **or** $v_y = \sqrt{2gh}$, $v_y = ${fmtA(r.vy)}\ ${u('m s-1')}$` },
        { mark: 'Combination of perpendicular components: $v = \\sqrt{v_x^2 + v_y^2}$' },
        { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` },
        { note: 'Allow ECF from (a).' },
      ],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the angle between the velocity of the stone and the horizontal just before it enters the sea.',
      response: { kind: 'numeric', answer: 'theta', symbol: '\\theta', unit: 'deg', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'In the right-angled triangle of velocity components, the vertical component is opposite the angle and the horizontal component is adjacent to it.',
          math: tex`\tan\theta = \frac{v_y}{v_x} = \frac{${fmtW(r.vy)}}{${d.u}}`,
        },
        {
          text: 'Take the inverse tangent.',
          math: tex`\theta = ${fmtA(r.theta)}^{\circ}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $\\tan\\theta = v_y / v_x$' },
        { mark: tex`$\theta = ${fmtA(r.theta)}^{\circ}$ below the horizontal` },
        { note: 'Allow ECF from (a).' },
      ],
    },
  ],
});
