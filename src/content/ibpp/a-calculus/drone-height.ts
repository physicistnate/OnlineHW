import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, workingValue } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  p: number;
  q: number;
  T: number;
}

/** h = pt² − qt³: the drone is highest when v = 2pt − 3qt² = 0. */
const tTop = (p: P) => (2 * p.p) / (3 * p.q);

/** The acceleration a = 2p − 6qt at the start and the end of the model. */
const aEnds = (p: P): [number, number][] => [
  [0, 2 * p.p],
  [p.T, 2 * p.p - 6 * p.q * p.T],
];

const axes = (p: P): GraphSpec => {
  const [[, top], [, bottom]] = aEnds(p);
  return {
    x: { label: 't / s', min: 0, max: p.T, major: 1, minor: 0.5 },
    y: { label: 'a / m s⁻²', min: 4 * Math.floor(bottom / 4) - 4, max: 4 * Math.ceil(top / 4) + 4, major: 4, minor: 2 },
  };
};

export default defineQuestion({
  id: 'ibpp-a5-drone-height',
  version: 1,
  title: 'A drone’s flight: derivatives, the second derivative test and an acceleration graph',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.3', 'ibp.A.1.5'],
  math: { topic: 'ibm.5', standards: ['ibm.5.7', 'ibm.5.8', 'ibm.5.9'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice', 'graph-drawing'],
  difficulty: 2,

  params: {
    p: { choices: [3, 4, 5, 6], base: 4 },
    q: { choices: [0.5, 1], base: 1 },
    T: { min: 3, max: 8, step: 1, base: 4 },
  },
  // The drone is past its highest point by the end, and has not yet come back down to the ground.
  constraint: (p) => tTop(p) < p.T && p.T <= p.p / p.q,

  compute: (p, c) => {
    const v1 = 2 * p.p - 3 * p.q;
    const tMax = tTop(p);
    const tm = c.carry(tMax, undefined, 3);
    const h1 = p.p * tm ** 2;
    const h2 = p.q * tm ** 3;
    const hMax = h1 - h2;
    const tV = p.p / (3 * p.q);
    const tv = c.carry(tV, undefined, 3);
    const v1a = 2 * p.p * tv;
    const v1b = 3 * p.q * tv ** 2;
    const vMax = v1a - v1b;
    return { v1, tMax, h1, h2, hMax, tV, v1a, v1b, vMax };
  },

  stem: ({ d }) =>
    `A drone takes off vertically from the ground at time $t = 0$. For the first ${Q(d.T, 's')} of its flight, its height above the ground is modelled by $$h(t) = ${d.p}t^2 - ${d.q}t^3$$ where $h$ is in metres and $t$ is in seconds.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the velocity of the drone at $t = 1\\ \\mathrm{s}$.',
      response: { kind: 'numeric', answer: 'v1', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'Velocity is the rate of change of displacement:', math: tex`v = \frac{dh}{dt} = ${2 * Number(d.p)}t - ${3 * Number(d.q)}t^2` },
        { math: tex`v(1) = (${2 * Number(d.p)} \times 1) - (${3 * Number(d.q)} \times 1^2) = ${fmtA(r.v1)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ d, r }) => [{ mark: tex`$\dfrac{dh}{dt} = ${2 * Number(d.p)}t - ${3 * Number(d.q)}t^2$` }, { mark: tex`$v = ${fmtA(r.v1)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'Find the greatest height that the drone reaches.',
      response: { kind: 'numeric', answer: 'hMax', symbol: 'h', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'At the highest point the drone is momentarily at rest:', math: tex`\frac{dh}{dt} = t\,(${2 * Number(d.p)} - ${3 * Number(d.q)}t) = 0 \;\Rightarrow\; t = \frac{${2 * Number(d.p)}}{${3 * Number(d.q)}} = ${fmtW(r.tMax)}\ ${u('s')}` },
        { text: '($t = 0$ is the take-off.)', math: tex`${d.p} \times ${fmtW(workingValue(r.tMax))}^2 = ${fmtW(r.h1)} \quad\text{and}\quad ${d.q} \times ${fmtW(workingValue(r.tMax))}^3 = ${fmtW(r.h2)}` },
        { math: tex`h = ${fmtW(r.h1)} - ${fmtW(r.h2)} = ${fmtA(r.hMax)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\dfrac{dh}{dt} = 0$' }, { mark: tex`$t = ${fmtW(r.tMax)}\ ${u('s')}$` }, { mark: tex`$h = ${fmtA(r.hMax)}\ ${u('m')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which statement correctly uses the second derivative to explain why the height in (b) is a maximum?',
      response: {
        kind: 'mcq',
        options: ({ d }) => [
          { text: `At that time $\\dfrac{d^2h}{dt^2} = -${2 * Number(d.p)}\\ \\mathrm{m\\,s^{-2}} < 0$, so the height is a maximum: the drone is momentarily at rest and accelerating downwards.`, correct: true },
          { text: `At that time $\\dfrac{d^2h}{dt^2} = ${2 * Number(d.p)}\\ \\mathrm{m\\,s^{-2}} > 0$, so the height is a maximum: the drone is accelerating upwards.` },
          { text: `At that time $\\dfrac{d^2h}{dt^2} = -${2 * Number(d.p)}\\ \\mathrm{m\\,s^{-2}} < 0$, so the height is a minimum: the drone is about to rise again.` },
          { text: 'At that time $\\dfrac{dh}{dt} = 0$, and that alone shows that the height is a maximum.' },
        ],
      },
      solution: ({ d }) => [
        {
          text: `$\\dfrac{d^2h}{dt^2} = ${2 * Number(d.p)} - ${6 * Number(d.q)}t$ is the acceleration. At $t = \\dfrac{${2 * Number(d.p)}}{${3 * Number(d.q)}}$ it is $${2 * Number(d.p)} - ${4 * Number(d.p)} = -${2 * Number(d.p)}\\ \\mathrm{m\\,s^{-2}}$: negative, so the graph of $h$ is concave down and the stationary point is a maximum. Physically, the drone is at rest with a downward acceleration, so it starts to come down.`,
        },
      ],
      markscheme: () => [{ note: 'h″ < 0 at the stationary point, so a maximum; the acceleration is downwards.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the greatest upward velocity of the drone.',
      response: { kind: 'numeric', answer: 'vMax', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The velocity is greatest when $\\dfrac{dv}{dt} = 0$, that is, when the acceleration is zero (the point of inflexion of the graph of $h$):',
          math: tex`\frac{dv}{dt} = ${2 * Number(d.p)} - ${6 * Number(d.q)}t = 0 \;\Rightarrow\; t = \frac{${2 * Number(d.p)}}{${6 * Number(d.q)}} = ${fmtW(r.tV)}\ ${u('s')}`,
        },
        { math: tex`${2 * Number(d.p)} \times ${fmtW(workingValue(r.tV))} = ${fmtW(r.v1a)} \quad\text{and}\quad ${3 * Number(d.q)} \times ${fmtW(workingValue(r.tV))}^2 = ${fmtW(r.v1b)}` },
        { math: tex`v = ${fmtW(r.v1a)} - ${fmtW(r.v1b)} = ${fmtA(r.vMax)}\ ${u('m s-1')}` },
        { text: 'The second derivative of $v$ is negative, so this is a maximum.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\dfrac{dv}{dt} = 0$ at $t = ${fmtW(r.tV)}\ ${u('s')}$` }, { mark: tex`$v = ${fmtA(r.vMax)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: ({ d }) => `On the axes, draw the graph of the acceleration $a$ of the drone against $t$ for $0 \\le t \\le ${d.T}\\ \\mathrm{s}$. Drag the points to the ends of your line.`,
      response: { kind: 'graph', axes: ({ p }) => axes(p), expected: ({ p }) => aEnds(p), snap: { x: 0.5, y: 1 } },
      solution: ({ p, d }) => [
        { text: 'The acceleration is the second derivative of the height:', math: tex`a = \frac{d^2h}{dt^2} = ${2 * Number(d.p)} - ${6 * Number(d.q)}t` },
        {
          text: `This is a straight line from $(0, ${2 * p.p})$ to $(${p.T}, ${2 * p.p - 6 * p.q * p.T})$. It crosses the time axis at $t = ${fmtW(p.p / (3 * p.q))}\\ \\mathrm{s}$, where the velocity is greatest.`,
          graph: { ...axes(p), series: [{ points: aEnds(p), showPoints: true }] },
        },
      ],
      markscheme: ({ p }) => [{ mark: tex`Straight line starting at $(0, ${2 * p.p})$` }, { mark: tex`Ending at $(${p.T}, ${2 * p.p - 6 * p.q * p.T})$` }],
    },
  ],
});
