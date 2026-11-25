import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'up1-t3-constant-power-car',
  version: 1,
  title: 'A car accelerating at constant power',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.6', 'up1.3.3'],
  uses: ['up1.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { min: 1000, max: 2000, step: 50, base: 1500 },
    P: { min: 40, max: 150, step: 5, base: 100 },
    t1: { min: 2, max: 10, step: 1, base: 5 },
  },
  // A final speed of at most 40 m/s.
  constraint: (p) => Math.sqrt((2 * p.P * 1000 * p.t1) / p.m) <= 40,

  compute: (p, c) => {
    const v = Math.sqrt((2 * p.P * 1000 * p.t1) / p.m);
    const x = (2 / 3) * Math.sqrt((2 * p.P * 1000) / p.m) * p.t1 ** 1.5;
    // Or x = (2/3) v t, from the speed in (a).
    const x__vt = (2 / 3) * c.carry(v, 'v') * p.t1;
    const F = (p.P * 1000) / c.carry(v, 'v');
    return { v, x, x__vt, F };
  },

  stem: ({ d }) =>
    `A car of mass ${Q(d.m, 'kg')} starts from rest on a level road. Its engine delivers a constant power of ${Q(d.P, 'kW')} to the wheels. Ignore air resistance and rolling resistance.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Find the speed of the car ${Q(d.t1, 's')} after it starts.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'With constant power, the work done in time $t$ is $Pt$. By the work–energy theorem it all becomes kinetic energy: $\\tfrac{1}{2}mv^2 = Pt$.',
          math: tex`v = \sqrt{\frac{2Pt}{m}} = \sqrt{\frac{2 \times ${d.P} \times 10^{3} \times ${d.t1}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$\\tfrac{1}{2}mv^2 = Pt$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the distance the car travels in this time.',
      response: { kind: 'numeric', answer: 'x', symbol: 'x', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The speed is not increasing uniformly, so integrate $v(t) = \\sqrt{2P/m}\\;t^{1/2}$.',
          math: tex`x = \int_0^{t} \sqrt{\frac{2P}{m}}\,t'^{1/2}\,dt' = \frac{2}{3}\sqrt{\frac{2P}{m}}\,t^{3/2} = \frac{2}{3}vt`,
        },
        { math: tex`x = \frac{2}{3} \times ${fmtW(r.v)} \times ${d.t1} = ${fmtWA(r.x__vt)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Integrating $v \\propto t^{1/2}$ to get $x \\propto t^{3/2}$' }, { mark: tex`$x = ${fmtA(r.x)}\ ${u('m')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Find the driving force on the car at that moment.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'For a force along the velocity, $P = Fv$.',
          math: tex`F = \frac{P}{v} = \frac{${d.P} \times 10^{3}}{${fmtW(r.v)}} = ${fmtWA(r.F)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F = P/v = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'This model predicts $F = P/v \\to \\infty$ as the car starts ($v \\to 0$). What limits the driving force of a real car at low speed?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The maximum static friction force between the tires and the road', correct: true },
          { text: 'Air resistance, which is largest at low speed' },
          { text: 'The car’s weight, which pushes it backward' },
          { text: 'Nothing: real cars do have an infinite force when they start' },
        ],
      },
      solution: () => [
        {
          text: 'The driving force is the static friction force of the road on the tires, which cannot exceed $\\mu_s N$. At low speed a real car is limited by traction (and by its gears and engine speed), so it cannot use its full power; constant-power acceleration applies only once $P/v$ has fallen below the maximum friction force. Air resistance is smallest at low speed.',
        },
      ],
      markscheme: () => [{ note: 'Traction: maximum static friction, μs N.' }],
    },
  ],
});
