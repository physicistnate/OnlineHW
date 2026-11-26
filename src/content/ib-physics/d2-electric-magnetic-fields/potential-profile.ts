import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';
import { IB } from '../constants';

interface P {
  V0: number;
  x1: number;
  w: number;
  x3: number;
}

/** Corners of the potential profile (x in cm, V in volts). */
const corners = (p: P): [number, number][] => [
  [0, p.V0],
  [p.x1, p.V0 / 2],
  [p.x1 + p.w, p.V0 / 2],
  [p.x1 + p.w + p.x3, 0],
];

const graph = (p: P): GraphSpec => {
  const end = p.x1 + p.w + p.x3;
  return {
    x: { label: 'x / cm', min: 0, max: end + 1, major: 1, minor: 0.5 },
    y: { label: 'V / V', min: 0, max: p.V0 + 20, major: 20, minor: 10 },
    series: [{ points: corners(p), showPoints: true }],
  };
};

export default defineQuestion({
  id: 'ibp-d2-potential-profile',
  version: 1,
  title: 'Electric field strength from a graph of potential',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.8', 'ibp.D.2.9'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V0: { choices: [80, 100, 120, 160], base: 120 },
    x1: { choices: [1, 2, 3], base: 2 },
    w: { choices: [2, 3], base: 3 },
    x3: { choices: [2, 3, 4], base: 3 },
  },

  compute: (p) => {
    const E1 = p.V0 / 2 / (p.x1 / 100);
    const E3 = p.V0 / 2 / (p.x3 / 100);
    const Ek = 2 * IB.e * p.V0;
    return { E1, E3, Ek, zero: 0 };
  },

  stem: () =>
    'The graph shows how the electric potential $V$ varies with distance $x$ along a line between two parallel electrodes, with a region in between where a wire mesh keeps the potential constant. The field is parallel to the line.',
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => `Determine the electric field strength between $x = 0$ and $x = ${p.x1}$ cm.`,
      response: { kind: 'numeric', answer: 'E1', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ p, r }) => [
        { text: 'The field strength is minus the potential gradient, $E = -\\dfrac{\\Delta V}{\\Delta x}$:', math: tex`|E| = \frac{${p.V0} - ${p.V0 / 2}}{${p.x1} \times 10^{-2}} = ${fmtA(r.E1)}\ ${u('V m-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Gradient of the graph, with $x$ in metres' }, { mark: tex`$E = ${fmtA(r.E1)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ p }) => `State the electric field strength between $x = ${p.x1}$ cm and $x = ${p.x1 + p.w}$ cm.`,
      response: { kind: 'numeric', answer: 'zero', symbol: 'E', unit: 'V m-1' },
      solution: () => [{ text: 'The potential is constant there: the potential gradient, and so the field strength, is zero.' }],
      markscheme: () => [{ mark: '$E = 0$' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `An alpha particle (charge $+2e$) starts at rest at $x = 0$ and moves to $x = ${p.x1 + p.w + p.x3}$ cm. Calculate the kinetic energy it gains.`,
      response: { kind: 'numeric', answer: 'Ek', symbol: 'E_k', unit: 'J', positive: true },
      solution: ({ p, r }) => [
        { text: 'The work done by the field depends only on the start and end potentials, not on the path or on the regions in between:', math: tex`E_k = q\,\Delta V = 2 \times 1.60 \times 10^{-19} \times ${p.V0} = ${fmtA(r.Ek)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$W = q\\Delta V$ with $\\Delta V$ from the first to the last point' }, { mark: tex`$E_k = ${fmtA(r.Ek)}\ ${u('J')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about this field is correct?',
      response: {
        kind: 'mcq',
        options: ({ p }) => [
          {
            text: `The field points in the direction of increasing $x$, and it is ${p.x1 < p.x3 ? 'stronger near $x = 0$ than near the last electrode' : p.x1 > p.x3 ? 'weaker near $x = 0$ than near the last electrode' : 'equally strong near both electrodes'}.`,
            correct: true,
          },
          { text: 'The field points in the direction of decreasing $x$, from low to high potential.' },
          { text: 'The field is strongest in the region where the potential is constant.' },
          { text: 'The equipotential surfaces are parallel to the line of the graph.' },
        ],
      },
      solution: ({ p, r }) => [
        {
          text: `The field points from high to low potential: towards larger $x$. Its strength is the steepness of the graph: ${fmtA(r.E1)} V m⁻¹ in the first region and ${fmtA(r.E3)} V m⁻¹ in the last. Equipotential surfaces are perpendicular to the field, so they are planes across the line. (${p.x1 === p.x3 ? 'The two sloping regions are equally steep.' : 'The steeper region has the stronger field.'})`,
        },
      ],
      markscheme: () => [{ note: 'Field from high to low potential; strength = steepness of V against x.' }],
    },
  ],
});
