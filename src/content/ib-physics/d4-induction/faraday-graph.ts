import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';

interface P {
  B1: number;
  t1: number;
  hold: number;
  t2: number;
}

/** B (mT) against t (ms): a steady rise to B₁, a constant field, then a steeper fall to zero. All corners are on gridlines. */
const graph = (p: P): GraphSpec => ({
  x: { label: 't / ms', min: 0, max: 100, major: 10, minor: 5 },
  y: { label: 'B / mT', min: 0, max: 100, major: 20, minor: 10 },
  series: [
    {
      points: [
        [0, 0],
        [p.t1, p.B1],
        [p.t1 + p.hold, p.B1],
        [p.t1 + p.hold + p.t2, 0],
        [100, 0],
      ],
    },
  ],
});

/** How many times faster the field falls than it rises, in words. */
const times = (k: number) => (k === 1.5 ? '1.5 times' : k === 2 ? 'twice' : `${k} times`);

export default defineQuestion({
  id: 'ibp-d4-faraday-graph',
  version: 1,
  title: 'Faraday’s law from a graph of a changing magnetic field',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.4',
  standards: ['ibp.D.4.2', 'ibp.D.4.1', 'ibp.D.4.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    N: { choices: [100, 200, 500], base: 200 },
    A: { choices: [10, 20, 40, 50], base: 20 },
    B1: { choices: [20, 40, 60, 80], base: 40 },
    t1: { choices: [20, 30, 40], base: 40 },
    hold: { choices: [20, 30], base: 20 },
    t2: { choices: [10, 20], base: 10 },
    R: { choices: [2, 5, 10], base: 5 },
  },
  constraint: (p) => p.t2 < p.t1,

  compute: (p, c) => {
    const dLinkage = p.N * p.A * 1e-4 * p.B1 * 1e-3; // change of flux linkage in each sloping section
    const emf1 = dLinkage / (p.t1 * 1e-3);
    const emf2 = dLinkage / (p.t2 * 1e-3);
    const I2 = c.carry(emf2, undefined, 3) / p.R;
    return { emf1, emf2, I2 };
  },

  stem: ({ d }) =>
    `A flat coil of ${d.N} turns, each of area ${Q(d.A, 'cm2')}, is placed with its plane perpendicular to a uniform magnetic field. The graph shows how the magnetic flux density $B$ varies with time $t$. The coil is connected to a resistor, and the total resistance of the circuit is ${Q(d.R, 'Ω')}.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ p }) => `Calculate the magnitude of the emf induced in the coil between $t = 0$ and $t = ${p.t1}$ ms.`,
      response: { kind: 'numeric', answer: 'emf1', symbol: '\\varepsilon', unit: 'V', positive: true },
      solution: ({ d, r }) => [
        { text: 'The area is constant, so the rate of change of flux linkage is $NA$ times the gradient of the graph:', math: tex`\varepsilon = NA\frac{\Delta B}{\Delta t} = \frac{${d.N} \times ${d.A} \times 10^{-4} \times ${d.B1} \times 10^{-3}}{${d.t1} \times 10^{-3}} = ${fmtA(r.emf1)}\ ${u('V')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Gradient $\\Delta B/\\Delta t$ in T s⁻¹, with the area in m²' }, { mark: tex`$\varepsilon = ${fmtA(r.emf1)}\ ${u('V')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ p }) => `What is the emf induced between $t = ${p.t1}$ ms and $t = ${p.t1 + p.hold}$ ms?`,
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Zero, because the flux linkage is not changing.', correct: true },
          { text: 'The same as in (a), because the coil is still in the field.' },
          { text: 'Its largest value, because the field is strongest.' },
          { text: 'Half the value in (a), because the field has stopped growing.' },
        ],
      },
      solution: () => [{ text: 'An emf is induced only while the flux linkage changes. The field is constant here, so the gradient of the graph is zero and so is the emf, however strong the field.' }],
      markscheme: () => [{ note: 'Zero: no change of flux linkage.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `Calculate the current in the resistor between $t = ${p.t1 + p.hold}$ ms and $t = ${p.t1 + p.hold + p.t2}$ ms.`,
      response: { kind: 'numeric', answer: 'I2', symbol: 'I', unit: 'A', positive: true },
      solution: ({ d, r }) => [
        { math: tex`\varepsilon = NA\frac{\Delta B}{\Delta t} = \frac{${d.N} \times ${d.A} \times 10^{-4} \times ${d.B1} \times 10^{-3}}{${d.t2} \times 10^{-3}} = ${fmtW(r.emf2)}\ ${u('V')}` },
        { math: tex`I = \frac{\varepsilon}{R} = \frac{${fmtW(r.emf2)}}{${d.R}} = ${fmtA(r.I2)}\ ${u('A')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'emf from the gradient of the falling section' }, { mark: tex`$I = ${fmtA(r.I2)}\ ${u('A')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ p }) => `How does the current in (c) compare with the current between $t = 0$ and $t = ${p.t1}$ ms?`,
      response: {
        kind: 'mcq',
        options: ({ p }) => [
          { text: `It flows in the opposite direction, and it is ${times(p.t1 / p.t2)} as large.`, correct: true },
          { text: `It flows in the same direction, and it is ${times(p.t1 / p.t2)} as large.` },
          { text: 'It flows in the opposite direction, and it is the same size, because the field changes by the same amount.' },
          { text: 'It flows in the same direction, and it is smaller, because the field changes for a shorter time.' },
        ],
      },
      solution: ({ p }) => [
        { text: `The flux is now decreasing instead of increasing, so by Lenz’s law the induced current reverses. The field falls by the same amount in ${p.t2} ms as it rose in ${p.t1} ms, so the gradient, the emf and the current are all ${times(p.t1 / p.t2)} as large.` },
      ],
      markscheme: ({ p }) => [{ note: `Opposite direction; ${times(p.t1 / p.t2)} as large.` }],
    },
  ],
});
