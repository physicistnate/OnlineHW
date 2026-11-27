import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Specific heat capacity of water (J kg⁻¹ K⁻¹) and specific latent heat of vaporization (J kg⁻¹), as given. */
const C_W = 4180;
const L_V = 2.26e6;

export default defineQuestion({
  id: 'ibp-b1-kettle',
  version: 1,
  title: 'Heating and boiling water in an electric kettle',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.1',
  standards: ['ibp.B.1.4', 'ibp.B.1.5', 'ibp.B.1.3'],
  uses: ['ibp.A.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    m: { choices: [0.5, 0.8, 1, 1.2, 1.5], base: 1, dp: 1 },
    T0: { choices: [12, 15, 18, 20, 22], base: 18 },
    P: { choices: [1800, 2000, 2200, 3000], base: 2200 },
    mb: { choices: [50, 100, 150], base: 100 },
  },

  compute: (p, c) => {
    const dT = 100 - p.T0;
    const Qh = p.m * C_W * dT;
    const t = c.carry(Qh, 'Qh', 3) / p.P;
    const tBoil = ((p.mb / 1000) * L_V) / p.P;
    return { dT, Qh, t, tBoil };
  },

  stem: ({ d }) =>
    `An electric kettle with a power of ${Q(d.P, 'W')} contains ${Q(d.m, 'kg')} of water at ${Q(d.T0, '°C')}. The specific heat capacity of water is $4.18 \\times 10^{3}\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$ and its specific latent heat of vaporization is $2.26 \\times 10^{6}\\ \\mathrm{J\\,kg^{-1}}$. Assume that all the energy supplied goes into the water.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the energy needed to heat the water to its boiling point, 100 °C.',
      response: { kind: 'numeric', answer: 'Qh', symbol: 'Q', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ math: tex`Q = mc\Delta T = ${d.m} \times 4180 \times (100 - ${d.T0}) = ${fmtA(r.Qh)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: '$Q = mc\\Delta T$ with $\\Delta T = 100 - T_0$' }, { mark: tex`$Q = ${fmtA(r.Qh)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the time this takes.',
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [{ math: tex`t = \frac{Q}{P} = \frac{${fmtW(r.Qh)}}{${d.P}} = ${fmtA(r.t)}\ ${u('s')}` }],
      markscheme: ({ r }) => [{ mark: tex`$t = ${fmtA(r.t)}\ ${u('s')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `The kettle fails to switch off. Calculate the time it takes to boil away ${Q(d.mb, 'g')} of the water once it is boiling.`,
      response: { kind: 'numeric', answer: 'tBoil', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [{ math: tex`t = \frac{mL}{P} = \frac{${Number(d.mb) / 1000} \times 2.26 \times 10^{6}}{${d.P}} = ${fmtA(r.tBoil)}\ ${u('s')}` }],
      markscheme: ({ r }) => [{ mark: '$Q = mL$ with the mass in kg' }, { mark: tex`$t = ${fmtA(r.tBoil)}\ ${u('s')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'While the water boils, its temperature stays at 100 °C although energy is still being supplied. Why?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The energy increases the potential energy of the molecules as they separate, not their average kinetic energy.', correct: true },
          { text: 'The energy increases the average kinetic energy of the molecules, but the thermometer cannot show it.' },
          { text: 'The water loses energy to the room as fast as it gains it from the heater.' },
          { text: 'Water cannot store any more internal energy once it reaches 100 °C.' },
        ],
      },
      solution: () => [{ text: 'Temperature measures the average kinetic energy of the molecules. During boiling the energy supplied separates the molecules, increasing their potential energy: the internal energy rises, the temperature does not.' }],
      markscheme: () => [{ note: 'Potential energy of the molecules increases; mean kinetic energy (temperature) does not.' }],
    },
  ],
});
