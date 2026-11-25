import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/**
 * Daily energy (kW h) of the appliances with fixed use: refrigerator 0.060 kW × 24 h,
 * ten 9.0 W bulbs × 5.0 h, television 0.100 kW × 4.0 h, laptop 0.050 kW × 6.0 h,
 * oven 2.4 kW × 0.50 h and clothes dryer 4.0 kW × 0.75 h.
 */
const FIXED = 6.79;
/** Power of the electric car charger (a typical home "level 2" charger), kW. */
const EV = 7.2;

export default defineQuestion({
  id: 'ibp-a3-home-energy',
  version: 1,
  title: 'Energy used by a home in one day, and its cost',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    PAC: { min: 2.5, max: 5, step: 0.5, base: 3.5, dp: 1 },
    tAC: { min: 2, max: 10, step: 1, base: 7 },
    tEV: { min: 0.5, max: 3, step: 0.5, base: 2.5, dp: 1 },
    price: { min: 12, max: 32, step: 0.5, base: 16.5, dp: 1 },
  },
  // A realistic summer day: 20 to 60 kW h in total.
  constraint: (p) => {
    const total = FIXED + p.PAC * p.tAC + EV * p.tEV;
    return total >= 20 && total <= 60;
  },

  compute: (p, c) => {
    const EAC = p.PAC * p.tAC;
    const EEV = EV * p.tEV;
    const total = FIXED + c.carry(EAC, 'EAC') + EEV;
    const cents = c.carry(total, 'total') * 30 * p.price;
    const cost = cents / 100;
    const Pavg = c.carry(total, 'total') / 24;
    return { EAC, EEV, total, cents, cost, Pavg };
  },

  stem: ({ d }) =>
    `The table shows the electrical appliances used in a home on one summer day.\n$$\\begin{array}{lll} \\textbf{Appliance} & \\textbf{Power} & \\textbf{Time used} \\\\ \\hline \\text{Refrigerator (average)} & 60\\ \\mathrm{W} & 24\\ \\mathrm{h} \\\\ \\text{LED light bulbs (10)} & 9.0\\ \\mathrm{W}\\ \\text{each} & 5.0\\ \\mathrm{h} \\\\ \\text{Television} & 100\\ \\mathrm{W} & 4.0\\ \\mathrm{h} \\\\ \\text{Laptop} & 50\\ \\mathrm{W} & 6.0\\ \\mathrm{h} \\\\ \\text{Electric oven} & 2.4\\ \\mathrm{kW} & 30\\ \\text{min} \\\\ \\text{Clothes dryer} & 4.0\\ \\mathrm{kW} & 45\\ \\text{min} \\\\ \\text{Air conditioner} & ${d.PAC}\\ \\mathrm{kW} & ${d.tAC}\\ \\mathrm{h} \\\\ \\text{Electric car charger} & ${EV}\\ \\mathrm{kW} & ${d.tEV}\\ \\mathrm{h} \\end{array}$$`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the energy used by the air conditioner in the day, in kW h.',
      response: { kind: 'numeric', answer: 'EAC', symbol: 'E', unit: 'kW h', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Energy = power × time. With the power in kW and the time in hours, the energy is in kilowatt-hours ($1\\ \\mathrm{kW\\,h} = 3.6\\ \\mathrm{MJ}$).',
          math: tex`E = Pt = ${d.PAC} \times ${d.tAC} = ${fmtA(r.EAC)}\ ${u('kW h')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.EAC)}\ ${u('kW h')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'The power of the oven is 40 times the average power of the refrigerator. Which uses more energy in the day?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The refrigerator, because it is used for a much longer time', correct: true },
          { text: 'The oven, because its power is much greater' },
          { text: 'Both use the same energy, because energy is conserved' },
          { text: 'The oven, because it gets much hotter than the refrigerator' },
        ],
      },
      solution: () => [
        {
          text: 'Energy depends on the power and on the time: $E = Pt$. Refrigerator: $0.060 \\times 24 = 1.44\\ \\mathrm{kW\\,h}$. Oven: $2.4 \\times 0.50 = 1.20\\ \\mathrm{kW\\,h}$. A low power for a long time can transfer more energy than a high power for a short time.',
        },
      ],
      markscheme: () => [{ note: 'E = Pt: the refrigerator runs 48 times longer.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the total electrical energy used by the home in the day.',
      response: { kind: 'numeric', answer: 'total', symbol: 'E_{\\text{total}}', unit: 'kW h', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Find the energy for each appliance in kW h (convert minutes to hours), then add them.',
          math: tex`\begin{gathered} \text{refrigerator: } 0.060 \times 24 = 1.44 \qquad \text{bulbs: } 10 \times 0.0090 \times 5.0 = 0.45 \\ \text{television: } 0.100 \times 4.0 = 0.40 \qquad \text{laptop: } 0.050 \times 6.0 = 0.30 \\ \text{oven: } 2.4 \times 0.50 = 1.20 \qquad \text{dryer: } 4.0 \times 0.75 = 3.00 \\ \text{air conditioner: } ${fmtW(r.EAC)} \qquad \text{car charger: } ${EV} \times ${d.tEV} = ${fmtW(r.EEV)} \end{gathered}`,
        },
        {
          math: tex`E_{\text{total}} = 1.44 + 0.45 + 0.40 + 0.30 + 1.20 + 3.00 + ${fmtW(r.EAC)} + ${fmtW(r.EEV)} = ${fmtA(r.total)}\ ${u('kW h')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy of each appliance from $E = Pt$, with times in hours' }, { mark: tex`$E_{\text{total}} = ${fmtA(r.total)}\ ${u('kW h')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ d }) => `Electricity costs ${d.price} cents per kW h. Calculate the cost of the electricity for 30 days like this one, in dollars.`,
      response: { kind: 'numeric', answer: 'cost', symbol: '\\text{cost}', unit: 'dollars', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`\text{cost} = ${fmtW(r.total)} \times 30 \times ${d.price} = ${fmtW(r.cents)}\ \text{cents} = ${fmtA(r.cost)}\ \text{dollars}`,
        },
        {
          text: `In 30 days the home uses $${fmtW(r.total)} \\times 30 = ${fmtWA(r.total * 30)}\\ \\mathrm{kW\\,h}$. The average US home used about $865\\ \\mathrm{kW\\,h}$ a month in 2024, at an average price of about 16.5 cents per kW h (US Energy Information Administration)${r.total * 30 > 865 ? ': air conditioning and charging a car make this home use more than average.' : '.'}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.cost)}$ dollars` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Calculate the average power used by the home over the day.',
      response: { kind: 'numeric', answer: 'Pavg', symbol: 'P_{\\text{average}}', unit: 'kW', positive: true },
      solution: ({ r }) => [
        {
          text: 'Average power = total energy ÷ total time.',
          math: tex`P = \frac{${fmtW(r.total)}}{24} = ${fmtA(r.Pavg)}\ ${u('kW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$P = ${fmtA(r.Pavg)}\ ${u('kW')}$` }, { note: 'Allow ECF from (c).' }],
    },
  ],
});
