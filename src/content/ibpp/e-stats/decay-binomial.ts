import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex } from '../../../engine/units';
import { choose } from '../helpers';

export default defineQuestion({
  id: 'ibpp-e4-decay-binomial',
  version: 1,
  title: 'A handful of nuclei: radioactive decay and the binomial distribution',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.3', 'ibp.E.3.6'],
  math: { topic: 'ibm.4', standards: ['ibm.4.8', 'ibm.4.7'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    n: { choices: [8, 10, 12, 14, 16], base: 10 },
    T: { choices: [2, 2.5, 4, 5], base: 4, dp: 1 },
    k: { choices: [2, 3], base: 2 },
  },

  compute: (p, c) => {
    const pd = 1 - 0.5 ** p.k;
    const pdc = c.carry(pd, 'pd');
    // A probability outside 0 to 1 from (a) earns no follow-through; any other wrong value does.
    c.assume(pdc >= 0 && pdc <= 1);
    const Eleft = p.n * (1 - pdc);
    const ways = choose(p.n, p.n / 2);
    const pHalf = ways / 2 ** p.n;
    const P0 = c.carry(pdc ** p.n, undefined, 3);
    const P1 = c.carry(p.n * (1 - pdc) * pdc ** (p.n - 1), undefined, 3);
    const pAtMost1 = P0 + P1;
    return { pd, Eleft, ways, pHalf, P0, P1, pAtMost1 };
  },

  stem: ({ d, p }) =>
    `A tiny sample contains only ${p.n} nuclei of a radioactive nuclide whose half-life is ${Q(d.T, 'min')}. Each nucleus decays independently of the others.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Find the probability that a particular nucleus has decayed ${Q((p.k * p.T).toFixed(1), 'min')} after the start.`,
      response: { kind: 'numeric', answer: 'pd', symbol: 'P', positive: true },
      solution: ({ p, d, r }) => [
        { text: `${(p.k * p.T).toFixed(1)} min is ${p.k} half-lives. In each half-life a nucleus that has not yet decayed has a probability of $\\tfrac{1}{2}$ of decaying, so the probability that it has not decayed is $\\left(\\tfrac{1}{2}\\right)^{${p.k}}$.`, math: tex`P(\text{decayed}) = 1 - \left(\tfrac{1}{2}\right)^{${p.k}} = ${fmtA(r.pd)}` },
        { text: `(The half-life ${d.T} min is the time in which each nucleus has a probability of one half of decaying.)` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$1 - \left(\tfrac{1}{2}\right)^k = ${fmtA(r.pd)}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the expected number of nuclei that have not decayed at that time.',
      response: { kind: 'numeric', answer: 'Eleft', symbol: 'E(N)', positive: true },
      solution: ({ p, r }) => [
        { text: 'The number of undecayed nuclei is binomial, $B(n, p)$ with $p$ the probability of not decaying, and its mean is $np$:', math: tex`E(N) = ${p.n} \times (1 - ${fmtW(r.pd)}) = ${fmtA(r.Eleft)}` },
        { text: 'This is the same as the decay law $N = N_0\\left(\\tfrac{1}{2}\\right)^k$: for a large sample, the number left is very close to this expected value.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Eleft)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Find the probability that exactly half of the nuclei have decayed after one half-life (${Q(d.T, 'min')}).`,
      response: { kind: 'numeric', answer: 'pHalf', symbol: 'P', positive: true },
      solution: ({ p, r }) => [
        { text: `After one half-life the number $X$ that have decayed is $B(${p.n}, 0.5)$:`, math: tex`P(X = ${p.n / 2}) = \binom{${p.n}}{${p.n / 2}}\left(\tfrac{1}{2}\right)^{${p.n / 2}}\left(\tfrac{1}{2}\right)^{${p.n / 2}} = \frac{${r.ways}}{${2 ** p.n}} = ${fmtA(r.pHalf)}` },
        { text: 'So even after exactly one half-life, it is more likely than not that the number decayed is not exactly half.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Binomial with $p = 0.5$' }, { mark: tex`$${fmtA(r.pHalf)}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ p }) => `Find the probability that at most one nucleus has not decayed ${Q((p.k * p.T).toFixed(1), 'min')} after the start.`,
      response: { kind: 'numeric', answer: 'pAtMost1', symbol: 'P', positive: true },
      solution: ({ p, r }) => [
        { text: `Let $Y$ be the number not decayed. Each nucleus has decayed with probability ${fmtW(r.pd)}, so $Y \\sim B(${p.n}, ${fmtW(1 - r.pd)})$:` },
        { math: tex`P(Y = 0) = ${fmtW(r.pd)}^{${p.n}} = ${fmtW(r.P0)} \quad\text{and}\quad P(Y = 1) = ${p.n} \times ${fmtW(1 - r.pd)} \times ${fmtW(r.pd)}^{${p.n - 1}} = ${fmtW(r.P1)}` },
        { math: tex`P(Y \le 1) = ${fmtW(r.P0)} + ${fmtW(r.P1)} = ${fmtA(r.pAtMost1)}` },
      ],
      markscheme: ({ r }) => [{ mark: '$P(Y = 0) + P(Y = 1)$, or the binomial cumulative distribution on a GDC' }, { mark: tex`$${fmtA(r.pAtMost1)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'For a sample of 10²⁰ nuclei, the fraction that has decayed after one half-life is almost exactly one half. For this tiny sample it often is not. Why?',
      response: {
        kind: 'mcq',
        options: () => [
          {
            text: 'Decay is random. The number decayed is binomial, with standard deviation $\\sqrt{np(1-p)}$. As a fraction of the mean $np$ this is large when $n$ is small, but tiny when $n$ is very large.',
            correct: true,
          },
          { text: 'In a small sample there are fewer nuclei to trigger the decay of the others, so it decays more slowly.' },
          { text: 'The half-life of a nuclide depends on the number of nuclei in the sample.' },
          { text: 'The decay law $N = N_0\\left(\\tfrac{1}{2}\\right)^k$ only applies to small samples.' },
        ],
      },
      solution: () => [
        {
          text: 'The relative spread $\\dfrac{\\sqrt{np(1-p)}}{np}$ falls as $\\dfrac{1}{\\sqrt{n}}$. For 10 nuclei it is about 30%; for 10²⁰ nuclei it is about 10⁻¹⁰, so the decay law describes large samples almost exactly.',
        },
      ],
      markscheme: () => [{ note: 'Random decay; the relative spread of the binomial falls as 1/√n.' }],
    },
  ],
});
