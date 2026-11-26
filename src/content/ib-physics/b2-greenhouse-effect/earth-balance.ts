import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b2-earth-balance',
  version: 1,
  title: 'The Earth’s energy balance and its equilibrium temperature',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.2',
  standards: ['ibp.B.2.3', 'ibp.B.2.4', 'ibp.B.2.1', 'ibp.B.2.5'],
  uses: ['ibp.B.1.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    a: { choices: [0.28, 0.29, 0.3, 0.31], base: 0.3, dp: 2 },
    Ts: { choices: [286, 287, 288, 289], base: 288 },
  },

  compute: (p, c) => {
    const I = ((1 - p.a) * IB.S) / 4;
    const Ic = c.carry(I, 'I', 3);
    const Tbb = (Ic / IB.sigma) ** 0.25;
    const e = Ic / (IB.sigma * p.Ts ** 4);
    return { I, Tbb, e };
  },

  stem: ({ d }) =>
    `The solar constant is $1.36 \\times 10^{3}\\ \\mathrm{W\\,m^{-2}}$ and the albedo of the Earth is ${d.a}. The Stefan–Boltzmann constant is $5.67 \\times 10^{-8}\\ \\mathrm{W\\,m^{-2}\\,K^{-4}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the mean intensity of solar radiation absorbed by the Earth, averaged over its whole surface.',
      response: { kind: 'numeric', answer: 'I', symbol: 'I', unit: 'W m-2', positive: true },
      solution: ({ d, r }) => [
        { text: 'The Earth intercepts sunlight over a disc of area $\\pi R^2$ but has a surface area of $4\\pi R^2$; a fraction equal to the albedo is reflected:', math: tex`I = \frac{(1 - ${d.a}) \times 1360}{4} = ${fmtA(r.I)}\ ${u('W m-2')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$I = (1 - \alpha)S/4 = ${fmtA(r.I)}\ ${u('W m-2')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Treating the Earth as a black body, calculate its equilibrium temperature.',
      response: { kind: 'numeric', answer: 'Tbb', symbol: 'T', unit: 'K', positive: true },
      solution: ({ r }) => [{ text: 'In equilibrium the intensity radiated, $\\sigma T^4$, equals the intensity absorbed:', math: tex`T = \sqrt[4]{\frac{${fmtW(r.I)}}{5.67 \times 10^{-8}}} = ${fmtA(r.Tbb)}\ ${u('K')}` }],
      markscheme: ({ r }) => [{ mark: '$\\sigma T^4 = (1 - \\alpha)S/4$' }, { mark: tex`$T = ${fmtA(r.Tbb)}\ ${u('K')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `The mean surface temperature of the Earth is ${Q(d.Ts, 'K')}. Calculate the emissivity of the Earth–atmosphere system that gives this temperature.`,
      response: { kind: 'numeric', answer: 'e', symbol: 'e', positive: true },
      solution: ({ d, r }) => [{ math: tex`e\sigma T^4 = I \;\Rightarrow\; e = \frac{${fmtW(r.I)}}{5.67 \times 10^{-8} \times ${d.Ts}^4} = ${fmtA(r.e)}` }],
      markscheme: ({ r }) => [{ mark: '$e\\sigma T^4 = (1 - \\alpha)S/4$' }, { mark: tex`$e = ${fmtA(r.e)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why is the Earth’s mean surface temperature higher than the black-body temperature in (b)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Greenhouse gases absorb infrared radiation from the surface and re-emit some of it back towards the surface.', correct: true },
          { text: 'Greenhouse gases absorb visible light from the Sun before it reaches the surface.' },
          { text: 'The atmosphere reflects more sunlight than the surface does.' },
          { text: 'The Earth’s core supplies more energy than the Sun.' },
        ],
      },
      solution: () => [{ text: 'The atmosphere is mostly transparent to the incoming visible light but absorbs much of the outgoing infrared radiation. Greenhouse gases re-emit this energy in all directions, some back to the surface, so the surface must be warmer than a black body to radiate away what it absorbs.' }],
      markscheme: () => [{ note: 'Infrared absorbed and re-emitted by greenhouse gases, partly back to the surface.' }],
    },
  ],
});
