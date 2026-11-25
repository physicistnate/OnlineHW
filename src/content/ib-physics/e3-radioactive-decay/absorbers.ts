import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-e3-absorbers',
  version: 1,
  title: 'Identifying radiation with absorbers',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.5', 'ibp.E.3.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    bg: { min: 15, max: 40, step: 5, base: 25 },
    alpha: { min: 100, max: 300, step: 20, base: 180 },
    beta: { min: 200, max: 600, step: 20, base: 340 },
    gamma: { min: 100, max: 300, step: 20, base: 160 },
  },

  compute: (p) => {
    const none = p.bg + p.alpha + p.beta + p.gamma;
    const paper = p.bg + p.beta + p.gamma;
    const al = p.bg + p.gamma;
    const pb = p.bg + Math.round(p.gamma * 0.15);
    return { none, paper, al, pb, a: none - paper, b: paper - al, g: al - p.bg };
  },

  stem: ({ d, r }) =>
    `A detector is placed a few centimetres from a radioactive source. Different absorbers are placed between them, and the count rate is measured each time. Without the source, the detector records a background count rate of ${d.bg} counts per minute.\n$$\\begin{array}{lc} \\textbf{Absorber} & \\textbf{Count rate / min}^{-1} \\\\ \\hline \\text{none} & ${r.none} \\\\ \\text{paper} & ${r.paper} \\\\ \\text{aluminium, 5 mm} & ${r.al} \\\\ \\text{lead, 3 cm} & ${r.pb} \\end{array}$$`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which types of radiation does the source emit?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Alpha, beta and gamma', correct: true },
          { text: 'Alpha and beta only' },
          { text: 'Beta and gamma only' },
          { text: 'Alpha and gamma only' },
        ],
      },
      solution: () => [
        {
          text: 'Paper reduces the count rate, so some radiation is stopped by paper: alpha. Aluminium reduces it further: beta (stopped by a few mm of aluminium). Some radiation still passes through aluminium and is only partly absorbed by lead: gamma.',
        },
      ],
      markscheme: () => [{ note: 'Alpha (stopped by paper), beta (by aluminium), gamma (reduced by lead).' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the count rate due to alpha particles.',
      response: { kind: 'numeric', answer: 'a', symbol: '\\text{alpha}', unit: 'min-1', positive: true },
      solution: ({ r }) => [{ text: 'Paper stops only the alpha particles.', math: tex`${r.none} - ${r.paper} = ${fmtA(r.a)}\ ${u('min-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.a)}\ ${u('min-1')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the count rate due to beta particles.',
      response: { kind: 'numeric', answer: 'b', symbol: '\\text{beta}', unit: 'min-1', positive: true },
      solution: ({ r }) => [{ text: 'Aluminium also stops the beta particles; the paper reading includes beta but no alpha.', math: tex`${r.paper} - ${r.al} = ${fmtA(r.b)}\ ${u('min-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.b)}\ ${u('min-1')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Calculate the count rate due to gamma rays when there is no absorber.',
      response: { kind: 'numeric', answer: 'g', symbol: '\\text{gamma}', unit: 'min-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Gamma rays pass through 5 mm of aluminium almost unaffected, so the aluminium reading is gamma plus background.',
          math: tex`${r.al} - ${d.bg} = ${fmtA(r.g)}\ ${u('min-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.g)}\ ${u('min-1')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which radiation produces the most ions per millimetre of its path in air?',
      response: {
        kind: 'mcq',
        options: () => [{ text: 'Alpha', correct: true }, { text: 'Beta' }, { text: 'Gamma' }, { text: 'All produce the same number' }],
      },
      solution: () => [
        {
          text: 'Alpha particles are massive and doubly charged, so they interact strongly with the atoms they pass and lose their energy in a few centimetres of air. That is why they are the most ionizing and the least penetrating.',
        },
      ],
      markscheme: () => [{ note: 'Alpha: most ionizing, least penetrating.' }],
    },
  ],
});
