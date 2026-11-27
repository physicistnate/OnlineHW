import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

interface P {
  m: number;
  d: number;
  n: number;
}

/** The potential difference (V, 3 s.f.) that holds the drop still, as the question gives it. */
const voltage = (p: P) => Number(((p.m * 1e-15 * 9.81 * p.d * 1e-3) / (p.n * IB.e)).toPrecision(3));

export default defineQuestion({
  id: 'ibp-d2-millikan-drop',
  version: 1,
  title: 'Millikan’s oil drop: a charge held still between parallel plates',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.1', 'ibp.D.2.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { choices: [1.2, 1.6, 2, 2.4, 3.2], base: 2, dp: 1 },
    d: { choices: [5, 8, 10], base: 8 },
    n: { choices: [2, 3, 4, 5, 6, 8], base: 4 },
  },
  // A realistic potential difference: 50 V to 1500 V.
  constraint: (p) => voltage(p) >= 50 && voltage(p) <= 1500,

  compute: (p, c) => {
    const V = voltage(p);
    const E = V / (p.d * 1e-3);
    const q = (p.m * 1e-15 * c.g) / c.carry(E, 'E', 3);
    const n = Math.round(q / IB.e);
    return { V, E, q, n };
  },

  stem: ({ p, d }) =>
    `In a version of Millikan’s experiment, a charged oil drop of mass $${d.m} \\times 10^{-15}$ kg is held stationary between two horizontal parallel plates ${Q(d.d, 'mm')} apart. The potential difference between the plates is ${Q(voltage(p).toPrecision(3), 'V')}. The drop has gained electrons.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the electric field strength between the plates.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`E = \frac{V}{d} = \frac{${r.V.toPrecision(3)}}{${d.d} \times 10^{-3}} = ${fmtA(r.E)}\ ${u('V m-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the charge on the drop.',
      response: { kind: 'numeric', answer: 'q', symbol: 'q', unit: 'C', positive: true },
      solution: ({ d, r, g }) => [
        { text: 'The drop is stationary, so the electric force balances its weight:', math: tex`qE = mg \;\Rightarrow\; q = \frac{mg}{E} = \frac{${d.m} \times 10^{-15} \times ${g}}{${fmtW(r.E)}} = ${fmtA(r.q)}\ ${u('C')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$qE = mg$' }, { mark: tex`$q = ${fmtA(r.q)}\ ${u('C')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'How many electrons has the drop gained?',
      response: { kind: 'numeric', answer: 'n', symbol: 'n', positive: true },
      solution: ({ r }) => [{ math: tex`n = \frac{q}{e} = \frac{${fmtW(r.q)}}{1.60 \times 10^{-19}} \approx ${r.n}` }, { text: 'The answer must be a whole number: charge is quantized.' }],
      markscheme: ({ r }) => [{ mark: tex`$${r.n}$ electrons` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which plate is positive?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The upper plate: the negative drop needs an upward electric force, so the field must point downwards.', correct: true },
          { text: 'The lower plate: the field must point upwards to hold the drop up.' },
          { text: 'Either plate: the electric force on the drop does not depend on the direction of the field.' },
          { text: 'Neither: the drop is held up by the upthrust of the air alone.' },
        ],
      },
      solution: () => [{ text: 'The force on a negative charge is opposite to the field. An upward force needs a downward field, from the positive upper plate to the negative lower plate.' }],
      markscheme: () => [{ note: 'Upper plate positive (field downwards, force on negative charge upwards).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'What did the results of Millikan’s experiment, for many drops, show?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Every charge measured was a whole-number multiple of one smallest charge, $e$: charge is quantized.', correct: true },
          { text: 'The charge on a drop is proportional to its mass.' },
          { text: 'Charge can take any value, depending on the size of the drop.' },
          { text: 'Electrons and protons have different masses.' },
        ],
      },
      solution: () => [{ text: 'All the measured charges were multiples of about $1.6 \\times 10^{-19}$ C, the elementary charge. No smaller charge has ever been found on a free particle.' }],
      markscheme: () => [{ note: 'Charges are integer multiples of e (quantization of charge).' }],
    },
  ],
});
