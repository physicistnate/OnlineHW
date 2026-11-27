import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Radius of the ground-state orbit (Bohr radius), m. */
const R1 = 5.29e-11;

export default defineQuestion({
  id: 'ibp-e1-bohr-hydrogen',
  version: 1,
  title: 'The Bohr model of hydrogen',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.8', 'ibp.E.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    n: { min: 2, max: 7, step: 1, base: 3 },
    lo: { min: 1, max: 3, step: 1, base: 2 },
  },
  constraint: (p) => p.n > p.lo,

  compute: (p, c) => {
    const En = -13.6 / p.n ** 2;
    const dE = 13.6 * (1 / p.lo ** 2 - 1 / p.n ** 2); // eV
    const lam = (IB.h * IB.c) / (c.carry(dE, undefined, 3) * IB.e);
    const nm = lam * 1e9;
    const rn = p.n ** 2 * R1;
    const v = IB.h / (2 * Math.PI * IB.me * p.n * R1);
    return { En, dE, lam, nm, rn, v };
  },

  stem: () =>
    'In the Bohr model of the hydrogen atom, the electron moves in a circular orbit around the proton. Its angular momentum is quantized, $mvr = \\dfrac{nh}{2\\pi}$, and its energy in level $n$ is $E = -\\dfrac{13.6}{n^2}\\ \\mathrm{eV}$. The radius of the ground-state orbit ($n = 1$) is $5.29 \\times 10^{-11}\\ \\mathrm{m}$, and the radius of level $n$ is $n^2$ times this.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate the energy of the electron in level $n = ${p.n}$.`,
      response: { kind: 'numeric', answer: 'En', symbol: 'E', unit: 'eV' },
      solution: ({ p, r }) => [{ math: tex`E_{${p.n}} = -\frac{13.6}{${p.n}^2} = ${fmtA(r.En)}\ ${u('eV')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.En)}\ ${u('eV')}$ (negative)` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Calculate the wavelength, in nm, of the photon emitted when the electron moves from $n = ${p.n}$ to $n = ${p.lo}$.`,
      response: { kind: 'numeric', answer: 'nm', symbol: '\\lambda', unit: 'nm', positive: true },
      solution: ({ p, r }) => [
        {
          math: tex`\Delta E = 13.6\left(\frac{1}{${p.lo}^2} - \frac{1}{${p.n}^2}\right) = ${fmtW(r.dE)}\ ${u('eV')}`,
        },
        {
          math: tex`\lambda = \frac{hc}{\Delta E} = \frac{6.63 \times 10^{-34} \times 3.00 \times 10^{8}}{${fmtW(r.dE)} \times 1.60 \times 10^{-19}} = ${fmtW(r.lam)}\ ${u('m')} = ${fmtA(r.nm)}\ ${u('nm')}`,
        },
        { text: p.lo === 1 ? 'Transitions down to $n = 1$ (the Lyman series) give ultraviolet photons.' : p.lo === 2 ? 'Transitions down to $n = 2$ (the Balmer series) give mostly visible light.' : 'Transitions down to $n = 3$ (the Paschen series) give infrared photons.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\Delta E = ${fmtA(r.dE)}\ ${u('eV')}$` }, { mark: tex`$\lambda = ${fmtA(r.nm)}\ ${u('nm')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ p }) => `Use the quantization of angular momentum to calculate the speed of the electron in level $n = ${p.n}$.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ p, r }) => [
        { math: tex`r_{${p.n}} = ${p.n}^2 \times 5.29 \times 10^{-11} = ${fmtW(r.rn)}\ ${u('m')}` },
        {
          text: 'From $mvr = \\dfrac{nh}{2\\pi}$:',
          math: tex`v = \frac{nh}{2\pi mr} = \frac{${p.n} \times 6.63 \times 10^{-34}}{2\pi \times 9.11 \times 10^{-31} \times ${fmtW(r.rn)}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Radius $n^2 r_1$ and $mvr = nh/2\\pi$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why are the energies of the electron in the atom negative?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Zero energy is taken to be the electron far from the proton; energy must be supplied to remove the electron, so a bound electron has less than zero.', correct: true },
          { text: 'The electron has negative charge, so its energy is negative.' },
          { text: 'The electron’s kinetic energy is negative inside the atom.' },
          { text: 'Energy is lost every time the electron goes round its orbit.' },
        ],
      },
      solution: () => [
        {
          text: 'The electron is bound: work must be done on it to free it. With zero energy defined for an electron at rest far away, every bound state has negative total energy. The ionization energy from level $n$ is $13.6/n^2$ eV.',
        },
      ],
      markscheme: () => [{ note: 'Bound state below the zero of energy at infinite separation.' }],
    },
  ],
});
