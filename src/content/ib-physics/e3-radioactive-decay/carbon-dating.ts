import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Half-life of carbon-14, years, and seconds in a year. */
const T = 5730;
const YEAR = 3.16e7;

export default defineQuestion({
  id: 'ibp-e3-carbon-dating',
  version: 1,
  title: 'Radiocarbon dating',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    ratio: { min: 0.2, max: 0.9, step: 0.05, base: 0.4, dp: 2 },
    Aliv: { min: 0.2, max: 0.3, step: 0.01, base: 0.25, dp: 2 },
  },

  compute: (p, c) => {
    const lam = Math.LN2 / T; // y⁻¹
    // λ multiplies a long time, so students keep 3 s.f. of it.
    const lamc = c.carry(lam, 'lam', 3);
    const age = Math.log(1 / p.ratio) / lamc;
    const lamS = lamc / YEAR;
    const N = p.Aliv / lamS;
    return { lam, age, lamS, N };
  },

  stem: ({ d }) =>
    `Living things take in carbon-14 while they are alive; when they die, it decays with a half-life of ${Q(T, 'years')}. One gram of carbon from a living tree has an activity of ${Q(d.Aliv, 'Bq')} from carbon-14. One gram of carbon from an ancient wooden tool has ${d.ratio} of this activity. Take one year as $3.16 \\times 10^{7}$ s.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the decay constant of carbon-14, in years⁻¹.',
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'years-1', positive: true },
      solution: ({ r }) => [{ math: tex`\lambda = \frac{\ln 2}{T_{1/2}} = \frac{\ln 2}{${T}} = ${fmtA(r.lam)}\ \mathrm{years^{-1}}` }],
      markscheme: ({ r }) => [{ mark: tex`$\lambda = ${fmtA(r.lam)}\ \mathrm{years^{-1}}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the age of the tool.',
      response: { kind: 'numeric', answer: 'age', symbol: 't', unit: 'years', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The activity per gram falls as $A = A_0e^{-\\lambda t}$, so $t = \\dfrac{1}{\\lambda}\\ln\\dfrac{A_0}{A}$.',
          math: tex`t = \frac{\ln(1/${d.ratio})}{${fmtW(r.lam)}} = ${fmtA(r.age)}\ \mathrm{years}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $A = A_0e^{-\\lambda t}$' }, { mark: tex`$t = ${fmtA(r.age)}$ years` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the number of carbon-14 nuclei in one gram of carbon from the living tree.',
      response: { kind: 'numeric', answer: 'N', symbol: 'N', positive: true },
      solution: ({ d, r }) => [
        { math: tex`\lambda = \frac{${fmtW(r.lam)}}{3.16 \times 10^{7}} = ${fmtW(r.lamS)}\ ${u('s-1')}` },
        { math: tex`N = \frac{A}{\lambda} = \frac{${d.Aliv}}{${fmtW(r.lamS)}} = ${fmtA(r.N)}` },
      ],
      markscheme: ({ r }) => [{ mark: '$A = \\lambda N$ with $\\lambda$ in s⁻¹' }, { mark: tex`$N = ${fmtA(r.N)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why is radiocarbon dating not used for objects older than about 50 000 years?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The remaining activity is too small to measure reliably above the background.', correct: true },
          { text: 'Carbon-14 did not exist more than 50 000 years ago.' },
          { text: 'The half-life of carbon-14 changes over long times.' },
          { text: 'After that long, all the carbon-14 has decayed exactly.' },
        ],
      },
      solution: () => [
        {
          text: 'After about nine half-lives less than 0.2 % of the carbon-14 remains. The count rate is then tiny compared with the background, and random fluctuations make the measured age very uncertain. Decay never quite reaches zero, but it becomes unmeasurable.',
        },
      ],
      markscheme: () => [{ note: 'Activity too low compared with background.' }],
    },
  ],
});
