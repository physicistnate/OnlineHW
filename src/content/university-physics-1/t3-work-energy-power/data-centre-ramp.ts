import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** Average US home, 2024: about 10 400 kW h of electricity a year (EIA: 865 kW h a month). */
const HOME_KWH = 10400;

export default defineQuestion({
  id: 'up1-t3-data-centre-ramp',
  version: 1,
  title: 'Energy used while a data center powers up, compared with cities',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.6'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Pmax: { min: 0.6, max: 1.5, step: 0.05, base: 1.2, dp: 2 },
    tau: { min: 5, max: 30, step: 1, base: 15 },
    T: { min: 30, max: 120, step: 5, base: 60 },
    H: { min: 100000, max: 600000, step: 50000, base: 300000, sci: 2 },
  },
  // The power-up is well under way by the end of the period.
  constraint: (p) => p.T >= 2 * p.tau,

  compute: (p, c) => {
    // ∫0^T Pmax(1 − e^(−t/τ)) dt = Pmax[T − τ(1 − e^(−T/τ))], in GW × days.
    const GWdays = p.Pmax * (p.T - p.tau * (1 - Math.exp(-p.T / p.tau)));
    const E = c.carry(GWdays) * 24; // GW h
    const homeKW = HOME_KWH / 8760;
    const N = (p.Pmax * 1e6) / c.carry(homeKW, undefined, 3);
    const cities = c.carry(N, 'N', 3) / p.H;
    return { GWdays, E, homeKW, N, cities };
  },

  stem: ({ d }) =>
    `The largest data centers being built to train and run AI models in 2026 draw about $1\\ \\mathrm{GW}$ (Epoch AI). A new data center is brought into service in stages, so its electrical power rises as $P(t) = P_{\\max}\\left(1 - e^{-t/\\tau}\\right)$, where $P_{\\max} = ${d.Pmax}\\ \\mathrm{GW}$, $\\tau = ${d.tau}$ days and $t$ is the time since it was switched on.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: ({ d }) => `Find the electrical energy the data center uses in its first ${d.T} days, in GW h.`,
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'GW h', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Power is the rate of energy use, $P = dE/dt$, so the energy is the integral of the power over time (the area under the $P$–$t$ graph).',
          math: tex`E = \int_0^{T} P_{\max}\left(1 - e^{-t/\tau}\right)dt = P_{\max}\Big[t + \tau e^{-t/\tau}\Big]_0^{T} = P_{\max}\left[T - \tau\left(1 - e^{-T/\tau}\right)\right]`,
        },
        {
          text: 'With $P_{\\max}$ in GW and the times in days, this gives GW × days.',
          math: tex`E = ${d.Pmax} \times \left[${d.T} - ${d.tau}\left(1 - e^{-${d.T}/${d.tau}}\right)\right] = ${fmtW(r.GWdays)}\ \text{GW}\cdot\text{days}`,
        },
        { math: tex`E = ${fmtW(r.GWdays)} \times 24 = ${fmtWA(r.E)}\ ${u('GW h')}` },
      ],
      markscheme: ({ r }) => [
        { mark: '$E = \\int P\\,dt$' },
        { mark: 'Correct antiderivative and limits: $P_{\\max}[T - \\tau(1 - e^{-T/\\tau})]$' },
        { mark: tex`$E = ${fmtA(r.E)}\ ${u('GW h')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () =>
        `An average US home used about $10\\,400\\ \\mathrm{kW\\,h}$ of electrical energy in 2024 (US Energy Information Administration). At full power, how many average homes would together draw the same average power as the data center?`,
      response: { kind: 'numeric', answer: 'N', symbol: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The average power of a home is its yearly energy divided by the 8760 hours in a year.',
          math: tex`P_{\text{home}} = \frac{${HOME_KWH}\ \mathrm{kW\,h}}{8760\ \mathrm{h}} = ${fmtW(r.homeKW)}\ ${u('kW')}`,
        },
        { math: tex`N = \frac{${d.Pmax} \times 10^{6}\ \mathrm{kW}}{${fmtW(r.homeKW)}\ \mathrm{kW}} = ${fmtA(r.N)}\ \text{homes}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`Average home power $= ${fmtA(r.homeKW)}\ ${u('kW')}$` }, { mark: tex`$N = ${fmtA(r.N)}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ d }) => `A city has $${d.H}$ homes. How many such cities’ worth of homes is this?`,
      response: { kind: 'numeric', answer: 'cities', symbol: '\\text{cities}', positive: true },
      solution: ({ d, r }) => [{ math: tex`\frac{${fmtW(r.N)}}{${d.H}} = ${fmtA(r.cities)}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.cities)}$ cities` }, { note: 'Follow through from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which expression gives the rate at which the data center’s total energy use $E(t)$ is increasing at time $t$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$P_{\\max}\\left(1 - e^{-t/\\tau}\\right)$', correct: true },
          { text: '$\\dfrac{P_{\\max}}{\\tau}e^{-t/\\tau}$' },
          { text: '$P_{\\max}\\,t$' },
          { text: '$P_{\\max}\\left[t - \\tau\\left(1 - e^{-t/\\tau}\\right)\\right]$' },
        ],
      },
      solution: () => [
        {
          text: 'By definition $dE/dt = P(t)$: the power is the rate of energy use (the fundamental theorem of calculus applied to (a)). $\\dfrac{P_{\\max}}{\\tau}e^{-t/\\tau}$ is $dP/dt$, how fast the power itself is rising, and the last expression is $E(t)$.',
        },
      ],
      markscheme: () => [{ note: 'dE/dt = P(t).' }],
    },
  ],
});
