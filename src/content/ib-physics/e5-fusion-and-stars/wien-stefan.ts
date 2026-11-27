import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-e5-wien-stefan',
  version: 1,
  title: 'The temperature and size of a star from its spectrum',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.6'],
  uses: ['ibp.B.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    lam: { min: 300, max: 900, step: 25, base: 500 },
    f: { choices: [0.5, 0.8, 1.5, 3, 5, 8, 12, 20, 30, 50], base: 5 },
  },
  // A star between a third of the Sun's radius and a modest giant.
  constraint: (p) => {
    const T = IB.wien / (p.lam * 1e-9);
    const R = Math.sqrt(((p.f as number) * IB.Lsun) / (4 * Math.PI * IB.sigma * T ** 4)) / IB.Rsun;
    return R >= 0.3 && R <= 30;
  },

  compute: (p, c) => {
    const T = IB.wien / (p.lam * 1e-9);
    const L = (p.f as number) * IB.Lsun;
    // T is raised to the fourth power next, so students keep 3 s.f. of it.
    const R = Math.sqrt(L / (4 * Math.PI * IB.sigma * c.carry(T, 'T', 3) ** 4));
    const ratio = c.carry(R, 'R') / IB.Rsun;
    return { T, L, R, ratio };
  },

  stem: ({ d }) =>
    `The intensity of the light from a star is greatest at a wavelength of ${Q(d.lam, 'nm')}. The luminosity of the star is ${d.f} times the luminosity of the Sun, $L_\\odot = 3.83 \\times 10^{26}\\ \\mathrm{W}$. The radius of the Sun is $R_\\odot = 6.96 \\times 10^{8}\\ \\mathrm{m}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the surface temperature of the star.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T', unit: 'K', positive: true },
      solution: ({ d, r }) => [
        { text: 'Wien’s displacement law, with the wavelength in metres.', math: tex`T = \frac{2.9 \times 10^{-3}}{\lambda_{\max}} = \frac{2.9 \times 10^{-3}}{${d.lam} \times 10^{-9}} = ${fmtA(r.T)}\ ${u('K')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$T = ${fmtA(r.T)}\ ${u('K')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the radius of the star.',
      response: { kind: 'numeric', answer: 'R', symbol: 'R', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { math: tex`L = ${d.f} \times 3.83 \times 10^{26} = ${fmtW(r.L)}\ ${u('W')}` },
        {
          text: 'Rearrange the Stefan–Boltzmann law, $L = \\sigma 4\\pi R^2 T^4$, for the radius.',
          math: tex`R = \sqrt{\frac{L}{4\pi\sigma T^4}} = \sqrt{\frac{${fmtW(r.L)}}{4\pi \times 5.67 \times 10^{-8} \times (${fmtW(r.T)})^4}} = ${fmtA(r.R)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $L = \\sigma 4\\pi R^2 T^4$ with $L$ in watts' }, { mark: tex`$R = ${fmtA(r.R)}\ ${u('m')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the radius of the star as a multiple of the radius of the Sun.',
      response: { kind: 'numeric', answer: 'ratio', symbol: 'R/R_\\odot', positive: true },
      solution: ({ r }) => [{ math: tex`\frac{R}{R_\odot} = \frac{${fmtW(r.R)}}{6.96 \times 10^{8}} = ${fmtA(r.ratio)}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.ratio)}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which assumption is made when Wien’s law and the Stefan–Boltzmann law are used for a star?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The star emits radiation as a black body.', correct: true },
          { text: 'The star is on the main sequence.' },
          { text: 'All the radiation from the star is visible light.' },
          { text: 'The star is at a distance of 1 pc.' },
        ],
      },
      solution: () => [
        {
          text: 'Both laws describe black-body radiation, and stellar spectra are close to black-body spectra. Neither law needs the star’s distance or its position on the HR diagram, and most of a star’s radiation may be infrared or ultraviolet.',
        },
      ],
      markscheme: () => [{ note: 'The star is a black body.' }],
    },
  ],
});
