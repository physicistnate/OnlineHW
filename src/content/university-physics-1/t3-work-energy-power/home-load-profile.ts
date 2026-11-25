import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** Peak-price hours (a common time-of-use window): 4 pm to 9 pm. */
const T1 = 16;
const T2 = 21;
const K = (2 * Math.PI) / 24;

export default defineQuestion({
  id: 'up1-t3-home-load-profile',
  version: 1,
  title: 'A home’s daily power curve and time-of-use electricity prices',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.6'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    Pbar: { min: 0.8, max: 2, step: 0.1, base: 1.2, dp: 1 },
    A: { min: 0.2, max: 1, step: 0.1, base: 0.6, dp: 1 },
    tp: { min: 17, max: 21, step: 1, base: 19 },
    cOff: { min: 10, max: 25, step: 1, base: 15 },
    cPk: { min: 30, max: 60, step: 1, base: 45 },
  },
  // The power never falls below 40% of its average.
  constraint: (p) => p.A <= 0.6 * p.Pbar,

  compute: (p, c) => {
    const Etot = 24 * p.Pbar;
    const coef = p.A / K; // 24A/2π
    const s2 = Math.sin(K * (T2 - p.tp));
    const s1 = Math.sin(K * (T1 - p.tp));
    const diff = c.carry(s2) - c.carry(s1);
    const E1 = p.Pbar * (T2 - T1);
    const E2 = c.carry(coef) * c.carry(diff);
    const Epk = E1 + c.carry(E2);
    const Eoff = Etot - c.carry(Epk, 'Epk', 3);
    const cents = c.carry(Epk, 'Epk') * p.cPk + c.carry(Eoff) * p.cOff;
    const cost = cents / 100;
    return { Etot, coef, s2, s1, diff, E1, E2, Epk, Eoff, cents, cost };
  },

  stem: ({ d }) =>
    `Over a typical day, the electrical power used by a home is modeled as $P(t) = \\bar{P} + A\\cos\\!\\left(\\dfrac{2\\pi(t - t_p)}{24}\\right)$, where $t$ is the time of day in hours, $\\bar{P} = ${d.Pbar}\\ \\mathrm{kW}$, $A = ${d.A}\\ \\mathrm{kW}$ and the evening peak is at $t_p = ${d.tp}$ (${d.tp}:00). (An average US home uses about $10\\,400\\ \\mathrm{kW\\,h}$ a year, an average power of about $1.2\\ \\mathrm{kW}$.)`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the energy the home uses in one whole day.',
      response: { kind: 'numeric', answer: 'Etot', symbol: 'E', unit: 'kW h', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Energy is the integral of power over time. The cosine term goes through one complete cycle in 24 hours, so its integral over the day is zero.',
          math: tex`E = \int_0^{24} \left[\bar{P} + A\cos\left(\frac{2\pi(t - t_p)}{24}\right)\right]dt = 24\bar{P} + 0 = 24 \times ${d.Pbar} = ${fmtA(r.Etot)}\ ${u('kW h')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'The cosine integrates to zero over a full period' }, { mark: tex`$E = ${fmtA(r.Etot)}\ ${u('kW h')}$` }],
    },
    {
      label: '(b)',
      marks: 3,
      prompt: () => 'The electricity company charges a peak price from 16:00 to 21:00. Find the energy used during these peak hours.',
      response: { kind: 'numeric', answer: 'Epk', symbol: 'E_{\\text{peak}}', unit: 'kW h', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`E_{\text{peak}} = \int_{16}^{21} P\,dt = \bar{P}(21 - 16) + \frac{24A}{2\pi}\left[\sin\left(\frac{2\pi(21 - t_p)}{24}\right) - \sin\left(\frac{2\pi(16 - t_p)}{24}\right)\right]`,
        },
        {
          text: 'Work out each piece (the angles are in radians):',
          math: tex`\bar{P}(21 - 16) = ${d.Pbar} \times 5 = ${fmtW(r.E1)}, \qquad \frac{24A}{2\pi} = \frac{24 \times ${d.A}}{2\pi} = ${fmtW(r.coef)}`,
        },
        {
          math: tex`\sin\left(\frac{2\pi(${T2 - Number(d.tp)})}{24}\right) - \sin\left(\frac{2\pi(${T1 - Number(d.tp)})}{24}\right) = ${fmtW(r.s2)} - (${fmtW(r.s1)}) = ${fmtW(r.diff)}`,
        },
        { math: tex`${fmtW(r.coef)} \times ${fmtW(r.diff)} = ${fmtW(r.E2)}, \qquad E_{\text{peak}} = ${fmtW(r.E1)} + ${fmtW(r.E2)} = ${fmtA(r.Epk)}\ ${u('kW h')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Integral of $P$ from 16 to 21' },
        { mark: 'Antiderivative $\\bar{P}t + \\dfrac{24A}{2\\pi}\\sin\\left(\\dfrac{2\\pi(t - t_p)}{24}\\right)$' },
        { mark: tex`$E_{\text{peak}} = ${fmtA(r.Epk)}\ ${u('kW h')}$` },
      ],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `The peak price is ${d.cPk} cents per kW h, and all other hours cost ${d.cOff} cents per kW h. Find the cost of the electricity for the day, in dollars.`,
      response: { kind: 'numeric', answer: 'cost', symbol: '\\text{cost}', unit: 'dollars', positive: true },
      solution: ({ d, r }) => [
        {
          math: tex`E_{\text{off-peak}} = ${fmtW(r.Etot)} - ${fmtW(r.Epk)} = ${fmtW(r.Eoff)}\ ${u('kW h')}`,
        },
        { math: tex`\text{cost} = ${fmtW(r.Epk)} \times ${d.cPk} + ${fmtW(r.Eoff)} \times ${d.cOff} = ${fmtW(r.cents)}\ \text{cents} = ${fmtA(r.cost)}\ \text{dollars}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Peak and off-peak energies at their own prices' }, { mark: tex`$${fmtA(r.cost)}$ dollars` }, { note: 'Follow through from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () =>
        'The home adds a battery that charges during off-peak hours and supplies the home during the peak hours. Assume the battery wastes no energy. Compared with before, which is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The energy taken from the grid each day is the same, but the cost is lower.', correct: true },
          { text: 'The energy taken from the grid each day and the cost are both lower.' },
          { text: 'The energy taken from the grid each day is lower, but the cost is the same.' },
          { text: 'Neither the energy nor the cost changes.' },
        ],
      },
      solution: () => [
        {
          text: 'The home still uses the same energy, $\\int P\\,dt$, and a lossless battery only shifts when it is taken from the grid. Moving the peak-hour energy to cheaper hours lowers the cost. (A real battery loses some energy, so slightly more energy would be taken from the grid.)',
        },
      ],
      markscheme: () => [{ note: 'Same energy, shifted to cheaper hours.' }],
    },
  ],
});
