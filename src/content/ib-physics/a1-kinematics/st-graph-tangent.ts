import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';
import { niceAxis } from '../graph-axes';

interface P {
  a: number;
  t1: number;
  T: number;
}

/** s = ½at², with the tangent at t1 drawn from where it crosses the time axis (t1/2) to t = T. */
const graph = (p: P): GraphSpec => {
  const n = 48;
  const curve = Array.from({ length: n + 1 }, (_, i) => {
    const t = (p.T * i) / n;
    return [t, 0.5 * p.a * t * t] as [number, number];
  });
  const tStart = p.t1 / 2;
  return {
    x: { label: 't / s', min: 0, max: p.T, major: 2, minor: 1 },
    y: niceAxis(0.5 * p.a * p.T ** 2, 's / m'),
    series: [
      { points: curve },
      { points: [[tStart, 0], [p.T, p.a * p.t1 * (p.T - tStart)]], dashed: true, showPoints: true },
      { points: [[p.T, 0.5 * p.a * p.T ** 2]], showPoints: true },
    ],
  };
};

export default defineQuestion({
  id: 'ibp-a1-st-graph-tangent',
  version: 1,
  title: 'Instantaneous velocity from a displacement–time graph',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.5', 'ibp.A.1.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    a: { choices: [0.5, 1, 1.5, 2], base: 1, dp: 1 },
    t1: { choices: [2, 4, 6, 8], base: 4 },
    T: { min: 6, max: 12, step: 2, base: 10 },
  },
  constraint: (p) => p.t1 <= p.T - 2,

  compute: (p, c) => {
    const sT = 0.5 * p.a * p.T ** 2;
    const vavg = sT / p.T;
    const tStart = p.t1 / 2;
    const sEnd = p.a * p.t1 * (p.T - tStart);
    const dt = p.T - tStart;
    const vInst = sEnd / dt;
    const acc = c.carry(vInst, 'vInst') / p.t1;
    return { sT, vavg, tStart, sEnd, dt, vInst, acc };
  },

  stem: ({ p }) =>
    `A cart is released from rest at the top of a straight ramp and rolls down it with uniform acceleration. The graph shows how the displacement $s$ of the cart varies with time $t$ for the first ${Q(p.T, 's')}. The dashed line is the tangent to the graph at $t = ${p.t1}\\ \\mathrm{s}$.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => `Calculate the average velocity of the cart during the first ${Q(p.T, 's')}.`,
      response: { kind: 'numeric', answer: 'vavg', symbol: '\\bar{v}', unit: 'm s-1', positive: true, tolerance: { rel: 0.04 } },
      solution: ({ p, r }) => [
        {
          text: `Average velocity is displacement ÷ time. Read the displacement at $t = ${p.T}\\ \\mathrm{s}$ from the end of the curve.`,
          math: tex`s = ${fmtA(r.sT)}\ ${u('m')}`,
        },
        {
          text: 'Divide by the time taken.',
          math: tex`\bar{v} = \frac{${fmtA(r.sT)}}{${p.T}} = ${fmtA(r.vavg)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: tex`Reading $s = ${fmtA(r.sT)}\ ${u('m')}$ from the graph` },
        { mark: tex`$\bar{v} = ${fmtA(r.vavg)}\ ${u('m s-1')}$` },
        { note: 'Accept answers within the precision of reading the graph.' },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Use the tangent to determine the instantaneous velocity of the cart at $t = ${p.t1}\\ \\mathrm{s}$.`,
      response: { kind: 'numeric', answer: 'vInst', symbol: 'v', unit: 'm s-1', positive: true, tolerance: { rel: 0.04 } },
      solution: ({ p, r }) => [
        {
          text: 'The instantaneous velocity is the gradient of the displacement–time graph at that moment, which is the gradient of the tangent. Use two points on the tangent that are far apart, such as the two marked ends.',
          math: tex`(${fmtW(r.tStart)},\ 0) \quad\text{and}\quad (${p.T},\ ${fmtW(r.sEnd)})`,
        },
        {
          text: 'Gradient = change in displacement ÷ change in time.',
          math: tex`v = \frac{\Delta s}{\Delta t} = \frac{${fmtW(r.sEnd)} - 0}{${p.T} - ${fmtW(r.tStart)}} = ${fmtA(r.vInst)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Gradient of the tangent, using two well-separated points on it' },
        { mark: tex`$v = ${fmtA(r.vInst)}\ ${u('m s-1')}$` },
        { note: 'Accept answers within the precision of reading the graph.' },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Hence, calculate the acceleration of the cart.',
      response: { kind: 'numeric', answer: 'acc', symbol: 'a', unit: 'm s-2', positive: true, tolerance: { rel: 0.04 } },
      solution: ({ p, r }) => [
        {
          text: `The cart starts from rest and accelerates uniformly, so $v = at$. Use the velocity from (b) at $t = ${p.t1}\\ \\mathrm{s}$.`,
          math: tex`a = \frac{v}{t} = \frac{${fmtW(r.vInst)}}{${p.t1}} = ${fmtA(r.acc)}\ ${u('m s-2')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$a = ${fmtA(r.acc)}\ ${u('m s-2')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement explains why the displacement–time graph is a curve?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The velocity of the cart increases, so the gradient of the graph increases.', correct: true },
          { text: 'The acceleration of the cart increases, so the gradient of the graph increases.' },
          { text: 'The cart moves along a curved path down the ramp.' },
          { text: 'The displacement of the cart increases at a constant rate.' },
        ],
      },
      solution: () => [
        {
          text: 'The gradient of a displacement–time graph is the velocity. The cart speeds up, so the graph gets steeper with time, which makes it curve upwards.',
        },
        {
          text: 'The acceleration is constant (it is uniform), not increasing. The ramp is straight, so the path is not curved: the graph shows how far, not which way. A constant rate of increase would give a straight line.',
        },
      ],
      markscheme: () => [{ note: 'The gradient of an s–t graph is the velocity, which increases.' }],
    },
  ],
});
