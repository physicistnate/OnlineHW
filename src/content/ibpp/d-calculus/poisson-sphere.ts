import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

export default defineQuestion({
  id: 'ibpp-d5-poisson-sphere',
  version: 1,
  title: 'Poisson’s equation and the second derivative test in Thomson’s model of the atom',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.8', 'ibp.D.2.7'],
  math: { topic: 'ibm.5', standards: ['ibm.5.7', 'ibm.5.8', 'ibm.5.3'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    R: { choices: [0.5, 0.8, 1, 1.2, 1.5], base: 1, dp: 1 },
    r1: { choices: [0.2, 0.3, 0.4, 0.5], base: 0.5, dp: 1 },
  },
  constraint: (p) => p.r1 < p.R,

  compute: (p, c) => {
    const ke = IB.k * IB.e;
    const R3 = (p.R * 1e-10) ** 3;
    const E1 = (ke * p.r1 * 1e-10) / R3;
    const V2 = -ke / R3; // d²V/dr², the same everywhere inside the sphere
    const rho = -3 * IB.eps0 * c.carry(V2, 'V2', 3);
    return { E1, V2, rho };
  },

  stem: ({ d }) =>
    `In J. J. Thomson’s 1904 model of the hydrogen atom, a positive charge $+e$ is spread evenly through a sphere of radius $R = ${d.R} \\times 10^{-10}$ m, and the electron is free to move inside it. Inside the sphere, the electric potential at a distance $r$ from the centre is $$V(r) = \\frac{ke}{2R^3}\\left(3R^2 - r^2\\right)$$ where $k = 8.99 \\times 10^{9}\\ \\mathrm{N\\,m^2\\,C^{-2}}$ and $e = 1.60 \\times 10^{-19}$ C. The charge is spherically symmetric, so the field is radial and $E = -\\dfrac{dV}{dr}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: ({ d }) => `Find the electric field strength at $r = ${d.r1} \\times 10^{-10}$ m.`,
      response: { kind: 'numeric', answer: 'E1', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ d, r }) => [
        { math: String.raw`\frac{dV}{dr} = \frac{ke}{2R^3}\times(-2r) = -\frac{ke\,r}{R^3} \;\Rightarrow\; E = -\frac{dV}{dr} = \frac{ke\,r}{R^3}` },
        { math: tex`E = \frac{8.99 \times 10^{9} \times 1.60 \times 10^{-19} \times ${d.r1} \times 10^{-10}}{(${d.R} \times 10^{-10})^3} = ${fmtA(r.E1)}\ ${u('V m-1')}` },
        { text: 'The field points radially outwards, and inside the sphere it grows in proportion to $r$.' },
      ],
      markscheme: ({ r }) => [{ mark: '$E = -dV/dr = ker/R^3$' }, { mark: tex`$E = ${fmtA(r.E1)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the value of $\\dfrac{d^2V}{dr^2}$ inside the sphere.',
      response: { kind: 'numeric', answer: 'V2', symbol: '\\dfrac{d^2V}{dr^2}', unit: 'V m-2' },
      solution: ({ d, r }) => [
        { math: tex`\frac{d^2V}{dr^2} = \frac{d}{dr}\left(-\frac{ke\,r}{R^3}\right) = -\frac{ke}{R^3} = -\frac{8.99 \times 10^{9} \times 1.60 \times 10^{-19}}{(${d.R} \times 10^{-10})^3} = ${fmtA(r.V2)}\ ${u('V m-2')}` },
        { text: 'It is the same everywhere inside the sphere, and negative.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.V2)}\ ${u('V m-2')}$ (negative)` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Along any line through the centre, $V$ has a stationary point at the centre of the sphere. Use the second derivative test to decide what kind of stationary point it is.',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A maximum: $\\dfrac{dV}{dr} = 0$ at the centre and $\\dfrac{d^2V}{dr^2} < 0$.', correct: true },
          { text: 'A minimum: $\\dfrac{dV}{dr} = 0$ at the centre and $\\dfrac{d^2V}{dr^2} < 0$.' },
          { text: 'A point of inflexion, because $\\dfrac{d^2V}{dr^2}$ is constant.' },
          { text: 'It cannot be tested, because the field is never zero inside the sphere.' },
        ],
      },
      solution: () => [{ text: 'At the centre $E = 0$, so $dV/dr = 0$; the second derivative is negative, so the potential has a maximum there. The graph of $V$ is an upside-down parabola, highest at the centre.' }],
      markscheme: () => [{ note: 'Maximum: V′ = 0 and V″ < 0.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () =>
        'For a spherically symmetric charge distribution, Poisson’s equation relates the potential to the charge density $\\rho$: $$\\frac{1}{r^2}\\frac{d}{dr}\\left(r^2\\frac{dV}{dr}\\right) = \\frac{d^2V}{dr^2} + \\frac{2}{r}\\frac{dV}{dr} = -\\frac{\\rho}{\\varepsilon_0}$$ Use it to find the charge density inside the sphere. Take $\\varepsilon_0 = 8.85 \\times 10^{-12}\\ \\mathrm{F\\,m^{-1}}$.',
      response: { kind: 'numeric', answer: 'rho', symbol: '\\rho', unit: 'C m-3', positive: true },
      solution: ({ r }) => [
        { text: 'The first derivative term is', math: String.raw`\frac{2}{r}\frac{dV}{dr} = \frac{2}{r}\times\left(-\frac{ke\,r}{R^3}\right) = -\frac{2ke}{R^3} = 2\,\frac{d^2V}{dr^2}` },
        { text: 'so the left-hand side is $3\\,\\dfrac{d^2V}{dr^2}$, and', math: tex`\rho = -3\varepsilon_0\frac{d^2V}{dr^2} = -3 \times 8.85 \times 10^{-12} \times (${fmtW(r.V2)}) = ${fmtA(r.rho)}\ ${u('C m-3')}` },
        { text: 'This is the charge $e$ spread through the volume $\\tfrac{4}{3}\\pi R^3$. Using $d^2V/dr^2$ alone would give only a third of it: with spherical symmetry the $\\dfrac{2}{r}\\dfrac{dV}{dr}$ term matters.' },
      ],
      markscheme: ({ r }) => [{ mark: '$\\dfrac{2}{r}\\dfrac{dV}{dr} = 2\\dfrac{d^2V}{dr^2}$, so the left side is $3V^{\\prime\\prime}$' }, { mark: tex`$\rho = ${fmtA(r.rho)}\ ${u('C m-3')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The electron is moved a little way from the centre and released. What happens?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It oscillates about the centre: its potential energy $-eV$ has a minimum there, so the centre is a stable equilibrium.', correct: true },
          { text: 'It accelerates away from the centre, because $V$ has a maximum there.' },
          { text: 'It stays wherever it is put, because the field inside a charged sphere is zero.' },
          { text: 'It moves to the surface of the sphere and stays there.' },
        ],
      },
      solution: () => [
        { text: 'The electron’s potential energy is $E_p = -eV$, which is smallest where $V$ is largest: at the centre. The force on it, $-eE = -\\dfrac{ke^2}{R^3}\\,r$, points back towards the centre and is proportional to the displacement, so it oscillates about the centre. Thomson hoped that oscillations like this would explain the light given out by atoms.' },
      ],
      markscheme: () => [{ note: 'Oscillates: stable equilibrium (minimum of −eV).' }],
    },
  ],
});
