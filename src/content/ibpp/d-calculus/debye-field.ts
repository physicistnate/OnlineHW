import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

/** The root of (1 + x)e^(−x) = 1/2 (Newton's method): where the screened field is half the unscreened one. */
const HALF_X = (() => {
  let x = 1.7;
  for (let i = 0; i < 40; i++) x -= ((1 + x) * Math.exp(-x) - 0.5) / (-x * Math.exp(-x));
  return x;
})();

export default defineQuestion({
  id: 'ibpp-d5-debye-field',
  version: 1,
  title: 'A screened charge in a plasma: the field from E = −dV/dr',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.8', 'ibp.D.2.7', 'ibp.D.2.9'],
  math: { topic: 'ibm.5', standards: ['ibm.5.6', 'ibm.5.2'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    Q: { choices: [1, 2, 4, 5], base: 2 },
    lam: { choices: [2, 4, 5, 8], base: 5 },
    r1: { choices: [2, 3, 4, 6], base: 4 },
    q: { choices: [0.1, 0.2, 0.5], base: 0.2, dp: 1 },
  },

  compute: (p, c) => {
    const kQ = IB.k * p.Q * 1e-9;
    const x = p.r1 / p.lam;
    const coul = kQ / (p.r1 * 1e-3) ** 2; // the field without the plasma
    const fac = (1 + x) * Math.exp(-x); // the screening factor
    const E = c.carry(coul, undefined, 3) * c.carry(fac, undefined, 3);
    const V1 = (kQ / (p.r1 * 1e-3)) * Math.exp(-x);
    const V2 = (kQ / (2 * p.r1 * 1e-3)) * Math.exp(-2 * x);
    const W = p.q * 1e-9 * (c.carry(V1, undefined, 3) - c.carry(V2, undefined, 3));
    const rHalf = c.carry(HALF_X, undefined, 4) * p.lam;
    return { kQ, x, coul, fac, E, V1, V2, W, half: HALF_X, rHalf };
  },

  stem: ({ d }) =>
    `A small sphere carrying a charge of ${Q(d.Q, 'nC')} is held in an ionized gas (a plasma). Free charges in the plasma gather round the sphere and partly screen it. At a distance $r$ from the centre of the sphere, the electric potential is $$V(r) = \\frac{kQ}{r}\\,e^{-r/\\lambda}$$ where $\\lambda = ${d.lam}$ mm is a length called the Debye length of the plasma and $k = 8.99 \\times 10^{9}\\ \\mathrm{N\\,m^2\\,C^{-2}}$. The arrangement is spherically symmetric, so the field is radial and $E = -\\dfrac{dV}{dr}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Use the product rule to find the electric field strength $E(r)$. Which expression is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$E = \\dfrac{kQ}{r^2}\\left(1 + \\dfrac{r}{\\lambda}\\right)e^{-r/\\lambda}$', correct: true },
          { text: '$E = \\dfrac{kQ}{r^2}\\,e^{-r/\\lambda}$' },
          { text: '$E = \\dfrac{kQ}{\\lambda r}\\,e^{-r/\\lambda}$' },
          { text: '$E = \\dfrac{kQ}{r^2}\\left(1 - \\dfrac{r}{\\lambda}\\right)e^{-r/\\lambda}$' },
        ],
      },
      solution: () => [
        { text: 'Write $V = kQ \\cdot r^{-1} \\cdot e^{-r/\\lambda}$ and differentiate the product:', math: String.raw`\frac{dV}{dr} = kQ\left(-\frac{1}{r^2}\,e^{-r/\lambda} + \frac{1}{r} \times \left(-\frac{1}{\lambda}\right)e^{-r/\lambda}\right) = -\frac{kQ}{r^2}\left(1 + \frac{r}{\lambda}\right)e^{-r/\lambda}` },
        { text: 'So $E = -\\dfrac{dV}{dr} = \\dfrac{kQ}{r^2}\\left(1 + \\dfrac{r}{\\lambda}\\right)e^{-r/\\lambda}$. Without the plasma ($\\lambda \\to \\infty$) this becomes Coulomb’s $kQ/r^2$.' },
      ],
      markscheme: () => [{ note: 'Product rule: both terms, with the factor −1/λ from the chain rule.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `Calculate the electric field strength at ${Q(d.r1, 'mm')} from the centre of the sphere.`,
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'The unscreened (Coulomb) field there:', math: tex`\frac{kQ}{r^2} = \frac{8.99 \times 10^{9} \times ${d.Q} \times 10^{-9}}{(${d.r1} \times 10^{-3})^2} = ${fmtW(r.coul)}\ ${u('V m-1')}` },
        { text: `The screening factor, with $r/\\lambda = ${r.x}$:`, math: tex`\left(1 + ${r.x}\right)e^{-${r.x}} = ${fmtW(r.fac)}` },
        { math: tex`E = ${fmtW(r.coul)} \times ${fmtW(r.fac)} = ${fmtA(r.E)}\ ${u('V m-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Substitution into $E(r)$ with $r$ in metres' }, { mark: tex`$E = ${fmtA(r.E)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d, p }) => `A small bead carrying a charge of ${Q(d.q, 'nC')} is moved slowly from ${Q(2 * p.r1, 'mm')} to ${Q(d.r1, 'mm')} from the centre of the sphere. Calculate the work done on the bead.`,
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, p, r }) => [
        { math: tex`V(${d.r1}\ \mathrm{mm}) = \frac{${fmtW(r.kQ)}}{${d.r1} \times 10^{-3}} \times e^{-${r.x}} = ${fmtW(r.V1)}\ ${u('V')}` },
        { math: tex`V(${2 * p.r1}\ \mathrm{mm}) = \frac{${fmtW(r.kQ)}}{${2 * p.r1} \times 10^{-3}} \times e^{-${2 * r.x}} = ${fmtW(r.V2)}\ ${u('V')}` },
        { text: 'The work done is the charge times the change of potential:', math: tex`W = q\,\Delta V = ${d.q} \times 10^{-9} \times (${fmtW(r.V1)} - ${fmtW(r.V2)}) = ${fmtA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Both potentials from $V(r)$' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'With $x = r/\\lambda$, the screened field is $(1 + x)e^{-x}$ times the unscreened field. Why is $(1 + x)e^{-x} < 1$ for every $x > 0$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It equals 1 at $x = 0$, and its derivative, $-xe^{-x}$, is negative for $x > 0$, so it decreases from 1.', correct: true },
          { text: 'Its derivative, $-xe^{-x}$, is negative, so the function itself is negative for $x > 0$.' },
          { text: '$e^{-x}$ is negative for $x > 0$.' },
          { text: 'It has a maximum value of $2e^{-1}$, at $x = 1$.' },
        ],
      },
      solution: () => [
        { math: String.raw`\frac{d}{dx}\Big((1 + x)e^{-x}\Big) = e^{-x} - (1 + x)e^{-x} = -xe^{-x} < 0 \text{ for } x > 0` },
        { text: 'The function starts at 1 when $x = 0$ and decreases from then on, so the plasma always weakens the field, more and more with distance.' },
      ],
      markscheme: () => [{ note: 'Decreasing from 1: derivative −xe^{−x} < 0.' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => 'Find the distance from the centre of the sphere at which the field is half of the unscreened field.',
      response: { kind: 'numeric', answer: 'rHalf', symbol: 'r', unit: 'mm', positive: true },
      solution: ({ d, r }) => [
        { text: 'Solve $(1 + x)e^{-x} = 0.5$ with a calculator (graph or solver): $x = ' + `${fmtW(r.half)}$.`, math: tex`r = x\lambda = ${fmtW(r.half)} \times ${d.lam} = ${fmtA(r.rHalf)}\ ${u('mm')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$(1 + r/\\lambda)e^{-r/\\lambda} = \\tfrac{1}{2}$ solved with technology' }, { mark: tex`$r = ${fmtA(r.rHalf)}\ ${u('mm')}$` }],
    },
  ],
});
