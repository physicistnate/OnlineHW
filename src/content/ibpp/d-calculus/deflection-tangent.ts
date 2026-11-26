import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

interface P {
  V: number;
  d: number;
  v: number;
  L: number;
}

/** The deflection (mm) of the electrons as they leave the plates. */
const exitDeflection = (p: P) => ((IB.e * (p.V / (p.d / 100))) / (2 * IB.me * (p.v * 1e7) ** 2)) * (p.L / 100) ** 2 * 1000;

export default defineQuestion({
  id: 'ibpp-d5-deflection-tangent',
  version: 1,
  title: 'An electron beam between deflecting plates: the parabola and its tangent',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.1'],
  uses: ['ibp.A.1', 'ibp.D.2.5'],
  math: { topic: 'ibm.5', standards: ['ibm.5.4', 'ibm.5.3'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { choices: [100, 150, 200, 300], base: 200 },
    d: { choices: [2, 3, 4], base: 2 },
    v: { choices: [2, 2.5, 3, 4], base: 3, dp: 1 },
    L: { choices: [4, 5, 6], base: 5 },
    D: { choices: [10, 15, 20], base: 15 },
  },
  // The beam must leave the plates without hitting them.
  constraint: (p) => exitDeflection(p) < 0.8 * (p.d * 10) / 2,

  compute: (p, c) => {
    const E = c.carry(p.V / (p.d / 100), undefined, 3);
    const k = (IB.e * E) / (2 * IB.me * (p.v * 1e7) ** 2);
    const kc = c.carry(k, 'k', 3);
    const yL = kc * (p.L / 100) ** 2 * 1000; // mm
    const grad = 2 * kc * (p.L / 100);
    const Y = c.carry(yL, 'yL', 3) + c.carry(grad, 'grad', 3) * p.D * 10; // mm
    return { E, k, yL, grad, Y };
  },

  stem: ({ d }) =>
    `Electrons moving at $${d.v} \\times 10^{7}\\ \\mathrm{m\\,s^{-1}}$ enter the space between two parallel plates, midway between them and moving parallel to them. The plates are ${Q(d.L, 'cm')} long and ${Q(d.d, 'cm')} apart, with a potential difference of ${Q(d.V, 'V')} between them. Take $x$ as the distance travelled along the plates and $y$ as the deflection towards the positive plate. Between the plates the electrons follow the parabola $$y = kx^2, \\qquad k = \\frac{eE}{2m_ev^2}$$ where $E$ is the field between the plates, $e = 1.60 \\times 10^{-19}$ C and $m_e = 9.11 \\times 10^{-31}$ kg.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate $k$.',
      response: { kind: 'numeric', answer: 'k', symbol: 'k', unit: 'm-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'The parabola comes from $x = vt$ and $y = \\tfrac{1}{2}at^2$ with $a = eE/m_e$. The field between the plates is', math: tex`E = \frac{V}{d} = \frac{${d.V}}{${Number(d.d) / 100}} = ${fmtW(r.E)}\ ${u('V m-1')}` },
        { math: tex`k = \frac{eE}{2m_ev^2} = \frac{1.60 \times 10^{-19} \times ${fmtW(r.E)}}{2 \times 9.11 \times 10^{-31} \times (${d.v} \times 10^{7})^2} = ${fmtA(r.k)}\ ${u('m-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$E = V/d$ with $d$ in metres' }, { mark: tex`$k = ${fmtA(r.k)}\ ${u('m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the deflection of the electrons as they leave the plates, in millimetres.',
      response: { kind: 'numeric', answer: 'yL', symbol: 'y', unit: 'mm', positive: true },
      solution: ({ d, r }) => [{ math: tex`y = kL^2 = ${fmtW(r.k)} \times ${Number(d.L) / 100}^2 = ${fmtW(r.yL / 1000)}\ ${u('m')} = ${fmtA(r.yL)}\ ${u('mm')}` }],
      markscheme: ({ r }) => [{ mark: tex`$y = ${fmtA(r.yL)}\ ${u('mm')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Find the gradient $\\dfrac{dy}{dx}$ of the path as the electrons leave the plates.',
      response: { kind: 'numeric', answer: 'grad', symbol: '\\dfrac{dy}{dx}', positive: true },
      solution: ({ d, r }) => [{ math: tex`\frac{dy}{dx} = 2kx = 2 \times ${fmtW(r.k)} \times ${Number(d.L) / 100} = ${fmtA(r.grad)}` }],
      markscheme: ({ r }) => [{ mark: tex`$\dfrac{dy}{dx} = 2kL = ${fmtA(r.grad)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) => `Once they leave the plates, the electrons travel in a straight line along the tangent to their path at $x = L$. A screen is ${Q(d.D, 'cm')} beyond the end of the plates. Find the deflection of the spot on the screen, in millimetres.`,
      response: { kind: 'numeric', answer: 'Y', symbol: 'Y', unit: 'mm', positive: true },
      solution: ({ d, r }) => [
        { text: 'Along the tangent the deflection grows by the gradient times the distance travelled:', math: tex`Y = y(L) + \frac{dy}{dx}\,D = ${fmtW(r.yL)} + ${fmtW(r.grad)} \times ${Number(d.D) * 10} = ${fmtA(r.Y)}\ ${u('mm')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Deflection at the plates + gradient × distance to the screen' }, { mark: tex`$Y = ${fmtA(r.Y)}\ ${u('mm')}$` }, { note: 'Allow ECF from (b) and (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Extended backwards, the tangent at $x = L$ crosses the original line of the beam ($y = 0$). Where?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'At $x = L/2$, the middle of the plates, whatever the speed and the field.', correct: true },
          { text: 'At $x = 0$, where the electrons enter the plates.' },
          { text: 'At $x = L/3$.' },
          { text: 'At a point that depends on the speed of the electrons.' },
        ],
      },
      solution: () => [
        { text: 'The tangent at $x = L$ is $y - kL^2 = 2kL\\,(x - L)$. Putting $y = 0$ gives $x - L = -\\tfrac{1}{2}L$, so $x = \\tfrac{1}{2}L$. Seen from the screen, the electrons seem to come from a point in the middle of the plates, so the spot moves in proportion to the deflecting voltage.' },
      ],
      markscheme: () => [{ note: 'x = L/2.' }],
    },
  ],
});
