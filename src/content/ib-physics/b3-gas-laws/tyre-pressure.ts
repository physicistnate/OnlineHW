import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b3-tyre-pressure',
  version: 1,
  title: 'The air in a car tyre: moles, molecules and pressure',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.3',
  standards: ['ibp.B.3.3', 'ibp.B.3.2', 'ibp.B.3.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    V: { choices: [20, 25, 30], base: 25 },
    p1: { choices: [300, 320, 340], base: 320 },
    T1: { choices: [5, 10, 15], base: 10 },
    T2: { choices: [35, 40, 45], base: 40 },
  },

  compute: (p, c) => {
    const T1K = p.T1 + IB.zeroC;
    const T2K = p.T2 + IB.zeroC;
    const n = (p.p1 * 1e3 * p.V * 1e-3) / (IB.R * T1K);
    const N = c.carry(n, 'n', 3) * IB.NA;
    const p2 = (p.p1 * T2K) / T1K;
    return { T1K, T2K, n, N, p2 };
  },

  stem: ({ d }) =>
    `A car tyre contains ${Q(d.V, 'L')} of air (1 L = 10⁻³ m³) at a pressure of ${Q(d.p1, 'kPa')} and a temperature of ${Q(d.T1, '°C')}. Treat the air as an ideal gas, and assume the volume of the tyre does not change. $R = 8.31\\ \\mathrm{J\\,K^{-1}\\,mol^{-1}}$ and $N_A = 6.02 \\times 10^{23}\\ \\mathrm{mol^{-1}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the amount of air in the tyre, in moles.',
      response: { kind: 'numeric', answer: 'n', symbol: 'n', unit: 'mol', positive: true },
      solution: ({ d, r }) => [{ text: 'With the pressure in pascals, the volume in m³ and the temperature in kelvin:', math: tex`n = \frac{pV}{RT} = \frac{${d.p1} \times 10^{3} \times ${d.V} \times 10^{-3}}{8.31 \times ${r.T1K}} = ${fmtA(r.n)}\ ${u('mol')}` }],
      markscheme: ({ r }) => [{ mark: 'SI units and the temperature in kelvin' }, { mark: tex`$n = ${fmtA(r.n)}\ ${u('mol')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the number of molecules of air in the tyre.',
      response: { kind: 'numeric', answer: 'N', symbol: 'N', positive: true },
      solution: ({ r }) => [{ math: tex`N = nN_A = ${fmtW(r.n)} \times 6.02 \times 10^{23} = ${fmtA(r.N)}` }],
      markscheme: ({ r }) => [{ mark: tex`$N = ${fmtA(r.N)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `After a long drive, the air in the tyre is at ${Q(d.T2, '°C')}. Calculate its pressure now, in kPa.`,
      response: { kind: 'numeric', answer: 'p2', symbol: 'p', unit: 'kPa', positive: true },
      solution: ({ d, r }) => [{ text: 'At constant volume, $p/T$ is constant (temperatures in kelvin):', math: tex`p_2 = p_1\frac{T_2}{T_1} = ${d.p1} \times \frac{${r.T2K}}{${r.T1K}} = ${fmtA(r.p2)}\ ${u('kPa')}` }],
      markscheme: ({ r }) => [{ mark: '$p/T$ constant, temperatures in kelvin' }, { mark: tex`$p = ${fmtA(r.p2)}\ ${u('kPa')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Using the kinetic model of a gas, why does the pressure rise?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The molecules move faster, so they hit the walls more often and with a larger change of momentum each time.', correct: true },
          { text: 'The molecules expand, so they take up more of the tyre’s volume.' },
          { text: 'The number of molecules increases as the air warms.' },
          { text: 'The molecules attract each other more strongly at higher temperatures.' },
        ],
      },
      solution: () => [{ text: 'A higher temperature means a larger average kinetic energy, so faster molecules. Each collision with the wall gives a larger change of momentum, and collisions happen more often: a larger force on each square metre of wall.' }],
      markscheme: () => [{ note: 'Faster molecules: more frequent collisions with a larger momentum change.' }],
    },
  ],
});
