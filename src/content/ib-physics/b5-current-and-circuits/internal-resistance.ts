import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  E: number;
  r: number;
}

const CURRENTS = [0.2, 0.4, 0.6, 0.8, 1.0];

/** Terminal p.d. against current: measurements on the line V = ε − Ir, and the line extended to I = 0. */
const graph = (p: P): GraphSpec => {
  const big = p.E > 3;
  return {
    x: { label: 'I / A', min: 0, max: 1.2, major: 0.2, minor: 0.1 },
    y: { label: 'V / V', min: 0, max: Math.ceil(p.E + (big ? 1 : 0.5)), major: big ? 1 : 0.5, minor: big ? 0.5 : 0.25 },
    series: [
      { points: CURRENTS.map((i) => [i, Number((p.E - i * p.r).toFixed(2))] as [number, number]), showPoints: true },
      {
        points: [
          [0, p.E],
          [1.2, Number((p.E - 1.2 * p.r).toFixed(2))],
        ],
        dashed: true,
      },
    ],
  };
};

export default defineQuestion({
  id: 'ibp-b5-internal-resistance',
  version: 1,
  title: 'The emf and internal resistance of a battery from a graph',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.9', 'ibp.B.5.6', 'ibp.B.5.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    E: { choices: [1.5, 3, 4.5, 6], base: 3, dp: 1 },
    r: { choices: [0.5, 1, 1.5, 2], base: 1, dp: 1 },
    R: { choices: [2, 4, 5], base: 4 },
  },
  // The terminal p.d. stays at least half the emf over the measurements.
  constraint: (p) => p.E / p.r >= 2,

  compute: (p, c) => {
    // (c) and (d) use the emf and internal resistance the student read in (a) and (b).
    const Ec = c.carry(p.E, 'E', 3);
    const rc = c.carry(p.r, 'r', 3);
    const Isc = Ec / rc;
    const I = Ec / (p.R + rc);
    const PR = c.carry(I, undefined, 3) ** 2 * p.R;
    // (a) and (b) are read from the graph: the answers are the emf and internal resistance themselves.
    return { E: p.E, r: p.r, Isc, I, PR, Vat1: p.E - p.r };
  },

  stem: () =>
    'A student varies the current $I$ drawn from a battery and measures the potential difference $V$ between its terminals. The graph shows the measurements and the straight line through them, extended to $I = 0$.',
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Use the graph to state the emf of the battery.',
      response: { kind: 'numeric', answer: 'E', symbol: '\\varepsilon', unit: 'V', positive: true },
      solution: ({ d }) => [{ text: `With no current there is no p.d. across the internal resistance, so the intercept on the $V$ axis is the emf: $\\varepsilon = ${d.E}$ V.` }],
      markscheme: ({ d }) => [{ mark: `$\\varepsilon = ${d.E}$ V (intercept)` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Use the graph to determine the internal resistance of the battery.',
      response: { kind: 'numeric', answer: 'r', symbol: 'r', unit: 'Ω', positive: true },
      solution: ({ d, r }) => [
        { text: 'From $V = \\varepsilon - Ir$, the gradient of the line is $-r$. Using the intercept and the point at 1.0 A:', math: tex`r = -\frac{\Delta V}{\Delta I} = \frac{${d.E} - ${r.Vat1.toFixed(1)}}{1.0 - 0} = ${d.r}\ \Omega` },
      ],
      markscheme: ({ d }) => [{ mark: 'Gradient of the line, with a large triangle' }, { mark: `$r = ${d.r}\\ \\Omega$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the current if the terminals of the battery were joined by a wire of negligible resistance.',
      response: { kind: 'numeric', answer: 'Isc', symbol: 'I', unit: 'A', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = \frac{\varepsilon}{r} = \frac{${d.E}}{${d.r}} = ${fmtA(r.Isc)}\ ${u('A')}` }],
      markscheme: ({ r }) => [{ mark: tex`$I = ${fmtA(r.Isc)}\ ${u('A')}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `A resistor of ${Q(d.R, 'Ω')} is connected to the battery. Calculate the power dissipated in it.`,
      response: { kind: 'numeric', answer: 'PR', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        { math: tex`I = \frac{\varepsilon}{R + r} = \frac{${d.E}}{${d.R} + ${d.r}} = ${fmtW(r.I)}\ ${u('A')}` },
        { math: tex`P = I^2R = ${fmtW(r.I)}^2 \times ${d.R} = ${fmtA(r.PR)}\ ${u('W')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$I = \\varepsilon/(R + r)$' }, { mark: tex`$P = ${fmtA(r.PR)}\ ${u('W')}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why does the terminal p.d. fall as the current increases?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A larger current means a larger p.d. ($Ir$) across the internal resistance, leaving less of the emf across the terminals.', correct: true },
          { text: 'The emf of the battery falls as the current increases.' },
          { text: 'The resistance of the external circuit increases.' },
          { text: 'Charge is used up faster, so less charge reaches the terminals.' },
        ],
      },
      solution: () => [{ text: 'The emf is shared between the internal resistance and the terminals: $\\varepsilon = Ir + V$. As $I$ increases, the "lost volts" $Ir$ increase, so $V$ falls.' }],
      markscheme: () => [{ note: 'Lost volts Ir increase.' }],
    },
  ],
});
