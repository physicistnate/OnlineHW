import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-power-time-force',
  version: 1,
  title: 'Instantaneous and average power from a force that grows with time',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.5', 'apcm.3.1'],
  uses: ['apcm.1', 'apcm.2'],
  style: 'AP',
  paper: 'Free-response style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    beta: { min: 2, max: 20, step: 1, base: 10 },
    m: { min: 1, max: 10, step: 0.5, base: 2, dp: 1 },
    T: { min: 2, max: 10, step: 1, base: 5 },
  },
  // A final speed of at most 100 m/s.
  constraint: (p) => (p.beta * p.T ** 2) / (2 * p.m) <= 100,

  compute: (p, c) => {
    const v = (p.beta * p.T ** 2) / (2 * p.m);
    const F = p.beta * p.T;
    const P = F * c.carry(v, 'v');
    const K = 0.5 * p.m * c.carry(v, 'v') ** 2;
    const Pavg = c.carry(K) / p.T;
    // Or average the instantaneous power: (1/T)∫P dt = β²T³/(8m).
    const Pavg__integral = (p.beta ** 2 * p.T ** 3) / (8 * p.m);
    return { v, F, P, K, Pavg, Pavg__integral };
  },

  stem: ({ d }) =>
    `A rocket sled of mass ${Q(d.m, 'kg')} is at rest on a straight, horizontal, frictionless track. At time $t = 0$ its engine starts. The thrust is horizontal and increases with time as $F(t) = \\beta t$, where $\\beta = ${d.beta}\\ \\mathrm{N/s}$. Air resistance and the change in the sled’s mass are negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Calculate the speed of the sled at $t = ${d.T}\\ \\mathrm{s}$.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The acceleration is not constant, $a = F/m = \\beta t/m$, so integrate it to find the velocity (the sled starts from rest).',
          math: tex`v(T) = \int_0^{T} \frac{\beta t}{m}\,dt = \frac{\beta T^2}{2m} = \frac{${d.beta} \times ${d.T}^2}{2 \times ${d.m}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Integrating $a = \\beta t/m$ (or the impulse $\\int F\\,dt$) with respect to time' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Calculate the instantaneous power delivered to the sled by the thrust at $t = ${d.T}\\ \\mathrm{s}$.`,
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Instantaneous power is $P = \\vec{F}\\cdot\\vec{v} = Fv$, using the force and the velocity at the same instant.',
          math: tex`F = \beta T = ${d.beta} \times ${d.T} = ${fmtW(r.F)}\ ${u('N')}`,
        },
        { math: tex`P = Fv = ${fmtW(r.F)} \times ${fmtW(r.v)} = ${fmtWA(r.P)}\ ${u('W')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$P = Fv$ at $t = T$' }, { mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Calculate the average power delivered by the thrust from $t = 0$ to $t = ${d.T}\\ \\mathrm{s}$.`,
      response: { kind: 'numeric', answer: 'Pavg', symbol: 'P_{\\text{avg}}', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Average power is the work done divided by the time taken. By the work–energy theorem the work done equals the gain in kinetic energy.',
          math: tex`W = \Delta K = \tfrac{1}{2}mv^2 = \tfrac{1}{2} \times ${d.m} \times ${fmtW(r.v)}^2 = ${fmtW(r.K)}\ ${u('J')}`,
        },
        { math: tex`P_{\text{avg}} = \frac{W}{\Delta t} = \frac{${fmtW(r.K)}}{${d.T}} = ${fmtA(r.Pavg)}\ ${u('W')}` },
        {
          text: 'Or average the instantaneous power: $P(t) = Fv = \\dfrac{\\beta^2 t^3}{2m}$, so $P_{\\text{avg}} = \\dfrac{1}{T}\\displaystyle\\int_0^T \\frac{\\beta^2 t^3}{2m}\\,dt = \\dfrac{\\beta^2 T^3}{8m}$, which is one quarter of the power at $t = T$.',
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Average power = work done ÷ time, with work = change in kinetic energy' }, { mark: tex`$P_{\text{avg}} = ${fmtA(r.Pavg)}\ ${u('W')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Suppose instead the engine runs for twice as long, with the same $F(t) = \\beta t$. By what factor is the instantaneous power at the end multiplied?',
      response: {
        kind: 'mcq',
        options: () => [{ text: '$8$', correct: true }, { text: '$2$' }, { text: '$4$' }, { text: '$16$' }],
      },
      solution: () => [
        {
          text: 'The force is proportional to $t$ and the speed is proportional to $t^2$, so $P = Fv$ is proportional to $t^3$. Doubling the time multiplies the power by $2^3 = 8$.',
        },
      ],
      markscheme: () => [{ note: 'P = Fv ∝ t × t² = t³.' }],
    },
  ],
});
