/**
 * Archived revision 1 of ibp-e5-hr-diagram, as first published (before review 6). Assignments made
 * with this revision keep showing it. Do not edit.
 */
import { defineQuestion } from '../../engine/define';
import { fmtA } from '../../engine/numbers';
import { tex } from '../../engine/units';

export default defineQuestion({
  id: 'ibp-e5-hr-diagram',
  version: 1,
  title: 'Reading the Hertzsprung–Russell diagram',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.4', 'ibp.E.5.6'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 2,

  params: {
    k: { min: 100, max: 10000, step: 100, base: 400 },
    q: { min: 1.5, max: 4, step: 0.25, base: 2.5, dp: 2 },
  },

  compute: (p) => ({ radii: Math.sqrt(p.k), giant: p.q ** 2 }),

  stem: () => 'On a Hertzsprung–Russell (HR) diagram, the luminosity of stars is plotted against their surface temperature, with temperature increasing to the left.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which region of the HR diagram contains stars that are hot but have a low luminosity?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'White dwarfs, at the bottom left', correct: true },
          { text: 'Red giants, at the top right' },
          { text: 'The main sequence, from top left to bottom right' },
          { text: 'Red dwarfs, at the bottom right' },
        ],
      },
      solution: () => [{ text: 'A hot star with a low luminosity must be very small ($L = \\sigma 4\\pi R^2 T^4$). White dwarfs are about the size of Earth, at the bottom left of the diagram.' }],
      markscheme: () => [{ note: 'White dwarfs.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Star X and star Y have the same surface temperature. Star X is ${p.k} times as luminous as star Y. Calculate $\\dfrac{R_X}{R_Y}$, the ratio of their radii.`,
      response: { kind: 'numeric', answer: 'radii', symbol: 'R_X/R_Y', positive: true },
      solution: ({ p, r }) => [
        {
          text: 'With the same temperature, $L \\propto R^2$ (from $L = \\sigma 4\\pi R^2 T^4$), so the ratio of the radii is the square root of the ratio of the luminosities.',
          math: tex`\frac{R_X}{R_Y} = \sqrt{\frac{L_X}{L_Y}} = \sqrt{${p.k}} = ${fmtA(r.radii)}`,
        },
        { text: 'Stars directly above one another on the HR diagram differ in size: the more luminous one is larger, as giants are.' },
      ],
      markscheme: ({ r }) => [{ mark: '$L \\propto R^2$ at the same temperature' }, { mark: tex`$${fmtA(r.radii)}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) =>
        `A red giant and a main-sequence star have the same luminosity. The surface temperature of the main-sequence star is ${d.q} times that of the red giant. Calculate $\\dfrac{R_{\\text{giant}}}{R_{\\text{main sequence}}}$.`,
      response: { kind: 'numeric', answer: 'giant', symbol: 'R_{\\text{giant}}/R_{\\text{MS}}', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'With the same luminosity, $R^2 T^4$ is the same for both stars, so $R \\propto \\dfrac{1}{T^2}$: the cooler star is larger.',
          math: tex`\frac{R_{\text{giant}}}{R_{\text{MS}}} = \left(\frac{T_{\text{MS}}}{T_{\text{giant}}}\right)^2 = ${d.q}^2 = ${fmtA(r.giant)}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$R \\propto 1/T^2$ at the same luminosity' }, { mark: tex`$${fmtA(r.giant)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement describes a star on the main sequence?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is fusing hydrogen into helium in its core, and it spends most of its life there.', correct: true },
          { text: 'It is fusing helium into carbon in its core after its hydrogen has run out.' },
          { text: 'It has stopped fusion and is cooling down.' },
          { text: 'It is contracting because gravity is no longer balanced.' },
        ],
      },
      solution: () => [
        {
          text: 'Main-sequence stars are stable stars fusing hydrogen in their cores. Their position along the main sequence is set by their mass: more massive stars are hotter and more luminous.',
        },
      ],
      markscheme: () => [{ note: 'Hydrogen fusion in the core.' }],
    },
  ],
});
