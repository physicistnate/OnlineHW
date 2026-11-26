import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { mean, median, sdPopulation } from '../helpers';

/** Twelve readings (μT) of the Earth's magnetic field; `bad` is the student whose phone lay on a steel radiator. */
const SETS: Record<string, { b: number[]; bad: number }> = {
  s1: { b: [53.9, 52.1, 52.3, 52.0, 50.9, 51.6, 76.6, 53.4, 52.0, 50.8, 52.8, 50.6], bad: 7 },
  s2: { b: [47.8, 45.4, 49.9, 48.8, 77.4, 48.2, 51.4, 49.2, 46.3, 46.7, 47.7, 46.9], bad: 5 },
  s3: { b: [50.8, 50.8, 54.9, 49.7, 73.9, 51.6, 48.9, 53.6, 51.8, 50.9, 50.5, 51.3], bad: 5 },
  s4: { b: [51.4, 47.1, 51.8, 48.0, 50.0, 50.7, 51.4, 51.0, 51.9, 48.8, 70.3, 51.2], bad: 11 },
  s5: { b: [49.4, 48.3, 50.1, 46.1, 49.6, 45.8, 47.8, 52.3, 50.2, 69.7, 48.7, 52.4], bad: 10 },
  s6: { b: [47.9, 47.8, 49.9, 47.5, 50.0, 69.3, 46.6, 49.0, 48.9, 48.8, 50.2, 48.9], bad: 6 },
  s7: { b: [47.6, 49.7, 48.9, 49.2, 72.7, 51.2, 52.2, 52.1, 50.3, 51.9, 51.9, 51.2], bad: 5 },
  s8: { b: [46.9, 48.9, 50.0, 47.6, 48.5, 46.6, 49.8, 47.2, 45.7, 75.3, 49.5, 47.3], bad: 10 },
  s9: { b: [49.5, 50.3, 51.2, 50.5, 51.0, 48.6, 49.4, 50.9, 52.2, 51.0, 72.2, 49.9], bad: 11 },
  s10: { b: [49.2, 48.4, 50.3, 47.9, 48.4, 48.6, 49.8, 49.4, 68.5, 46.6, 47.2, 48.7], bad: 9 },
  s11: { b: [51.9, 52.0, 52.1, 48.8, 49.3, 51.0, 51.2, 52.5, 49.5, 50.9, 70.0, 49.9], bad: 11 },
  s12: { b: [47.9, 47.3, 47.4, 48.3, 46.5, 48.0, 49.5, 48.0, 69.2, 46.8, 49.4, 48.8], bad: 9 },
};

/** The readings as a table of six rows, students 1–6 on the left and 7–12 on the right. */
function readingsTable(b: number[]): string {
  const rows = Array.from({ length: 6 }, (_, i) => `${i + 1} & ${b[i].toFixed(1)} & ${i + 7} & ${b[i + 6].toFixed(1)}`).join(' \\\\ ');
  const head = '\\text{Student} & B\\ /\\ \\mu\\mathrm{T}';
  return `$$\\begin{array}{c|c|c|c} ${head} & ${head} \\\\ \\hline ${rows} \\end{array}$$`;
}

export default defineQuestion({
  id: 'ibpp-d4-phone-magnetometer',
  version: 1,
  title: 'Measuring the Earth’s magnetic field with phones: averages, spread and a faulty reading',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.4'],
  uses: ['ibp.D.2.6'],
  math: { topic: 'ibm.4', standards: ['ibm.4.3', 'ibm.4.1'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    set: { choices: Object.keys(SETS), base: 's1' },
    I: { choices: [200, 400, 500], base: 400 },
    L: { choices: [40, 50, 100], base: 50 },
    th: { choices: [30, 60, 90], base: 60 },
  },

  compute: (p, c) => {
    const { b, bad } = SETS[p.set];
    const all = mean(b);
    const med = median(b);
    const good = b.filter((_, i) => i !== bad - 1);
    const mGood = mean(good);
    const sGood = sdPopulation(good);
    const F = c.carry(mGood, 'mGood', 3) * 1e-6 * p.I * p.L * sinD(p.th);
    return { all, med, mGood, sGood, F };
  },

  stem: ({ p }) =>
    `Twelve students measure the strength $B$ of the Earth’s magnetic field with the magnetometers in their phones, all in the same room.\n${readingsTable(SETS[p.set].b)}`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the mean of the twelve readings.',
      response: { kind: 'numeric', answer: 'all', symbol: '\\bar{B}', unit: 'μT', positive: true },
      solution: ({ r }) => [{ text: `Adding the readings and dividing by 12: $\\bar{B} = ${fmtA(r.all)}\\ \\mu\\mathrm{T}$.` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.all)}\ \mu\mathrm{T}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the median of the twelve readings.',
      response: { kind: 'numeric', answer: 'med', symbol: '\\text{median}', unit: 'μT', positive: true },
      solution: ({ p, r }) => {
        const s = [...SETS[p.set].b].sort((a, b) => a - b);
        return [{ text: `In order, the 6th and 7th readings are ${s[5].toFixed(1)} and ${s[6].toFixed(1)} μT, so the median is their mean: $${fmtA(r.med)}\\ \\mu\\mathrm{T}$.` }];
      },
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.med)}\ \mu\mathrm{T}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ p }) => `Student ${SETS[p.set].bad} had left their phone on a steel radiator. Which of these is least affected by that reading?`,
      response: {
        kind: 'mcq',
        options: () => [{ text: 'The median', correct: true }, { text: 'The mean' }, { text: 'The standard deviation' }, { text: 'The range' }],
      },
      solution: () => [{ text: 'The median depends only on the order of the readings in the middle, so one very large value hardly moves it. The mean, the standard deviation and the range all use the size of that value.' }],
      markscheme: () => [{ note: 'The median.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Leave out the faulty reading. Find the mean of the other eleven readings.',
      response: { kind: 'numeric', answer: 'mGood', symbol: '\\bar{B}', unit: 'μT', positive: true },
      solution: ({ r }) => [{ text: `$\\bar{B} = ${fmtA(r.mGood)}\\ \\mu\\mathrm{T}$, a little less than the mean of all twelve.` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.mGood)}\ \mu\mathrm{T}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Find the standard deviation of these eleven readings, treating them as the whole data set.',
      response: { kind: 'numeric', answer: 'sGood', symbol: '\\sigma', unit: 'μT', positive: true },
      solution: ({ r }) => [{ text: `From the calculator’s one-variable statistics: $\\sigma = ${fmtA(r.sGood)}\\ \\mu\\mathrm{T}$. The faulty reading is more than ten standard deviations from this mean.` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.sGood)}\ \mu\mathrm{T}$` }],
    },
    {
      label: '(f)',
      marks: 2,
      prompt: ({ d }) => `An overhead power cable ${Q(d.L, 'm')} long carries a current of ${Q(d.I, 'A')} at ${d.th}° to the Earth’s field. Use your mean from (d) to calculate the magnetic force on the cable.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [{ math: tex`F = BIL\sin\theta = ${fmtW(r.mGood)} \times 10^{-6} \times ${d.I} \times ${d.L} \times \sin ${d.th}^{\circ} = ${fmtA(r.F)}\ ${u('N')}` }],
      markscheme: ({ r }) => [{ mark: '$F = BIL\\sin\\theta$ with $B$ in tesla' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (d).' }],
    },
  ],
});
