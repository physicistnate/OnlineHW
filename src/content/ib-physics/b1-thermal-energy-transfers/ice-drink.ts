import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const C_W = 4180;
const L_F = 3.34e5;

interface P {
  md: number;
  T1: number;
  mi: number;
}

const finalT = (p: P) => ((p.md / 1000) * C_W * p.T1 - (p.mi / 1000) * L_F) / (C_W * ((p.md + p.mi) / 1000));

export default defineQuestion({
  id: 'ibp-b1-ice-drink',
  version: 1,
  title: 'Cooling a drink with ice: latent heat of fusion',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.1',
  standards: ['ibp.B.1.5', 'ibp.B.1.4', 'ibp.B.1.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    md: { choices: [200, 250, 300, 330], base: 250 },
    T1: { choices: [20, 25, 30], base: 25 },
    mi: { choices: [20, 30, 40, 50], base: 30 },
  },
  // All the ice melts and the drink stays clearly above 0 °C.
  constraint: (p) => finalT(p) >= 2,

  compute: (p, c) => {
    const Qm = (p.mi / 1000) * L_F;
    const Tf = ((p.md / 1000) * C_W * p.T1 - c.carry(Qm, 'Qm', 3)) / (C_W * ((p.md + p.mi) / 1000));
    const mMax = ((p.md / 1000) * C_W * p.T1 * 1000) / L_F; // g
    return { Qm, Tf, mMax };
  },

  stem: ({ d }) =>
    `${Q(d.mi, 'g')} of ice at 0 °C is added to ${Q(d.md, 'g')} of a drink at ${Q(d.T1, '°C')} in an insulated cup. Treat the drink as water: its specific heat capacity is $4.18 \\times 10^{3}\\ \\mathrm{J\\,kg^{-1}\\,K^{-1}}$. The specific latent heat of fusion of ice is $3.34 \\times 10^{5}\\ \\mathrm{J\\,kg^{-1}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the energy needed to melt the ice.',
      response: { kind: 'numeric', answer: 'Qm', symbol: 'Q', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ math: tex`Q = mL = ${Number(d.mi) / 1000} \times 3.34 \times 10^{5} = ${fmtA(r.Qm)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$Q = ${fmtA(r.Qm)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'Calculate the final temperature of the drink, once all the ice has melted and mixed in.',
      response: { kind: 'numeric', answer: 'Tf', symbol: 'T', unit: '°C', positive: true },
      solution: ({ d, r }) => [
        { text: 'The energy the drink loses as it cools to $T$ melts the ice and then warms the melted ice from 0 °C to $T$:', math: tex`${Number(d.md) / 1000} \times 4180 \times (${d.T1} - T) = ${fmtW(r.Qm)} + ${Number(d.mi) / 1000} \times 4180 \times T` },
        { math: tex`T = \frac{${Number(d.md) / 1000} \times 4180 \times ${d.T1} - ${fmtW(r.Qm)}}{4180 \times (${Number(d.md) / 1000} + ${Number(d.mi) / 1000})} = ${fmtA(r.Tf)}\ ${u('°C')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy lost by the drink = energy to melt the ice' }, { mark: '+ energy to warm the melted ice' }, { mark: tex`$T = ${fmtA(r.Tf)}\ ${u('°C')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the largest mass of ice at 0 °C that the original drink could melt completely, in grams.',
      response: { kind: 'numeric', answer: 'mMax', symbol: 'm', unit: 'g', positive: true },
      solution: ({ d, r }) => [
        { text: 'At most, the drink cools to 0 °C, and all the energy it gives out melts ice:', math: tex`m = \frac{${Number(d.md) / 1000} \times 4180 \times ${d.T1}}{3.34 \times 10^{5}} = ${fmtW(r.mMax / 1000)}\ ${u('kg')} = ${fmtA(r.mMax)}\ ${u('g')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Drink cools to 0 °C: $m_dc\\Delta T = mL$' }, { mark: tex`$m = ${fmtA(r.mMax)}\ ${u('g')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does ice at 0 °C cool a drink much more than the same mass of water at 0 °C?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Melting the ice takes a large amount of energy from the drink without any change in the ice’s temperature.', correct: true },
          { text: 'Ice has a lower temperature than water at 0 °C.' },
          { text: 'Ice has a higher specific heat capacity than water.' },
          { text: 'Ice is denser than water, so it holds more cold.' },
        ],
      },
      solution: () => [{ text: 'Both start at 0 °C, but the ice must first absorb its latent heat of fusion to melt, a large amount of energy, before the melted ice warms like the cold water would.' }],
      markscheme: () => [{ note: 'Latent heat of fusion absorbed at constant temperature.' }],
    },
  ],
});
