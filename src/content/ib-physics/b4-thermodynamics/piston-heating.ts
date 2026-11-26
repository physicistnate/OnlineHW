import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-b4-piston-heating',
  version: 1,
  title: 'Heating a gas at constant pressure: the first law of thermodynamics',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.B.4',
  standards: ['ibp.B.4.1', 'ibp.B.4.2', 'ibp.B.4.3', 'ibp.B.4.5'],
  uses: ['ibp.B.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    p: { choices: [100, 150, 200], base: 150 },
    V1: { choices: [1, 2, 3], base: 2, dp: 1 },
    T1: { choices: [290, 300], base: 300 },
    T2: { choices: [400, 450, 500], base: 450 },
  },

  compute: (p, c) => {
    const V2 = (p.V1 * p.T2) / p.T1; // L
    const W = p.p * 1e3 * (c.carry(V2, 'V2', 3) - p.V1) * 1e-3;
    const n = (p.p * 1e3 * p.V1 * 1e-3) / (IB.R * p.T1);
    const dU = 1.5 * c.carry(n, undefined, 3) * IB.R * (p.T2 - p.T1);
    const Qin = c.carry(dU, 'dU', 3) + c.carry(W, 'W', 3);
    return { V2, W, n, dU, Qin };
  },

  stem: ({ d }) =>
    `Helium, an ideal monatomic gas, is held in a cylinder by a piston that moves freely, so its pressure stays at ${Q(d.p, 'kPa')}. The gas has a volume of ${Q(d.V1, 'L')} at ${Q(d.T1, 'K')}. It is heated slowly to ${Q(d.T2, 'K')}. $R = 8.31\\ \\mathrm{J\\,K^{-1}\\,mol^{-1}}$; 1 L = 10⁻³ m³.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the final volume of the gas.',
      response: { kind: 'numeric', answer: 'V2', symbol: 'V', unit: 'L', positive: true },
      solution: ({ d, r }) => [{ text: 'At constant pressure $V/T$ is constant:', math: tex`V_2 = V_1\frac{T_2}{T_1} = ${d.V1} \times \frac{${d.T2}}{${d.T1}} = ${fmtA(r.V2)}\ \mathrm{L}` }],
      markscheme: ({ r }) => [{ mark: tex`$V = ${fmtA(r.V2)}$ L` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the work done by the gas.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ math: tex`W = p\Delta V = ${d.p} \times 10^{3} \times (${fmtW(r.V2)} - ${d.V1}) \times 10^{-3} = ${fmtA(r.W)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$W = p\Delta V = ${fmtA(r.W)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the change in the internal energy of the gas.',
      response: { kind: 'numeric', answer: 'dU', symbol: '\\Delta U', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { math: tex`n = \frac{pV}{RT} = \frac{${d.p} \times 10^{3} \times ${d.V1} \times 10^{-3}}{8.31 \times ${d.T1}} = ${fmtW(r.n)}\ ${u('mol')}` },
        { math: tex`\Delta U = \tfrac{3}{2}nR\Delta T = \tfrac{3}{2} \times ${fmtW(r.n)} \times 8.31 \times (${d.T2} - ${d.T1}) = ${fmtA(r.dU)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta U = \\tfrac{3}{2}nR\\Delta T$ with $n$ from $pV = nRT$' }, { mark: tex`$\Delta U = ${fmtA(r.dU)}\ ${u('J')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Calculate the thermal energy supplied to the gas.',
      response: { kind: 'numeric', answer: 'Qin', symbol: 'Q', unit: 'J', positive: true },
      solution: ({ r }) => [{ text: 'First law of thermodynamics:', math: tex`Q = \Delta U + W = ${fmtW(r.dU)} + ${fmtW(r.W)} = ${fmtA(r.Qin)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$Q = \Delta U + W = ${fmtA(r.Qin)}\ ${u('J')}$` }, { note: 'Allow ECF from (b) and (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Why is more thermal energy needed to raise the temperature by the same amount at constant pressure than at constant volume?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'At constant pressure the gas expands and does work on the piston, as well as gaining internal energy.', correct: true },
          { text: 'At constant pressure the internal energy rises more for the same temperature change.' },
          { text: 'At constant volume some of the energy is lost through the walls.' },
          { text: 'At constant pressure the number of moles increases.' },
        ],
      },
      solution: () => [{ text: 'The internal energy of an ideal gas depends only on its temperature, so $\\Delta U$ is the same either way. At constant pressure the gas also does work $p\\Delta V$, which must be supplied too: $Q = \\Delta U + W$.' }],
      markscheme: () => [{ note: 'Work done by the expanding gas.' }],
    },
  ],
});
