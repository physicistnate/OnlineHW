import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  F1: number;
  F2: number;
  a: number;
  w: number;
}

/** Constant force F1 up to x = a, then decreasing linearly to −F2 at x = a + w. */
const graph = (p: P): GraphSpec => {
  const span = p.F1 + p.F2 + 2;
  const major = span > 10 ? 2 : 1;
  const top = Math.ceil((p.F1 + 1) / major) * major;
  const bottom = -Math.ceil((p.F2 + 1) / major) * major;
  return {
    x: { label: 'x (m)', min: 0, max: p.a + p.w + 1, major: 1, minor: 0.5 },
    y: { label: 'F (N)', min: bottom, max: top, major, minor: major / 2 },
    series: [{ points: [[0, p.F1], [p.a, p.F1], [p.a + p.w, -p.F2]], showPoints: true }],
  };
};

export default defineQuestion({
  id: 'apcm-u3-force-position-graph',
  version: 1,
  title: 'Work and speed from a force–position graph',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.2', 'apcm.3.1'],
  style: 'AP',
  paper: 'AP-style problem set',
  types: ['graph-reading', 'calculation'],
  difficulty: 2,

  params: {
    F1: { min: 2, max: 8, step: 1, base: 6 },
    F2: { min: 1, max: 6, step: 1, base: 3 },
    a: { min: 1, max: 4, step: 1, base: 2 },
    w: { min: 2, max: 6, step: 1, base: 3 },
    m: { min: 0.5, max: 3, step: 0.5, base: 1, dp: 1 },
    v0: { min: 1, max: 4, step: 0.5, base: 2, dp: 1 },
  },
  // The block still has a clear amount of kinetic energy at the end of the graph.
  constraint: (p) => {
    const W = p.F1 * p.a + 0.5 * (p.F1 - p.F2) * p.w;
    const K0 = 0.5 * p.m * p.v0 ** 2;
    return K0 + W >= 0.5 && K0 + W >= 0.25 * (K0 + p.F1 * p.a);
  },

  compute: (p, c) => {
    const W1 = p.F1 * p.a;
    const W2 = 0.5 * (p.F1 - p.F2) * p.w;
    const W = W1 + W2;
    const K0 = 0.5 * p.m * p.v0 ** 2;
    const Kb = c.carry(K0) + c.carry(W, 'W');
    c.assume(Kb > 0);
    const vb = Math.sqrt((2 * Kb) / p.m);
    const x0 = p.a + (p.w * p.F1) / (p.F1 + p.F2);
    return { W1, W2, W, K0, Kb, vb, x0, b: p.a + p.w };
  },

  stem: ({ d }) =>
    `A block of mass ${Q(d.m, 'kg')} moves along a horizontal, frictionless surface in the $+x$ direction. At $x = 0$ its speed is ${Q(d.v0, 'm/s')}. A horizontal force $F$ acts on the block. The graph shows how $F$ varies with position $x$ (positive $F$ is in the $+x$ direction).`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the work done on the block by the force from $x = 0$ to $x = ${p.a}\\ \\mathrm{m}$.`,
      response: { kind: 'numeric', answer: 'W1', symbol: 'W', unit: 'J', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'The work done is the area under the force–position graph. Here the force is constant, so the area is a rectangle.',
          math: tex`W = ${p.F1} \times ${p.a} = ${fmtA(r.W1)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W = ${fmtA(r.W1)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ r }) => `Calculate the net work done on the block by the force from $x = 0$ to $x = ${r.b}\\ \\mathrm{m}$.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J' },
      solution: ({ p, r }) => [
        {
          text: 'Add the signed area of the sloping section. Where the graph is below the axis, the force is opposite to the motion and the work is negative. The sloping section is a trapezoid with signed heights $F_1$ and $-F_2$:',
          math: tex`W_2 = \tfrac{1}{2}\big(${p.F1} + (-${p.F2})\big) \times ${p.w} = ${fmtW(r.W2)}\ ${u('J')}`,
        },
        { math: tex`W = ${fmtW(r.W1)} ${r.W2 < 0 ? '-' : '+'} ${fmtW(Math.abs(r.W2))} = ${fmtA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Area below the axis counted as negative work' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ r }) => `Calculate the speed of the block at $x = ${r.b}\\ \\mathrm{m}$.`,
      response: { kind: 'numeric', answer: 'vb', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Work–energy theorem: the net work done equals the change in kinetic energy. The force shown is the only force that does work.',
          math: tex`K = K_0 + W = \tfrac{1}{2} \times ${d.m} \times ${d.v0}^2 ${r.W < 0 ? '-' : '+'} ${fmtW(Math.abs(r.W))} = ${fmtW(r.Kb)}\ ${u('J')}`,
        },
        { math: tex`v = \sqrt{\frac{2K}{m}} = \sqrt{\frac{2 \times ${fmtW(r.Kb)}}{${d.m}}} = ${fmtA(r.vb)}\ ${u('m/s')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$K_0 + W_{\\text{net}} = K$' }, { mark: tex`$v = ${fmtA(r.vb)}\ ${u('m/s')}$` }, { note: 'Allow credit for an answer consistent with (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'At what position is the speed of the block greatest?',
      response: { kind: 'numeric', answer: 'x0', symbol: 'x', unit: 'm', positive: true, tolerance: { rel: 0.02 } },
      solution: ({ p, r }) => [
        {
          text: 'The block speeds up while the force is positive and slows down once the force becomes negative, so the speed is greatest where $F = 0$. On the sloping line the force falls by $F_1 + F_2$ over a distance $w$:',
          math: tex`x = ${p.a} + ${p.w} \times \frac{${p.F1}}{${p.F1} + ${p.F2}} = ${fmtA(r.x0)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`Where $F = 0$: $x = ${fmtA(r.x0)}\ ${u('m')}$` }],
    },
  ],
});
