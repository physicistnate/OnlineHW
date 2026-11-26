import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const P0 = 1.01e5;
const BREATH = 0.5; // litres

export default defineQuestion({
  id: 'ibp-b3-scuba-tank',
  version: 1,
  title: 'How long does a scuba tank last?',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.3',
  standards: ['ibp.B.3.3', 'ibp.B.3.1', 'ibp.B.3.2', 'ibp.B.3.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { choices: [10, 12, 15], base: 12 },
    pb: { choices: [150, 200, 230], base: 200 },
    T: { choices: [15, 20, 25], base: 20 },
    pd: { choices: [2, 3, 4], base: 3 },
  },

  compute: (p, c) => {
    const TK = p.T + IB.zeroC;
    const n = (p.pb * 1e5 * p.V * 1e-3) / (IB.R * TK);
    const m = c.carry(n, 'n', 3) * 0.029;
    const Vs = (p.pb * 1e5 * p.V) / P0; // litres at the surface
    const breaths = (c.carry(Vs, 'Vs', 3) * P0) / (p.pd * 1e5 * BREATH);
    return { TK, n, m, Vs, breaths };
  },

  stem: ({ d }) =>
    `A diver’s tank has a volume of ${Q(d.V, 'L')} and is filled with air at a pressure of ${Q(`${d.pb} \\times 10^{5}`, 'Pa')} and a temperature of ${Q(d.T, '°C')}. The molar mass of air is $29\\ \\mathrm{g\\,mol^{-1}}$, $R = 8.31\\ \\mathrm{J\\,K^{-1}\\,mol^{-1}}$ and 1 L = 10⁻³ m³. Treat the air as an ideal gas at a constant temperature.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the mass of air in the tank.',
      response: { kind: 'numeric', answer: 'm', symbol: 'm', unit: 'kg', positive: true },
      solution: ({ d, r }) => [
        { math: tex`n = \frac{pV}{RT} = \frac{${d.pb} \times 10^{5} \times ${d.V} \times 10^{-3}}{8.31 \times ${r.TK}} = ${fmtW(r.n)}\ ${u('mol')}` },
        { math: tex`m = nM = ${fmtW(r.n)} \times 0.029 = ${fmtA(r.m)}\ ${u('kg')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$n = pV/RT$ in SI units' }, { mark: tex`$m = ${fmtA(r.m)}\ ${u('kg')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the volume this air would occupy at the surface, where the pressure is $1.01 \\times 10^{5}$ Pa, in litres.',
      response: { kind: 'numeric', answer: 'Vs', symbol: 'V', unit: 'L', positive: true },
      solution: ({ d, r }) => [{ text: 'At constant temperature $pV$ is constant (Boyle’s law):', math: tex`V = \frac{${d.pb} \times 10^{5} \times ${d.V}}{1.01 \times 10^{5}} = ${fmtA(r.Vs)}\ \mathrm{L}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Vs)}$ L` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Under water, the pressure is ${Q(`${d.pd}.0 \\times 10^{5}`, 'Pa')}. Each breath the diver takes is ${BREATH} L of air at this pressure. Assuming all the air in the tank can be used, how many breaths does it supply?`,
      response: { kind: 'numeric', answer: 'breaths', symbol: '\\text{breaths}', positive: true },
      solution: ({ d, r }) => [
        { text: 'At the depth, the air occupies a volume smaller than at the surface by the ratio of the pressures:', math: tex`\text{breaths} = \frac{${fmtW(r.Vs)} \times 1.01 \times 10^{5}}{${d.pd}.0 \times 10^{5} \times ${BREATH}} = ${fmtA(r.breaths)}` },
        { text: 'The deeper the dive, the faster the tank empties.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Volume of the air at the pressure of the depth' }, { mark: tex`$${fmtA(r.breaths)}$ breaths` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'At the pressure inside a full tank, real air does not behave exactly like an ideal gas. Why not?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The molecules are close together, so their own volume and the forces between them are no longer negligible.', correct: true },
          { text: 'The molecules move too fast for the gas laws to apply.' },
          { text: 'The temperature is too high for air to be an ideal gas.' },
          { text: 'The collisions between molecules stop being elastic at high pressure.' },
        ],
      },
      solution: () => [{ text: 'The ideal gas model assumes that the particles take up a negligible part of the volume and exert no forces on each other except in collisions. At high pressure (high density) the molecules are close together, and neither assumption holds well.' }],
      markscheme: () => [{ note: 'High density: molecular volume and intermolecular forces matter.' }],
    },
  ],
});
