import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const P0 = 1.01e5;
const T0C = 15;

export default defineQuestion({
  id: 'ibp-b3-weather-balloon',
  version: 1,
  title: 'A weather balloon rising through the atmosphere',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.3',
  standards: ['ibp.B.3.3', 'ibp.B.3.2', 'ibp.B.3.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V1: { choices: [4, 5, 6], base: 5 },
    p2: { choices: [25, 30, 50], base: 30 },
    T2: { choices: [-50, -45, -40], base: -45 },
  },

  compute: (p, c) => {
    const T1K = T0C + IB.zeroC;
    const T2K = p.T2 + IB.zeroC;
    const n = (P0 * p.V1) / (IB.R * T1K);
    const m = c.carry(n, 'n', 3) * 0.004;
    const V2 = (p.V1 * (P0 / (p.p2 * 1e3)) * T2K) / T1K;
    return { T1K, T2K, n, m, V2 };
  },

  stem: ({ d }) =>
    `A weather balloon is filled with ${Q(d.V1, 'm3')} of helium at ground level, where the pressure is $1.01 \\times 10^{5}$ Pa and the temperature is ${T0C} °C. The molar mass of helium is $4.0\\ \\mathrm{g\\,mol^{-1}}$ and $R = 8.31\\ \\mathrm{J\\,K^{-1}\\,mol^{-1}}$. Treat the helium as an ideal gas.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the mass of helium in the balloon.',
      response: { kind: 'numeric', answer: 'm', symbol: 'm', unit: 'kg', positive: true },
      solution: ({ d, r }) => [
        { math: tex`n = \frac{pV}{RT} = \frac{1.01 \times 10^{5} \times ${d.V1}}{8.31 \times ${r.T1K}} = ${fmtW(r.n)}\ ${u('mol')}` },
        { math: tex`m = nM = ${fmtW(r.n)} \times 0.0040 = ${fmtA(r.m)}\ ${u('kg')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$n = pV/RT$ with $T$ in kelvin' }, { mark: tex`$m = ${fmtA(r.m)}\ ${u('kg')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `The balloon rises to a height where the pressure is ${Q(d.p2, 'kPa')} and the temperature is ${Q(d.T2, '°C')}. Assuming the balloon’s skin lets it expand freely, calculate the volume of the helium there.`,
      response: { kind: 'numeric', answer: 'V2', symbol: 'V', unit: 'm3', positive: true },
      solution: ({ d, r }) => [
        { text: 'The amount of gas is fixed, so $pV/T$ is constant:', math: tex`V_2 = V_1 \times \frac{p_1}{p_2} \times \frac{T_2}{T_1} = ${d.V1} \times \frac{101}{${d.p2}} \times \frac{${r.T2K}}{${r.T1K}} = ${fmtA(r.V2)}\ ${u('m3')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$pV/T$ constant, temperatures in kelvin' }, { mark: tex`$V = ${fmtA(r.V2)}\ ${u('m3')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Why is the ideal gas model a good description of the helium here?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The pressure is low and the temperature far above helium’s boiling point, so the atoms are far apart and the forces between them are negligible.', correct: true },
          { text: 'Helium atoms are large, so their collisions are elastic.' },
          { text: 'The temperature is low, so the atoms move slowly and rarely collide.' },
          { text: 'The ideal gas model works for every gas at every pressure and temperature.' },
        ],
      },
      solution: () => [{ text: 'A real gas behaves like an ideal gas when its molecules are far apart compared with their size, so that their volume and the forces between them can be neglected: low pressure (low density) and a temperature well above the point where the gas liquefies (4 K for helium).' }],
      markscheme: () => [{ note: 'Low pressure/density and high temperature compared with the boiling point.' }],
    },
  ],
});
