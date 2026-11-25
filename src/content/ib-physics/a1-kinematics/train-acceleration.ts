import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-train-acceleration',
  version: 2,
  title: 'Uniformly accelerating train',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 1,

  params: {
    u: { min: 2, max: 8, step: 0.5, base: 4, dp: 1 },
    v: { min: 15, max: 30, step: 1, base: 20 },
    s: { min: 200, max: 800, step: 10, base: 400 },
  },
  constraint: (p) => p.v - p.u >= 8,

  compute: (p, c) => {
    const a = (p.v ** 2 - p.u ** 2) / (2 * p.s);
    const t = (p.v - p.u) / c.carry(a, 'a');
    // Alternative method shown in the solution: average speed ½(u + v), then t = s / v̄.
    const vavg = (p.u + p.v) / 2;
    const t__avg = p.s / c.carry(vavg);
    return { a, t, vavg, t__avg };
  },

  stem: ({ d }) =>
    `A train travelling along a straight, horizontal track accelerates uniformly from a speed of ${Q(d.u, 'm s-1')} to ${Q(d.v, 'm s-1')} over a distance of ${Q(d.s, 'm')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the acceleration of the train.',
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2' },
      solution: ({ d, r }) => [
        {
          text: 'The acceleration is uniform, so the equations of motion apply. Take the direction of motion as positive, and list what is known and what is wanted.',
          math: knowns([['u', d.u, 'm s-1'], ['v', d.v, 'm s-1'], ['s', d.s, 'm'], ['a', '?']]),
        },
        {
          text: 'The time is neither given nor asked for, so use the equation of motion that does not contain $t$.',
          math: tex`v^2 = u^2 + 2as`,
        },
        {
          text: 'Rearrange for $a$, then substitute the values.',
          math: tex`a = \frac{v^2 - u^2}{2s} = \frac{${d.v}^2 - ${d.u}^2}{2 \times ${d.s}}`,
        },
        {
          text: 'Evaluate. The acceleration is positive because the train speeds up in its direction of motion.',
          math: tex`a = ${fmtW(r.a)} \approx ${fmtA(r.a)}\ ${u('m s-2')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $v^2 = u^2 + 2as$' },
        { mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` },
        { note: 'Award [2] for a bald correct answer.' },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Calculate the time taken for the speed of the train to increase from ${Q(d.u, 'm s-1')} to ${Q(d.v, 'm s-1')}.`,
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The acceleration is now known, so use the equation linking $u$, $v$, $a$ and $t$ and rearrange it for $t$.',
          math: tex`v = u + at \quad\Rightarrow\quad t = \frac{v - u}{a}`,
        },
        {
          text: 'Substitute the acceleration from (a), keeping an extra significant figure so the final answer is not affected by rounding.',
          math: tex`t = \frac{${d.v} - ${d.u}}{${fmtW(r.a)}}`,
        },
        {
          text: 'Evaluate.',
          math: tex`t = ${fmtA(r.t)}\ ${u('s')}`,
        },
        {
          text: 'Check with a method that does not use the answer to (a). For uniform acceleration the average speed is $\\tfrac{1}{2}(u+v)$, and time = distance ÷ average speed.',
          math: tex`\bar{v} = \tfrac{1}{2}(${d.u} + ${d.v}) = ${fmtW(r.vavg)}\ ${u('m s-1')}, \qquad t = \frac{${d.s}}{${fmtW(r.vavg)}} = ${fmtA(r.t__avg)}\ ${u('s')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $v = u + at$ **or** $s = \\tfrac{1}{2}(u+v)\\,t$' },
        { mark: tex`$t = ${fmtA(r.t)}\ ${u('s')}$` },
        { note: 'Allow ECF from (a).' },
      ],
    },
  ],
});
