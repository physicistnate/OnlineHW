import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-ball-wall-rebound',
  version: 1,
  title: 'A ball rebounds from a wall',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.7', 'ibp.A.2.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 0.05, max: 0.2, step: 0.005, base: 0.06, dp: 3 },
    u: { min: 5, max: 20, step: 0.5, base: 12, dp: 1 },
    v: { min: 2, max: 18, step: 0.5, base: 8, dp: 1 },
    t: { min: 5, max: 30, step: 1, base: 12 },
  },
  // The ball rebounds more slowly than it arrived.
  constraint: (p) => p.v <= p.u - 1,

  compute: (p, c) => {
    // Towards the wall is positive, so the rebound velocity is negative.
    const dp = p.m * -p.v - p.m * p.u;
    const ts = p.t / 1000;
    // Uses the size of the change in momentum, so a sign slip in (a) still earns follow-through.
    const F = Math.abs(c.carry(dp, 'dp')) / ts;
    return { dp, pBefore: p.m * p.u, pAfter: -p.m * p.v, ts, F };
  },

  stem: ({ d }) =>
    `A ball of mass ${Q(d.m, 'kg')} moves horizontally at ${Q(d.u, 'm s-1')} towards a vertical wall. It hits the wall at right angles and rebounds along the same line at ${Q(d.v, 'm s-1')}. Take the direction towards the wall as positive.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the change in momentum of the ball.',
      response: { kind: 'numeric', answer: 'dp', symbol: '\\Delta p', unit: 'kg m s-1' },
      solution: ({ d, r }) => [
        {
          text: 'Momentum is a vector. Towards the wall is positive, so after the rebound the velocity is negative.',
          math: tex`p_{\text{before}} = ${d.m} \times ${d.u} = ${fmtW(r.pBefore)}\ ${u('kg m s-1')}, \qquad p_{\text{after}} = ${d.m} \times (-${d.v}) = ${fmtW(r.pAfter)}\ ${u('kg m s-1')}`,
        },
        {
          text: 'Change = final − initial. The two speeds add, because the direction reverses.',
          math: tex`\Delta p = ${fmtW(r.pAfter)} - ${fmtW(r.pBefore)} = ${fmtA(r.dp)}\ ${u('kg m s-1')}`,
        },
        { text: 'The negative sign means the change in momentum is directed away from the wall.' },
      ],
      markscheme: ({ r }) => [
        { mark: 'Final momentum taken as negative (direction reversed)' },
        { mark: tex`$\Delta p = ${fmtA(r.dp)}\ ${u('kg m s-1')}$ (away from the wall)` },
        { note: 'Award [1 max] for m(u − v), the common mistake of subtracting the speeds.' },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `The ball is in contact with the wall for ${Q(d.t, 'ms')}. Calculate the magnitude of the average force exerted on the ball by the wall.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Convert the contact time to seconds.',
          math: tex`\Delta t = ${d.t}\ ${u('ms')} = ${fmtW(r.ts)}\ ${u('s')}`,
        },
        {
          text: 'The impulse of the wall equals the change in momentum of the ball, so the average force is the size of the change in momentum divided by the contact time.',
          math: tex`F = \frac{|\Delta p|}{\Delta t} = \frac{${fmtW(Math.abs(r.dp))}}{${fmtW(r.ts)}} = ${fmtA(r.F)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $F = \\Delta p / \\Delta t$ with time in seconds' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which row gives the direction of the change in momentum of the ball and the direction of the force on the ball from the wall?',
      response: {
        kind: 'mcq',
        columns: ['Change in momentum of the ball', 'Force on the ball from the wall'],
        options: () => [
          { cells: ['away from the wall', 'away from the wall'], correct: true },
          { cells: ['towards the wall', 'away from the wall'] },
          { cells: ['away from the wall', 'towards the wall'] },
          { cells: ['towards the wall', 'towards the wall'] },
        ],
      },
      solution: () => [
        {
          text: 'The change in momentum is negative in (a), so it points away from the wall. The impulse of the force is equal to the change in momentum, so the force on the ball is in the same direction: away from the wall. (The ball pushes on the wall in the opposite direction, by Newton’s third law.)',
        },
      ],
      markscheme: () => [{ note: 'Force and change in momentum are in the same direction (impulse = change in momentum).' }],
    },
  ],
});
