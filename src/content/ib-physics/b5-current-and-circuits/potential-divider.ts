import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-b5-potential-divider',
  version: 1,
  title: 'A light sensor: a potential divider with a light-dependent resistor',
  courses: ['ib-physics-sl'],
  topic: 'ibp.B.5',
  standards: ['ibp.B.5.8', 'ibp.B.5.7'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Vs: { choices: [5, 6, 9, 12], base: 6 },
    Rf: { choices: [1, 2.2, 4.7], base: 2.2, dp: 1 },
    Rd: { choices: [20, 50, 100], base: 50 },
    Rl: { choices: [0.2, 0.5, 1], base: 0.5, dp: 1 },
    Rm: { choices: [2, 5, 10], base: 5 },
  },

  compute: (p) => {
    const Vdark = (p.Vs * p.Rd) / (p.Rd + p.Rf);
    const Vlight = (p.Vs * p.Rl) / (p.Rl + p.Rf);
    // The fixed resistor that makes the output half the supply when the LDR's resistance is Rm.
    const Rnew = p.Rm;
    return { Vdark, Vlight, Rnew };
  },

  stem: ({ d }) =>
    `A light-dependent resistor (LDR) and a fixed resistor of ${Q(d.Rf, 'kΩ')} are connected in series across a supply of ${Q(d.Vs, 'V')} with negligible internal resistance. The output is the potential difference across the LDR. The resistance of the LDR is ${Q(d.Rd, 'kΩ')} in the dark and ${Q(d.Rl, 'kΩ')} in bright light.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the output potential difference in the dark.',
      response: { kind: 'numeric', answer: 'Vdark', symbol: 'V_{out}', unit: 'V', positive: true },
      solution: ({ d, r }) => [
        { text: 'The supply p.d. is shared in proportion to the resistances:', math: tex`V_{out} = V_s\frac{R_{LDR}}{R_{LDR} + R} = ${d.Vs} \times \frac{${d.Rd}}{${d.Rd} + ${d.Rf}} = ${fmtA(r.Vdark)}\ ${u('V')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Potential divider ratio' }, { mark: tex`$V_{out} = ${fmtA(r.Vdark)}\ ${u('V')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the output potential difference in bright light.',
      response: { kind: 'numeric', answer: 'Vlight', symbol: 'V_{out}', unit: 'V', positive: true },
      solution: ({ d, r }) => [{ math: tex`V_{out} = ${d.Vs} \times \frac{${d.Rl}}{${d.Rl} + ${d.Rf}} = ${fmtA(r.Vlight)}\ ${u('V')}` }],
      markscheme: ({ r }) => [{ mark: tex`$V_{out} = ${fmtA(r.Vlight)}\ ${u('V')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ d }) => `The output is to switch on a street lamp when it reaches half the supply p.d., which should happen when the LDR’s resistance has risen to ${Q(d.Rm, 'kΩ')}. What resistance should the fixed resistor have, in kΩ?`,
      response: { kind: 'numeric', answer: 'Rnew', symbol: 'R', unit: 'kΩ', positive: true },
      solution: ({ d }) => [{ text: `The output is half the supply when the two resistances are equal, so the fixed resistor should be ${d.Rm} kΩ.` }],
      markscheme: ({ d }) => [{ mark: `$R = ${d.Rm}$ kΩ (equal resistances share the p.d. equally)` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why is the output taken across the LDR, rather than across the fixed resistor, to switch the lamp on at dusk?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'As it gets darker the LDR’s resistance rises, so it takes a larger share of the supply p.d. and the output rises.', correct: true },
          { text: 'As it gets darker the LDR’s resistance falls, so the current through it rises.' },
          { text: 'The p.d. across the fixed resistor never changes.' },
          { text: 'The current through the LDR is larger than the current through the fixed resistor.' },
        ],
      },
      solution: () => [{ text: 'The two components carry the same current, and each takes a share of the supply p.d. proportional to its resistance. In the dark the LDR’s resistance is high, so the p.d. across it is high: the output rises at dusk.' }],
      markscheme: () => [{ note: 'LDR resistance rises in the dark, so its share of the p.d. rises.' }],
    },
  ],
});
