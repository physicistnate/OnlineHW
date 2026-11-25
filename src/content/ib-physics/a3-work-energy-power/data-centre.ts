import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Electrical energy used by an average US home in 2024, in kW h per year (EIA: 865 kW h a month). */
const HOME = 10400;

export default defineQuestion({
  id: 'ibp-a3-data-centre',
  version: 1,
  title: 'An AI data centre compared with the homes of whole cities',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.5', 'ibp.A.3.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    PIT: { min: 300, max: 1000, step: 50, base: 800 },
    PUE: { min: 1.1, max: 1.4, step: 0.02, base: 1.2, dp: 2 },
    H: { min: 100000, max: 600000, step: 50000, base: 250000, sci: 2 },
  },

  compute: (p, c) => {
    const Ptot = p.PIT * p.PUE; // MW
    // A chain of three rounded values: students write the power and the number of homes
    // to at least 3 s.f. (a 2 s.f. energy is still allowed).
    const EMWh = c.carry(Ptot, 'Ptot', 3) * 8760;
    const E = EMWh / 1e6; // TW h
    const N = (c.carry(E, 'E') * 1e9) / HOME; // homes
    const cities = c.carry(N, 'N', 3) / p.H;
    return { Ptot, EMWh, E, N, cities };
  },

  stem: ({ d }) =>
    `The largest data centres that train and run artificial intelligence (AI) models now need about $1\\ \\mathrm{GW}$ of electrical power for their computers alone (Epoch AI, 2026). The computers in a new data centre use ${Q(d.PIT, 'MW')}. Cooling, power supplies and lighting need extra power, so the total power the data centre draws is its power usage effectiveness (PUE) multiplied by the power used by its computers. For this data centre the PUE is ${d.PUE}. The data centre runs at this power all year, which is $8760$ hours.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the total electrical power drawn by the data centre.',
      response: { kind: 'numeric', answer: 'Ptot', symbol: 'P_{\\text{total}}', unit: 'MW', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`P_{\text{total}} = \text{PUE} \times P_{\text{computers}} = ${d.PUE} \times ${d.PIT} = ${fmtA(r.Ptot)}\ ${u('MW')}`,
        },
        {
          text: `Only a fraction $\\dfrac{1}{${d.PUE}} = ${fmtA(1 / Number(d.PUE))}$ (${fmtA(100 / Number(d.PUE))} %) of the power reaches the computers; the rest runs the cooling and the power supplies.`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$P = ${fmtA(r.Ptot)}\ ${u('MW')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the electrical energy used by the data centre in one year, in TW h.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'TW h', positive: true },
      solution: ({ r }) => [
        {
          text: 'Energy = power × time. With the power in MW and the time in hours, the energy comes out in MW h. Then $1\\ \\mathrm{TW\\,h} = 10^{6}\\ \\mathrm{MW\\,h}$.',
          math: tex`E = Pt = ${fmtW(r.Ptot)} \times 8760 = ${fmtW(r.EMWh)}\ ${u('MW h')} = ${fmtA(r.E)}\ ${u('TW h')}`,
        },
        {
          text: 'For comparison, the International Energy Agency estimates that all the data centres in the world together used about $485\\ \\mathrm{TW\\,h}$ in 2025.',
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy = power × time (8760 h)' }, { mark: tex`$E = ${fmtA(r.E)}\ ${u('TW h')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () =>
        `In 2024 an average home in the United States used about $10\\,400\\ \\mathrm{kW\\,h}$ of electrical energy in a year (US Energy Information Administration). Calculate how many average homes would use the same energy in a year as the data centre.`,
      response: { kind: 'numeric', answer: 'N', symbol: 'N', positive: true },
      solution: ({ r }) => [
        {
          text: 'Convert the data centre’s energy to kW h: $1\\ \\mathrm{TW\\,h} = 10^{12}\\ \\mathrm{W\\,h} = 10^{9}\\ \\mathrm{kW\\,h}$.',
          math: tex`N = \frac{${fmtW(r.E)} \times 10^{9}}{${HOME}} = ${fmtA(r.N)}\ \text{homes}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Conversion of TW h to kW h' }, { mark: tex`$N = ${fmtA(r.N)}$ homes` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ d }) => `A city has $${d.H}$ homes. Calculate how many cities of this size have homes that together use the same energy as the data centre.`,
      response: { kind: 'numeric', answer: 'cities', symbol: '\\text{number of cities}', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`\frac{${fmtW(r.N)}}{${d.H}} = ${fmtA(r.cities)}`,
        },
        { text: 'One building uses as much electrical energy as the homes of several whole cities.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.cities)}$ cities` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which change would reduce the PUE of the data centre?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Using a more efficient cooling system for the same computers', correct: true },
          { text: 'Adding more computers, with the same cooling power for each computer' },
          { text: 'Running the computers for more hours each day' },
          { text: 'Replacing the computers with faster ones that need more power' },
        ],
      },
      solution: () => [
        {
          text: 'PUE = total power ÷ power used by the computers. It is reduced only if less extra power is needed for each watt the computers use, for example with more efficient cooling. The other changes alter the total power, but not the extra power needed for each watt used by the computers. A PUE of 1 would mean that all the power reaches the computers.',
        },
      ],
      markscheme: () => [{ note: 'Less power for cooling and power supplies for each watt used by the computers.' }],
    },
  ],
});
