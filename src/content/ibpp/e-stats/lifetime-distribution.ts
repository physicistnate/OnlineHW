import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/**
 * Nuclides with their half-lives, in the unit used for every time in the question:
 * its symbol in working (min, h, d), in words, and for the decay constant.
 */
const NUCLIDES: Record<string, { name: string; T: number; shown: string; unit: 'min' | 'h' | 'd'; words: string; per: string }> = {
  F18: { name: 'Fluorine-18', T: 110, shown: '110', unit: 'min', words: 'minutes', per: 'min⁻¹' },
  Tc99m: { name: 'Technetium-99m', T: 6, shown: '6.0', unit: 'h', words: 'hours', per: 'h⁻¹' },
  I131: { name: 'Iodine-131', T: 8, shown: '8.0', unit: 'd', words: 'days', per: 'day⁻¹' },
  Rn222: { name: 'Radon-222', T: 3.8, shown: '3.8', unit: 'd', words: 'days', per: 'day⁻¹' },
};

interface P {
  nuc: string;
  f1: number;
  f2: number;
  N0: number;
}

const nuclide = (p: P) => NUCLIDES[p.nuc];
/** The two times, rounded as shown. */
const times = (p: P) => {
  const { T } = nuclide(p);
  return { t1: Number((p.f1 * T).toFixed(1)), t2: Number(((p.f1 + p.f2) * T).toFixed(1)) };
};

export default defineQuestion({
  id: 'ibpp-e4-lifetime-distribution',
  version: 1,
  title: 'How long does a nucleus live? The exponential distribution',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.8'],
  // The density function is Topic 4; the mean lifetime also needs integration by parts (Topic 5).
  math: { topic: 'ibm.4', standards: ['ibm.4.14', 'ibm.5.16'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    nuc: { choices: Object.keys(NUCLIDES), base: 'Tc99m' },
    f1: { choices: [0.5, 1, 1.5], base: 0.5 },
    f2: { choices: [1, 2], base: 1 },
    N0: { choices: [2e12, 5e12, 8e12], base: 5e12, sci: 2 },
  },

  compute: (p, c) => {
    const { T } = nuclide(p);
    const { t1, t2 } = times(p);
    const lam = Math.LN2 / T;
    const lc = c.carry(lam, 'lam', 3);
    const pSurvive = Math.exp(-lc * t1);
    const S1 = c.carry(Math.exp(-lc * t1), undefined, 3);
    const S2 = c.carry(Math.exp(-lc * t2), undefined, 3);
    const dS = S1 - S2;
    const nDecay = p.N0 * dS;
    const mean = 1 / lc;
    return { lam, pSurvive, S1, S2, dS, nDecay, mean };
  },

  stem: ({ p, d }) => {
    const n = nuclide(p);
    return `${n.name} has a half-life of ${n.shown} ${n.words}. The time $T$ (in ${n.words}) that a nucleus of it exists before it decays is a continuous random variable with probability density function $$f(t) = \\lambda e^{-\\lambda t}, \\quad t \\ge 0$$ where $\\lambda$ is the decay constant. A sample contains $${d.N0}$ of these nuclei.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the decay constant $\\lambda$, in ${nuclide(p).per}.`,
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', positive: true },
      solution: ({ p, r }) => [{ math: tex`\lambda = \frac{\ln 2}{T_{1/2}} = \frac{\ln 2}{${nuclide(p).shown}} = ${fmtA(r.lam)}\ ${u(`${nuclide(p).unit}-1`)}` }],
      markscheme: ({ p, r }) => [{ mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u(`${nuclide(p).unit}-1`)}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Use the probability density function to find the probability that a particular nucleus has not decayed after ${times(p).t1} ${nuclide(p).words}.`,
      response: { kind: 'numeric', answer: 'pSurvive', symbol: 'P', positive: true },
      solution: ({ p, r }) => {
        const { t1 } = times(p);
        return [
          { math: tex`P(T > ${t1}) = \int_{${t1}}^{\infty} \lambda e^{-\lambda t}\,dt = \left[-e^{-\lambda t}\right]_{${t1}}^{\infty} = e^{-\lambda \times ${t1}}` },
          { math: tex`P(T > ${t1}) = e^{-${fmtW(r.lam)} \times ${t1}} = ${fmtA(r.pSurvive)}` },
          { text: 'This is the fraction $N/N_0$ of a large sample left after this time: the decay law $N = N_0e^{-\\lambda t}$.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Integral of the density from $t$ to $\\infty$' }, { mark: tex`$${fmtA(r.pSurvive)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => {
        const { t1, t2 } = times(p);
        return `Find the expected number of nuclei in the sample that decay between ${t1} and ${t2} ${nuclide(p).words} after the start.`;
      },
      response: { kind: 'numeric', answer: 'nDecay', symbol: 'N', positive: true },
      solution: ({ p, d, r }) => {
        const { t1, t2 } = times(p);
        return [
          { text: 'The probability that a nucleus decays in this interval is the area under the density between the two times:', math: tex`P(${t1} < T < ${t2}) = e^{-\lambda \times ${t1}} - e^{-\lambda \times ${t2}} = ${fmtW(r.S1)} - ${fmtW(r.S2)} = ${fmtW(r.dS)}` },
          { text: 'The expected number is $N_0$ times this probability:', math: tex`N = ${d.N0} \times ${fmtW(r.dS)} = ${fmtA(r.nDecay)}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$e^{-\\lambda t_1} - e^{-\\lambda t_2}$' }, { mark: tex`$${fmtA(r.nDecay)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ p }) => `Find the mean lifetime $E(T)$ of the nuclei, in ${nuclide(p).words}.`,
      response: { kind: 'numeric', answer: 'mean', symbol: 'E(T)', positive: true },
      solution: ({ p, r }) => [
        { text: 'Integrate by parts, with $u = t$ and $\\dfrac{dv}{dt} = \\lambda e^{-\\lambda t}$:', math: tex`E(T) = \int_0^{\infty} t\,\lambda e^{-\lambda t}\,dt = \left[-te^{-\lambda t}\right]_0^{\infty} + \int_0^{\infty} e^{-\lambda t}\,dt = 0 + \frac{1}{\lambda}` },
        { math: tex`E(T) = \frac{1}{${fmtW(r.lam)}} = ${fmtA(r.mean)}\ ${u(nuclide(p).unit)}` },
      ],
      markscheme: ({ p, r }) => [{ mark: 'Integration by parts, giving $1/\\lambda$' }, { mark: tex`$E(T) = ${fmtA(r.mean)}\ ${u(nuclide(p).unit)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which statement about the median lifetime is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The median is the half-life, which is less than the mean: a few nuclei live much longer than the rest and pull the mean up.', correct: true },
          { text: 'The median is equal to the mean, because the density is symmetric.' },
          { text: 'The median is the half-life, which is greater than the mean.' },
          { text: 'The median is twice the half-life.' },
        ],
      },
      solution: () => [
        {
          text: 'The median $m$ satisfies $P(T > m) = e^{-\\lambda m} = \\tfrac{1}{2}$, so $m = \\dfrac{\\ln 2}{\\lambda}$: the half-life. The mean is $\\dfrac{1}{\\lambda} \\approx 1.44$ half-lives. The density has a long tail to the right, so the mean is greater than the median.',
        },
      ],
      markscheme: () => [{ note: 'Median = ln 2/λ = half-life < mean 1/λ (skewed distribution).' }],
    },
  ],
});
