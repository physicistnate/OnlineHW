import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b3-helium-cylinder',
  version: 1,
  title: 'The internal energy of helium in a cylinder',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.3',
  standards: ['ibp.B.3.7', 'ibp.B.3.3', 'ibp.B.3.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    p: { choices: [200, 500, 1000], base: 500 },
    V: { choices: [2, 5, 10], base: 5 },
    T: { choices: [17, 27], base: 17 },
    dT: { choices: [10, 20, 50], base: 20 },
  },

  compute: (p, c) => {
    const TK = p.T + IB.zeroC;
    const n = (p.p * 1e3 * p.V * 1e-3) / (IB.R * TK);
    const nc = c.carry(n, 'n', 3);
    const U = 1.5 * nc * IB.R * TK;
    const dU = 1.5 * nc * IB.R * p.dT;
    return { TK, n, U, dU };
  },

  stem: ({ d }) =>
    `A sealed steel cylinder of volume ${Q(d.V, 'L')} contains helium at a pressure of ${Q(d.p, 'kPa')} and a temperature of ${Q(d.T, '°C')}. Treat the helium as an ideal monatomic gas. $R = 8.31\\ \\mathrm{J\\,K^{-1}\\,mol^{-1}}$; 1 L = 10⁻³ m³.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the amount of helium in the cylinder, in moles.',
      response: { kind: 'numeric', answer: 'n', symbol: 'n', unit: 'mol', positive: true },
      solution: ({ d, r }) => [{ math: tex`n = \frac{pV}{RT} = \frac{${d.p} \times 10^{3} \times ${d.V} \times 10^{-3}}{8.31 \times ${r.TK}} = ${fmtA(r.n)}\ ${u('mol')}` }],
      markscheme: ({ r }) => [{ mark: 'SI units and the temperature in kelvin' }, { mark: tex`$n = ${fmtA(r.n)}\ ${u('mol')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the internal energy of the helium.',
      response: { kind: 'numeric', answer: 'U', symbol: 'U', unit: 'J', positive: true },
      solution: ({ r }) => [{ math: tex`U = \tfrac{3}{2}nRT = \tfrac{3}{2} \times ${fmtW(r.n)} \times 8.31 \times ${r.TK} = ${fmtA(r.U)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$U = ${fmtA(r.U)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `The cylinder is left in the sun, and the helium warms by ${Q(d.dT, 'K')}. Calculate the energy the helium absorbs.`,
      response: { kind: 'numeric', answer: 'dU', symbol: '\\Delta U', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'The volume is fixed, so the gas does no work: all the energy absorbed increases its internal energy.', math: tex`\Delta U = \tfrac{3}{2}nR\Delta T = \tfrac{3}{2} \times ${fmtW(r.n)} \times 8.31 \times ${d.dT} = ${fmtA(r.dU)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta U = \\tfrac{3}{2}nR\\Delta T$' }, { mark: tex`$${fmtA(r.dU)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why is the internal energy of an ideal gas only the kinetic energy of its particles?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'There are no forces between the particles except during collisions, so they have no potential energy.', correct: true },
          { text: 'The particles are at rest between collisions.' },
          { text: 'Potential energy is always converted to kinetic energy when a gas is heated.' },
          { text: 'The particles are too small to have potential energy.' },
        ],
      },
      solution: () => [{ text: 'Internal energy is the total kinetic and potential energy of the particles. In the ideal gas model the particles exert no forces on each other except in brief collisions, so there is no intermolecular potential energy; for a monatomic gas, the energy is all translational kinetic energy, $\\tfrac{3}{2}k_BT$ per atom.' }],
      markscheme: () => [{ note: 'No intermolecular forces, so no potential energy.' }],
    },
  ],
});
