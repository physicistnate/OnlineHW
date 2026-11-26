import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { distributionTable } from '../helpers';

/** Launch speeds (m/s) and, per version, their probabilities. */
const SPEEDS = [3, 4, 5, 6];
const PROBS: Record<string, number[]> = {
  d1: [0.1, 0.3, 0.4, 0.2],
  d2: [0.2, 0.3, 0.3, 0.2],
  d3: [0.15, 0.25, 0.35, 0.25],
  d4: [0.25, 0.35, 0.25, 0.15],
};

export default defineQuestion({
  id: 'ibpp-a4-launcher-variance',
  version: 1,
  title: 'A ball launcher: variance and expected kinetic energy',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.3'],
  uses: ['ibp.A.1.6'],
  math: { topic: 'ibm.4', standards: ['ibm.4.14', 'ibm.4.7'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    dist: { choices: Object.keys(PROBS), base: 'd1' },
    H: { choices: [0.8, 1.0, 1.25], base: 1.0 },
    m: { choices: [0.05, 0.06, 0.08], base: 0.06 },
  },

  compute: (p, c) => {
    const probs = PROBS[p.dist as string];
    const t = Math.sqrt((2 * p.H) / c.g);
    const d5 = 5 * c.carry(t, 't');
    const EX = SPEEDS.reduce((s, v, i) => s + v * probs[i], 0);
    const EX2 = SPEEDS.reduce((s, v, i) => s + v * v * probs[i], 0);
    const varX = EX2 - EX ** 2;
    // E(D) = tE(X), with t from the student's distance in (a) (d = 5t).
    const ED = (c.carry(d5, 'd5') / 5) * EX;
    const varC = c.carry(varX, 'varX', 3);
    c.assume(varC >= 0); // a negative variance earns no follow-through
    const EK = 0.5 * (p.m as number) * (varC + EX ** 2);
    return { t, d5, EX, EX2, varX, ED, EK };
  },

  stem: ({ d, p }) =>
    `A machine launches balls of mass ${Q(Number(d.m).toFixed(3), 'kg')} horizontally from a height of ${Q(Number(d.H).toFixed(2), 'm')} above level ground. The launch speed $X$ varies from ball to ball with this probability distribution:\n${distributionTable('X', SPEEDS, PROBS[p.dist as string], '\\mathrm{m\\,s^{-1}}')}Air resistance is negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the horizontal distance travelled by a ball launched at 5 m s⁻¹ before it lands.',
      response: { kind: 'numeric', answer: 'd5', symbol: 'd', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        { text: 'The time of flight depends only on the height (vertically the ball starts from rest).', math: tex`t = \sqrt{\frac{2h}{g}} = \sqrt{\frac{2 \times ${Number(d.H).toFixed(2)}}{${g}}} = ${fmtW(r.t)}\ ${u('s')}` },
        { math: tex`d = 5 \times ${fmtW(r.t)} = ${fmtA(r.d5)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Time of flight from the vertical motion' }, { mark: tex`$d = ${fmtA(r.d5)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the variance of the launch speed, $\\mathrm{Var}(X)$.',
      response: { kind: 'numeric', answer: 'varX', symbol: '\\mathrm{Var}(X)', unit: 'm2 s-2', positive: true },
      solution: ({ p, r }) => {
        const probs = PROBS[p.dist as string];
        return [
          { math: tex`E(X) = ${SPEEDS.map((v, i) => `${v} \times ${probs[i]}`).join(' + ')} = ${fmtW(r.EX)}` },
          { math: tex`E(X^2) = ${SPEEDS.map((v, i) => `${v}^2 \times ${probs[i]}`).join(' + ')} = ${fmtW(r.EX2)}` },
          { math: tex`[E(X)]^2 = ${fmtW(r.EX)}^2 = ${fmtW(r.EX ** 2)}` },
          { math: tex`\mathrm{Var}(X) = E(X^2) - [E(X)]^2 = ${fmtW(r.EX2)} - ${fmtW(r.EX ** 2)} = ${fmtA(r.varX)}\ ${u('m2 s-2')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$E(X)$ and $E(X^2)$' }, { mark: tex`$\mathrm{Var}(X) = ${fmtA(r.varX)}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'The horizontal distance is $D = tX$, where $t$ is the time of flight. Find the expected horizontal distance, $E(D)$.',
      response: { kind: 'numeric', answer: 'ED', symbol: 'E(D)', unit: 'm', positive: true },
      solution: ({ r }) => [{ text: 'Every ball has the same time of flight, so $D$ is a linear transformation of $X$: $E(D) = tE(X)$ (with $t$ from (a)).', math: tex`E(D) = ${fmtW(r.t)} \times ${fmtW(r.EX)} = ${fmtA(r.ED)}\ ${u('m')}` }],
      markscheme: ({ r }) => [{ mark: '$E(tX) = tE(X)$' }, { mark: tex`$E(D) = ${fmtA(r.ED)}\ ${u('m')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the expected kinetic energy of a ball at launch.',
      response: { kind: 'numeric', answer: 'EK', symbol: 'E(E_k)', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'The kinetic energy is $\\tfrac{1}{2}mX^2$, so its expected value needs $E(X^2) = \\mathrm{Var}(X) + [E(X)]^2$.', math: tex`E\left(\tfrac{1}{2}mX^2\right) = \tfrac{1}{2} \times ${Number(d.m).toFixed(3)} \times (${fmtW(r.varX)} + ${fmtW(r.EX)}^2) = ${fmtA(r.EK)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$E(X^2) = \\mathrm{Var}(X) + [E(X)]^2$' }, { mark: tex`$${fmtA(r.EK)}\ ${u('J')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why is the expected kinetic energy greater than the kinetic energy of a ball launched at the expected speed $E(X)$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$E(X^2) = \\mathrm{Var}(X) + [E(X)]^2$, and the variance is positive because the speeds vary.', correct: true },
          { text: 'Faster balls have more mass.' },
          { text: 'Kinetic energy is lost to air resistance at lower speeds.' },
          { text: '$E(X^2)$ is always equal to $[E(X)]^2$, so the two are the same.' },
        ],
      },
      solution: () => [{ text: 'Kinetic energy depends on the square of the speed. Averaging $X$ before squaring loses the spread of the speeds; the difference is exactly $\\tfrac{1}{2}m\\,\\mathrm{Var}(X)$.' }],
      markscheme: () => [{ note: 'E(X²) − [E(X)]² = Var(X) > 0.' }],
    },
  ],
});
