import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b2-greenhouse-gases',
  version: 1,
  title: 'Why greenhouse gases trap the Earth’s radiation but not the Sun’s',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.2',
  standards: ['ibp.B.2.5', 'ibp.B.2.1'],
  uses: ['ibp.B.1.10', 'ibp.B.1.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    Tsun: { choices: [5700, 5800, 5900], base: 5800 },
    Te: { choices: [284, 286, 288, 290], base: 288 },
  },

  compute: (p) => {
    const lamSun = (IB.wien / p.Tsun) * 1e6; // μm
    const lamEarth = (IB.wien / p.Te) * 1e6;
    const Iearth = IB.sigma * p.Te ** 4;
    return { lamSun, lamEarth, Iearth };
  },

  stem: ({ d }) =>
    `The surface of the Sun behaves like a black body at ${Q(d.Tsun, 'K')}, and the Earth’s surface like a black body at ${Q(d.Te, 'K')}. Wien’s displacement constant is $2.9 \\times 10^{-3}$ m K and the Stefan–Boltzmann constant is $5.67 \\times 10^{-8}\\ \\mathrm{W\\,m^{-2}\\,K^{-4}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the peak wavelength of the Sun’s radiation, in μm.',
      response: { kind: 'numeric', answer: 'lamSun', symbol: '\\lambda_{\\max}', unit: 'μm', positive: true },
      solution: ({ d, r }) => [{ math: tex`\lambda_{\max} = \frac{2.9 \times 10^{-3}}{${d.Tsun}} = ${fmtW(r.lamSun / 1e6)}\ ${u('m')} = ${fmtA(r.lamSun)}\ ${u('μm')}` }, { text: 'This is visible light.' }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.lamSun)}\ ${u('μm')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the peak wavelength of the radiation from the Earth’s surface, in μm.',
      response: { kind: 'numeric', answer: 'lamEarth', symbol: '\\lambda_{\\max}', unit: 'μm', positive: true },
      solution: ({ d, r }) => [{ math: tex`\lambda_{\max} = \frac{2.9 \times 10^{-3}}{${d.Te}} = ${fmtW(r.lamEarth / 1e6)}\ ${u('m')} = ${fmtA(r.lamEarth)}\ ${u('μm')}` }, { text: 'This is in the infrared.' }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.lamEarth)}\ ${u('μm')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the intensity of the radiation emitted by the Earth’s surface.',
      response: { kind: 'numeric', answer: 'Iearth', symbol: 'I', unit: 'W m-2', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = \sigma T^4 = 5.67 \times 10^{-8} \times ${d.Te}^4 = ${fmtA(r.Iearth)}\ ${u('W m-2')}` }],
      markscheme: ({ r }) => [{ mark: tex`$I = ${fmtA(r.Iearth)}\ ${u('W m-2')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why do greenhouse gases such as carbon dioxide absorb much of the Earth’s radiation but little of the Sun’s?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Infrared radiation has frequencies that match the natural frequencies of vibration of the gas molecules, so it is absorbed by resonance; visible light does not.', correct: true },
          { text: 'The Earth’s radiation is more intense than the Sun’s at the top of the atmosphere.' },
          { text: 'Visible light travels faster through the atmosphere than infrared radiation.' },
          { text: 'Greenhouse gases are found only near the surface, where the Earth’s radiation starts.' },
        ],
      },
      solution: () => [{ text: 'Molecules such as CO₂, H₂O, CH₄ and N₂O have bonds that bend and stretch at infrared frequencies. Radiation at those frequencies drives the vibrations (resonance) and is absorbed; most visible light passes straight through.' }],
      markscheme: () => [{ note: 'Resonance with molecular vibrations at infrared frequencies.' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'What is the enhanced greenhouse effect?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Human activities, such as burning fossil fuels, increase the concentration of greenhouse gases, so more infrared is re-emitted towards the surface and the mean temperature rises.', correct: true },
          { text: 'The natural warming of the Earth by greenhouse gases, without which the surface would be about 30 K colder.' },
          { text: 'A thinning of the ozone layer, which lets more ultraviolet radiation reach the surface.' },
          { text: 'An increase in the Earth’s albedo caused by clouds.' },
        ],
      },
      solution: () => [{ text: 'The natural greenhouse effect keeps the Earth habitable. The enhanced greenhouse effect is the extra warming caused by the extra greenhouse gases that human activity adds.' }],
      markscheme: () => [{ note: 'Extra warming from human-made increases in greenhouse gases.' }],
    },
  ],
});
