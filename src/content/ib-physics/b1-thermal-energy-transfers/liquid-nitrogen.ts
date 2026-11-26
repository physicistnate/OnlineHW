import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Liquid nitrogen: density (kg m⁻³), boiling point (K) and specific latent heat of vaporization (J kg⁻¹). */
const RHO_L = 808;
const T_BOIL = 77;
const L_V = 1.99e5;

interface P {
  m: number;
  Tr: number;
}

/** Density of nitrogen gas at atmospheric pressure and room temperature (kg m⁻³, 3 s.f., as given). */
const rhoGas = (p: P) => Number(((1.01e5 * 0.028) / (IB.R * (p.Tr + IB.zeroC))).toPrecision(3));

export default defineQuestion({
  id: 'ibp-b1-liquid-nitrogen',
  version: 1,
  title: 'Boiling liquid nitrogen: density, molecular spacing and internal energy',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.1',
  standards: ['ibp.B.1.1', 'ibp.B.1.2', 'ibp.B.1.3', 'ibp.B.1.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { choices: [0.5, 1, 2, 5], base: 1, dp: 1 },
    Tr: { choices: [15, 20, 25], base: 20 },
  },

  compute: (p, c) => {
    const V = (p.m / RHO_L) * 1000; // litres
    const Qb = p.m * L_V;
    const ratio = RHO_L / rhoGas(p);
    const spacing = Math.cbrt(c.carry(ratio, 'ratio', 3));
    const keRatio = (p.Tr + IB.zeroC) / T_BOIL;
    return { V, Qb, ratio, spacing, keRatio };
  },

  stem: ({ p, d }) =>
    `A flask holds ${Q(d.m, 'kg')} of liquid nitrogen at its boiling point, 77 K. Liquid nitrogen has a density of $808\\ \\mathrm{kg\\,m^{-3}}$ and a specific latent heat of vaporization of $1.99 \\times 10^{5}\\ \\mathrm{J\\,kg^{-1}}$. At atmospheric pressure and room temperature, ${Q(d.Tr, '°C')}, nitrogen gas has a density of ${Q(rhoGas(p).toPrecision(3), 'kg m-3')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the volume of the liquid nitrogen, in litres. (1 litre = 10⁻³ m³.)',
      response: { kind: 'numeric', answer: 'V', symbol: 'V', unit: 'L', positive: true },
      solution: ({ d, r }) => [{ math: tex`V = \frac{m}{\rho} = \frac{${d.m}}{808} = ${fmtW(r.V / 1000)}\ ${u('m3')} = ${fmtA(r.V)}\ \text{litres}` }],
      markscheme: ({ r }) => [{ mark: tex`$V = ${fmtA(r.V)}$ litres` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the energy needed to boil all of the liquid nitrogen.',
      response: { kind: 'numeric', answer: 'Qb', symbol: 'Q', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ text: 'The liquid is already at its boiling point, so all the energy goes into the change of phase:', math: tex`Q = mL = ${d.m} \times 1.99 \times 10^{5} = ${fmtA(r.Qb)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: '$Q = mL$, no temperature change' }, { mark: tex`$Q = ${fmtA(r.Qb)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'The nitrogen boils and warms to room temperature. By what factor does its volume increase?',
      response: { kind: 'numeric', answer: 'ratio', symbol: '\\dfrac{V_{gas}}{V_{liquid}}', positive: true },
      solution: ({ p, r }) => [
        { text: 'The mass stays the same, so the volume is inversely proportional to the density:', math: tex`\frac{V_{gas}}{V_{liquid}} = \frac{\rho_{liquid}}{\rho_{gas}} = \frac{808}{${rhoGas(p).toPrecision(3)}} = ${fmtA(r.ratio)}` },
        { text: 'This is why containers of liquid nitrogen must never be sealed.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Ratio of the densities' }, { mark: tex`$${fmtA(r.ratio)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Estimate how many times larger the average spacing of the molecules is in the gas than in the liquid.',
      response: { kind: 'numeric', answer: 'spacing', symbol: '\\dfrac{d_{gas}}{d_{liquid}}', positive: true },
      solution: ({ r }) => [{ text: 'Each molecule has a volume of about $d^3$ to itself, so the spacing grows as the cube root of the volume:', math: tex`\frac{d_{gas}}{d_{liquid}} = \sqrt[3]{${fmtW(r.ratio)}} = ${fmtA(r.spacing)}` }],
      markscheme: ({ r }) => [{ mark: tex`Cube root of the volume ratio: $${fmtA(r.spacing)}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Calculate the ratio of the average kinetic energy of the molecules at room temperature to their average kinetic energy at 77 K.',
      response: { kind: 'numeric', answer: 'keRatio', symbol: '\\dfrac{\\bar{E}_k(T_{room})}{\\bar{E}_k(77\\ \\mathrm{K})}', positive: true },
      solution: ({ d, r }) => [{ text: 'The average kinetic energy of the particles is proportional to the absolute temperature:', math: tex`\frac{${d.Tr} + 273}{77} = \frac{${Number(d.Tr) + 273}}{77} = ${fmtA(r.keRatio)}` }],
      markscheme: ({ r }) => [{ mark: tex`Temperatures in kelvin: $${fmtA(r.keRatio)}$` }],
    },
    {
      label: '(f)',
      marks: 1,
      prompt: () => 'What happens to the internal energy of the nitrogen while it boils at 77 K?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It increases: the potential energy of the molecules increases, while their average kinetic energy stays the same.', correct: true },
          { text: 'It stays the same, because the temperature does not change.' },
          { text: 'It increases: the average kinetic energy of the molecules increases.' },
          { text: 'It decreases, because the molecules move further apart.' },
        ],
      },
      solution: () => [{ text: 'Internal energy is the total kinetic and potential energy of the molecules. While the nitrogen boils, energy is absorbed to separate the molecules, raising their potential energy; the temperature, and so the average kinetic energy, is constant.' }],
      markscheme: () => [{ note: 'Increases: potential energy increases at constant kinetic energy.' }],
    },
  ],
});
