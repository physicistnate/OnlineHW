import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-b4-adiabatic-compression',
  version: 1,
  title: 'A rapid (adiabatic) compression of argon',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.B.4',
  standards: ['ibp.B.4.5', 'ibp.B.4.1', 'ibp.B.4.3'],
  uses: ['ibp.B.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    p1: { choices: [100, 120], base: 100 },
    V1: { choices: [400, 500, 600], base: 500 },
    ratio: { choices: [4, 5, 8], base: 5 },
    T1: { choices: [290, 300], base: 300 },
  },

  compute: (p, c) => {
    const V2 = p.V1 / p.ratio; // cm³
    const p2 = p.p1 * p.ratio ** (5 / 3); // kPa
    const p2c = c.carry(p2, 'p2', 3);
    const T2 = (p.T1 * p2c * V2) / (p.p1 * p.V1);
    // Work done on the gas = ΔU = (3/2)(p2V2 − p1V1); kPa × cm³ = mJ.
    const Won = 1.5 * (p2c * V2 - p.p1 * p.V1) * 1e-3; // J
    return { V2, p2, T2, Won };
  },

  stem: ({ d }) =>
    `Argon, an ideal monatomic gas, is compressed so quickly that no thermal energy is transferred: an adiabatic change, for which $pV^{5/3}$ is constant. At the start its pressure is ${Q(d.p1, 'kPa')}, its volume ${Q(d.V1, 'cm3')} and its temperature ${Q(d.T1, 'K')}. Its volume is reduced to $\\tfrac{1}{${d.ratio}}$ of the starting volume.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the final pressure of the gas, in kPa.',
      response: { kind: 'numeric', answer: 'p2', symbol: 'p', unit: 'kPa', positive: true },
      solution: ({ d, r }) => [{ math: tex`p_2 = p_1\left(\frac{V_1}{V_2}\right)^{5/3} = ${d.p1} \times ${d.ratio}^{5/3} = ${fmtA(r.p2)}\ ${u('kPa')}` }],
      markscheme: ({ r }) => [{ mark: '$p_1V_1^{5/3} = p_2V_2^{5/3}$' }, { mark: tex`$p = ${fmtA(r.p2)}\ ${u('kPa')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the final temperature of the gas.',
      response: { kind: 'numeric', answer: 'T2', symbol: 'T', unit: 'K', positive: true },
      solution: ({ d, r }) => [{ text: 'For a fixed amount of gas, $pV/T$ is constant:', math: tex`T_2 = T_1\frac{p_2V_2}{p_1V_1} = ${d.T1} \times \frac{${fmtW(r.p2)} \times ${fmtW(r.V2)}}{${d.p1} \times ${d.V1}} = ${fmtA(r.T2)}\ ${u('K')}` }],
      markscheme: ({ r }) => [{ mark: '$pV/T$ constant (or $TV^{2/3}$ constant)' }, { mark: tex`$T = ${fmtA(r.T2)}\ ${u('K')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the work done on the gas.',
      response: { kind: 'numeric', answer: 'Won', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        { text: 'No thermal energy is transferred, so by the first law the work done on the gas equals the increase in its internal energy, $\\tfrac{3}{2}nR\\Delta T = \\tfrac{3}{2}\\Delta(pV)$:', math: tex`W = \tfrac{3}{2}(p_2V_2 - p_1V_1) = \tfrac{3}{2} \times (${fmtW(r.p2)} \times 10^{3} \times ${fmtW(r.V2)} \times 10^{-6} - ${d.p1} \times 10^{3} \times ${d.V1} \times 10^{-6}) = ${fmtA(r.Won)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$Q = 0$, so $W_{on} = \\Delta U = \\tfrac{3}{2}\\Delta(pV)$' }, { mark: tex`$W = ${fmtA(r.Won)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does the temperature of the gas rise, although no thermal energy is supplied?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Work is done on the gas, and with $Q = 0$ it all goes into internal energy, so the average kinetic energy of the atoms increases.', correct: true },
          { text: 'The atoms are pushed closer together, so their potential energy turns into thermal energy.' },
          { text: 'The pressure rises, and pressure is a form of internal energy.' },
          { text: 'Friction between the piston and the cylinder heats the gas.' },
        ],
      },
      solution: () => [{ text: 'From $Q = \\Delta U + W$ with $Q = 0$, $\\Delta U = -W$: the work done on the gas (negative $W$) increases its internal energy. For an ideal gas that means a higher temperature: the moving piston speeds up the atoms that bounce off it.' }],
      markscheme: () => [{ note: 'Q = 0, so ΔU = work done on the gas > 0.' }],
    },
  ],
});
