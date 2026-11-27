import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** World primary energy use, about 2 × 10¹³ W (roughly 600 EJ a year). */
const WORLD = 2e13;

export default defineQuestion({
  id: 'ibp-b2-sea-ice-albedo',
  version: 1,
  title: 'Melting sea ice and the Earth’s albedo',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.2',
  standards: ['ibp.B.2.2', 'ibp.B.2.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    I: { choices: [150, 200, 250], base: 200 },
    aIce: { choices: [0.6, 0.7, 0.8], base: 0.7, dp: 1 },
    aSea: { choices: [0.06, 0.1], base: 0.06, dp: 2 },
    A: { choices: [0.5, 1, 2], base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const Pice = (1 - p.aIce) * p.I;
    const Psea = (1 - p.aSea) * p.I;
    const dP = (c.carry(Psea, 'Psea', 3) - c.carry(Pice, 'Pice', 3)) * p.A * 1e12;
    const ratio = c.carry(dP, 'dP', 3) / WORLD;
    return { Pice, Psea, dP, ratio };
  },

  stem: ({ d }) =>
    `In the Arctic summer, the mean intensity of sunlight reaching the sea surface is ${Q(d.I, 'W m-2')}. Sea ice has an albedo of ${d.aIce}; open ocean has an albedo of ${d.aSea}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the intensity absorbed by a surface covered with sea ice.',
      response: { kind: 'numeric', answer: 'Pice', symbol: 'I_{ice}', unit: 'W m-2', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = (1 - ${d.aIce}) \times ${d.I} = ${fmtA(r.Pice)}\ ${u('W m-2')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Pice)}\ ${u('W m-2')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the intensity absorbed by open ocean.',
      response: { kind: 'numeric', answer: 'Psea', symbol: 'I_{sea}', unit: 'W m-2', positive: true },
      solution: ({ d, r }) => [{ math: tex`I = (1 - ${d.aSea}) \times ${d.I} = ${fmtA(r.Psea)}\ ${u('W m-2')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Psea)}\ ${u('W m-2')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `In one summer, an area of ${d.A} million km² of sea ice melts. Calculate the extra power absorbed by this area.`,
      response: { kind: 'numeric', answer: 'dP', symbol: '\\Delta P', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        { text: '1 million km² is $10^{6} \\times 10^{6}\\ \\mathrm{m^2} = 10^{12}\\ \\mathrm{m^2}$:', math: tex`\Delta P = (${fmtW(r.Psea)} - ${fmtW(r.Pice)}) \times ${d.A} \times 10^{12} = ${fmtA(r.dP)}\ ${u('W')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Difference in absorbed intensity × area in m²' }, { mark: tex`$\Delta P = ${fmtA(r.dP)}\ ${u('W')}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The world’s total rate of primary energy use is about $2 \\times 10^{13}$ W. How many times larger is the power found in (c)?',
      response: { kind: 'numeric', answer: 'ratio', symbol: '\\text{ratio}', positive: true },
      solution: ({ r }) => [{ math: tex`\frac{${fmtW(r.dP)}}{2 \times 10^{13}} = ${fmtA(r.ratio)}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.ratio)}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why is the melting of sea ice described as a positive feedback?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Open ocean absorbs more solar energy than ice, which warms the region and melts more ice.', correct: true },
          { text: 'Melting ice absorbs latent heat, which cools the region and stops more ice melting.' },
          { text: 'Ice reflects more infrared radiation from the Earth back to space.' },
          { text: 'Melting ice increases the albedo of the region.' },
        ],
      },
      solution: () => [{ text: 'Replacing ice by darker ocean lowers the albedo, so more sunlight is absorbed. The extra warming melts more ice, lowering the albedo further: the change reinforces itself.' }],
      markscheme: () => [{ note: 'Lower albedo → more absorption → more melting.' }],
    },
  ],
});
