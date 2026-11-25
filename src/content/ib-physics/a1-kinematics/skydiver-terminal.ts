import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

/**
 * Speed of a falling skydiver with air resistance proportional to v²: v = v_t tanh(g t / v_t).
 * The graph starts with gradient g and levels off at the terminal speed v_t.
 */
const tau = (vt: number, g: number) => vt / g;
const tMaxFor = (vt: number, g: number) => 5 * Math.ceil((3 * tau(vt, g)) / 5);
const tAFor = (vt: number, g: number) => Math.round(tau(vt, g));

const graph = (vt: number, g: number): GraphSpec => {
  const tMax = tMaxFor(vt, g);
  const n = 60;
  return {
    x: { label: 't / s', min: 0, max: tMax, major: tMax > 15 ? 5 : 2, minor: 1 },
    y: { label: 'v / m s⁻¹', min: 0, max: 10 * Math.ceil((vt + 5) / 10), major: 10, minor: 2 },
    series: [{ points: Array.from({ length: n + 1 }, (_, i) => [(tMax * i) / n, vt * Math.tanh((g * tMax * i) / n / vt)] as [number, number]) }],
  };
};

export default defineQuestion({
  id: 'ibp-a1-skydiver-terminal',
  version: 1,
  title: 'A skydiver reaching terminal speed',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.7', 'ibp.A.1.5'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['graph-reading', 'multiple-choice'],
  difficulty: 1,

  params: {
    vt: { min: 30, max: 60, step: 2, base: 50 },
  },

  compute: (p, c) => ({ vt: p.vt, tA: tAFor(p.vt, c.g), tMax: tMaxFor(p.vt, c.g) }),

  stem: () =>
    'A skydiver jumps from a hot-air balloon that is not moving. The graph shows how the vertical speed $v$ of the skydiver varies with time $t$ before the parachute opens.',
  figure: ({ p, g }) => graph(p.vt, g),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Use the graph to estimate the terminal speed of the skydiver.',
      response: { kind: 'numeric', answer: 'vt', symbol: 'v_t', unit: 'm s-1', positive: true, tolerance: { rel: 0.06 } },
      solution: ({ r }) => [
        {
          text: 'The terminal speed is the constant speed that the graph levels off at, where the curve becomes horizontal.',
          math: tex`v_t \approx ${fmtA(r.vt)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_t = ${fmtA(r.vt)}\ ${u('m s-1')}$` }, { note: 'Accept answers within the precision of reading the graph.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ r }) => `Which row describes the acceleration of the skydiver at $t = ${r.tA}\\ \\mathrm{s}$ and at $t = ${r.tMax}\\ \\mathrm{s}$?`,
      response: {
        kind: 'mcq',
        columns: ['Acceleration at the earlier time', 'Acceleration at the later time'],
        options: () => [
          { cells: ['between zero and $g$', 'approximately zero'], correct: true },
          { cells: ['equal to $g$', 'approximately zero'] },
          { cells: ['between zero and $g$', 'equal to $g$'] },
          { cells: ['approximately zero', 'between zero and $g$'] },
        ],
      },
      solution: ({ r }) => [
        {
          text: 'The acceleration is the gradient of the velocity–time graph.',
        },
        {
          text: `At $t = ${r.tA}\\ \\mathrm{s}$ the graph is still rising, but less steeply than at the start. At the start the only force is the weight, so the gradient there is $g$; air resistance then grows with speed, so the acceleration is between zero and $g$.`,
        },
        {
          text: `At $t = ${r.tMax}\\ \\mathrm{s}$ the graph is almost horizontal: the skydiver is very close to terminal speed, so the acceleration is approximately zero. (It would be exactly zero only at terminal speed, which the curve approaches but never quite reaches.)`,
        },
      ],
      markscheme: () => [{ note: 'The gradient of the v–t graph gives the acceleration; it falls from g towards zero.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which statement about the forces on the skydiver at terminal speed is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The air resistance is equal in size to the weight.', correct: true },
          { text: 'The air resistance is greater than the weight.' },
          { text: 'The air resistance is zero.' },
          { text: 'The weight is zero because the skydiver is falling freely.' },
        ],
      },
      solution: () => [
        {
          text: 'At terminal speed the velocity is constant, so the acceleration is zero and the resultant force is zero. The upward air resistance therefore balances the downward weight.',
        },
      ],
      markscheme: () => [{ note: 'Zero acceleration means zero resultant force: drag = weight.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () =>
        'The skydiver changes from a flat position to a head-down position, which reduces the air resistance at any given speed. What is the effect on the terminal speed?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It increases.', correct: true },
          { text: 'It decreases.' },
          { text: 'It does not change.' },
          { text: 'There is no longer a terminal speed.' },
        ],
      },
      solution: () => [
        {
          text: 'Terminal speed is reached when the air resistance has grown to equal the weight. With less air resistance at each speed, the skydiver must fall faster before the air resistance balances the weight, so the terminal speed is higher. Air resistance still increases with speed, so a terminal speed is still reached.',
        },
      ],
      markscheme: () => [{ note: 'Drag must still reach the weight, which now happens at a higher speed.' }],
    },
  ],
});
