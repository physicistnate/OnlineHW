import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const RAD = Math.PI / 180;

export default defineQuestion({
  id: 'ibpp-a4-random-launch-angle',
  version: 1,
  title: 'A launcher with a random angle: a continuous random variable',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.6'],
  math: { topic: 'ibm.4', standards: ['ibm.4.14'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    v: { min: 8, max: 12, step: 1, base: 10 },
    lo: { choices: [20, 25, 30], base: 30 },
    hi: { choices: [60, 65, 70], base: 60 },
    k: { choices: [0.8, 0.85, 0.9], base: 0.9 },
  },

  compute: (p, c) => {
    const Rlo = (p.v ** 2 * sinD(2 * (p.lo as number))) / c.g;
    const width = (p.hi as number) - (p.lo as number);
    const p40 = (40 - (p.lo as number)) / width;
    // sin 2θ ≥ k between θ1 and 90° − θ1.
    const t1 = (Math.asin(p.k as number) / RAD) / 2;
    const a = Math.max(p.lo as number, t1);
    const b = Math.min(p.hi as number, 90 - t1);
    const pFar = (b - a) / width;
    const ER = (p.v ** 2 / c.g) * ((cosD(2 * (p.lo as number)) - cosD(2 * (p.hi as number))) / (2 * width * RAD));
    return { Rlo, width, p40, t1, a, b, pFar, ER };
  },

  stem: ({ d }) =>
    `A launcher throws a ball from level ground with speed ${Q(d.v, 'm s-1')}. The launch angle $\\Theta$ (in degrees) is random: it is equally likely to be anywhere between ${d.lo}° and ${d.hi}°, so its probability density function is constant on that interval. Air resistance is negligible, and the range on level ground is $R = \\dfrac{v^2\\sin 2\\theta}{g}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Calculate the range of a ball launched at ${d.lo}°.`,
      response: { kind: 'numeric', answer: 'Rlo', symbol: 'R', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [{ math: tex`R = \frac{${d.v}^2 \sin ${2 * Number(d.lo)}^{\circ}}{${g}} = ${fmtA(r.Rlo)}\ ${u('m')}` }],
      markscheme: ({ r }) => [{ mark: 'Use of the range formula (or components and the time of flight)' }, { mark: tex`$R = ${fmtA(r.Rlo)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find $P(\\Theta < 40°)$.',
      response: { kind: 'numeric', answer: 'p40', symbol: 'P', positive: true },
      solution: ({ d, r }) => [{ text: `The density is $\\dfrac{1}{${r.width}}$ per degree, so the probability is the area of a rectangle:`, math: tex`P(\Theta < 40^{\circ}) = \frac{40 - ${d.lo}}{${r.width}} = ${fmtA(r.p40)}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.p40)}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Find the probability that the range is more than ${Math.round(Number(d.k) * 100)}% of the greatest possible range for this speed.`,
      response: { kind: 'numeric', answer: 'pFar', symbol: 'P', positive: true },
      solution: ({ d, r }) => [
        { text: `The greatest range is at 45°, where $\\sin 2\\theta = 1$. So the condition is $\\sin 2\\theta > ${d.k}$:`, math: tex`2\theta > \arcsin ${d.k} = ${fmtW(2 * r.t1)}^{\circ} \text{ and } 2\theta < 180^{\circ} - ${fmtW(2 * r.t1)}^{\circ} \;\Rightarrow\; ${fmtW(r.t1)}^{\circ} < \theta < ${fmtW(90 - r.t1)}^{\circ}` },
        { text: `Within the launcher’s range of angles this is from ${fmtW(r.a)}° to ${fmtW(r.b)}°:`, math: tex`P = \frac{${fmtW(r.b)} - ${fmtW(r.a)}}{${r.width}} = ${fmtA(r.pFar)}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Interval of angles from $\\sin 2\\theta > k$, symmetric about 45°' }, { mark: tex`$P = ${fmtA(r.pFar)}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the expected range, $E(R)$.',
      response: { kind: 'numeric', answer: 'ER', symbol: 'E(R)', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Work in radians, so that the integral of $\\sin 2\\theta$ is $-\\tfrac{1}{2}\\cos 2\\theta$. With $\\alpha$ and $\\beta$ the end angles, the density is $\\dfrac{1}{\\beta - \\alpha}$:',
          math: tex`E(R) = \int_\alpha^\beta \frac{v^2\sin 2\theta}{g}\cdot\frac{1}{\beta - \alpha}\,d\theta = \frac{v^2}{g}\cdot\frac{\cos 2\alpha - \cos 2\beta}{2(\beta - \alpha)}`,
        },
        { math: tex`E(R) = \frac{${d.v}^2}{${g}} \times \frac{\cos ${2 * Number(d.lo)}^{\circ} - \cos ${2 * Number(d.hi)}^{\circ}}{2 \times ${fmtW(r.width * RAD)}} = ${fmtA(r.ER)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$E(R) = \\int R(\\theta)f(\\theta)\\,d\\theta$ with $f$ constant, in radians' }, { mark: tex`$E(R) = ${fmtA(r.ER)}\ ${u('m')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why is $E(R)$ less than the range at the mean angle?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The range is greatest near 45° and smaller on both sides, so averaging over the angles gives less than the range near the middle.', correct: true },
          { text: 'Balls launched at larger angles travel faster.' },
          { text: 'The probability density is greatest at the ends of the interval.' },
          { text: 'Air resistance reduces the range of every ball.' },
        ],
      },
      solution: () => [{ text: '$\\sin 2\\theta$ curves downwards on both sides of its maximum, so the average of $R$ over the interval is less than $R$ at the middle angle.' }],
      markscheme: () => [{ note: 'R(θ) is concave near 45°: the average of R is less than R at the average angle.' }],
    },
  ],
});
