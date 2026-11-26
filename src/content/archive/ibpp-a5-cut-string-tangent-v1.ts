/**
 * Archived revision 1 of ibpp-a5-cut-string-tangent, as first published (before review 8: the wall could cross the circle).
 * Assignments made with this revision keep showing it. Do not edit.
 */
import { defineQuestion } from '../../engine/define';
import { fmtA, fmtW } from '../../engine/numbers';
import { Q, tex, unitTex as u } from '../../engine/units';

/** Pythagorean triples (x₀, y₀, r) in units of `unit` metres, so P lies exactly on the circle. */
const TRIPLES: Record<string, [number, number, number]> = {
  t345: [3, 4, 5],
  t435: [4, 3, 5],
  t5_12: [5, 12, 13],
  t12_5: [12, 5, 13],
  t8_15: [8, 15, 17],
  t15_8: [15, 8, 17],
};

interface P {
  pt: string;
  unit: number;
  T: number;
  D: number;
}

/** P = (x₀, y₀) and the radius r, in metres. */
const point = (p: P) => {
  const [a, b, h] = TRIPLES[p.pt];
  const s = (k: number) => Number((k * p.unit).toFixed(6));
  return { x0: s(a), y0: s(b), r: s(h) };
};

export default defineQuestion({
  id: 'ibpp-a5-cut-string-tangent',
  version: 1,
  title: 'Cutting the string: circular motion and the tangent to a circle',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.9', 'ibp.A.2.1'],
  math: { topic: 'ibm.5', standards: ['ibm.5.4', 'ibm.5.6'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    pt: { choices: Object.keys(TRIPLES), base: 't345' },
    unit: { choices: [0.05, 0.1], base: 0.1 },
    T: { choices: [0.8, 1, 1.2, 1.5, 2], base: 1.2 },
    D: { choices: [0.5, 1, 1.5, 2], base: 1 },
  },
  constraint: (p) => {
    const { x0, y0, r } = point(p);
    const v = (2 * Math.PI * r) / p.T;
    return v >= 1 && v <= 10 && Math.abs(x0 - (p.D * y0) / x0) >= 0.2;
  },

  compute: (p, c) => {
    const { x0, y0, r } = point(p);
    const v = (2 * Math.PI * r) / p.T;
    const m = -x0 / y0;
    const run = p.D / c.carry(m, 'm', 3);
    const xHit = x0 + run;
    const dxHit = c.carry(xHit, 'xHit', 3) - x0;
    const L = c.carry(Math.sqrt(dxHit ** 2 + p.D ** 2));
    const t = L / c.carry(v, 'v');
    return { r, v, m, run, xHit, dxHit, L, t };
  },

  stem: ({ p, d }) => {
    const { x0, y0, r } = point(p);
    return `A small puck on a frictionless horizontal table is tied by a string to a peg at the origin O. It moves anticlockwise at constant speed in a circle of radius ${Q(r, 'm')} centred on O, making one revolution every ${Q(d.T, 's')}. Positions on the table are given as coordinates $(x, y)$ in metres. When the puck is at the point P$(${x0}, ${y0})$ the string is cut. A straight wall runs along the line $y = ${Number((y0 + p.D).toFixed(6))}$.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the speed of the puck.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [{ text: 'In one period the puck travels once round the circle:', math: tex`v = \frac{2\pi r}{T} = \frac{2\pi \times ${r.r}}{${d.T}} = ${fmtA(r.v)}\ ${u('m s-1')}` }],
      markscheme: ({ r }) => [{ mark: '$v = 2\\pi r/T$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which describes the motion of the puck after the string is cut?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It moves in a straight line along the tangent to the circle at P, at constant speed.', correct: true },
          { text: 'It moves in a straight line radially outwards, directly away from O.' },
          { text: 'It moves along a curved path that gradually straightens out.' },
          { text: 'It moves in a straight line along the tangent to the circle at P, slowing down because no force acts on it.' },
        ],
      },
      solution: () => [
        {
          text: 'Before the cut, the tension provides the centripetal force. Afterwards no horizontal force acts, so by Newton’s first law the puck keeps the velocity it had at P: along the tangent at P (perpendicular to the radius OP), at constant speed.',
        },
      ],
      markscheme: () => [{ note: 'No resultant force: constant velocity along the tangent at P.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the gradient of the path of the puck after the string is cut.',
      response: { kind: 'numeric', answer: 'm', symbol: '\\text{gradient}' },
      solution: ({ p, r }) => {
        const { x0, y0 } = point(p);
        return [
          { text: 'Near P the circle is the upper half of $x^2 + y^2 = r^2$, so $y = \\sqrt{r^2 - x^2}$. By the chain rule,', math: tex`\frac{dy}{dx} = \frac{-x}{\sqrt{r^2 - x^2}} = -\frac{x}{y}` },
          { math: tex`\text{gradient at P} = -\frac{${x0}}{${y0}} = ${fmtA(r.m)}` },
          { text: `Or: the tangent is perpendicular to the radius OP, whose gradient is $\\tfrac{${y0}}{${x0}}$, and the product of perpendicular gradients is $-1$.` },
        ];
      },
      markscheme: ({ p, r }) => {
        const { x0, y0 } = point(p);
        return [{ mark: tex`$\dfrac{dy}{dx} = -\dfrac{x}{y}$, or the tangent is perpendicular to OP (gradient $\tfrac{${y0}}{${x0}}$)` }, { mark: tex`$${fmtA(r.m)}$` }];
      },
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the $x$-coordinate of the point where the puck hits the wall.',
      response: { kind: 'numeric', answer: 'xHit', symbol: 'x' },
      solution: ({ p, r }) => {
        const { x0, y0 } = point(p);
        const Y = Number((y0 + p.D).toFixed(6));
        return [
          { text: 'The path is the tangent line through P:', math: tex`y - ${y0} = ${fmtW(r.m)}\,(x - ${x0})` },
          { text: `It meets the wall where $y = ${Y}$:`, math: tex`x = ${x0} + \frac{${Y} - ${y0}}{${fmtW(r.m)}} = ${x0} + (${fmtW(r.run)}) = ${fmtA(r.xHit)}` },
          { text: 'The puck moves anticlockwise, so at P it is moving up and to the left: the $y$-coordinate increases, and the puck does reach the wall.' },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Equation of the tangent through P, with $y$ set to the wall' }, { mark: tex`$x = ${fmtA(r.xHit)}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => 'Calculate the time between cutting the string and the puck hitting the wall.',
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ p, r }) => [
        { text: 'The distance from P to the point where the puck hits the wall:', math: tex`d = \sqrt{(${fmtW(r.dxHit)})^2 + ${p.D}^2} = ${fmtW(r.L)}\ ${u('m')}` },
        { text: 'The puck moves at the constant speed from (a):', math: tex`t = \frac{${fmtW(r.L)}}{${fmtW(r.v)}} = ${fmtA(r.t)}\ ${u('s')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Distance along the tangent from P to the wall' }, { mark: tex`$t = ${fmtA(r.t)}\ ${u('s')}$` }, { note: 'Allow ECF from (a) and (d).' }],
    },
  ],
});
