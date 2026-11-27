import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Petrol: density in kg per litre, and energy released per kilogram in MJ. */
const RHO = 0.74;
const PETROL = 46;
/** Efficiencies (percent) of a petrol engine and of an electric car's battery and motor. */
const ETA_PETROL = 25;
const ETA_ELECTRIC = 85;

export default defineQuestion({
  id: 'ibp-a3-energy-density',
  version: 1,
  title: 'Petrol and batteries: energy density and efficiency',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.7', 'ibp.A.3.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { min: 30, max: 70, step: 5, base: 50 },
    Eb: { min: 40, max: 100, step: 5, base: 60 },
    mb: { min: 250, max: 650, step: 25, base: 400 },
  },
  // A realistic battery (0.4 to 0.75 MJ per kg), and a petrol car with a few times more useful energy.
  constraint: (p) => {
    const eb = (p.Eb * 3.6) / p.mb;
    const ratio = (ETA_PETROL * p.V * RHO * PETROL) / (ETA_ELECTRIC * p.Eb * 3.6);
    return eb >= 0.4 && eb <= 0.75 && ratio >= 1.5 && ratio <= 4.5;
  },

  compute: (p, c) => {
    const mp = p.V * RHO;
    const Ep = c.carry(mp) * PETROL; // MJ
    const EbMJ = p.Eb * 3.6;
    const eb = EbMJ / p.mb;
    const usefulP = (ETA_PETROL / 100) * c.carry(Ep, 'Ep');
    const usefulB = (ETA_ELECTRIC / 100) * EbMJ;
    const ratio = c.carry(usefulP) / usefulB;
    return { mp, Ep, EbMJ, eb, usefulP, usefulB, ratio };
  },

  stem: ({ d }) =>
    `A petrol car has a fuel tank that holds ${Q(d.V, 'L')} of petrol. Petrol has a density of ${Q(RHO, 'kg L-1')} and an energy density of ${Q(PETROL, 'MJ kg-1')}. An electric car has a battery that stores ${Q(d.Eb, 'kW h')} of energy when fully charged. The mass of the battery is ${Q(d.mb, 'kg')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the energy released when a full tank of petrol is burned.',
      response: { kind: 'numeric', answer: 'Ep', symbol: 'E', unit: 'MJ', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'First find the mass of the petrol, then multiply by the energy released by each kilogram.',
          math: tex`m = \rho V = ${RHO} \times ${d.V} = ${fmtW(r.mp)}\ ${u('kg')}`,
        },
        {
          math: tex`E = ${fmtW(r.mp)} \times ${PETROL} = ${fmtA(r.Ep)}\ ${u('MJ')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`Mass of petrol $= ${fmtA(r.mp)}\ ${u('kg')}$` }, { mark: tex`$E = ${fmtA(r.Ep)}\ ${u('MJ')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the energy density of the battery.',
      response: { kind: 'numeric', answer: 'eb', symbol: '\\text{energy density}', unit: 'MJ kg-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Convert the stored energy to megajoules: $1\\ \\mathrm{kW\\,h} = 1000\\ \\mathrm{W} \\times 3600\\ \\mathrm{s} = 3.6\\ \\mathrm{MJ}$.',
          math: tex`E = ${d.Eb} \times 3.6 = ${fmtW(r.EbMJ)}\ ${u('MJ')}`,
        },
        {
          text: 'Energy density is the energy stored per kilogram.',
          math: tex`\text{energy density} = \frac{${fmtW(r.EbMJ)}}{${d.mb}} = ${fmtA(r.eb)}\ ${u('MJ kg-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Conversion: 1 kW h = 3.6 MJ' }, { mark: tex`$${fmtA(r.eb)}\ ${u('MJ kg-1')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () =>
        `The petrol engine has an efficiency of ${Q(ETA_PETROL, '%')}. The battery and electric motor together have an efficiency of ${Q(ETA_ELECTRIC, '%')}. Calculate the ratio of the useful energy from a full tank of petrol to the useful energy from a fully charged battery.`,
      response: { kind: 'numeric', answer: 'ratio', symbol: '\\text{ratio}', positive: true },
      solution: ({ r }) => [
        {
          text: 'Useful energy = efficiency × energy supplied.',
          math: tex`\begin{gathered} \text{petrol: } ${ETA_PETROL / 100} \times ${fmtW(r.Ep)} = ${fmtW(r.usefulP)}\ ${u('MJ')} \\ \text{battery: } ${ETA_ELECTRIC / 100} \times ${fmtW(r.EbMJ)} = ${fmtW(r.usefulB)}\ ${u('MJ')} \end{gathered}`,
        },
        {
          math: tex`\text{ratio} = \frac{${fmtW(r.usefulP)}}{${fmtW(r.usefulB)}} = ${fmtA(r.ratio)}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Useful energy = efficiency × energy, for both' }, { mark: tex`Ratio $= ${fmtA(r.ratio)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ r }) =>
        `The energy density of petrol is about ${Math.round(PETROL / r.eb)} times that of the battery, yet the petrol car has only a few times more useful energy. Which statement explains this?`,
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The battery has a much greater mass than the petrol, and the electric motor is more efficient than the petrol engine.', correct: true },
          { text: 'The battery has a greater energy density than the petrol, and the petrol engine is more efficient.' },
          { text: 'Burning petrol destroys most of its energy, but a battery conserves energy.' },
          { text: 'The battery is recharged while the car is moving, so it never runs out.' },
        ],
      },
      solution: () => [
        {
          text: 'A full tank holds only a few tens of kilograms of petrol, while the battery has a mass of several hundred kilograms, which makes up for much of its low energy density. The electric motor also transfers a much larger fraction of its energy usefully (about 85 % compared with about 25 %). Energy is never destroyed: in the petrol engine most of it is transferred to the surroundings as thermal energy.',
        },
      ],
      markscheme: () => [{ note: 'Greater battery mass and higher efficiency of the electric car.' }],
    },
  ],
});
