import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Energy per fission (MeV) and seconds in a year. */
const EF = 200;
const YEAR = 3.16e7;

export default defineQuestion({
  id: 'ibp-e4-reactor-fuel',
  version: 1,
  title: 'How much uranium does a power station use?',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.4',
  standards: ['ibp.E.4.1', 'ibp.E.4.3'],
  uses: ['ibp.A.3.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Pe: { min: 600, max: 1600, step: 50, base: 1000 },
    eff: { min: 30, max: 40, step: 1, base: 33 },
  },

  compute: (p, c) => {
    const Pth = p.Pe / (p.eff / 100); // MW
    const rate = (c.carry(Pth, 'Pth') * 1e6) / (EF * 1e6 * IB.e);
    const mass = c.carry(rate, 'rate') * YEAR * 235 * IB.u; // kg per year
    return { Pth, rate, mass };
  },

  stem: ({ d }) =>
    `A nuclear power station produces an electrical power output of ${Q(d.Pe, 'MW')}. Its overall efficiency is ${Q(d.eff, '%')}. Each fission of a uranium-235 nucleus releases about ${Q(EF, 'MeV')}. Take one year as $3.16 \\times 10^{7}$ s.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the thermal power produced in the reactor core.',
      response: { kind: 'numeric', answer: 'Pth', symbol: 'P_{\\text{thermal}}', unit: 'MW', positive: true },
      solution: ({ d, r }) => [{ text: 'Efficiency = useful (electrical) power ÷ input (thermal) power.', math: tex`P_{\text{thermal}} = \frac{${d.Pe}}{${Number(d.eff) / 100}} = ${fmtA(r.Pth)}\ ${u('MW')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.Pth)}\ ${u('MW')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the number of fissions in the core each second.',
      response: { kind: 'numeric', answer: 'rate', symbol: '\\text{fissions per second}', unit: 's-1', positive: true },
      solution: ({ r }) => [
        { math: tex`\text{energy per fission} = ${EF} \times 1.60 \times 10^{-13} = 3.20 \times 10^{-11}\ ${u('J')}` },
        { math: tex`\frac{${fmtW(r.Pth)} \times 10^{6}}{3.20 \times 10^{-11}} = ${fmtA(r.rate)}\ ${u('s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy per fission in joules' }, { mark: tex`$${fmtA(r.rate)}\ ${u('s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the mass of uranium-235 that undergoes fission in one year.',
      response: { kind: 'numeric', answer: 'mass', symbol: 'm', unit: 'kg', positive: true },
      solution: ({ r }) => [
        { text: 'Mass of one uranium-235 nucleus ≈ 235 u = $235 \\times 1.661 \\times 10^{-27}$ kg.', math: tex`m = ${fmtW(r.rate)} \times 3.16 \times 10^{7} \times 235 \times 1.661 \times 10^{-27} = ${fmtA(r.mass)}\ ${u('kg')}` },
        { text: 'About a tonne of uranium-235 a year powers a whole city. (A large AI data centre needing 1 GW would use the entire output of a station like this.)' },
      ],
      markscheme: ({ r }) => [{ mark: 'Number of fissions in a year × mass of one nucleus' }, { mark: tex`$m = ${fmtA(r.mass)}\ ${u('kg')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'What is the role of the heat exchanger in a nuclear power station?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It transfers thermal energy from the coolant that passes through the core to separate water, which turns to steam to drive the turbines.', correct: true },
          { text: 'It slows down the neutrons so that they cause more fissions.' },
          { text: 'It absorbs neutrons to control the rate of fission.' },
          { text: 'It turns thermal energy directly into electrical energy.' },
        ],
      },
      solution: () => [
        {
          text: 'The coolant leaving the core is radioactive, so it stays in a closed loop. In the heat exchanger it heats water in a second loop; that steam drives the turbines and never touches the core.',
        },
      ],
      markscheme: () => [{ note: 'Transfers thermal energy from the coolant to the steam circuit, keeping them separate.' }],
    },
  ],
});
