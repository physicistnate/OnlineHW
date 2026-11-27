import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

const T0 = 288;

export default defineQuestion({
  id: 'ibp-b2-warmer-earth',
  version: 1,
  title: 'What would make the Earth warmer? Albedo, emissivity and the energy balance',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.2',
  standards: ['ibp.B.2.2', 'ibp.B.2.4', 'ibp.B.2.3'],
  uses: ['ibp.B.1.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    a: { choices: [0.28, 0.3, 0.32], base: 0.3, dp: 2 },
    dT: { choices: [0.5, 1, 1.5, 2], base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const I = ((1 - p.a) * IB.S) / 4;
    const e = c.carry(I, 'I', 3) / (IB.sigma * T0 ** 4);
    const ec = c.carry(e, 'e', 3);
    const T1 = T0 + p.dT;
    // The albedo that gives T0 + ΔT with the same emissivity.
    const a2 = 1 - (4 * ec * IB.sigma * T1 ** 4) / IB.S;
    // The emissivity that gives T0 + ΔT with the same albedo.
    const e2 = c.carry(I, 'I', 3) / (IB.sigma * T1 ** 4);
    return { I, e, T1, a2, e2 };
  },

  stem: ({ d }) =>
    `In a simple energy-balance model, the Earth absorbs a mean intensity $(1 - \\alpha)S/4$ and radiates $e\\sigma T^4$, where $\\alpha = ${d.a}$ is the albedo, $S = 1.36 \\times 10^{3}\\ \\mathrm{W\\,m^{-2}}$ the solar constant and $e$ the emissivity of the Earth–atmosphere system. The mean surface temperature is ${T0} K. $\\sigma = 5.67 \\times 10^{-8}\\ \\mathrm{W\\,m^{-2}\\,K^{-4}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the emissivity $e$ of the Earth–atmosphere system.',
      response: { kind: 'numeric', answer: 'e', symbol: 'e', positive: true },
      solution: ({ d, r }) => [
        { math: tex`I = \frac{(1 - ${d.a}) \times 1360}{4} = ${fmtW(r.I)}\ ${u('W m-2')}` },
        { math: tex`e = \frac{${fmtW(r.I)}}{5.67 \times 10^{-8} \times ${T0}^4} = ${fmtA(r.e)}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Absorbed intensity $(1 - \\alpha)S/4$' }, { mark: tex`$e = ${fmtA(r.e)}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `With the emissivity unchanged, what albedo would make the mean surface temperature ${d.dT} K higher?`,
      response: { kind: 'numeric', answer: 'a2', symbol: '\\alpha', positive: true },
      solution: ({ r }) => [
        { math: tex`\frac{(1 - \alpha)S}{4} = e\sigma T^4 \;\Rightarrow\; \alpha = 1 - \frac{4 \times ${fmtW(r.e)} \times 5.67 \times 10^{-8} \times ${r.T1}^4}{1360} = ${fmtA(r.a2)}` },
        { text: 'A very small fall in albedo, for example from less ice and snow, is enough.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy balance at the new temperature with the same $e$' }, { mark: tex`$\alpha = ${fmtA(r.a2)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Instead, with the albedo unchanged, what emissivity would make the mean surface temperature ${d.dT} K higher?`,
      response: { kind: 'numeric', answer: 'e2', symbol: 'e', positive: true },
      solution: ({ r }) => [{ math: tex`e = \frac{${fmtW(r.I)}}{5.67 \times 10^{-8} \times ${r.T1}^4} = ${fmtA(r.e2)}` }, { text: 'More greenhouse gases lower the effective emissivity: less of the surface’s radiation escapes to space.' }],
      markscheme: ({ r }) => [{ mark: 'Same absorbed intensity, new temperature' }, { mark: tex`$e = ${fmtA(r.e2)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which change would also raise the equilibrium temperature in this model?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A decrease in the emissivity of the Earth–atmosphere system.', correct: true },
          { text: 'An increase in the albedo.' },
          { text: 'An increase in the emissivity of the Earth–atmosphere system.' },
          { text: 'A decrease in the solar constant.' },
        ],
      },
      solution: () => [{ text: 'From $(1 - \\alpha)S/4 = e\\sigma T^4$, $T$ rises if the absorbed intensity rises (lower albedo, larger $S$) or if $e$ falls.' }],
      markscheme: () => [{ note: 'Lower emissivity.' }],
    },
  ],
});
