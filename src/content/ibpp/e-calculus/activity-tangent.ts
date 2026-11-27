import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibpp-e5-activity-tangent',
  version: 1,
  title: 'Activity as a rate of change: derivatives, tangents and areas for a decaying sample',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.6'],
  math: { topic: 'ibm.5', standards: ['ibm.5.6', 'ibm.5.4', 'ibm.5.11'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 2,

  params: {
    N0: { choices: [2e12, 4e12, 5e12, 8e12], base: 5e12, sci: 2 },
    k: { choices: [0.0462, 0.0578, 0.0866, 0.1155], base: 0.1155 },
    t1: { choices: [2, 3, 4, 5], base: 3 },
    dt: { choices: [2, 4, 6], base: 4 },
  },

  compute: (p, c) => {
    const half = Math.LN2 / p.k;
    const N1 = c.carry(p.N0 * Math.exp(-p.k * p.t1), undefined, 3);
    const dNdt = -p.k * p.N0 * Math.exp(-p.k * p.t1);
    const dc = c.carry(dNdt, 'dNdt', 3);
    const A = -dc / 3600;
    const run = c.carry(-N1 / dc, undefined, 3);
    const tCross = p.t1 + run;
    const t2 = p.t1 + p.dt;
    const N2 = c.carry(p.N0 * Math.exp(-p.k * t2), undefined, 3);
    const decays = N1 - N2;
    return { half, N1, dNdt, A, run, tCross, t2, N2, decays };
  },

  stem: ({ d }) =>
    `A sample of a radioactive nuclide is prepared at time $t = 0$. The number of nuclei that have not decayed is modelled by $$N(t) = ${d.N0}\\,e^{-${d.k}t}$$ where $t$ is the time in hours.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the half-life of the nuclide.',
      response: { kind: 'numeric', answer: 'half', symbol: 'T_{1/2}', unit: 'h', positive: true },
      solution: ({ d, r }) => [
        { text: 'After one half-life, half of the nuclei are left:', math: tex`e^{-${d.k}T} = \tfrac{1}{2} \;\Rightarrow\; ${d.k}T = \ln 2 \;\Rightarrow\; T = \frac{\ln 2}{${d.k}} = ${fmtA(r.half)}\ ${u('h')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$N = \\tfrac{1}{2}N_0$, solved with logarithms' }, { mark: tex`$T_{1/2} = ${fmtA(r.half)}\ ${u('h')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Find the rate of change of $N$, in nuclei per hour, at $t = ${d.t1}$ hours.`,
      response: { kind: 'numeric', answer: 'dNdt', symbol: '\\dfrac{dN}{dt}' },
      solution: ({ d, r }) => [
        { math: tex`\frac{dN}{dt} = -${d.k} \times ${d.N0}\,e^{-${d.k}t}` },
        { math: tex`\frac{dN}{dt}\Big|_{t = ${d.t1}} = -${d.k} \times ${d.N0} \times e^{-${d.k} \times ${d.t1}} = ${fmtA(r.dNdt)}\ \text{per hour}` },
        { text: 'It is negative because the number of undecayed nuclei is falling.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Derivative of $e^{-kt}$ is $-ke^{-kt}$' }, { mark: tex`$${fmtA(r.dNdt)}$ per hour` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ d }) => `Hence find the activity of the sample, in Bq, at $t = ${d.t1}$ hours.`,
      response: { kind: 'numeric', answer: 'A', symbol: 'A', unit: 'Bq', positive: true },
      solution: ({ r }) => [{ text: 'The activity is the number of decays per second, $-\\dfrac{dN}{dt}$, and there are 3600 s in an hour:', math: tex`A = \frac{${fmtW(-r.dNdt)}}{3600} = ${fmtA(r.A)}\ ${u('Bq')}` }],
      markscheme: ({ r }) => [{ mark: tex`$A = ${fmtA(r.A)}\ ${u('Bq')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `The tangent to the graph of $N$ against $t$ at $t = ${d.t1}$ hours meets the $t$-axis. Find the value of $t$ there.`,
      response: { kind: 'numeric', answer: 'tCross', symbol: 't', unit: 'h', positive: true },
      solution: ({ d, r }) => [
        { math: tex`N(${d.t1}) = ${d.N0}\,e^{-${d.k} \times ${d.t1}} = ${fmtW(r.N1)}` },
        { text: 'The tangent is $N - N(t_1) = N^{\\prime}(t_1)\\,(t - t_1)$. It meets the axis where $N = 0$:', math: tex`t = ${d.t1} - \frac{N(${d.t1})}{N^{\prime}(${d.t1})} = ${d.t1} - \frac{${fmtW(r.N1)}}{${fmtW(r.dNdt)}} = ${d.t1} + ${fmtW(r.run)} = ${fmtA(r.tCross)}\ ${u('h')}` },
        { text: 'This is the time at which every nucleus would have decayed if the sample kept decaying at its rate at that moment. The real decay slows down, so it never finishes.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Equation of the tangent with $N = 0$' }, { mark: tex`$t = ${fmtA(r.tCross)}\ ${u('h')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: ({ d, r }) => `Find the number of nuclei that decay between $t = ${d.t1}$ hours and $t = ${r.t2}$ hours.`,
      response: { kind: 'numeric', answer: 'decays', symbol: '\\text{number}', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The number of decays is the area under the graph of the decay rate $-\\dfrac{dN}{dt}$ between the two times:',
          math: tex`\int_{${d.t1}}^{${r.t2}} -\frac{dN}{dt}\,dt = \Big[-N(t)\Big]_{${d.t1}}^{${r.t2}} = N(${d.t1}) - N(${r.t2})`,
        },
        { math: tex`N(${r.t2}) = ${d.N0}\,e^{-${d.k} \times ${r.t2}} = ${fmtW(r.N2)}` },
        { math: tex`\text{number} = ${fmtW(r.N1)} - ${fmtW(r.N2)} = ${fmtA(r.decays)}` },
      ],
      markscheme: ({ r }) => [{ mark: '$N(t_1) - N(t_2)$, or the integral of the activity' }, { mark: tex`$${fmtA(r.decays)}$` }],
    },
  ],
});
