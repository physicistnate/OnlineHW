import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-car-power',
  version: 1,
  title: 'Power, resistive forces and the top speed of a car',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.5', 'ibp.A.3.2'],
  uses: ['ibp.A.2.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    P: { min: 15, max: 60, step: 1, base: 30 },
    v: { min: 15, max: 30, step: 1, base: 25 },
    s: { min: 2, max: 20, step: 1, base: 12 },
    Pmax: { min: 60, max: 150, step: 5, base: 90 },
  },
  // The engine has plenty of spare power, and the top speed is realistic (at most 60 m/s).
  constraint: (p) => p.Pmax >= 1.5 * p.P && p.v * Math.cbrt(p.Pmax / p.P) <= 60,

  compute: (p, c) => {
    const F = (p.P * 1000) / p.v;
    const WJ = c.carry(F, 'F') * p.s * 1000;
    const W = WJ / 1e6;
    // The resistive force is kv², so the power needed is P = kv³: v is proportional to P^(1/3).
    const vmax = p.v * Math.cbrt(p.Pmax / p.P);
    // Or find k first, from the force in (a).
    const k = c.carry(F, 'F') / p.v ** 2;
    const vmax__k = Math.cbrt((p.Pmax * 1000) / c.carry(k));
    return { F, WJ, W, vmax, k, vmax__k };
  },

  stem: ({ d }) =>
    `A car travels at a constant speed of ${Q(d.v, 'm s-1')} along a straight, level road. The useful power output of its engine (the power delivered to the wheels) is ${Q(d.P, 'kW')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the total resistive force acting on the car.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The speed is constant, so the resultant force on the car is zero (Newton’s first law): the driving force equals the total resistive force (air resistance and rolling resistance).',
        },
        {
          text: 'The useful power is the rate at which the driving force does work, $P = Fv$.',
          math: tex`F = \frac{P}{v} = \frac{${d.P} \times 10^{3}}{${d.v}} = ${fmtWA(r.F)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Driving force = resistive force (constant speed)' }, { mark: tex`$F = P/v = ${fmtA(r.F)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Calculate the work done against the resistive forces as the car travels ${Q(d.s, 'km')} at this speed.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'MJ', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'The resistive force acts against the motion for the whole distance. Convert the distance to metres.',
          math: tex`W = Fs = ${fmtW(r.F)} \times ${fmtW(p.s * 1000)} = ${fmtW(r.WJ)}\ ${u('J')} = ${fmtA(r.W)}\ ${u('MJ')}`,
        },
        { text: 'This energy is transferred to the surroundings, mostly as internal energy of the air and the tyres.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $W = Fs$ with $s$ in metres' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('MJ')}$` }, { note: 'Allow ECF from (a). Accept $P \\times t$ with $t = s/v$.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () =>
        'The resistive force on the car is proportional to the square of its speed. The car now travels at twice the speed. By what factor does the useful power output of the engine increase?',
      response: {
        kind: 'mcq',
        options: () => [{ text: '$8$', correct: true }, { text: '$2$' }, { text: '$4$' }, { text: '$16$' }],
      },
      solution: () => [
        {
          text: 'At twice the speed the resistive force is $2^2 = 4$ times greater. The power needed is $P = Fv$, and the speed is also twice as great, so the power is $4 \\times 2 = 8$ times greater. In general $P = kv^2 \\times v = kv^3$.',
        },
      ],
      markscheme: () => [{ note: 'F ∝ v² and P = Fv, so P ∝ v³.' }],
    },
    {
      label: '(d)',
      marks: 3,
      prompt: ({ d }) => `The maximum useful power output of the engine is ${Q(d.Pmax, 'kW')}. Determine the maximum speed of the car on this road.`,
      response: { kind: 'numeric', answer: 'vmax', symbol: 'v_{\\max}', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'From (c), the power needed is proportional to the cube of the speed, $P = kv^3$. At top speed the engine gives its maximum power, so compare it with the power at the speed in the stem:',
          math: tex`\frac{P_{\max}}{P} = \left(\frac{v_{\max}}{v}\right)^3 \quad\Rightarrow\quad v_{\max} = v\left(\frac{P_{\max}}{P}\right)^{1/3} = ${d.v} \times \left(\frac{${d.Pmax}}{${d.P}}\right)^{1/3} = ${fmtA(r.vmax)}\ ${u('m s-1')}`,
        },
        {
          text: 'Another method: find $k$ from (a), then use $P_{\\max} = kv_{\\max}^3$.',
          math: tex`k = \frac{F}{v^2} = \frac{${fmtW(r.F)}}{${d.v}^2} = ${fmtW(r.k)}\ ${u('kg m-1')}, \qquad v_{\max} = \left(\frac{${d.Pmax} \times 10^{3}}{${fmtW(r.k)}}\right)^{1/3} = ${fmtA(r.vmax__k)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: '$P = kv^3$, or $k = F/v^2$ found from (a)' },
        { mark: '$v_{\\max} = v\\,(P_{\\max}/P)^{1/3}$, or $v_{\\max} = (P_{\\max}/k)^{1/3}$' },
        { mark: tex`$v_{\max} = ${fmtA(r.vmax)}\ ${u('m s-1')}$` },
      ],
    },
  ],
});
