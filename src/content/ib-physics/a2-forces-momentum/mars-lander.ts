import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

const G_MARS = 3.7;

export default defineQuestion({
  id: 'ibp-a2-mars-lander',
  version: 1,
  title: 'A probe landing on Mars',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.5', 'ibp.A.2.1', 'ibp.A.2.2'],
  uses: ['ibp.A.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 200, max: 900, step: 10, base: 600 },
    T: { min: 300, max: 5000, step: 50, base: 2700 },
    v0: { min: 3, max: 10, step: 0.5, base: 6, dp: 1 },
    h: { min: 10, max: 60, step: 5, base: 20 },
  },
  // The thrust is clearly different from the weight (between half and 1.6 times it, and at
  // least 10% away from it), so the acceleration is not a tiny difference of large numbers.
  constraint: (p) => {
    const W = p.m * G_MARS;
    return p.T >= 0.5 * W && p.T <= 1.6 * W && Math.abs(p.T - W) >= 0.1 * W;
  },

  compute: (p, c) => {
    const W = p.m * G_MARS;
    // W is subtracted from a similar number, so students keep at least 3 s.f. of it.
    const a = (p.T - c.carry(W, 'W', 3)) / p.m;
    // Slowing from v0 to rest over h: deceleration v0² / 2h, so the thrust exceeds the weight.
    const decel = p.v0 ** 2 / (2 * p.h);
    const T2 = p.m * (G_MARS + c.carry(decel));
    return { W, a, decel, T2 };
  },

  stem: ({ d }) =>
    `A space probe of mass ${Q(d.m, 'kg')} is about to land on Mars, where the gravitational field strength is ${Q(G_MARS, 'N kg-1')}. Near the surface, its rocket engine provides an upward thrust. Ignore the thin Martian atmosphere.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the weight of the probe on Mars.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Weight is the gravitational force on the probe: mass × gravitational field strength.',
          math: tex`W = mg_{\text{Mars}} = ${d.m} \times ${G_MARS} = ${fmtWA(r.W)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W = ${fmtA(r.W)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `The thrust is ${Q(d.T, 'N')}. Determine the acceleration of the probe. Take upwards as positive.`,
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2' },
      solution: ({ d, r }) => [
        {
          text: 'Two forces act: the thrust upwards and the weight downwards. The resultant force gives the acceleration (Newton’s second law).',
          math: tex`a = \frac{T - W}{m} = \frac{${d.T} - ${fmtW(r.W)}}{${d.m}} = ${fmtA(r.a)}\ ${u('m s-2')}`,
        },
        {
          text:
            r.a > 0
              ? 'The acceleration is positive, so it is upwards: the probe speeds up if it is rising, or slows down if it is falling.'
              : 'The acceleration is negative, so it is downwards: the thrust is less than the weight.',
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Resultant force $= T - W$' },
        { mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` },
        { note: 'Allow ECF from (a). The sign gives the direction.' },
      ],
    },
    {
      label: '(c)',
      marks: 3,
      prompt: ({ d }) =>
        `Later, the probe is falling at ${Q(d.v0, 'm s-1')} when it is ${Q(d.h, 'm')} above the ground. Calculate the constant thrust needed for the probe to come to rest just as it reaches the ground.`,
      response: { kind: 'numeric', answer: 'T2', symbol: 'T', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'First find the deceleration needed, from the equations of motion. Take downwards as positive for this step: the probe slows from $v_0$ to rest over the height $h$.',
          math: knowns([['u', d.v0, 'm s-1'], ['v', '0'], ['s', d.h, 'm'], ['a', '?']]),
        },
        {
          text: 'Use $v^2 = u^2 + 2as$. The acceleration comes out negative (upwards), with size:',
          math: tex`|a| = \frac{u^2}{2s} = \frac{${d.v0}^2}{2 \times ${d.h}} = ${fmtW(r.decel)}\ ${u('m s-2')}`,
        },
        {
          text: 'The acceleration is upwards, so the thrust must exceed the weight. With upwards positive, $T - mg = m|a|$.',
          math: tex`T = m(g_{\text{Mars}} + |a|) = ${d.m} \times (${G_MARS} + ${fmtW(r.decel)}) = ${fmtWA(r.T2)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: tex`Deceleration $= v_0^2 / 2h = ${fmtA(r.decel)}\ ${u('m s-2')}$` },
        { mark: 'Thrust − weight = mass × acceleration, with the acceleration upwards' },
        { mark: tex`$T = ${fmtA(r.T2)}\ ${u('N')}$` },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The probe lands. Which row compares its mass and its weight on Mars with their values on Earth?',
      response: {
        kind: 'mcq',
        columns: ['Mass on Mars', 'Weight on Mars'],
        options: () => [
          { cells: ['the same', 'smaller'], correct: true },
          { cells: ['smaller', 'smaller'] },
          { cells: ['the same', 'the same'] },
          { cells: ['smaller', 'the same'] },
        ],
      },
      solution: () => [
        {
          text: 'Mass is the amount of matter in the probe, so it does not depend on where the probe is. Weight is the gravitational force $mg$, and the gravitational field strength on Mars is smaller than on Earth, so the weight is smaller.',
        },
      ],
      markscheme: () => [{ note: 'Mass is unchanged; weight = mg depends on the field strength.' }],
    },
  ],
});
