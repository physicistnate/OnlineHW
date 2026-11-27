import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';
import { IB } from '../constants';
import { dataTable } from '../../ibpp/helpers';

interface P {
  p0: number;
  V: number;
}

const TEMPS = [0, 25, 50, 75, 100];

/** Pressures (kPa, to 0.1 kPa) at each temperature for an ideal gas at constant volume. */
const pressures = (p: P) => TEMPS.map((t) => Number(((p.p0 * (t + 273)) / 273).toFixed(1)));

const YMAX: Record<number, number> = { 60: 100, 80: 120, 100: 140, 120: 180 };

const graph = (p: P): GraphSpec => ({
  x: { label: 'T / °C', min: -300, max: 100, major: 50, minor: 10 },
  y: { label: 'p / kPa', min: 0, max: YMAX[p.p0], major: 20, minor: 10 },
  series: [{ points: TEMPS.map((t, i) => [t, pressures(p)[i]] as [number, number]), showPoints: true }],
});

export default defineQuestion({
  id: 'ibp-b3-absolute-zero',
  version: 1,
  title: 'Finding absolute zero with a constant-volume gas thermometer',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.3',
  standards: ['ibp.B.3.3', 'ibp.B.3.4'],
  uses: ['ibp.B.1.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    p0: { choices: [60, 80, 100, 120], base: 80 },
    V: { choices: [0.5, 1, 2], base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const ps = pressures(p);
    const grad = (ps[4] - ps[0]) / 100; // kPa per K
    const gc = c.carry(grad, 'grad', 3);
    const zero = -ps[0] / gc; // °C
    const n = (gc * 1e3 * p.V * 1e-3) / IB.R;
    return { p0m: ps[0], p100: ps[4], grad, zero, n };
  },

  stem: ({ p, d }) =>
    `A fixed amount of gas is kept at a constant volume of ${Q(d.V, 'L')} (1 L = 10⁻³ m³). Its pressure $p$ is measured at different temperatures $T$:\n${dataTable(
      ['T\\ /\\ {}^{\\circ}\\mathrm{C}', 'p\\ /\\ \\mathrm{kPa}'],
      TEMPS.map((t, i) => [t, pressures(p)[i].toFixed(1)]),
    )}The graph shows the data, with the temperature axis extended to −300 °C. $R = 8.31\\ \\mathrm{J\\,K^{-1}\\,mol^{-1}}$.`,
  figure: ({ p }) => graph(p),

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the gradient of the line, in kPa K⁻¹ (a change of 1 °C is a change of 1 K).',
      response: { kind: 'numeric', answer: 'grad', symbol: '\\text{gradient}', unit: 'kPa K-1', positive: true },
      solution: ({ r }) => [{ text: 'The points lie on a straight line; use the first and last:', math: tex`\text{gradient} = \frac{${r.p100.toFixed(1)} - ${r.p0m.toFixed(1)}}{100 - 0} = ${fmtA(r.grad)}\ ${u('kPa K-1')}` }],
      markscheme: ({ r }) => [{ mark: 'Two well-separated points on the line' }, { mark: tex`$${fmtA(r.grad)}\ \mathrm{kPa\ per\ {}^{\circ}C}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Extrapolate the line to find the temperature at which the pressure would be zero, in °C.',
      response: { kind: 'numeric', answer: 'zero', symbol: 'T', unit: '°C' },
      solution: ({ r }) => [
        { text: 'The line reaches $p = 0$ where $p_0 + \\text{gradient} \\times T = 0$:', math: tex`T = -\frac{${r.p0m.toFixed(1)}}{${fmtW(r.grad)}} = ${fmtA(r.zero)}\ ${u('°C')}` },
        { text: 'This is absolute zero, 0 K: close to the accepted −273 °C.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Line extended to $p = 0$' }, { mark: tex`$T = ${fmtA(r.zero)}\ ${u('°C')}$ (accept about −273 °C)` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Use the gradient to find the amount of gas, in moles.',
      response: { kind: 'numeric', answer: 'n', symbol: 'n', unit: 'mol', positive: true },
      solution: ({ d, r }) => [
        { text: 'At constant volume, $p = \\dfrac{nR}{V}T$ with $T$ in kelvin, so the gradient (the same per K as per °C) is $nR/V$:', math: tex`n = \frac{\text{gradient} \times V}{R} = \frac{${fmtW(r.grad)} \times 10^{3} \times ${d.V} \times 10^{-3}}{8.31} = ${fmtA(r.n)}\ ${u('mol')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Gradient $= nR/V$ with the gradient in Pa K⁻¹ and $V$ in m³' }, { mark: tex`$n = ${fmtA(r.n)}\ ${u('mol')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'What does absolute zero mean in the kinetic model of a gas?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The temperature at which the average kinetic energy of the particles would be zero.', correct: true },
          { text: 'The temperature at which the gas turns into a liquid.' },
          { text: 'The temperature at which the particles have no mass.' },
          { text: 'The lowest temperature that has been reached in a laboratory.' },
        ],
      },
      solution: () => [{ text: 'The average kinetic energy of the particles is proportional to the absolute temperature, so at 0 K it would be zero, and so would the pressure. (Real gases liquefy before reaching it, which is why the line is extrapolated.)' }],
      markscheme: () => [{ note: 'Average kinetic energy of the particles is zero.' }],
    },
  ],
});
