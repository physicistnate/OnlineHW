import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, workingValue } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { dataTable, regression } from '../helpers';

/** Small random errors in the measured times (as fractions), one set per version. */
const NOISE: Record<string, number[]> = {
  n1: [0.004, -0.006, 0.003, -0.002, 0.005, -0.004],
  n2: [-0.005, 0.004, -0.003, 0.006, -0.002, 0.003],
  n3: [0.006, 0.002, -0.005, -0.004, 0.003, 0.001],
  n4: [-0.003, -0.004, 0.005, 0.002, -0.006, 0.004],
  n5: [0.002, 0.005, -0.004, 0.003, -0.003, -0.005],
  n6: [-0.006, 0.003, 0.004, -0.005, 0.002, 0.002],
};

/** The heights (m) and measured times (s), as shown in the table. */
function data(p: { noise: string; h0: number; step: number }) {
  const hs = NOISE[p.noise].map((_, i) => Number((p.h0 + i * p.step).toFixed(2)));
  const ts = hs.map((h, i) => Number((Math.sqrt((2 * h) / 9.81) * (1 + NOISE[p.noise][i])).toFixed(3)));
  return { hs, ts };
}

export default defineQuestion({
  id: 'ibpp-a4-free-fall-regression',
  version: 1,
  title: 'Measuring g with a regression line',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.4'],
  math: { topic: 'ibm.4', standards: ['ibm.4.4'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    noise: { choices: Object.keys(NOISE), base: 'n1' },
    h0: { choices: [0.3, 0.4, 0.5], base: 0.4 },
    step: { choices: [0.2, 0.25], base: 0.2 },
    tq: { choices: [0.4, 0.45, 0.5], base: 0.45 },
  },

  compute: (p, c) => {
    const { hs, ts } = data(p as never);
    const { a, b } = regression(
      ts.map((t) => t * t),
      hs,
    );
    const bc = c.carry(b, 'b');
    const g = 2 * bc;
    const hq = a + bc * (p.tq as number) ** 2;
    return { a, b, g, hq };
  },

  stem: ({ p }) => {
    const { hs, ts } = data(p as never);
    return `A student drops a ball from rest from different heights $h$ and measures the time $t$ it takes to fall, using light gates. Air resistance is negligible.\n${dataTable(
      ['h\\ /\\ \\mathrm{m}', 't\\ /\\ \\mathrm{s}'],
      hs.map((h, i) => [h.toFixed(2), ts[i].toFixed(3)]),
    )}`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'The student plots $h$ against $t^2$. Why?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'From $h = \\tfrac{1}{2}gt^2$, $h$ is proportional to $t^2$: the graph is a straight line through the origin with gradient $\\tfrac{g}{2}$.', correct: true },
          { text: '$h$ is proportional to $t$, so plotting $t^2$ makes the graph curve.' },
          { text: 'Squaring the times removes their random errors.' },
          { text: 'The gradient of the graph of $h$ against $t^2$ is equal to $g$.' },
        ],
      },
      solution: () => [{ text: 'With $u = 0$, $s = ut + \\tfrac{1}{2}at^2$ becomes $h = \\tfrac{1}{2}gt^2$. A graph of $h$ against $t^2$ is a straight line through the origin with gradient $g/2$.' }],
      markscheme: () => [{ note: 'h = ½gt², so h ∝ t²; gradient g/2.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the gradient of the regression line of $h$ on $t^2$.',
      response: { kind: 'numeric', answer: 'b', symbol: '\\text{gradient}', unit: 'm s-2', positive: true, tolerance: { rel: 0.01 } },
      solution: ({ p, r }) => {
        const { ts } = data(p as never);
        return [
          { text: `Calculate $t^2$ for each time (in a calculator list): ${ts.map((t) => fmtW(t * t)).join(', ')} s².` },
          { text: 'Use the calculator’s linear regression with $x = t^2$ and $y = h$:', math: tex`h = a + bt^2 \text{ with } a = ${fmtW(r.a)}\ ${u('m')},\ b = ${fmtW(r.b)}\ ${u('m s-2')}` },
          { math: tex`\text{gradient} = ${fmtA(r.b)}\ ${u('m s-2')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$t^2$ values used as $x$, $h$ as $y$' }, { mark: tex`Gradient $= ${fmtA(r.b)}\ ${u('m s-2')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Hence estimate the acceleration of free fall, $g$.',
      response: { kind: 'numeric', answer: 'g', symbol: 'g', unit: 'm s-2', positive: true, tolerance: { rel: 0.01 } },
      solution: ({ r }) => [{ math: tex`g = 2 \times \text{gradient} = 2 \times ${fmtW(r.b)} = ${fmtA(r.g)}\ ${u('m s-2')}` }],
      markscheme: ({ r }) => [{ mark: tex`$g = ${fmtA(r.g)}\ ${u('m s-2')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ p }) => `Use the regression line to estimate the height from which the ball takes ${(p.tq as number).toFixed(3)} s to fall.`,
      response: { kind: 'numeric', answer: 'hq', symbol: 'h', unit: 'm', positive: true, tolerance: { rel: 0.01 } },
      solution: ({ p, r }) => [
        { math: tex`bt^2 = ${fmtW(r.b)} \times ${(p.tq as number).toFixed(3)}^2 = ${fmtW(workingValue(r.b) * (p.tq as number) ** 2)}\ ${u('m')}` },
        { math: tex`h = a + bt^2 = (${fmtW(r.a)}) + ${fmtW(workingValue(r.b) * (p.tq as number) ** 2)} = ${fmtA(r.hq)}\ ${u('m')}` },
        { text: 'This time is within the range of the data, so the estimate is an interpolation and is reliable.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Substitutes $t^2$ (not $t$) into the regression line' }, { mark: tex`$h = ${fmtA(r.hq)}\ ${u('m')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Pearson’s correlation coefficient for $h$ and $t^2$ is very close to 1. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It shows a strong linear relationship between $h$ and $t^2$, as $h = \\tfrac{1}{2}gt^2$ predicts, but it does not show that the value of $g$ is accurate.', correct: true },
          { text: 'It proves that the value of $g$ found is exactly 9.81 m s⁻².' },
          { text: 'It shows that the gradient of the line is close to 1.' },
          { text: 'It shows that the measured times have no random errors.' },
        ],
      },
      solution: () => [
        {
          text: 'r measures how close the points are to a straight line, not whether the gradient is right. A systematic error (for example a delay in the light gates) can give a perfect straight line with the wrong gradient or intercept.',
        },
      ],
      markscheme: () => [{ note: 'Strong linear correlation; says nothing about accuracy of g.' }],
    },
  ],
});
