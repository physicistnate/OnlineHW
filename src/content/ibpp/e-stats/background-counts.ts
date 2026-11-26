import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex } from '../../../engine/units';
import { mean, normalCdf, sdPopulation } from '../helpers';

/** Background counts in ten one-minute intervals, as differences from the level L. */
const SETS: Record<string, number[]> = {
  s1: [0, -5, 3, -2, 1, 6, -3, 2, -1, 4],
  s2: [-4, 2, 5, -1, 0, -3, 3, 6, -2, 1],
  s3: [3, -2, 0, 4, -5, 1, 2, -3, 5, -1],
  s4: [1, 4, -3, 0, 2, -4, 5, -2, 3, -1],
  s5: [-2, 0, 6, -4, 3, 1, -1, 2, -3, 4],
  s6: [2, -3, 1, 5, -2, 0, 4, -5, 3, -1],
};

interface P {
  set: string;
  L: number;
  R: number;
  T: number;
  k: number;
}

const counts = (p: P) => SETS[p.set].map((x) => x + p.L);

/** How many standard deviations above the mean background the expected reading is. */
const zFor = (p: P) => (p.R - mean(counts(p))) / 2 ** p.k / sdPopulation(counts(p));

export default defineQuestion({
  id: 'ibpp-e4-background-counts',
  version: 1,
  title: 'Is the source still there? Background counts and the normal distribution',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.6', 'ibp.E.3.3'],
  math: { topic: 'ibm.4', standards: ['ibm.4.3', 'ibm.4.9', 'ibm.4.12'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    set: { choices: Object.keys(SETS), base: 's1' },
    L: { choices: [18, 22, 25], base: 22 },
    R: { choices: [60, 80, 100], base: 80 },
    T: { choices: [2.5, 4, 6], base: 4, dp: 1 },
    k: { choices: [2, 3, 4], base: 3 },
  },
  // The expected reading is between 0.5 and 3 standard deviations above the mean background.
  constraint: (p) => zFor(p) >= 0.5 && zFor(p) <= 3,

  compute: (p, c) => {
    const xs = counts(p);
    const m = mean(xs);
    const sd = sdPopulation(xs);
    const mc = c.carry(m, 'mean');
    const src0 = p.R - mc;
    const src = src0 / 2 ** p.k;
    const z = c.carry(src, 'src', 3) / c.carry(sd, 'sd', 3);
    const pBg = 1 - normalCdf(z, 0, 1);
    return { mean: m, sd, src0, src, z, pBg };
  },

  stem: ({ p }) =>
    `A student measures the background count in ten separate one-minute intervals, with no source near the detector:\n$$${counts(p).join(',\\ ')}$$\nA radioactive source with a half-life of ${Q((p.T as number).toFixed(1), 'h')} is then placed near the detector. In the first minute after it is put in place, the count (including the background) is ${p.R}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the mean of the ten background counts.',
      response: { kind: 'numeric', answer: 'mean', symbol: '\\bar{x}', positive: true },
      solution: ({ p, r }) => [{ math: tex`\bar{x} = \frac{${counts(p).reduce((s, x) => s + x, 0)}}{10} = ${fmtA(r.mean)}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.mean)}$ counts` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the standard deviation $\\sigma$ of the ten background counts (treat them as the whole population, $\\sigma_x$ on a GDC).',
      response: { kind: 'numeric', answer: 'sd', symbol: '\\sigma', positive: true },
      solution: ({ r }) => [
        { text: 'Using the GDC’s one-variable statistics (or $\\sigma = \\sqrt{\\dfrac{\\sum(x - \\bar{x})^2}{n}}$):', math: tex`\sigma = ${fmtA(r.sd)}` },
        { text: 'The counts vary even though nothing changes, because radioactive decay is random.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\sigma = ${fmtA(r.sd)}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `Estimate the count in one minute due to the source alone, ${Q((p.k * p.T).toFixed(1), 'h')} after the source was put in place.`,
      response: { kind: 'numeric', answer: 'src', symbol: '\\text{count}', positive: true },
      solution: ({ p, r }) => [
        { text: 'Subtract the mean background from the first reading:', math: tex`${p.R} - ${fmtW(r.mean)} = ${fmtW(r.src0)}` },
        { text: `${(p.k * p.T).toFixed(1)} h is ${p.k} half-lives, so the count due to the source is halved ${p.k} times:`, math: tex`\frac{${fmtW(r.src0)}}{2^{${p.k}}} = ${fmtA(r.src)}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Background subtracted before halving' }, { mark: tex`$${fmtA(r.src)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () =>
        'One-minute background counts are modelled by a normal distribution with the mean and standard deviation from (a) and (b). At the time in (c), the expected one-minute count with the source in place is the mean background plus your answer to (c). Find the probability that a one-minute count of the background alone is greater than this.',
      response: { kind: 'numeric', answer: 'pBg', symbol: 'P', positive: true },
      solution: ({ r }) => [
        { text: `The expected count is ${fmtW(r.mean)} + ${fmtW(r.src)}. It is above the mean background by the answer to (c):`, math: tex`z = \frac{${fmtW(r.src)}}{${fmtW(r.sd)}} = ${fmtW(r.z)}` },
        { math: tex`P(X > \bar{x} + ${fmtW(r.src)}) = P(Z > ${fmtW(r.z)}) = ${fmtA(r.pBg)}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Normal distribution with the mean and standard deviation of the background' }, { mark: tex`$${fmtA(r.pBg)}$` }, { note: 'Allow ECF from (b) and (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which statement about the probability found in (d) is correct?',
      response: {
        kind: 'mcq',
        options: ({ r }) => [
          { text: `If the source had no activity at all, about ${fmtA(100 * r.pBg)}% of one-minute counts would still be this high, from background radiation alone.`, correct: true },
          { text: `There is a probability of about ${fmtA(r.pBg)} that every nucleus in the source has decayed.` },
          { text: `About ${fmtA(100 * r.pBg)}% of the radioactive nuclei in the source have not yet decayed.` },
          { text: `The background count rate has fallen by about ${fmtA(100 * r.pBg)}% since the start.` },
        ],
      },
      solution: () => [
        {
          text: 'The probability describes the background alone: how often random background counts reach the level expected with the source. The smaller it is, the more confidently a count at that level shows that the source is still active. Counting for longer helps, because the expected count from the source grows in proportion to the counting time but the spread of the background grows more slowly.',
        },
      ],
      markscheme: () => [{ note: 'Probability that background alone gives such a count.' }],
    },
  ],
});
