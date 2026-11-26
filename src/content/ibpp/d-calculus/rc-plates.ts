import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/**
 * Capacitors are not in the 2025 IB Physics guide; they appear here only because the
 * differential equation is the point. Everything the student needs about them is given.
 * Times are in ms: C in μF times R in kΩ is a time constant in ms.
 */
export default defineQuestion({
  id: 'ibpp-d5-rc-plates',
  version: 1,
  title: 'Deflecting plates that discharge: a differential equation for an RC circuit',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.1'],
  uses: ['ibp.D.2.5', 'ibp.B.5'],
  math: { topic: 'ibm.5', standards: ['ibm.5.18', 'ibm.5.6', 'ibm.5.1'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    V0: { choices: [200, 300, 400], base: 300 },
    C: { choices: [1, 2.2, 4.7], base: 2.2, dp: 1 },
    R: { choices: [10, 22, 47], base: 22 },
    t1: { choices: [5, 10, 20], base: 10 },
    Y0: { choices: [20, 24, 30], base: 24 },
    k: { choices: [2, 4, 10], base: 4 },
  },

  compute: (p, c) => {
    const tau = p.C * p.R; // ms
    const tc = c.carry(tau, undefined, 3);
    const V1 = p.V0 * Math.exp(-p.t1 / tc);
    const Y1 = p.Y0 / p.k;
    const tY = tc * Math.log(p.k); // ms
    const speed = p.Y0 / tc; // mm per ms = m/s
    return { tau, V1, Y1, tY, speed };
  },

  stem: ({ d }) =>
    `An electron beam passes between two deflecting plates and makes a spot on a screen. The spot’s distance from the centre of the screen is proportional to the potential difference $V$ between the plates. The plates are connected to a capacitor, and the total capacitance is $C = ${d.C}\\ \\mu\\mathrm{F}$: the charge on the plates and the capacitor is $Q = CV$. At $t = 0$ the potential difference is ${Q(d.V0, 'V')} and the spot is ${Q(d.Y0, 'mm')} from the centre. The supply is then disconnected, and the charge flows away through a resistor of ${Q(d.R, 'kΩ')}. (Capacitors are not in the IB Physics guide: everything needed about them is given here.)`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'The current in the resistor is $I = V/R$, and it carries charge away from the plates: $I = -\\dfrac{dQ}{dt}$. Which differential equation does $V$ satisfy?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$\\dfrac{dV}{dt} = -\\dfrac{V}{RC}$', correct: true },
          { text: '$\\dfrac{dV}{dt} = -RCV$' },
          { text: '$\\dfrac{dV}{dt} = -\\dfrac{V}{R}$' },
          { text: '$\\dfrac{d^2V}{dt^2} = -\\dfrac{V}{RC}$' },
        ],
      },
      solution: () => [{ math: String.raw`\frac{dQ}{dt} = C\frac{dV}{dt} = -I = -\frac{V}{R} \;\Rightarrow\; \frac{dV}{dt} = -\frac{V}{RC}` }],
      markscheme: () => [{ note: 'C dV/dt = −V/R.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Solve the equation by separating the variables, with $V = V_0$ at $t = 0$. Find the potential difference between the plates ${Q(d.t1, 'ms')} after the supply is disconnected.`,
      response: { kind: 'numeric', answer: 'V1', symbol: 'V', unit: 'V', positive: true },
      solution: ({ d, r }) => [
        { math: String.raw`\int \frac{dV}{V} = -\int \frac{dt}{RC} \;\Rightarrow\; \ln V = -\frac{t}{RC} + \text{constant} \;\Rightarrow\; V = V_0e^{-t/RC}` },
        { text: 'The time constant, using $1\\ \\mu\\mathrm{F} \\times 1\\ \\mathrm{k\\Omega} = 1$ ms:', math: tex`RC = ${d.C} \times ${d.R} = ${fmtW(r.tau)}\ ${u('ms')}` },
        { math: tex`V = ${d.V0}\,e^{-${d.t1}/${fmtW(r.tau)}} = ${fmtA(r.V1)}\ ${u('V')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$V = V_0e^{-t/RC}$ by separating the variables' }, { mark: tex`$V = ${fmtA(r.V1)}\ ${u('V')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ r }) => `Find the time at which the spot is ${Q(fmtA(r.Y1), 'mm')} from the centre of the screen.`,
      response: { kind: 'numeric', answer: 'tY', symbol: 't', unit: 'ms', positive: true },
      solution: ({ d, r }) => [
        { text: `The distance is proportional to $V$, so it falls in the same way: $Y = ${d.Y0}\\,e^{-t/RC}$ mm.`, math: tex`e^{-t/RC} = \frac{${fmtA(r.Y1)}}{${d.Y0}} \;\Rightarrow\; t = RC\ln ${d.k} = ${fmtW(r.tau)} \times \ln ${d.k} = ${fmtA(r.tY)}\ ${u('ms')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$Y \\propto V$, so $t = RC\\ln(Y_0/Y)$' }, { mark: tex`$t = ${fmtA(r.tY)}\ ${u('ms')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the speed of the spot across the screen just after the supply is disconnected.',
      response: { kind: 'numeric', answer: 'speed', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        { math: String.raw`\frac{dY}{dt} = -\frac{Y_0}{RC}\,e^{-t/RC} \;\Rightarrow\; \left|\frac{dY}{dt}\right|_{t = 0} = \frac{Y_0}{RC}` },
        { text: 'A millimetre per millisecond is a metre per second:', math: tex`v = \frac{${d.Y0}\ \mathrm{mm}}{${fmtW(r.tau)}\ \mathrm{ms}} = ${fmtA(r.speed)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Derivative of $Y_0e^{-t/RC}$ at $t = 0$' }, { mark: tex`$v = ${fmtA(r.speed)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'In this model, when does the spot reach the centre of the screen?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Never: $V$ falls exponentially and only approaches zero.', correct: true },
          { text: 'At $t = RC$.' },
          { text: 'At $t = RC\\ln 2$.' },
          { text: 'At $t = 5RC$, when the plates have lost all their charge.' },
        ],
      },
      solution: () => [{ text: 'Since $e^{-t/RC} > 0$ for every $t$, $V$ and the deflection only approach zero as $t \\to \\infty$. In practice, after five time constants the deflection is less than 1% of $Y_0$, too small to see.' }],
      markscheme: () => [{ note: 'Never (exponential decay approaches zero).' }],
    },
  ],
});
