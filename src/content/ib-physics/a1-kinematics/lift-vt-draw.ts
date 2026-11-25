import { defineQuestion } from '../../../engine/define';
import { areaUnderPoints } from '../../../engine/grading';
import { fmt, fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  a: number;
  t1: number;
  t2: number;
  t3: number;
}

const vmax = (p: P) => p.a * p.t1;

const vertices = (p: P): [number, number][] => [
  [0, 0],
  [p.t1, vmax(p)],
  [p.t1 + p.t2, vmax(p)],
  [p.t1 + p.t2 + p.t3, 0],
];

const axes = (p: P): GraphSpec => {
  const T = p.t1 + p.t2 + p.t3;
  return {
    x: { label: 't / s', min: 0, max: 2 * Math.ceil((T + 2) / 2), major: 2, minor: 1 },
    y: { label: 'v / m s⁻¹', min: 0, max: Math.ceil(vmax(p)) + 1, major: 1, minor: 0.5 },
  };
};

export default defineQuestion({
  id: 'ibp-a1-lift-vt-draw',
  version: 2,
  title: 'Drawing a velocity–time graph for a lift',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.5', 'ibp.A.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-drawing', 'calculation'],
  difficulty: 2,

  params: {
    a: { min: 0.5, max: 1.5, step: 0.5, base: 1, dp: 1 },
    t1: { min: 2, max: 4, step: 1, base: 3, dp: 1 },
    t2: { min: 3, max: 8, step: 1, base: 5, dp: 1 },
    t3: { min: 2, max: 5, step: 1, base: 2, dp: 1 },
  },
  constraint: (p) => vmax(p) <= 5,

  compute: (p, c) => {
    const v = vmax(p);
    const T = p.t1 + p.t2 + p.t3;
    const tEnd1 = p.t1 + p.t2;
    const vc = c.carry(v, 'v');
    const s1 = (vc * p.t1) / 2;
    const s2 = vc * p.t2;
    const s3 = (vc * p.t3) / 2;
    const dist = s1 + s2 + s3;
    return { v, T, tEnd1, s1, s2, s3, dist };
  },

  stem: ({ d }) =>
    `A lift (elevator) starts from rest. It accelerates uniformly upwards at ${Q(d.a, 'm s-2')} for ${Q(d.t1, 's')}. It then moves upwards at constant velocity for ${Q(d.t2, 's')}, and finally decelerates uniformly, coming to rest ${Q(d.t3, 's')} later.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'On the axes, draw a graph to show how the velocity $v$ of the lift varies with time $t$, from $t = 0$ until the lift comes to rest.',
      response: { kind: 'graph', axes: ({ p }) => axes(p), expected: ({ p }) => vertices(p) },
      solution: ({ p, d, r }) => [
        { text: 'Take upwards as positive. The lift starts from rest, so the graph starts at the origin.' },
        {
          text: `Uniform acceleration gives a straight line. Find the velocity reached after ${Q(d.t1, 's')}:`,
          math: tex`v = u + at = 0 + ${d.a} \times ${d.t1} = ${fmt(r.v, 2)}\ ${u('m s-1')}`,
        },
        {
          text: `Constant velocity gives a horizontal line at ${Q(fmt(r.v, 2), 'm s-1')} from $t = ${p.t1}$ s to $t = ${p.t1} + ${p.t2} = ${r.tEnd1}$ s.`,
        },
        {
          text: `Uniform deceleration gives a straight line back down to $v = 0$ at $t = ${r.tEnd1} + ${p.t3} = ${r.T}$ s.`,
          graph: { ...axes(p), series: [{ points: vertices(p), showPoints: true }] },
        },
      ],
      markscheme: ({ p, r }) => [
        { mark: tex`Straight line from the origin to $v = ${fmt(r.v, 2)}\ ${u('m s-1')}$ at $t = ${p.t1}\ \mathrm{s}$` },
        { mark: tex`Horizontal line at $v = ${fmt(r.v, 2)}\ ${u('m s-1')}$ until $t = ${r.tEnd1}\ \mathrm{s}$` },
        { mark: tex`Straight line down to $v = 0$ at $t = ${r.T}\ \mathrm{s}$` },
        { note: 'Online: each of the three line segments earns its mark when both of its ends are in the right place.' },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Determine the total distance travelled by the lift.',
      response: {
        kind: 'numeric',
        answer: 'dist',
        symbol: 's',
        unit: 'm',
        positive: true,
        // ECF: the area under the graph the student drew in (a).
        followThrough: {
          from: 'your graph in (a)',
          value: (responses) => {
            const g = responses['a'];
            return g?.kind === 'graph' ? areaUnderPoints(g.points) : undefined;
          },
        },
      },
      solution: ({ p, r }) => [
        { text: 'The distance travelled is the area under the velocity–time graph (the velocity is never negative).' },
        {
          text: 'Add the areas of the two triangles and the rectangle.',
          math: tex`s = \tfrac{1}{2}(${fmt(r.v, 2)})(${p.t1}) + (${fmt(r.v, 2)})(${p.t2}) + \tfrac{1}{2}(${fmt(r.v, 2)})(${p.t3})`,
        },
        { text: 'Evaluate.', math: tex`s = ${fmtW(r.s1)} + ${fmtW(r.s2)} + ${fmtW(r.s3)} = ${fmtA(r.dist)}\ ${u('m')}` },
        {
          text: 'Alternatively, treat the whole shape as one trapezium with parallel sides equal to the time at constant velocity and the total time.',
          math: tex`s = \tfrac{1}{2}(${p.t2} + ${r.T}) \times ${fmt(r.v, 2)} = ${fmtA(r.dist)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Area under the velocity–time graph used' },
        { mark: tex`$s = ${fmtA(r.dist)}\ ${u('m')}$` },
        { note: 'Allow ECF from the graph drawn in (a) (applied online: the area under the student’s own graph is accepted).' },
      ],
    },
  ],
});
