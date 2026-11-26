import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex } from '../../../engine/units';
import { dataTable, mean, sdPopulation } from '../helpers';

/** Charges on eight oil drops, in units of 10⁻¹⁹ C, each measured to within about 3 %. */
const SETS: Record<string, number[]> = {
  s1: [6.46, 6.46, 1.58, 7.97, 9.47, 1.63, 4.82, 4.94],
  s2: [6.44, 6.31, 9.77, 4.69, 4.94, 3.3, 6.31, 1.59],
  s3: [1.57, 6.3, 4.84, 1.63, 3.27, 6.39, 4.88, 3.19],
  s4: [8.01, 6.44, 6.45, 1.61, 6.42, 9.64, 7.97, 1.63],
  s5: [4.72, 8.07, 8.21, 9.55, 7.78, 3.14, 3.18, 4.89],
  s6: [8.14, 9.89, 6.56, 4.92, 9.35, 1.61, 1.59, 6.52],
  s7: [9.8, 3.12, 6.46, 3.27, 1.6, 1.65, 3.11, 4.68],
  s8: [4.68, 3.29, 9.47, 9.48, 7.78, 3.18, 8.02, 3.21],
  s9: [1.56, 8.08, 6.4, 4.69, 4.93, 9.37, 1.61, 4.92],
  s10: [9.69, 8.1, 1.62, 1.64, 4.82, 7.97, 1.62, 6.31],
  s11: [3.17, 6.36, 4.8, 7.86, 3.21, 8.2, 9.67, 3.22],
  s12: [4.91, 4.89, 3.17, 3.29, 8.09, 4.91, 6.3, 6.35],
};

const DROPS = 'ABCDEFGH';

/** Each drop's number of excess electrons, using 1.60 × 10⁻¹⁹ C as a first estimate of e. */
const electrons = (qs: number[]) => qs.map((q) => Math.round(q / 1.6));

export default defineQuestion({
  id: 'ibpp-d4-millikan-statistics',
  version: 1,
  title: 'Is charge quantized? The statistics of Millikan’s oil drops',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.1'],
  math: { topic: 'ibm.4', standards: ['ibm.4.3', 'ibm.4.1'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    set: { choices: Object.keys(SETS), base: 's1' },
  },

  compute: (p) => {
    const qs = SETS[p.set];
    const n = electrons(qs);
    const est = qs.map((q, i) => q / n[i]);
    const iMax = qs.indexOf(Math.max(...qs));
    const qMax = qs[iMax];
    const nMax = n[iMax];
    const m = mean(est) * 1e-19;
    const sd = sdPopulation(est) * 1e-19;
    const sumQ = qs.reduce((s, q) => s + q, 0);
    const sumN = n.reduce((s, k) => s + k, 0);
    const total = (sumQ / sumN) * 1e-19;
    return { qMax, nMax, m, sd, sumQ, sumN, total };
  },

  stem: ({ p }) =>
    `In a version of Millikan’s oil-drop experiment, a student measures the charges $q$ on eight oil drops. Each drop carries a whole number $n$ of excess electrons.\n${dataTable(
      ['\\text{Drop}', 'q\\ /\\ 10^{-19}\\ \\mathrm{C}'],
      SETS[p.set].map((q, i) => [DROPS[i], q.toFixed(2)]),
    )}`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Taking $e \\approx 1.60 \\times 10^{-19}$ C as a first estimate, find the number of excess electrons on drop ${DROPS[SETS[p.set].indexOf(Math.max(...SETS[p.set]))]}, the drop with the largest charge.`,
      response: { kind: 'numeric', answer: 'nMax', symbol: 'n', positive: true },
      solution: ({ r }) => [{ math: tex`\frac{${r.qMax.toFixed(2)}}{1.60} = ${fmtW(r.qMax / 1.6)} \approx ${r.nMax}` }, { text: 'The number of electrons must be a whole number.' }],
      markscheme: ({ r }) => [{ mark: tex`$n = ${r.nMax}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'For each drop, divide its charge by its number of excess electrons to give an estimate of $e$. Find the mean of the eight estimates. (Use your calculator’s lists and keep full precision.)',
      response: { kind: 'numeric', answer: 'm', symbol: '\\bar{e}', unit: 'C', positive: true },
      solution: ({ p, r }) => {
        const qs = SETS[p.set];
        const n = electrons(qs);
        const rows = qs.map((q, i) => `${DROPS[i]} & ${q.toFixed(2)} & ${n[i]} & ${fmtW(q / n[i])}`).join(' \\\\ ');
        return [
          { text: 'The numbers of electrons, and the estimates $q/n$ in units of $10^{-19}$ C:', math: `\\begin{array}{c|c|c|c} \\text{Drop} & q & n & q/n \\\\ \\hline ${rows} \\end{array}` },
          { math: tex`\bar{e} = \frac{1}{8}\sum \frac{q}{n} = ${fmtA(r.m)}\ \mathrm{C}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Whole numbers $n$ for every drop' }, { mark: tex`$\bar{e} = ${fmtA(r.m)}\ \mathrm{C}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Find the standard deviation of the eight estimates, treating them as the whole data set.',
      response: { kind: 'numeric', answer: 'sd', symbol: '\\sigma', unit: 'C', positive: true },
      solution: ({ r }) => [{ text: `From the calculator’s one-variable statistics of the list of estimates: $\\sigma = ${fmtA(r.sd)}$ C. The estimates spread by only about ${Math.round((r.sd / r.m) * 1000) / 10}% either side of the mean.` }],
      markscheme: ({ r }) => [{ mark: tex`$\sigma = ${fmtA(r.sd)}\ \mathrm{C}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Another estimate of $e$ is the total charge on all the drops divided by the total number of excess electrons. Find this estimate.',
      response: { kind: 'numeric', answer: 'total', symbol: 'e', unit: 'C', positive: true },
      solution: ({ r }) => [
        { math: tex`e = \frac{\sum q}{\sum n} = \frac{${r.sumQ.toFixed(2)} \times 10^{-19}}{${r.sumN}} = ${fmtA(r.total)}\ \mathrm{C}` },
        { text: 'This gives more weight to the drops with more electrons, whose estimates $q/n$ share the error in $q$ among more electrons.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.total)}\ \mathrm{C}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'A classmate suggests that the real quantum of charge is $0.80 \\times 10^{-19}$ C, half the student’s value, since every charge is also a whole number of these. Which is the best evidence against the suggestion?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'With a quantum of $0.80 \\times 10^{-19}$ C, some drops would be expected to carry an odd number of quanta, but every charge is close to an even number of them.', correct: true },
          { text: 'The mean in (b) is close to $1.60 \\times 10^{-19}$ C, so the quantum must be $1.60 \\times 10^{-19}$ C.' },
          { text: 'The standard deviation in (c) is small, so the quantum must be $1.60 \\times 10^{-19}$ C.' },
          { text: 'A charge as small as $0.80 \\times 10^{-19}$ C would be too small to measure.' },
        ],
      },
      solution: () => [
        { text: 'Any set of charges that are whole numbers of $e$ are also whole numbers of $e/2$, so the mean and the spread cannot decide. What decides is that no drop ever shows an odd multiple of $e/2$: if the quantum really were $e/2$, about half of the drops would. Millikan measured many drops and never found one.' },
      ],
      markscheme: () => [{ note: 'No odd multiples of 0.80 × 10⁻¹⁹ C among the charges.' }],
    },
  ],
});
