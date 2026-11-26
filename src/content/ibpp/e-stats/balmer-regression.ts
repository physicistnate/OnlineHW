import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';
import { dataTable, regression } from '../helpers';

/** Rydberg constant for hydrogen, m⁻¹ (used only to make realistic data). */
const R_H = 1.09678e7;
const LEVELS = [3, 4, 5, 6];

/** Small measurement errors in the wavelengths (nm), one set per version. */
const NOISE: Record<string, number[]> = {
  n1: [0.5, -0.3, 0.4, -0.2],
  n2: [-0.4, 0.5, -0.2, 0.3],
  n3: [0.3, 0.2, -0.4, -0.3],
  n4: [-0.2, -0.4, 0.3, 0.5],
  n5: [0.6, -0.1, -0.3, 0.2],
  n6: [-0.5, 0.3, 0.1, -0.4],
};

/** The measured wavelengths (nm), as shown in the table. */
const measured = (noise: string) => LEVELS.map((n, i) => Number((1e9 / (R_H * (0.25 - 1 / n ** 2)) + NOISE[noise][i]).toFixed(1)));

/** The data a student plots: x = 1/n², y = 1/λ in μm⁻¹. */
function fit(noise: string) {
  const xs = LEVELS.map((n) => 1 / n ** 2);
  const ys = measured(noise).map((l) => 1000 / l);
  return regression(xs, ys);
}

export default defineQuestion({
  id: 'ibpp-e4-balmer-regression',
  version: 1,
  title: 'The Balmer series: the Rydberg constant from a regression line',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.3', 'ibp.E.1.4'],
  math: { topic: 'ibm.4', standards: ['ibm.4.4'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    noise: { choices: Object.keys(NOISE), base: 'n1' },
    nE: { choices: [3, 4, 5], base: 3 },
    nP: { choices: [7, 8, 9], base: 8 },
  },

  compute: (p, c) => {
    const lam = measured(p.noise)[LEVELS.indexOf(p.nE)];
    const EJ = (IB.h * IB.c) / (lam * 1e-9);
    const E = c.carry(EJ, undefined, 3) / IB.e;
    const { a, b } = fit(p.noise);
    const bc = c.carry(b, 'b', 3);
    const R = -bc * 1e6;
    const xP = 1 / p.nP ** 2;
    const ac = c.carry(a, undefined, 3);
    const bxP = bc * xP;
    const invLam = c.carry(ac + bxP, undefined, 4);
    const lamP = 1000 / invLam;
    return { lam, EJ, E, a, b, R, bxP, invLam, lamP };
  },

  stem: ({ p }) =>
    `The visible lines in the spectrum of hydrogen (the Balmer series) are emitted when electrons fall from higher energy levels $n = 3, 4, 5, 6$ to the level $n = 2$. A student measures their wavelengths $\\lambda$ with a diffraction grating:\n${dataTable(
      ['n', '\\lambda\\ /\\ \\mathrm{nm}'],
      LEVELS.map((n, i) => [n, measured(p.noise)[i].toFixed(1)]),
    )}The wavelengths are expected to fit $\\dfrac{1}{\\lambda} = R\\left(\\dfrac{1}{2^2} - \\dfrac{1}{n^2}\\right)$, where $R$ is the Rydberg constant.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Calculate, in eV, the energy of a photon of the line emitted when electrons fall from $n = ${p.nE}$.`,
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'eV', positive: true },
      solution: ({ r }) => [
        { text: 'The photon carries the energy difference between the two levels:', math: tex`E = \frac{hc}{\lambda} = \frac{6.63 \times 10^{-34} \times 3.00 \times 10^{8}}{${r.lam.toFixed(1)} \times 10^{-9}} = ${fmtW(r.EJ)}\ ${u('J')}` },
        { math: tex`E = \frac{${fmtW(r.EJ)}}{1.60 \times 10^{-19}} = ${fmtA(r.E)}\ ${u('eV')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = \dfrac{hc}{\lambda} = ${fmtA(r.E)}\ ${u('eV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'The student plots $\\dfrac{1}{\\lambda}$, in $\\mu\\mathrm{m}^{-1}$, against $\\dfrac{1}{n^2}$. Find the gradient of the regression line of $\\dfrac{1}{\\lambda}$ on $\\dfrac{1}{n^2}$.',
      response: { kind: 'numeric', answer: 'b', symbol: '\\text{gradient}', unit: 'μm-1', tolerance: { rel: 0.01 } },
      solution: ({ p, r }) => [
        { text: `With $x = \\dfrac{1}{n^2}$: ${LEVELS.map((n) => fmtW(1 / n ** 2)).join(', ')}.` },
        { text: `And $y = \\dfrac{1}{\\lambda}$ in $\\mu\\mathrm{m}^{-1}$ (for example $\\dfrac{1}{${(measured(p.noise)[0] / 1000).toFixed(4)}\\ \\mu\\mathrm{m}}$): ${measured(p.noise).map((l) => fmtW(1000 / l)).join(', ')}.` },
        { text: 'The GDC’s linear regression of $y$ on $x$ gives', math: tex`\frac{1}{\lambda} = a + b\cdot\frac{1}{n^2} \text{ with } a = ${fmtW(r.a)},\ b = ${fmtW(r.b)}\ ${u('μm-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$1/n^2$ as $x$ and $1/\\lambda$ as $y$' }, { mark: tex`Gradient $= ${fmtA(r.b)}\ ${u('μm-1')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Hence determine the Rydberg constant $R$, in m⁻¹.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'm-1', positive: true, tolerance: { rel: 0.01 } },
      solution: ({ r }) => [
        { text: 'Expanding the bracket, $\\dfrac{1}{\\lambda} = \\dfrac{R}{4} - R\\cdot\\dfrac{1}{n^2}$: a straight line with gradient $-R$.' },
        { math: tex`R = -(${fmtW(r.b)}\ ${u('μm-1')}) = ${fmtW(-r.b)} \times 10^{6}\ ${u('m-1')} = ${fmtA(r.R)}\ ${u('m-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$R = -\text{gradient} = ${fmtA(r.R)}\ ${u('m-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ p }) => `Use the regression line to predict the wavelength of the line emitted when electrons fall from $n = ${p.nP}$ to $n = 2$.`,
      response: { kind: 'numeric', answer: 'lamP', symbol: '\\lambda', unit: 'nm', positive: true },
      solution: ({ p, r }) => [
        { math: tex`b \times \frac{1}{${p.nP}^2} = \frac{${fmtW(r.b)}}{${p.nP ** 2}} = ${fmtW(r.bxP)}\ ${u('μm-1')}` },
        { math: tex`\frac{1}{\lambda} = ${fmtW(r.a)} + (${fmtW(r.bxP)}) = ${fmtW(r.invLam)}\ ${u('μm-1')}` },
        { math: tex`\lambda = \frac{1}{${fmtW(r.invLam)}}\ ${u('μm')} = ${fmtA(r.lamP)}\ ${u('nm')}` },
        { text: `$\\tfrac{1}{${p.nP ** 2}}$ is just outside the range of the data, so this is a small extrapolation. It is reliable here because the physics predicts a straight line.` },
      ],
      markscheme: ({ r }) => [{ mark: 'Substitutes $1/n^2$ (not $n$) into the regression line' }, { mark: tex`$\lambda = ${fmtA(r.lamP)}\ ${u('nm')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'What does the intercept $a$ of the regression line on the $\\dfrac{1}{\\lambda}$ axis represent?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$\\dfrac{1}{\\lambda}$ in the limit $n \\to \\infty$: $\\dfrac{1}{a}$ is the shortest wavelength in the series, from a free electron falling to $n = 2$.', correct: true },
          { text: '$\\dfrac{1}{\\lambda}$ for the line from $n = 1$, the longest wavelength in the series.' },
          { text: 'The random error in the measured wavelengths.' },
          { text: 'The wavelength of the brightest line in the series.' },
        ],
      },
      solution: ({ r }) => [
        { text: `At the intercept $\\dfrac{1}{n^2} = 0$, that is, $n \\to \\infty$. Then $\\dfrac{1}{\\lambda} = \\dfrac{R}{4}$, so the series limit is $\\lambda = \\dfrac{1}{${fmtW(r.a)}}\\ \\mu\\mathrm{m} = ${fmtA(1000 / r.a)}\\ \\mathrm{nm}$: the lines crowd together towards this wavelength.` },
      ],
      markscheme: () => [{ note: 'n → ∞: the series limit (shortest wavelength).' }],
    },
  ],
});
