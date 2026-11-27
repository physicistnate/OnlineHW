import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Half-life of technetium-99m, hours. */
const T = 6.0;

export default defineQuestion({
  id: 'ibp-e3-decay-constant',
  version: 1,
  title: 'A medical tracer: the decay constant and the decay law',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 2,

  params: {
    A0: { min: 200, max: 800, step: 50, base: 400 },
    t: { min: 2, max: 24, step: 1, base: 10 },
    pct: { choices: [1, 2, 5, 10, 20], base: 5 },
  },

  compute: (p, c) => {
    const lam = Math.LN2 / T; // h⁻¹
    // λ is used in an exponent next, so students keep 3 s.f. of it.
    const lamc = c.carry(lam, 'lam', 3);
    const A = p.A0 * Math.exp(-lamc * p.t);
    const lamS = lamc / 3600;
    const N0 = (p.A0 * 1e6) / lamS;
    const tp = Math.log(100 / (p.pct as number)) / lamc;
    return { lam, A, lamS, N0, tp };
  },

  stem: ({ d }) =>
    `Technetium-99m is used as a tracer in medical imaging. Its half-life is ${Q(T.toFixed(1), 'h')}. A patient is injected with a sample whose activity is ${Q(d.A0, 'MBq')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the decay constant of technetium-99m, in h⁻¹.',
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'h-1', positive: true },
      solution: ({ r }) => [{ math: tex`\lambda = \frac{\ln 2}{T_{1/2}} = \frac{\ln 2}{${T.toFixed(1)}} = ${fmtA(r.lam)}\ ${u('h-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('h-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Calculate the activity of the sample ${Q(d.t, 'h')} after the injection.`,
      response: { kind: 'numeric', answer: 'A', symbol: 'A', unit: 'MBq', positive: true },
      solution: ({ d, r }) => [{ math: tex`A = A_0e^{-\lambda t} = ${d.A0} \times e^{-${fmtW(r.lam)} \times ${d.t}} = ${fmtA(r.A)}\ ${u('MBq')}` }],
      markscheme: ({ r }) => [{ mark: 'Use of $A = A_0e^{-\\lambda t}$' }, { mark: tex`$A = ${fmtA(r.A)}\ ${u('MBq')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the number of technetium-99m nuclei in the sample when it is injected.',
      response: { kind: 'numeric', answer: 'N0', symbol: 'N_0', positive: true },
      solution: ({ d, r }) => [
        { text: 'Activity is the number of decays per second, $A = \\lambda N$, with $\\lambda$ in s⁻¹ and $A$ in Bq.', math: tex`\lambda = \frac{${fmtW(r.lam)}}{3600} = ${fmtW(r.lamS)}\ ${u('s-1')}` },
        { math: tex`N_0 = \frac{A_0}{\lambda} = \frac{${d.A0} \times 10^{6}}{${fmtW(r.lamS)}} = ${fmtA(r.N0)}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\lambda$ in s⁻¹ and $A$ in Bq in $A = \\lambda N$' }, { mark: tex`$N_0 = ${fmtA(r.N0)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `Calculate how long it takes for the activity to fall to ${d.pct}% of its initial value.`,
      response: { kind: 'numeric', answer: 'tp', symbol: 't', unit: 'h', positive: true },
      solution: ({ d, r }) => [
        {
          text: `$\\dfrac{A}{A_0} = e^{-\\lambda t} = ${Number(d.pct) / 100}$, so $t = \\dfrac{\\ln(1/${Number(d.pct) / 100})}{\\lambda}$.`,
          math: tex`t = \frac{\ln ${100 / Number(d.pct)}}{${fmtW(r.lam)}} = ${fmtA(r.tp)}\ ${u('h')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Taking logarithms of the decay law' }, { mark: tex`$t = ${fmtA(r.tp)}\ ${u('h')}$` }, { note: 'Allow ECF from (a).' }],
    },
  ],
});
