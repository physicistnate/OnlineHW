import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';
import { niceAxis } from '../graph-axes';

interface P {
  a: number;
  Fa: number;
  d: number;
  dF: number;
}

/** A rubber cord: stiff at first, then less stiff. Extension in cm, force in N. */
const graph = (p: P): GraphSpec => {
  const b = p.a + p.d;
  const Fb = p.Fa + p.dF;
  return {
    x: niceAxis(b, 'x / cm'),
    y: niceAxis(Fb, 'F / N'),
    series: [{ points: [[0, 0], [p.a, p.Fa], [b, Fb]], showPoints: true }],
  };
};

export default defineQuestion({
  id: 'ibp-a3-force-extension-area',
  version: 1,
  title: 'Energy stored in a stretched rubber cord',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.2', 'ibp.A.3.3', 'ibp.A.3.6'],
  uses: ['ibp.A.2.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    a: { min: 4, max: 10, step: 2, base: 6 },
    Fa: { min: 3, max: 8, step: 1, base: 6 },
    d: { min: 4, max: 10, step: 2, base: 8 },
    dF: { min: 1, max: 3, step: 1, base: 2 },
    m: { min: 20, max: 100, step: 5, base: 40 },
    eff: { min: 60, max: 90, step: 5, base: 75 },
  },
  // The cord gets less stiff: the second section is less steep than the first.
  constraint: (p) => p.dF / p.d < p.Fa / p.a,

  compute: (p, c) => {
    const W1 = 0.5 * p.Fa * (p.a / 100);
    const b = p.a + p.d;
    const Fb = p.Fa + p.dF;
    const W2 = 0.5 * (p.Fa + Fb) * (p.d / 100);
    const W = c.carry(W1, 'W1') + c.carry(W2);
    const v = Math.sqrt((2 * (p.eff / 100) * c.carry(W, 'W')) / (p.m / 1000));
    return { W1, b, Fb, W2, W, v, mkg: p.m / 1000 };
  },

  stem: () =>
    'The graph shows how the force $F$ needed to stretch a rubber cord varies with the extension $x$ of the cord. The cord does not obey Hooke’s law.',
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Determine the work done in stretching the cord to an extension of ${Q(p.a, 'cm')}.`,
      response: { kind: 'numeric', answer: 'W1', symbol: 'W', unit: 'J', positive: true, tolerance: { rel: 0.03 } },
      solution: ({ p, r }) => [
        {
          text: 'The work done is the area under the force–extension graph. Up to the first marked point the area is a triangle. Convert the extension to metres.',
          math: tex`W = \tfrac{1}{2} \times ${p.Fa} \times ${fmtW(p.a / 100)} = ${fmtA(r.W1)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`Area of the triangle, $W = ${fmtA(r.W1)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ r }) => `Determine the total work done in stretching the cord to an extension of ${Q(r.b, 'cm')}.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true, tolerance: { rel: 0.03 } },
      solution: ({ p, r }) => [
        {
          text: 'Add the area of the trapezium between the two marked points. (When the force changes, work is not simply force × distance: it is the area under the graph, which is what the integral $\\int F\\,dx$ means.)',
          math: tex`W_2 = \tfrac{1}{2}(${p.Fa} + ${r.Fb}) \times ${fmtW(p.d / 100)} = ${fmtW(r.W2)}\ ${u('J')}`,
        },
        {
          text: 'Total work done = elastic potential energy stored.',
          math: tex`W = ${fmtW(r.W1)} + ${fmtW(r.W2)} = ${fmtA(r.W)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Work = total area under the graph (triangle + trapezium)' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) =>
        `The cord is used as a catapult to launch a stone of mass ${Q(d.m, 'g')}. Only ${Q(d.eff, '%')} of the stored energy becomes kinetic energy of the stone. Calculate the launch speed of the stone.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true, tolerance: { rel: 0.03 } },
      solution: ({ p, r }) => [
        {
          text: 'The useful energy (efficiency × stored energy) becomes kinetic energy. The rest is transferred to internal energy of the rubber, which warms up.',
          math: tex`\tfrac{1}{2}mv^2 = ${fmtW(p.eff / 100)} \times W \quad\Rightarrow\quad v = \sqrt{\frac{2 \times ${fmtW(p.eff / 100)} \times ${fmtW(r.W)}}{${fmtW(r.mkg)}}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Kinetic energy = efficiency × stored energy' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why can the stored energy not be calculated with $E_H = \\tfrac{1}{2}k\\Delta x^2$ for this cord?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The force is not proportional to the extension, so there is no single spring constant.', correct: true },
          { text: 'Rubber cords cannot store elastic potential energy.' },
          { text: 'The formula only works for compressions, not extensions.' },
          { text: 'The extension is given in centimetres instead of metres.' },
        ],
      },
      solution: () => [
        {
          text: '$E_H = \\tfrac{1}{2}k\\Delta x^2$ is the area of a triangle under a straight-line graph, which needs $F = k\\Delta x$ with a constant $k$. This graph changes gradient, so the area must be found piece by piece.',
        },
      ],
      markscheme: () => [{ note: 'Hooke’s law (F ∝ x) does not hold, so k is not constant.' }],
    },
  ],
});
