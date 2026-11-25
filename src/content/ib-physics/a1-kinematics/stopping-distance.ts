import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, workingValue } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-stopping-distance',
  version: 3,
  title: 'Reaction time and stopping distance',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.4', 'ibp.A.1.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    v: { min: 12, max: 30, step: 1, base: 20 },
    tr: { min: 0.5, max: 1.2, step: 0.05, base: 0.7, dp: 2 },
    a: { min: 4, max: 8, step: 0.5, base: 6, dp: 1 },
  },

  compute: (p, c) => {
    const s1 = p.v * p.tr;
    const s2 = p.v ** 2 / (2 * p.a);
    const total = c.carry(s1, 's1') + c.carry(s2, 's2');
    // For the worked solution of (d) only:
    const s1Double = 2 * p.v * p.tr;
    const totalDouble = c.carry(s1Double) + c.carry(s2);
    return { s1, s2, total, s1Double, totalDouble };
  },

  stem: ({ d }) =>
    `A car travels at a constant speed of ${Q(d.v, 'm s-1')} along a straight, level road. The driver sees an obstacle ahead and applies the brakes after a reaction time of ${Q(d.tr, 's')}. The car then decelerates uniformly at ${Q(d.a, 'm s-2')} until it stops.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the distance travelled by the car during the reaction time.',
      response: { kind: 'numeric', answer: 's1', symbol: 's_1', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'During the reaction time the brakes have not yet been applied, so the car keeps moving at constant speed. Distance = speed × time.',
          math: tex`s_1 = v\,t_r = ${d.v} \times ${d.tr} = ${fmtA(r.s1)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$s_1 = ${fmtA(r.s1)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the distance travelled by the car while it is braking.',
      response: { kind: 'numeric', answer: 's2', symbol: 's_2', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Take the direction of motion as positive. The car is slowing down, so its acceleration is negative. It finishes at rest.',
          math: knowns([['u', d.v, 'm s-1'], ['v', '0'], ['a', `-${d.a}`, 'm s-2'], ['s', '?']]),
        },
        {
          text: 'The braking time is not known, so use the equation of motion without $t$ and rearrange for $s$.',
          math: tex`v^2 = u^2 + 2as \quad\Rightarrow\quad s = \frac{v^2 - u^2}{2a}`,
        },
        {
          text: 'Substitute and evaluate. The two negative signs cancel, giving a positive distance.',
          math: tex`s_2 = \frac{0 - ${d.v}^2}{2 \times (-${d.a})} = ${fmtA(r.s2)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $v^2 = u^2 + 2as$ with $v = 0$' },
        { mark: tex`$s_2 = ${fmtA(r.s2)}\ ${u('m')}$` },
        { note: 'Award [2] for a bald correct answer.' },
      ],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Determine the total stopping distance of the car.',
      response: { kind: 'numeric', answer: 'total', symbol: 's', unit: 'm', positive: true },
      solution: ({ r }) => [
        {
          text: 'The stopping distance is the reaction (thinking) distance plus the braking distance.',
          math: tex`s = s_1 + s_2 = ${fmtW(r.s1)} + ${fmtW(r.s2)} = ${fmtA(r.total)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$s = ${fmtA(r.total)}\ ${u('m')}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () =>
        'The driver is tired and their reaction time doubles. The car travels at the same speed and decelerates at the same rate. Which statement explains why the total stopping distance does **not** double?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The reaction distance doubles, but the braking distance does not change.', correct: true },
          { text: 'The braking distance doubles, but the reaction distance does not change.' },
          { text: 'Both distances double, but the car spends less time braking.' },
          { text: 'The deceleration halves, so the braking distance decreases.' },
        ],
      },
      solution: ({ r }) => [
        {
          text: `Only the reaction distance depends on the reaction time. Since $s_1 = v\\,t_r$, it is proportional to $t_r$, so it doubles from $${fmtA(r.s1)}$ m to $${fmtA(r.s1Double)}$ m.`,
        },
        {
          text: `The braking distance $s_2 = \\frac{u^2}{2|a|}$ depends only on the speed and the size of the deceleration, so it stays at $${fmtA(r.s2)}$ m.`,
        },
        {
          text: `The new stopping distance is $${fmtA(r.totalDouble)}$ m, which is less than double the original ($2 \\times ${fmtW(r.total)} = ${fmtW(2 * workingValue(r.total))}$ m).`,
          math: tex`s_{\text{new}} = ${fmtW(r.s1Double)} + ${fmtW(r.s2)} = ${fmtA(r.totalDouble)}\ ${u('m')}`,
        },
      ],
      markscheme: () => [
        { note: 'The reaction distance is proportional to the reaction time; the braking distance does not depend on it.' },
      ],
    },
  ],
});
