import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Energy released by burning 1 kg of natural gas (methane is about 55 MJ per kilogram). */
const GAS = 55;

export default defineQuestion({
  id: 'ibp-a3-power-station',
  version: 1,
  title: 'Energy transfers in a gas-fired power station',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.1', 'ibp.A.3.6', 'ibp.A.3.7'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Pin: { min: 600, max: 2400, step: 50, base: 1500 },
    lb: { min: 8, max: 14, step: 1, base: 10 },
    lc: { min: 45, max: 55, step: 1, base: 50 },
    lo: { min: 2, max: 6, step: 1, base: 4 },
    lt: { min: 3, max: 8, step: 1, base: 5 },
  },
  // The station's efficiency is at least 30%.
  constraint: (p) => 100 - p.lb - p.lc - p.lo >= 30,

  compute: (p, c) => {
    const effSt = 100 - p.lb - p.lc - p.lo; // percent
    const Pout = (p.Pin * effSt) / 100;
    const keep = 1 - p.lt / 100;
    const effAll = effSt * keep;
    // Or from the electrical power found in (a).
    const effAll__power = ((c.carry(Pout, 'Pout') * keep) / p.Pin) * 100;
    const mdot = p.Pin / GAS;
    return { effSt, Pout, keep, effAll, effAll__power, mdot };
  },

  stem: ({ d }) =>
    `A power station burns natural gas. The fuel supplies energy at a rate of ${Q(d.Pin, 'MW')}. Of this energy:\n• ${Q(d.lb, '%')} is lost in the hot exhaust gases from the boiler\n• ${Q(d.lc, '%')} is transferred to the cooling water in the condenser\n• ${Q(d.lo, '%')} is lost in the turbine, the generator and other machinery\n• the rest is the electrical energy output.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the electrical power output of the power station.',
      response: { kind: 'numeric', answer: 'Pout', symbol: 'P_{\\text{out}}', unit: 'MW', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Energy is conserved, so the percentages of the input add up to 100 %. The electrical output is what is left after the losses.',
          math: tex`100 - ${d.lb} - ${d.lc} - ${d.lo} = ${r.effSt}\ ${u('%')}`,
        },
        {
          math: tex`P_{\text{out}} = ${fmtW(r.effSt / 100)} \times ${d.Pin} = ${fmtA(r.Pout)}\ ${u('MW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`Useful fraction $= ${r.effSt}\ ${u('%')}$` }, { mark: tex`$P_{\text{out}} = ${fmtA(r.Pout)}\ ${u('MW')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) =>
        `${Q(d.lt, '%')} of the electrical energy is lost as thermal energy in the transmission cables. Calculate the overall efficiency with which the energy of the fuel is delivered as electrical energy to homes.`,
      response: { kind: 'numeric', answer: 'effAll', symbol: '\\eta', unit: '%', positive: true },
      solution: ({ d, r }) => [
        {
          text: `The cables deliver $100 - ${d.lt} = ${100 - Number(d.lt)}\\ \\%$ of the electrical energy they receive. The efficiencies of stages one after another multiply.`,
          math: tex`\eta = ${fmtW(r.effSt / 100)} \times ${fmtW(r.keep)} = ${fmtW(r.effAll / 100)} = ${fmtA(r.effAll)}\ ${u('%')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Overall efficiency = product of the efficiencies of the two stages' }, { mark: tex`$\eta = ${fmtA(r.effAll)}\ ${u('%')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => `The energy density of natural gas is ${Q(GAS, 'MJ kg-1')}. Calculate the mass of gas burned each second.`,
      response: { kind: 'numeric', answer: 'mdot', symbol: '\\frac{\\Delta m}{\\Delta t}', unit: 'kg s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: `Each second the fuel supplies $${d.Pin}\\ \\mathrm{MJ}$ of energy (1 MW = 1 MJ each second), and each kilogram of gas supplies $${GAS}\\ \\mathrm{MJ}$.`,
          math: tex`\frac{\Delta m}{\Delta t} = \frac{${d.Pin} \times 10^{6}}{${GAS} \times 10^{6}} = ${fmtA(r.mdot)}\ ${u('kg s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Mass per second = power input ÷ energy density' }, { mark: tex`$${fmtA(r.mdot)}\ ${u('kg s-1')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The power station is improved so that its efficiency increases, while it produces the same electrical power. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Less gas is burned each second, and less energy is wasted each second.', correct: true },
          { text: 'The same mass of gas is burned each second, but less energy is wasted each second.' },
          { text: 'Less gas is burned each second, but the same energy is wasted each second.' },
          { text: 'More gas is burned each second, because more of its energy becomes electrical energy.' },
        ],
      },
      solution: () => [
        {
          text: 'Efficiency = useful output ÷ input. With the same useful output and a greater efficiency, the input power must be smaller, so less gas is burned each second. The wasted power is input − output, and the input is smaller while the output is the same, so less energy is wasted each second too.',
        },
      ],
      markscheme: () => [{ note: 'Same output, higher efficiency: smaller input, so less fuel and less waste.' }],
    },
  ],
});
