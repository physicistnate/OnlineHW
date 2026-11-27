import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-roller-coaster',
  version: 1,
  title: 'Energy on a roller coaster',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.4', 'ibp.A.3.3', 'ibp.A.3.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 400, max: 1200, step: 50, base: 800 },
    v0: { min: 2, max: 5, step: 0.5, base: 3, dp: 1 },
    h1: { min: 25, max: 60, step: 1, base: 40 },
    h2: { min: 5, max: 40, step: 1, base: 22 },
    d: { min: 20, max: 60, step: 1, base: 35 },
  },
  // The second hill is clearly lower than the first, and the brakes decelerate the car at no more than 15 m/s² (about 1.5 g).
  constraint: (p) => p.h2 <= p.h1 - 8 && (p.v0 ** 2 + 2 * 9.81 * p.h1) / (2 * p.d) <= 15,

  compute: (p, c) => {
    const vb = Math.sqrt(p.v0 ** 2 + 2 * c.g * p.h1);
    const v2 = Math.sqrt(p.v0 ** 2 + 2 * c.g * (p.h1 - p.h2));
    // Or from the speed at ground level, found in (a) (kept to 3 s.f., because 2gh is subtracted from it).
    const s2 = c.carry(vb, 'vb', 3) ** 2 - 2 * c.g * p.h2;
    c.assume(s2 > 0);
    const v2__vb = Math.sqrt(s2);
    const Ek = 0.5 * p.m * c.carry(vb, 'vb') ** 2;
    const F = c.carry(Ek) / p.d;
    // Or straight from the energy at the top: all of it is removed by the brakes.
    const F__energy = (0.5 * p.m * p.v0 ** 2 + p.m * c.g * p.h1) / p.d;
    return { vb, v2, v2__vb, Ek, F, F__energy };
  },

  stem: ({ d }) =>
    `A roller coaster car and its passengers have a total mass of ${Q(d.m, 'kg')}. The car passes over the top of the first hill, ${Q(d.h1, 'm')} above the ground, at a speed of ${Q(d.v0, 'm s-1')}. Friction and air resistance are negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the speed of the car when it reaches ground level after the first drop.',
      response: { kind: 'numeric', answer: 'vb', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'With no friction or air resistance, mechanical energy is conserved: the gravitational potential energy lost becomes kinetic energy. The mass cancels.',
          math: tex`\tfrac{1}{2}mv^2 = \tfrac{1}{2}mv_0^2 + mgh \quad\Rightarrow\quad v = \sqrt{v_0^2 + 2gh}`,
        },
        { math: tex`v = \sqrt{${d.v0}^2 + 2 \times ${g} \times ${d.h1}} = ${fmtA(r.vb)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Loss of gravitational potential energy = gain of kinetic energy' }, { mark: tex`$v = ${fmtA(r.vb)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `The track then rises to the top of a second hill, ${Q(d.h2, 'm')} above the ground. Calculate the speed of the car at the top of the second hill.`,
      response: { kind: 'numeric', answer: 'v2', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Compare the top of the second hill with the top of the first hill: the car has fallen through a height $h_1 - h_2$.',
          math: tex`v = \sqrt{v_0^2 + 2g(h_1 - h_2)} = \sqrt{${d.v0}^2 + 2 \times ${g} \times (${d.h1} - ${d.h2})} = ${fmtA(r.v2)}\ ${u('m s-1')}`,
        },
        {
          text: 'Or start from the speed at ground level in (a): the car climbs $h_2$ and loses kinetic energy.',
          math: tex`v = \sqrt{${fmtW(r.vb)}^2 - 2 \times ${g} \times ${d.h2}} = ${fmtA(r.v2__vb)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Kinetic energy at the top of the second hill from conservation of energy' }, { mark: tex`$v = ${fmtA(r.v2)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) =>
        `At the end of the ride the car moves along horizontal track at ground level. Brakes bring it to rest in a distance of ${Q(d.d, 'm')}. Calculate the average braking force.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At ground level the car has the speed found in (a). The work done by the brakes removes all of its kinetic energy.',
          math: tex`E_k = \tfrac{1}{2}mv^2 = \tfrac{1}{2} \times ${d.m} \times ${fmtW(r.vb)}^2 = ${fmtW(r.Ek)}\ ${u('J')}`,
        },
        {
          text: 'Work done by the brakes $= Fs$.',
          math: tex`F = \frac{E_k}{s} = \frac{${fmtW(r.Ek)}}{${d.d}} = ${fmtA(r.F)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Work done by the brakes = kinetic energy at ground level' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'More passengers get into the car, so its total mass increases. It passes over the first hill at the same speed. How does the speed at ground level change?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It stays the same.', correct: true },
          { text: 'It increases, because the weight of the car is greater.' },
          { text: 'It decreases, because there is more mass to accelerate.' },
          { text: 'It increases, because the car has more gravitational potential energy.' },
        ],
      },
      solution: () => [
        {
          text: 'Both the gravitational potential energy lost ($mgh$) and the kinetic energy gained ($\\tfrac{1}{2}mv^2$) are proportional to the mass, so the mass cancels: $v = \\sqrt{v_0^2 + 2gh}$ does not depend on $m$. (The braking force needed would be greater, though.)',
        },
      ],
      markscheme: () => [{ note: 'Mass cancels from the energy equation.' }],
    },
  ],
});
