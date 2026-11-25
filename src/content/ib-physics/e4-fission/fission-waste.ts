import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-e4-fission-waste',
  version: 1,
  title: 'Fission products and radioactive waste',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.4',
  standards: ['ibp.E.4.4'],
  uses: ['ibp.E.3.6'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 1,

  params: {
    n: { min: 2, max: 8, step: 1, base: 5 },
    m: { min: 2, max: 6, step: 1, base: 4 },
  },

  compute: (p) => ({ pct: 100 / 2 ** p.n, years: 30 * p.m, frac: 2 ** p.m, tSr: 29 * p.n }),

  stem: () => 'Spent fuel from a nuclear reactor contains fission products such as strontium-90 (half-life 29 years) and caesium-137 (half-life 30 years).',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which statement about fission products is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They have too many neutrons to be stable, so most are radioactive beta-minus emitters, some with long half-lives.', correct: true },
          { text: 'They are stable, because they are near the peak of the binding energy curve.' },
          { text: 'They have too few neutrons, so they decay by emitting positrons.' },
          { text: 'They are only dangerous while the reactor is running.' },
        ],
      },
      solution: () => [
        {
          text: 'Heavy nuclei have a higher neutron–proton ratio than medium nuclei. When uranium splits, the fragments keep too many neutrons, so they decay by β⁻ emission, often through several steps, and some products remain active for many years.',
        },
      ],
      markscheme: () => [{ note: 'Neutron-rich, β⁻ emitters, some long-lived.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ r }) => `Calculate the percentage of the strontium-90 that remains after ${r.tSr} years.`,
      response: { kind: 'numeric', answer: 'pct', symbol: '\\text{remaining}', unit: '%', positive: true },
      solution: ({ p, r }) => [{ text: `${r.tSr} years is ${p.n} half-lives of 29 years.`, math: tex`\frac{100\ ${u('%')}}{2^{${p.n}}} = ${fmtA(r.pct)}\ ${u('%')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.pct)}\ ${u('%')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ r }) => `Calculate how long it takes for the activity of the caesium-137 to fall to $\\tfrac{1}{${r.frac}}$ of its initial value.`,
      response: { kind: 'numeric', answer: 'years', symbol: 't', unit: 'years', positive: true },
      solution: ({ p, r }) => [{ text: `$\\tfrac{1}{${r.frac}} = \\left(\\tfrac{1}{2}\\right)^{${p.m}}$, so it takes ${p.m} half-lives: $${p.m} \\times 30 = ${fmtA(r.years)}$ years.` }],
      markscheme: ({ r }) => [{ mark: `$${fmtA(r.years)}$ years` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Spent fuel rods are first stored under water for several years. Why?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They are still releasing a lot of energy from radioactive decay, so they need cooling, and the water also absorbs radiation.', correct: true },
          { text: 'Water makes the fission products stable.' },
          { text: 'Water slows down the decay of the fission products.' },
          { text: 'The rods must be kept wet to stop them reacting with air.' },
        ],
      },
      solution: () => [
        {
          text: 'Fresh spent fuel is very active, and the decay energy heats it strongly. Water removes this thermal energy and shields workers from radiation. Later the waste can be moved to dry storage and, eventually, deep geological disposal.',
        },
      ],
      markscheme: () => [{ note: 'Cooling and shielding.' }],
    },
  ],
});
