import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const L_F = 3.34e5;

export default defineQuestion({
  id: 'ibp-b4-entropy-melting',
  version: 1,
  title: 'Entropy: melting ice and a gas spreading out',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.B.4',
  standards: ['ibp.B.4.4'],
  uses: ['ibp.B.1.5', 'ibp.B.3.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { choices: [20, 50, 100], base: 50 },
    Tr: { choices: [20, 25], base: 20 },
    n: { choices: [0.5, 1, 2], base: 1, dp: 1 },
  },

  compute: (p) => {
    const Qm = (p.m / 1000) * L_F;
    const TrK = p.Tr + IB.zeroC;
    const dSice = Qm / IB.zeroC;
    // A small difference of two larger terms: worked out in one step, Q(1/273 − 1/T_room).
    const dStot = Qm * (1 / IB.zeroC - 1 / TrK);
    const dSgas = p.n * IB.NA * IB.kB * Math.log(2);
    return { Qm, TrK, dSice, dStot, dSgas };
  },

  stem: ({ d }) =>
    `An ice cube of mass ${Q(d.m, 'g')} at 0 °C melts in a room at ${Q(d.Tr, '°C')}. The specific latent heat of fusion of ice is $3.34 \\times 10^{5}\\ \\mathrm{J\\,kg^{-1}}$. Treat the room as so large that its temperature does not change.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the change in entropy of the ice as it melts.',
      response: { kind: 'numeric', answer: 'dSice', symbol: '\\Delta S', unit: 'J K-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'The ice absorbs $Q = mL$ at a constant 273 K:', math: tex`\Delta S = \frac{Q}{T} = \frac{${Number(d.m) / 1000} \times 3.34 \times 10^{5}}{273} = ${fmtA(r.dSice)}\ ${u('J K-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta S = mL/T$ with $T$ = 273 K' }, { mark: tex`$\Delta S = ${fmtA(r.dSice)}\ ${u('J K-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the total change in entropy of the ice and the room.',
      response: { kind: 'numeric', answer: 'dStot', symbol: '\\Delta S_{total}', unit: 'J K-1', positive: true },
      solution: ({ r }) => [
        { text: 'The room gives out the same energy $Q$ at its higher temperature, so its entropy falls by $Q/T_{room}$, less than the ice’s gain:', math: tex`\Delta S_{total} = \frac{Q}{273} - \frac{Q}{T_{room}} = ${fmtW(r.Qm)} \times \left(\frac{1}{273} - \frac{1}{${r.TrK}}\right) = ${fmtA(r.dStot)}\ ${u('J K-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Room: $-Q/T_{room}$' }, { mark: tex`$\Delta S_{total} = ${fmtA(r.dStot)}\ ${u('J K-1')}$ (positive)` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `In a different process, ${Q(d.n, 'mol')} of an ideal gas expands freely into a vacuum, doubling its volume, at constant temperature. Each molecule then has twice as many places to be, so the number of microstates $\\Omega$ is multiplied by $2^N$, where $N$ is the number of molecules. Use $S = k_B\\ln\\Omega$ to calculate the increase in entropy. ($k_B = 1.38 \\times 10^{-23}\\ \\mathrm{J\\,K^{-1}}$, $N_A = 6.02 \\times 10^{23}\\ \\mathrm{mol^{-1}}$.)`,
      response: { kind: 'numeric', answer: 'dSgas', symbol: '\\Delta S', unit: 'J K-1', positive: true },
      solution: ({ d, r }) => [
        { math: String.raw`\Delta S = k_B\ln(2^N\Omega) - k_B\ln\Omega = Nk_B\ln 2` },
        { math: tex`\Delta S = ${d.n} \times 6.02 \times 10^{23} \times 1.38 \times 10^{-23} \times \ln 2 = ${fmtA(r.dSgas)}\ ${u('J K-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\Delta S = k_B\\ln 2^N = Nk_B\\ln 2$' }, { mark: tex`$\Delta S = ${fmtA(r.dSgas)}\ ${u('J K-1')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement of the second law of thermodynamics do these examples illustrate?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The total entropy of an isolated system never decreases.', correct: true },
          { text: 'The entropy of every object always increases.' },
          { text: 'Energy cannot be created or destroyed.' },
          { text: 'Entropy is conserved in every process.' },
        ],
      },
      solution: () => [{ text: 'In both processes the total entropy increases. The entropy of part of a system can fall (the room’s did), but the total for an isolated system never decreases.' }],
      markscheme: () => [{ note: 'Total entropy of an isolated system never decreases.' }],
    },
  ],
});
