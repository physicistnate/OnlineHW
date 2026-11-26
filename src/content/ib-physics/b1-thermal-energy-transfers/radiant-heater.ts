import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b1-radiant-heater',
  version: 1,
  title: 'Radiation from a glowing heater element: Wien, Stefan–Boltzmann and brightness',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.1',
  standards: ['ibp.B.1.8', 'ibp.B.1.9', 'ibp.B.1.10'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    T: { choices: [1000, 1100, 1200, 1300], base: 1200 },
    r: { choices: [3, 4, 5], base: 4 },
    L: { choices: [25, 30, 40], base: 30 },
    dist: { choices: [1.5, 2, 3], base: 2, dp: 1 },
  },

  compute: (p, c) => {
    const lam = (IB.wien / p.T) * 1e6; // μm
    const A = 2 * Math.PI * (p.r / 1000) * (p.L / 100);
    const P = IB.sigma * c.carry(A, undefined, 3) * p.T ** 4;
    const b = c.carry(P, 'P', 3) / (4 * Math.PI * p.dist ** 2);
    return { lam, A, P, b };
  },

  stem: ({ d }) =>
    `The heating element of an electric heater is a metal cylinder of radius ${Q(d.r, 'mm')} and length ${Q(d.L, 'cm')}. When switched on it glows red, at a temperature of ${Q(d.T, 'K')}. Treat the element as a black body; the area of its ends is negligible. The Stefan–Boltzmann constant is $5.67 \\times 10^{-8}\\ \\mathrm{W\\,m^{-2}\\,K^{-4}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the wavelength at which the element emits most strongly, in μm.',
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda_{\\max}', unit: 'μm', positive: true },
      solution: ({ d, r }) => [
        { text: 'Wien’s displacement law:', math: tex`\lambda_{\max} = \frac{2.9 \times 10^{-3}}{${d.T}} = ${fmtW(r.lam / 1e6)}\ ${u('m')} = ${fmtA(r.lam)}\ ${u('μm')}` },
        { text: 'This is in the infrared: most of the radiation is invisible, and only the short-wavelength tail of the spectrum makes the element glow red.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\lambda_{\max} = ${fmtA(r.lam)}\ ${u('μm')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the power radiated by the element.',
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        { text: 'The radiating surface is the curved surface of the cylinder:', math: tex`A = 2\pi rL = 2\pi \times (${Number(d.r) / 1000} \times ${Number(d.L) / 100}) = ${fmtW(r.A)}\ ${u('m2')}` },
        { math: tex`P = \sigma AT^4 = 5.67 \times 10^{-8} \times ${fmtW(r.A)} \times ${d.T}^4 = ${fmtA(r.P)}\ ${u('W')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$A = 2\\pi rL$ in m²' }, { mark: tex`$P = ${fmtA(r.P)}\ ${u('W')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Treating the element as a point source that radiates equally in all directions, calculate the intensity of its radiation ${Q(d.dist, 'm')} away.`,
      response: { kind: 'numeric', answer: 'b', symbol: 'b', unit: 'W m-2', positive: true },
      solution: ({ d, r }) => [{ text: 'The power spreads over a sphere of radius $d$:', math: tex`b = \frac{P}{4\pi d^2} = \frac{${fmtW(r.P)}}{4\pi \times ${d.dist}^2} = ${fmtA(r.b)}\ ${u('W m-2')}` }],
      markscheme: ({ r }) => [{ mark: '$b = L/4\\pi d^2$' }, { mark: tex`$b = ${fmtA(r.b)}\ ${u('W m-2')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The absolute temperature of the element is doubled. What happens to the peak wavelength and to the power radiated?',
      response: {
        kind: 'mcq',
        columns: ['Peak wavelength', 'Power radiated'],
        options: () => [
          { cells: ['halves', '× 16'], correct: true },
          { cells: ['doubles', '× 16'] },
          { cells: ['halves', '× 4'] },
          { cells: ['halves', '× 2'] },
        ],
      },
      solution: () => [{ text: 'By Wien’s law $\\lambda_{\\max} \\propto 1/T$, so the peak wavelength halves. By the Stefan–Boltzmann law $P \\propto T^4$, so the power becomes $2^4 = 16$ times larger.' }],
      markscheme: () => [{ note: 'Halves; 16 times larger.' }],
    },
  ],
});
