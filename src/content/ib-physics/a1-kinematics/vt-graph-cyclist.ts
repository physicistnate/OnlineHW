import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  v0: number;
  v1: number;
  t1: number;
  t2: number;
  t3: number;
}

const vertices = (p: P): [number, number][] => [
  [0, p.v0],
  [p.t1, p.v1],
  [p.t1 + p.t2, p.v1],
  [p.t1 + p.t2 + p.t3, 0],
];

const graph = (p: P): GraphSpec => {
  const T = p.t1 + p.t2 + p.t3;
  return {
    x: { label: 't / s', min: 0, max: 2 * Math.ceil((T + 1) / 2), major: 2, minor: 1 },
    y: { label: 'v / m s⁻¹', min: 0, max: 2 * Math.ceil((p.v1 + 1) / 2), major: 2, minor: 1 },
    series: [{ points: vertices(p) }],
  };
};

export default defineQuestion({
  id: 'ibp-a1-vt-graph-cyclist',
  version: 2,
  title: 'Velocity–time graph for a cyclist',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.5', 'ibp.A.1.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation'],
  difficulty: 2,

  params: {
    v0: { min: 0, max: 3, step: 1, base: 2 },
    v1: { min: 5, max: 10, step: 1, base: 8 },
    t1: { min: 2, max: 6, step: 1, base: 4 },
    t2: { min: 3, max: 8, step: 1, base: 6 },
    t3: { min: 2, max: 6, step: 1, base: 4 },
  },
  constraint: (p) => p.v1 - p.v0 >= 3,

  compute: (p, c) => {
    const T = p.t1 + p.t2 + p.t3;
    const a = (p.v1 - p.v0) / p.t1;
    const area1 = ((p.v0 + p.v1) / 2) * p.t1;
    const area2 = p.v1 * p.t2;
    const area3 = (p.v1 * p.t3) / 2;
    const dist = area1 + area2 + area3;
    const avg = c.carry(dist, 'dist') / T;
    return { T, a, area1, area2, area3, dist, avg };
  },

  stem: ({ r }) =>
    `A cyclist moves along a straight road. The graph shows how the velocity $v$ of the cyclist varies with time $t$ over a period of ${Q(r.T, 's')}.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => `Calculate the acceleration of the cyclist during the first ${Q(p.t1, 's')}.`,
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2' },
      solution: ({ p, r }) => [
        {
          text: 'Acceleration is the rate of change of velocity, which is the gradient of a velocity–time graph. Take the direction of motion as positive.',
          math: tex`a = \frac{\Delta v}{\Delta t}`,
        },
        {
          text: `Read the graph: the velocity rises from ${Q(p.v0, 'm s-1')} at $t = 0$ to ${Q(p.v1, 'm s-1')} at $t = ${p.t1}\\ \\mathrm{s}$.`,
          math: tex`a = \frac{${p.v1} - ${p.v0}}{${p.t1} - 0}`,
        },
        { text: 'Evaluate.', math: tex`a = ${fmtA(r.a)}\ ${u('m s-2')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of gradient, $a = \\Delta v / \\Delta t$' },
        { mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ r }) => `Determine the distance travelled by the cyclist in the ${Q(r.T, 's')} shown on the graph.`,
      response: { kind: 'numeric', answer: 'dist', symbol: 's', unit: 'm', positive: true },
      solution: ({ p, r }) => {
        // From rest the first region is a triangle; otherwise it is a trapezium.
        const first = p.v0 === 0 ? 'a triangle' : 'a trapezium';
        const firstArea = p.v0 === 0 ? tex`\tfrac{1}{2}(${p.v1})(${p.t1})` : tex`\tfrac{1}{2}(${p.v0} + ${p.v1})(${p.t1})`;
        return [
          {
            text: 'The area under a velocity–time graph is the displacement. The velocity is never negative, so here this is also the distance travelled.',
          },
          {
            text: `Split the area into three shapes: ${first} (0 to ${p.t1} s), a rectangle (${p.t1} to ${p.t1 + p.t2} s) and a triangle (${p.t1 + p.t2} to ${r.T} s).`,
            math: tex`s = ${firstArea} + (${p.v1})(${p.t2}) + \tfrac{1}{2}(${p.v1})(${p.t3})`,
          },
          {
            text: 'Add the three areas.',
            math: tex`s = ${fmtW(r.area1)} + ${fmtW(r.area2)} + ${fmtW(r.area3)} = ${fmtA(r.dist)}\ ${u('m')}`,
          },
        ];
      },
      markscheme: ({ r }) => [
        { mark: 'Recognition that distance is the area under the graph' },
        { mark: tex`$s = ${fmtA(r.dist)}\ ${u('m')}$` },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ r }) => `Calculate the average speed of the cyclist over the ${Q(r.T, 's')}.`,
      response: { kind: 'numeric', answer: 'avg', symbol: '\\bar{v}', unit: 'm s-1', positive: true },
      solution: ({ r }) => [
        {
          text: 'Average speed is the total distance travelled divided by the total time taken.',
          math: tex`\bar{v} = \frac{${fmtW(r.dist)}}{${r.T}} = ${fmtA(r.avg)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\bar{v} = ${fmtA(r.avg)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
  ],
});
