import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  ph: number;
  pl: number;
  V1: number;
  V2: number;
}

/** The cycle A → B → C → D → A on a p–V diagram (V in L, p in kPa). */
const graph = (p: P): GraphSpec => ({
  x: { label: 'V / L', min: 0, max: 6, major: 1, minor: 0.5 },
  y: { label: 'p / kPa', min: 0, max: 500, major: 100, minor: 50 },
  series: [
    {
      points: [
        [p.V1, p.ph],
        [p.V2, p.ph],
        [p.V2, p.pl],
        [p.V1, p.pl],
        [p.V1, p.ph],
      ],
      showPoints: true,
    },
  ],
});

export default defineQuestion({
  id: 'ibp-b4-pv-cycle',
  version: 1,
  title: 'A heat engine cycle on a p–V diagram: work, efficiency and the Carnot limit',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.B.4',
  standards: ['ibp.B.4.6', 'ibp.B.4.2', 'ibp.B.4.7', 'ibp.B.4.5', 'ibp.B.4.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    ph: { choices: [300, 400], base: 400 },
    pl: { choices: [100, 150], base: 100 },
    V1: { choices: [1, 2], base: 1 },
    V2: { choices: [3, 4, 5], base: 4 },
  },

  compute: (p, c) => {
    const W = (p.ph - p.pl) * (p.V2 - p.V1); // kPa × L = J
    const Qda = 1.5 * p.V1 * (p.ph - p.pl);
    const Qab = 2.5 * p.ph * (p.V2 - p.V1);
    const Qin = Qda + Qab;
    const eta = c.carry(W, 'W', 3) / c.carry(Qin, 'Qin', 3);
    const carnot = 1 - (p.pl * p.V1) / (p.ph * p.V2);
    return { W, Qda, Qab, Qin, eta, carnot };
  },

  stem: ({ d }) =>
    `An ideal monatomic gas is the working substance of a heat engine. It is taken round the cycle A → B → C → D → A shown on the graph: from A (${d.V1} L, ${d.ph} kPa) it expands at constant pressure to B (${d.V2} L, ${d.ph} kPa), then cools at constant volume to C (${d.V2} L, ${d.pl} kPa), is compressed at constant pressure to D (${d.V1} L, ${d.pl} kPa), and is heated at constant volume back to A. (1 kPa × 1 L = 1 J.)`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Determine the net work done by the gas in one cycle.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ text: 'The net work is the area enclosed by the cycle:', math: tex`W = (${d.ph} - ${d.pl}) \times (${d.V2} - ${d.V1}) = ${fmtA(r.W)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`Area enclosed: $W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'The gas takes in thermal energy during D → A and A → B. Calculate the total thermal energy taken in per cycle.',
      response: { kind: 'numeric', answer: 'Qin', symbol: 'Q_{in}', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'D → A, constant volume: no work, so $Q = \\Delta U = \\tfrac{3}{2}nR\\Delta T = \\tfrac{3}{2}V\\Delta p$:', math: tex`Q_{DA} = \tfrac{3}{2} \times ${d.V1} \times (${d.ph} - ${d.pl}) = ${fmtW(r.Qda)}\ ${u('J')}` },
        { text: 'A → B, constant pressure: $Q = \\Delta U + W = \\tfrac{3}{2}p\\Delta V + p\\Delta V = \\tfrac{5}{2}p\\Delta V$:', math: tex`Q_{AB} = \tfrac{5}{2} \times ${d.ph} \times (${d.V2} - ${d.V1}) = ${fmtW(r.Qab)}\ ${u('J')}` },
        { math: tex`Q_{in} = ${fmtW(r.Qda)} + ${fmtW(r.Qab)} = ${fmtA(r.Qin)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$Q_{DA} = \\tfrac{3}{2}V\\Delta p$ and $Q_{AB} = \\tfrac{5}{2}p\\Delta V$' }, { mark: tex`$Q_{in} = ${fmtA(r.Qin)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the efficiency of the engine.',
      response: { kind: 'numeric', answer: 'eta', symbol: '\\eta', positive: true },
      solution: ({ r }) => [{ math: tex`\eta = \frac{W}{Q_{in}} = \frac{${fmtW(r.W)}}{${fmtW(r.Qin)}} = ${fmtA(r.eta)}` }],
      markscheme: ({ r }) => [{ mark: tex`$\eta = ${fmtA(r.eta)}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the efficiency of a Carnot engine working between the highest and lowest temperatures reached in this cycle.',
      response: { kind: 'numeric', answer: 'carnot', symbol: '\\eta_{Carnot}', positive: true },
      solution: ({ d, r }) => [
        { text: 'For a fixed amount of ideal gas, $T \\propto pV$: the hottest point is B and the coldest is D.', math: tex`\frac{T_D}{T_B} = \frac{${d.pl} \times ${d.V1}}{${d.ph} \times ${d.V2}}` },
        { math: tex`\eta_{Carnot} = 1 - \frac{T_D}{T_B} = \frac{${Number(d.ph) * Number(d.V2)} - ${Number(d.pl) * Number(d.V1)}}{${Number(d.ph) * Number(d.V2)}} = ${fmtA(r.carnot)}` },
        { text: 'The real cycle is less efficient than a Carnot engine between the same temperatures, as the second law requires.' },
      ],
      markscheme: ({ r }) => [{ mark: '$T \\propto pV$: hottest at B, coldest at D' }, { mark: tex`$\eta_{Carnot} = ${fmtA(r.carnot)}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why must every heat engine give out some thermal energy to a cold reservoir?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The second law: no cyclic process can turn all the thermal energy it takes in into work.', correct: true },
          { text: 'The first law: energy cannot be created or destroyed.' },
          { text: 'Friction in the engine turns some of the work back into thermal energy.' },
          { text: 'The gas cannot be compressed without being cooled.' },
        ],
      },
      solution: () => [{ text: 'The Kelvin–Planck statement of the second law: a heat engine cannot convert all the thermal energy from a hot reservoir into work; some must be passed to a colder reservoir. This is why the efficiency is less than 1, even for a perfect (Carnot) engine.' }],
      markscheme: () => [{ note: 'Second law (Kelvin–Planck).' }],
    },
  ],
});
