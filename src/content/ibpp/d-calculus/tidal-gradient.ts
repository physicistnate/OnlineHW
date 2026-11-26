import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

/** The largest difference in g between head and feet taken as survivable (m s⁻²), about 10g. */
const SAFE = 100;

export default defineQuestion({
  id: 'ibpp-d5-tidal-gradient',
  version: 1,
  title: 'Tidal stretching near a black hole: the derivative of g and the tangent-line estimate',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.3', 'ibp.D.1.2'],
  math: { topic: 'ibm.5', standards: ['ibm.5.3', 'ibm.5.4', 'ibm.5.7'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    M: { choices: [3, 5, 10, 20], base: 10 },
    r0: { choices: [2000, 5000, 10000], base: 5000 },
    h: { choices: [1.6, 1.8, 2], base: 1.8, dp: 1 },
  },

  compute: (p, c) => {
    const Mkg = p.M * IB.Msun;
    const r = p.r0 * 1e3;
    const g = (IB.G * Mkg) / r ** 2;
    const grad = (-2 * IB.G * Mkg) / r ** 3;
    const dg = -c.carry(grad, 'grad', 3) * p.h;
    const rSafe = Math.cbrt((2 * IB.G * Mkg * p.h) / SAFE) / 1e3;
    return { Mkg, g, grad, dg, rSafe };
  },

  stem: ({ d }) =>
    `An astronaut of height ${Q(d.h, 'm')} falls feet first towards a black hole of ${d.M} times the mass of the Sun. Far from the black hole, its gravitational field strength at distance $r$ from its centre is $g = \\dfrac{GM}{r^2}$, as for a point mass. Take the mass of the Sun as $1.99 \\times 10^{30}$ kg and $G = 6.67 \\times 10^{-11}\\ \\mathrm{N\\,m^2\\,kg^{-2}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ d }) => `Calculate the gravitational field strength at ${Q(d.r0, 'km')} from the centre of the black hole.`,
      response: { kind: 'numeric', answer: 'g', symbol: 'g', unit: 'm s-2', positive: true },
      solution: ({ d, r }) => [
        { math: tex`M = ${d.M} \times 1.99 \times 10^{30} = ${fmtW(r.Mkg)}\ ${u('kg')}` },
        { math: tex`g = \frac{GM}{r^2} = \frac{6.67 \times 10^{-11} \times ${fmtW(r.Mkg)}}{(${d.r0} \times 10^{3})^2} = ${fmtA(r.g)}\ ${u('m s-2')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$g = ${fmtA(r.g)}\ ${u('m s-2')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Find $\\dfrac{dg}{dr}$ at ${Q(d.r0, 'km')} from the centre.`,
      response: { kind: 'numeric', answer: 'grad', symbol: '\\dfrac{dg}{dr}', unit: 's-2' },
      solution: ({ d, r }) => [
        { math: String.raw`g = GMr^{-2} \;\Rightarrow\; \frac{dg}{dr} = -2GMr^{-3} = -\frac{2GM}{r^3}` },
        { math: tex`\frac{dg}{dr} = -\frac{2 \times 6.67 \times 10^{-11} \times ${fmtW(r.Mkg)}}{(${d.r0} \times 10^{3})^3} = ${fmtA(r.grad)}\ ${u('s-2')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Derivative of $r^{-2}$ is $-2r^{-3}$' }, { mark: tex`$${fmtA(r.grad)}\ ${u('s-2')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Use your answer to (b) to estimate the difference between the gravitational field strengths at the astronaut’s feet and head. (This difference stretches the astronaut.)',
      response: { kind: 'numeric', answer: 'dg', symbol: '\\Delta g', unit: 'm s-2', positive: true },
      solution: ({ d, r }) => [
        { text: 'Over a small distance $\\Delta r$, the tangent-line approximation gives $\\Delta g \\approx \\dfrac{dg}{dr}\\,\\Delta r$:', math: tex`|\Delta g| \approx ${fmtW(-r.grad)} \times ${d.h} = ${fmtA(r.dg)}\ ${u('m s-2')}` },
        { text: 'The feet are pulled harder than the head, so the astronaut is stretched along the line to the black hole (and squeezed from the sides).' },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta g \\approx |dg/dr| \\times h$' }, { mark: tex`$${fmtA(r.dg)}\ ${u('m s-2')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Compare the estimate in (c) with the exact difference $g(r) - g(r + h)$, where $r$ is the distance of the feet from the centre.',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The estimate is slightly too large: $\\dfrac{d^2g}{dr^2} > 0$, so the graph of $g$ lies above its tangent, and $g$ at the head is a little more than the tangent predicts.', correct: true },
          { text: 'The estimate is slightly too small: $\\dfrac{d^2g}{dr^2} > 0$, so the graph of $g$ lies above its tangent.' },
          { text: 'The estimate is exactly right: over a short distance the graph of $g$ is a straight line.' },
          { text: 'The estimate is slightly too large: $\\dfrac{d^2g}{dr^2} < 0$, so the graph of $g$ lies below its tangent.' },
        ],
      },
      solution: () => [
        { math: String.raw`\frac{d^2g}{dr^2} = 6GMr^{-4} > 0` },
        { text: 'The graph of $g$ against $r$ curves upwards (it is concave up), so it lies above its tangent. At the head, $g(r + h)$ is a little larger than the tangent value, so the true difference $g(r) - g(r + h)$ is a little smaller than the estimate. Here $h$ is so small compared with $r$ that the two agree to many significant figures.' },
      ],
      markscheme: () => [{ note: 'Overestimate: g″ > 0 (concave up).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => `Suppose a person can survive a difference of up to ${SAFE} m s⁻² (about 10$g$) between head and feet. Using the approximation in (c), find the closest distance to the centre of the black hole that the astronaut could survive, in kilometres.`,
      response: { kind: 'numeric', answer: 'rSafe', symbol: 'r', unit: 'km', positive: true },
      solution: ({ d, r }) => [
        { math: tex`\frac{2GMh}{r^3} = ${SAFE} \;\Rightarrow\; r = \sqrt[3]{\frac{2 \times 6.67 \times 10^{-11} \times ${fmtW(r.Mkg)} \times ${d.h}}{${SAFE}}} = ${fmtW(r.rSafe * 1000)}\ ${u('m')} = ${fmtA(r.rSafe)}\ ${u('km')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$2GMh/r^3 = 100$ solved for $r$' }, { mark: tex`$r = ${fmtA(r.rSafe)}\ ${u('km')}$` }],
    },
  ],
});
