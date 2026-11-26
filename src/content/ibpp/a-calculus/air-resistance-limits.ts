import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibpp-a5-air-resistance-limits',
  version: 1,
  title: 'Falling with air resistance: a differential equation, a limit and an integral',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.7', 'ibp.A.1.5'],
  uses: ['ibp.A.2.4'],
  math: { topic: 'ibm.5', standards: ['ibm.5.18', 'ibm.5.13', 'ibm.5.10'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { choices: [0.01, 0.015, 0.02, 0.025], base: 0.02 },
    k: { choices: [0.004, 0.005, 0.008, 0.01], base: 0.008 },
    t1: { choices: [1, 2, 3], base: 2 },
  },
  // Time constants m/k of 1 s to 4 s: terminal speeds of about 10 m/s to 40 m/s.
  constraint: (p) => p.m / p.k <= 4,

  compute: (p, c) => {
    const tau = p.m / p.k;
    const vT = (p.m * c.g) / p.k;
    const t90 = tau * Math.log(10);
    const E = c.carry(1 - Math.exp(-p.t1 / tau), undefined, 3);
    const tauE = tau * E;
    const B = c.carry(p.t1 - tauE, undefined, 3);
    const s = c.carry(vT, 'vT') * B;
    return { tau, vT, t90, E, tauE, B, s };
  },

  stem: ({ d }) =>
    `A small ball of mass ${Q(Number(d.m).toFixed(3), 'kg')} is dropped from rest and falls vertically. The air resistance on it is modelled as $kv$, where $v$ is its speed and $k = ${Number(d.k).toFixed(3)}\\ \\mathrm{kg\\,s^{-1}}$. Newton’s second law gives $$m\\frac{dv}{dt} = mg - kv.$$`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the terminal speed of the ball.',
      response: { kind: 'numeric', answer: 'vT', symbol: 'v_T', unit: 'm s-1', positive: true },
      solution: ({ d, r, g }) => [
        { text: 'At terminal speed the air resistance balances the weight, so the acceleration is zero:', math: tex`kv_T = mg \;\Rightarrow\; v_T = \frac{mg}{k} = \frac{${Number(d.m).toFixed(3)} \times ${g}}{${Number(d.k).toFixed(3)}} = ${fmtA(r.vT)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_T = \dfrac{mg}{k} = ${fmtA(r.vT)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () =>
        'Which function satisfies both the differential equation and the starting condition $v = 0$ when $t = 0$? You do not need to solve the equation: substitute each function into it.',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$v = \\dfrac{mg}{k}\\left(1 - e^{-kt/m}\\right)$', correct: true },
          { text: '$v = \\dfrac{mg}{k}\\left(1 + e^{-kt/m}\\right)$' },
          { text: '$v = \\dfrac{mg}{k}e^{-kt/m}$' },
          { text: '$v = gt$' },
        ],
      },
      solution: () => [
        { text: 'For $v = \\dfrac{mg}{k}\\left(1 - e^{-kt/m}\\right)$:', math: tex`m\frac{dv}{dt} = m \cdot \frac{mg}{k} \cdot \frac{k}{m}e^{-kt/m} = mg\,e^{-kt/m} \quad\text{and}\quad mg - kv = mg - mg\left(1 - e^{-kt/m}\right) = mg\,e^{-kt/m}` },
        { text: 'The two sides agree, and $v(0) = \\dfrac{mg}{k}(1 - 1) = 0$.' },
        {
          text: 'The function with $1 + e^{-kt/m}$ also satisfies the differential equation, but it starts at $v = 2mg/k$, not at rest. $\\dfrac{mg}{k}e^{-kt/m}$ gives $m\\,\\dfrac{dv}{dt} = -mg\\,e^{-kt/m}$ but $mg - kv = mg(1 - e^{-kt/m})$, which do not agree. $v = gt$ works only if there is no air resistance ($k = 0$).',
        },
      ],
      markscheme: () => [{ note: 'Substitution shows both sides equal mg e^(−kt/m), and v(0) = 0.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the time taken for the ball to reach 90% of its terminal speed.',
      response: { kind: 'numeric', answer: 't90', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [
        { math: tex`0.9\,v_T = v_T\left(1 - e^{-kt/m}\right) \;\Rightarrow\; e^{-kt/m} = 0.1 \;\Rightarrow\; t = \frac{m}{k}\ln 10` },
        { math: tex`t = \frac{${Number(d.m).toFixed(3)}}{${Number(d.k).toFixed(3)}}\ln 10 = ${fmtW(r.tau)}\ln 10 = ${fmtA(r.t90)}\ ${u('s')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$e^{-kt/m} = 0.1$' }, { mark: tex`$t = ${fmtA(r.t90)}\ ${u('s')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'What happens to the velocity at a fixed time $t$ as the air resistance becomes negligible ($k \\to 0$)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$v \\to gt$, the velocity in free fall.', correct: true },
          { text: '$v \\to \\infty$, because $\\dfrac{mg}{k}$ becomes infinitely large.' },
          { text: '$v \\to 0$, because $1 - e^{-kt/m} \\to 0$.' },
          { text: '$v \\to \\dfrac{mg}{k}$ at every time.' },
        ],
      },
      solution: () => [
        { text: 'As $k \\to 0$, $\\dfrac{mg}{k} \\to \\infty$ while $1 - e^{-kt/m} \\to 0$, so the limit has the form $\\infty \\times 0$. Write it as a quotient and use l’Hôpital’s rule (differentiating with respect to $k$):' },
        { math: tex`\lim_{k \to 0}\frac{mg\left(1 - e^{-kt/m}\right)}{k} = \lim_{k \to 0}\frac{mg \cdot \frac{t}{m}e^{-kt/m}}{1} = gt` },
        { text: 'Or use the Maclaurin series $e^{-x} = 1 - x + \\dots$, so $1 - e^{-kt/m} \\approx \\dfrac{kt}{m}$. Without air resistance the ball is in free fall, as it should be.' },
      ],
      markscheme: () => [{ note: 'l’Hôpital’s rule or e^(−x) ≈ 1 − x gives v → gt (free fall).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: ({ d }) => `Find the distance the ball falls in the first ${Q(d.t1, 's')}.`,
      response: { kind: 'numeric', answer: 's', symbol: 's', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'The distance is the area under the velocity–time graph:', math: tex`s = \int_0^{${d.t1}} v_T\left(1 - e^{-kt/m}\right) dt = v_T\left[t + \frac{m}{k}e^{-kt/m}\right]_0^{${d.t1}} = v_T\left(${d.t1} - \frac{m}{k}\left(1 - e^{-${d.t1}k/m}\right)\right)` },
        { math: tex`1 - e^{-${d.t1}/${fmtW(r.tau)}} = ${fmtW(r.E)} \quad\text{and}\quad \frac{m}{k}\left(1 - e^{-${d.t1}k/m}\right) = ${fmtW(r.tau)} \times ${fmtW(r.E)} = ${fmtW(r.tauE)}\ ${u('s')}` },
        { math: tex`s = ${fmtW(r.vT)} \times (${d.t1} - ${fmtW(r.tauE)}) = ${fmtW(r.vT)} \times ${fmtW(r.B)} = ${fmtA(r.s)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$s = \\int v\\,dt$ with the exponential integrated correctly' }, { mark: tex`$s = ${fmtA(r.s)}\ ${u('m')}$` }, { note: 'Allow ECF from (a).' }],
    },
  ],
});
