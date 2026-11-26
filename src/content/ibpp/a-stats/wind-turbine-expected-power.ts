import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { distributionTable } from '../helpers';

/** Wind speeds (m/s) and, per version, how often each occurs. */
const SPEEDS = [4, 6, 8, 10, 12];
const PROBS: Record<string, number[]> = {
  w1: [0.15, 0.3, 0.3, 0.15, 0.1],
  w2: [0.1, 0.25, 0.35, 0.2, 0.1],
  w3: [0.2, 0.3, 0.25, 0.15, 0.1],
  w4: [0.05, 0.2, 0.4, 0.25, 0.1],
};
/** Density of air, kg m⁻³. */
const RHO = 1.2;

/** Electrical power (MW) at wind speed v: efficiency × ½ρAv³. */
const power = (v: number, r: number, eff: number) => (eff * 0.5 * RHO * Math.PI * r ** 2 * v ** 3) / 1e6;

export default defineQuestion({
  id: 'ibpp-a4-wind-turbine-expected-power',
  version: 1,
  title: 'The expected power of a wind turbine',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.5', 'ibp.A.3.6'],
  math: { topic: 'ibm.4', standards: ['ibm.4.7'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    wind: { choices: Object.keys(PROBS), base: 'w1' },
    r: { min: 40, max: 60, step: 5, base: 50 },
    eff: { choices: [0.35, 0.4, 0.45], base: 0.4 },
  },

  compute: (p, c) => {
    const probs = PROBS[p.wind as string];
    const P8 = power(8, p.r, p.eff as number);
    const EV = SPEEDS.reduce((s, v, i) => s + v * probs[i], 0);
    const PEV = power(c.carry(EV, 'EV'), p.r, p.eff as number);
    const EP = SPEEDS.reduce((s, v, i) => s + power(v, p.r, p.eff as number) * probs[i], 0);
    return { P8, EV, PEV, EP };
  },

  stem: ({ d, p }) =>
    `The blades of a wind turbine sweep a circle of radius ${Q(d.r, 'm')}. The kinetic energy of the air passing through this circle each second is $\\tfrac{1}{2}\\rho Av^3$, where $\\rho = ${RHO}\\ \\mathrm{kg\\,m^{-3}}$ is the density of air, $A$ the area of the circle and $v$ the wind speed. The turbine converts ${Math.round(Number(d.eff) * 100)}% of this to electrical energy. The wind speed $V$ at the site has this probability distribution:\n${distributionTable('V', SPEEDS, PROBS[p.wind as string], '\\mathrm{m\\,s^{-1}}')}`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the electrical power output, in MW, when the wind speed is 8 m s⁻¹.',
      response: { kind: 'numeric', answer: 'P8', symbol: 'P', unit: 'MW', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Power = efficiency × kinetic energy of the air per second.',
          math: tex`P = ${d.eff} \times \tfrac{1}{2} \times ${RHO} \times \pi \times ${d.r}^2 \times 8^3 = ${fmtW(r.P8 * 1e6)}\ ${u('W')} = ${fmtA(r.P8)}\ ${u('MW')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$A = \\pi r^2$ and efficiency applied' }, { mark: tex`$P = ${fmtA(r.P8)}\ ${u('MW')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the expected wind speed, $E(V)$.',
      response: { kind: 'numeric', answer: 'EV', symbol: 'E(V)', unit: 'm s-1', positive: true },
      solution: ({ p, r }) => {
        const probs = PROBS[p.wind as string];
        return [{ math: tex`E(V) = \sum vP(V = v) = ${SPEEDS.map((v, i) => `${v} \times ${probs[i]}`).join(' + ')} = ${fmtA(r.EV)}\ ${u('m s-1')}` }];
      },
      markscheme: ({ r }) => [{ mark: '$\\sum vP(V = v)$' }, { mark: tex`$E(V) = ${fmtA(r.EV)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Find the power output, in MW, at a wind speed equal to $E(V)$.',
      response: { kind: 'numeric', answer: 'PEV', symbol: 'P', unit: 'MW', positive: true },
      solution: ({ r }) => [{ text: 'Power is proportional to $v^3$, so scale the answer to (a):', math: tex`P = ${fmtW(r.P8)} \times \left(\frac{${fmtW(r.EV)}}{8}\right)^3 = ${fmtA(r.PEV)}\ ${u('MW')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.PEV)}\ ${u('MW')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the expected power output, in MW, over a long time.',
      response: { kind: 'numeric', answer: 'EP', symbol: 'E(P)', unit: 'MW', positive: true },
      solution: ({ d, p, r }) => {
        const probs = PROBS[p.wind as string];
        const powers = SPEEDS.map((v) => power(v, p.r, Number(d.eff)));
        return [
          { text: `Find the power at each wind speed (MW): ${SPEEDS.map((v, i) => `${v} m s⁻¹: ${fmtW(powers[i])}`).join('; ')}. Then weight each by its probability.` },
          { math: tex`E(P) = \sum P(v)\,P(V = v) = ${powers.map((w, i) => `${fmtW(w)} \times ${probs[i]}`).join(' + ')} = ${fmtA(r.EP)}\ ${u('MW')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Power at each speed weighted by its probability' }, { mark: tex`$E(P) = ${fmtA(r.EP)}\ ${u('MW')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why is the expected power output in (d) greater than the power at the expected wind speed in (c)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Power is proportional to $v^3$, so the windier times add much more power than the calmer times take away.', correct: true },
          { text: 'The turbine is more efficient at low wind speeds.' },
          { text: 'The expected wind speed was calculated incorrectly.' },
          { text: 'The density of the air is greater on windy days.' },
        ],
      },
      solution: () => [
        {
          text: 'Doubling the wind speed multiplies the power by 8. Averaging the speeds first hides how much the fast winds contribute, so $E(P) > P(E(V))$. Wind farms are therefore sited where strong winds are common, not just where the average speed is moderate.',
        },
      ],
      markscheme: () => [{ note: 'P ∝ v³ (the function is not linear).' }],
    },
  ],
});
