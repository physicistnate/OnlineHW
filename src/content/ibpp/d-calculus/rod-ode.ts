import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibpp-d5-rod-ode',
  version: 1,
  title: 'A rod braked by induction: a differential equation for a circuit',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.D.4',
  standards: ['ibp.D.4.2', 'ibp.D.4.3'],
  uses: ['ibp.D.3.4', 'ibp.A.2.1'],
  math: { topic: 'ibm.5', standards: ['ibm.5.18', 'ibm.5.11', 'ibm.5.1'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { choices: [20, 50, 100], base: 50 },
    B: { choices: [0.5, 0.8, 1], base: 0.8, dp: 1 },
    L: { choices: [10, 20, 25], base: 20 },
    R: { choices: [0.1, 0.2, 0.5], base: 0.2, dp: 1 },
    v0: { choices: [1, 2, 4], base: 2 },
  },

  compute: (p, c) => {
    const tau = (p.m * 1e-3 * p.R) / (p.B ** 2 * (p.L / 100) ** 2);
    const tc = c.carry(tau, 'tau', 3);
    const tHalf = tc * Math.LN2;
    const x = p.v0 * tc;
    const heat = 0.5 * p.m * 1e-3 * p.v0 ** 2;
    return { tau, tHalf, x, heat };
  },

  stem: ({ d }) =>
    `A metal rod of mass ${Q(d.m, 'g')} rests across two smooth horizontal rails ${Q(d.L, 'cm')} apart, in a uniform vertical magnetic field of ${Q(d.B, 'T')}. The rails are joined by a resistor of ${Q(d.R, 'Ω')}; the rest of the circuit has negligible resistance. The rod is given a speed $v_0 = ${d.v0}\\ \\mathrm{m\\,s^{-1}}$ along the rails and released. Its speed $v$ then falls, because of the current induced in the circuit.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which expression gives the force on the rod, along the rails, when its speed is $v$? ($B$ is the field, $L$ the distance between the rails and $R$ the resistance.)',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$F = -\\dfrac{B^2L^2v}{R}$', correct: true },
          { text: '$F = -\\dfrac{BLv}{R}$' },
          { text: '$F = -\\dfrac{B^2L^2v^2}{R}$' },
          { text: '$F = -BLv$' },
        ],
      },
      solution: () => [
        { text: 'The emf is $\\varepsilon = BLv$, so the current is $I = \\dfrac{BLv}{R}$. The force on the current in the field is $BIL = \\dfrac{B^2L^2v}{R}$, and by Lenz’s law it opposes the motion: hence the minus sign.' },
      ],
      markscheme: () => [{ note: 'ε = BLv, I = ε/R, F = BIL, opposing the motion.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () =>
        'Newton’s second law gives $m\\dfrac{dv}{dt} = -\\dfrac{B^2L^2}{R}\\,v$. Separate the variables to solve it, with $v = v_0$ at $t = 0$. Which is the solution? Here $\\tau = \\dfrac{mR}{B^2L^2}$.',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$v = v_0e^{-t/\\tau}$', correct: true },
          { text: '$v = v_0\\left(1 - \\dfrac{t}{\\tau}\\right)$' },
          { text: '$v = \\dfrac{v_0}{1 + t/\\tau}$' },
          { text: '$v = v_0e^{-\\tau t}$' },
        ],
      },
      solution: () => [
        { math: String.raw`\int \frac{dv}{v} = -\int \frac{dt}{\tau} \;\Rightarrow\; \ln v = -\frac{t}{\tau} + C \;\Rightarrow\; v = v_0e^{-t/\tau}` },
        { text: 'The speed never quite reaches zero: the slower the rod moves, the smaller the force slowing it down.' },
      ],
      markscheme: () => [{ note: 'Exponential decay with time constant τ = mR/B²L².' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the time constant $\\tau$.',
      response: { kind: 'numeric', answer: 'tau', symbol: '\\tau', unit: 's', positive: true },
      solution: ({ d, r }) => [{ math: tex`\tau = \frac{mR}{B^2L^2} = \frac{${Number(d.m) / 1000} \times ${d.R}}{${d.B}^2 \times ${Number(d.L) / 100}^2} = ${fmtA(r.tau)}\ ${u('s')}` }],
      markscheme: ({ r }) => [{ mark: tex`$\tau = ${fmtA(r.tau)}\ ${u('s')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Find the time taken for the speed of the rod to fall to half its initial value.',
      response: { kind: 'numeric', answer: 'tHalf', symbol: 't', unit: 's', positive: true },
      solution: ({ r }) => [{ math: tex`e^{-t/\tau} = \tfrac{1}{2} \;\Rightarrow\; t = \tau\ln 2 = ${fmtW(r.tau)} \times \ln 2 = ${fmtA(r.tHalf)}\ ${u('s')}` }],
      markscheme: ({ r }) => [{ mark: tex`$t = \tau\ln 2 = ${fmtA(r.tHalf)}\ ${u('s')}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => 'As time goes on, the distance travelled by the rod approaches a limit. Find this distance.',
      response: { kind: 'numeric', answer: 'x', symbol: 'x', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'The distance is the integral of the velocity:', math: String.raw`x(t) = \int_0^t v_0e^{-s/\tau}\,ds = v_0\tau\left(1 - e^{-t/\tau}\right)` },
        { text: 'As $t \\to \\infty$, $e^{-t/\\tau} \\to 0$, so', math: tex`x \to v_0\tau = ${d.v0} \times ${fmtW(r.tau)} = ${fmtA(r.x)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Integral of $v$, then the limit as $t \\to \\infty$' }, { mark: tex`$x = v_0\tau = ${fmtA(r.x)}\ ${u('m')}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(f)',
      marks: 1,
      prompt: () => 'Find the total thermal energy produced in the resistor.',
      response: { kind: 'numeric', answer: 'heat', symbol: 'Q', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'All of the rod’s kinetic energy ends up in the resistor:', math: tex`\tfrac{1}{2}mv_0^{\,2} = \tfrac{1}{2} \times ${Number(d.m) / 1000} \times ${d.v0}^2 = ${fmtA(r.heat)}\ ${u('J')}` },
        { text: 'As a check, $\\displaystyle\\int_0^\\infty I^2R\\,dt = \\frac{B^2L^2v_0^{\\,2}}{R}\\int_0^\\infty e^{-2t/\\tau}\\,dt = \\frac{B^2L^2v_0^{\\,2}}{R}\\cdot\\frac{\\tau}{2} = \\tfrac{1}{2}mv_0^{\\,2}$.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.heat)}\ ${u('J')}$` }, { note: 'Energy conservation, or the integral of I²R.' }],
    },
  ],
});
