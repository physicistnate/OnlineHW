import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Width of the input arrow, in grid squares. */
const W = 20;

export default defineQuestion({
  id: 'ibp-a3-sankey-engine',
  version: 1,
  title: 'Reading a Sankey diagram for a car engine',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.1', 'ibp.A.3.6', 'ibp.A.3.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    U: { min: 4, max: 8, step: 1, base: 6 },
    cl: { min: 3, max: 6, step: 1, base: 5 },
    f: { min: 1, max: 3, step: 1, base: 2 },
    s: { choices: [2, 4, 5], base: 5 },
    t: { min: 10, max: 60, step: 5, base: 30 },
  },
  // The exhaust is the largest wasted transfer, as in a real petrol engine.
  constraint: (p) => {
    const e = W - p.U - p.cl - p.f;
    return e >= 5 && e > p.cl;
  },

  compute: (p) => {
    const e = W - p.U - p.cl - p.f;
    const Pin = W * p.s; // kW
    const Pu = p.U * p.s;
    const eff = (p.U / W) * 100;
    const Pcool = p.cl * p.s;
    const Pex = e * p.s;
    const EexJ = Pex * 1000 * p.t * 60;
    const Eex = EexJ / 1e6; // MJ
    return { e, Pin, Pu, eff, Pcool, Pex, EexJ, Eex };
  },

  stem: ({ p }) =>
    `The Sankey diagram shows the energy transfers in a car engine while the car travels at a steady speed. It is drawn to scale on a grid: the width of each arrow shows the power it represents, and each small square represents ${Q(p.s, 'kW')}.`,
  figure: ({ p, r }) => ({
    kind: 'sankey',
    input: { label: 'chemical energy of the fuel', squares: W },
    useful: { label: 'work done to drive the car', squares: p.U },
    wasted: [
      { label: 'thermal energy carried away by the exhaust gases', squares: r.e },
      { label: 'thermal energy removed by the cooling system', squares: p.cl },
      { label: 'friction in the engine, and sound', squares: p.f },
    ],
    scale: `Each small square represents ${Q(p.s, 'kW')}.`,
  }),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Determine the useful power output of the engine.',
      response: { kind: 'numeric', answer: 'Pu', symbol: 'P_{\\text{useful}}', unit: 'kW', positive: true },
      solution: ({ p, r }) => [
        {
          text: `Count the squares across the useful arrow: it is ${p.U} squares wide. Multiply by the power each square represents.`,
          math: tex`P_{\text{useful}} = ${p.U} \times ${p.s} = ${fmtA(r.Pu)}\ ${u('kW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Pu)}\ ${u('kW')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the efficiency of the engine.',
      response: { kind: 'numeric', answer: 'eff', symbol: '\\eta', unit: '%', positive: true },
      solution: ({ p, r }) => [
        {
          text: `Efficiency = useful power ÷ input power. The input arrow is ${W} squares wide, so the ratio of the widths gives the efficiency directly.`,
          math: tex`\eta = \frac{${p.U}}{${W}} = ${fmtW(r.eff / 100)} = ${fmtA(r.eff)}\ ${u('%')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\eta = ${fmtA(r.eff)}\ ${u('%')}$` }, { note: 'Accept a ratio of widths or of powers.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Determine the power transferred to the cooling system.',
      response: { kind: 'numeric', answer: 'Pcool', symbol: 'P', unit: 'kW', positive: true },
      solution: ({ p, r }) => [
        {
          text: `Arrow 2 is ${p.cl} squares wide.`,
          math: tex`P = ${p.cl} \times ${p.s} = ${fmtA(r.Pcool)}\ ${u('kW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Pcool)}\ ${u('kW')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `The car travels at this steady speed for ${Q(d.t, 'min')}. Calculate the energy carried away by the exhaust gases in this time, in MJ.`,
      response: { kind: 'numeric', answer: 'Eex', symbol: 'E', unit: 'MJ', positive: true },
      solution: ({ d, p, r }) => [
        {
          text: `Arrow 1 is ${r.e} squares wide, so the exhaust gases carry away energy at a rate of:`,
          math: tex`P = ${r.e} \times ${p.s} = ${fmtW(r.Pex)}\ ${u('kW')}`,
        },
        {
          text: 'Energy = power × time, with the time in seconds.',
          math: tex`E = Pt = ${fmtW(r.Pex)} \times 10^{3} \times (${d.t} \times 60) = ${fmtW(r.EexJ)}\ ${u('J')} = ${fmtA(r.Eex)}\ ${u('MJ')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`Power in the exhaust $= ${fmtA(r.Pex)}\ ${u('kW')}$` }, { mark: tex`$E = ${fmtA(r.Eex)}\ ${u('MJ')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Engineers redesign the engine so that it is more efficient, with the same fuel input. How does the Sankey diagram change?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The input arrow stays the same width, the useful arrow becomes wider and the wasted arrows become narrower in total.', correct: true },
          { text: 'The input arrow becomes wider and all the other arrows stay the same.' },
          { text: 'Every arrow becomes wider, because more energy is transferred.' },
          { text: 'The wasted arrows become wider, because a more powerful engine runs hotter.' },
        ],
      },
      solution: () => [
        {
          text: 'The input is unchanged, so its arrow keeps its width. Energy is conserved, so the output arrows still add up to the input: a larger useful share means less is wasted.',
        },
      ],
      markscheme: () => [{ note: 'Same input; useful wider; total wasted narrower (widths still add up to the input).' }],
    },
  ],
});
