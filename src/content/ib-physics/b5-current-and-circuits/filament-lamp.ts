import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';
import { dataTable } from '../../ibpp/helpers';

/** Lamps: rated p.d. (V) and current (A). Their characteristic is modelled as I = I₀(V/V₀)^0.6. */
const LAMPS: Record<string, { V0: number; I0: number }> = {
  a: { V0: 6, I0: 0.5 },
  b: { V0: 6, I0: 0.3 },
  c: { V0: 12, I0: 0.25 },
  d: { V0: 12, I0: 0.5 },
};

interface P {
  lamp: string;
  k: number;
}

/** The six measurements: p.d. in equal steps up to the rated value, current to 0.01 A (0.001 A below 0.1 A). */
const data = (p: P) => {
  const { V0, I0 } = LAMPS[p.lamp];
  return [1, 2, 3, 4, 5, 6].map((j) => {
    const V = (V0 * j) / 6;
    const I = I0 * (V / V0) ** 0.6;
    return { V, I: Number(I.toFixed(I < 0.1 ? 3 : 2)) };
  });
};

const graph = (p: P): GraphSpec => {
  const { V0, I0 } = LAMPS[p.lamp];
  return {
    x: { label: 'V / V', min: 0, max: V0, major: V0 / 6, minor: V0 / 12 },
    y: { label: 'I / A', min: 0, max: I0 > 0.3 ? 0.6 : 0.3, major: I0 > 0.3 ? 0.1 : 0.05, minor: I0 > 0.3 ? 0.05 : 0.025 },
    series: [{ points: [[0, 0] as [number, number], ...data(p).map((m) => [m.V, m.I] as [number, number])], showPoints: true }],
  };
};

export default defineQuestion({
  id: 'ibp-b5-filament-lamp',
  version: 1,
  title: 'The I–V characteristic of a filament lamp',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.4', 'ibp.B.5.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    lamp: { choices: Object.keys(LAMPS), base: 'a' },
    k: { choices: [1, 2, 3], base: 2 },
  },

  compute: (p) => {
    const m = data(p);
    const low = m[p.k - 1];
    const top = m[5];
    const Rlow = low.V / low.I;
    const Rtop = top.V / top.I;
    const P = top.V * top.I;
    return { Vlow: low.V, Ilow: low.I, Rlow, Vtop: top.V, Itop: top.I, Rtop, P };
  },

  stem: ({ p }) =>
    `A student measures the current $I$ in a filament lamp for different potential differences $V$ across it, up to the lamp’s rated value:\n${dataTable(
      ['V\\ /\\ \\mathrm{V}', 'I\\ /\\ \\mathrm{A}'],
      data(p).map((m) => [m.V, m.I < 0.1 ? m.I.toFixed(3) : m.I.toFixed(2)]),
    )}The graph shows the measurements.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ r }) => `Calculate the resistance of the lamp when the p.d. across it is ${Q(r.Vlow, 'V')}.`,
      response: { kind: 'numeric', answer: 'Rlow', symbol: 'R', unit: 'Ω', positive: true },
      solution: ({ r }) => [{ math: tex`R = \frac{V}{I} = \frac{${r.Vlow}}{${r.Ilow}} = ${fmtA(r.Rlow)}\ \Omega` }],
      markscheme: ({ r }) => [{ mark: tex`$R = V/I = ${fmtA(r.Rlow)}\ \Omega$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the resistance of the lamp at its rated p.d., the largest p.d. in the table.',
      response: { kind: 'numeric', answer: 'Rtop', symbol: 'R', unit: 'Ω', positive: true },
      solution: ({ r }) => [{ math: tex`R = \frac{${r.Vtop}}{${r.Itop}} = ${fmtA(r.Rtop)}\ \Omega` }],
      markscheme: ({ r }) => [{ mark: tex`$R = ${fmtA(r.Rtop)}\ \Omega$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the power of the lamp at its rated p.d.',
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ r }) => [{ math: tex`P = VI = ${r.Vtop} \times ${r.Itop} = ${fmtA(r.P)}\ ${u('W')}` }],
      markscheme: ({ r }) => [{ mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does the resistance of the filament increase as the p.d. increases?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The filament gets hotter, so its ions vibrate more and the electrons collide with them more often.', correct: true },
          { text: 'The filament gets longer as it heats up, and that is the main effect.' },
          { text: 'There are fewer free electrons at higher p.d.' },
          { text: 'The electrons move faster at higher p.d., so they pass the ions without colliding.' },
        ],
      },
      solution: () => [{ text: 'A larger current heats the filament. The metal ions vibrate with larger amplitudes, so the conduction electrons collide with them more often, which makes the resistance larger.' }],
      markscheme: () => [{ note: 'Temperature rises; more frequent collisions of electrons with vibrating ions.' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Is the filament lamp an ohmic conductor?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'No: its I–V graph is a curve, not a straight line through the origin, so its resistance changes.', correct: true },
          { text: 'Yes: the current increases whenever the p.d. increases.' },
          { text: 'Yes: its graph passes through the origin.' },
          { text: 'No: the current decreases at high p.d.' },
        ],
      },
      solution: () => [{ text: 'An ohmic conductor at constant temperature has a current proportional to the p.d.: a straight line through the origin. The lamp’s graph curves over, because its resistance rises as it heats up.' }],
      markscheme: () => [{ note: 'Non-ohmic: the graph is not a straight line through the origin.' }],
    },
  ],
});
