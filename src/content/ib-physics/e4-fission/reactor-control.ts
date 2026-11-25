import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-e4-reactor-control',
  version: 1,
  title: 'Chain reactions and controlling a reactor',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.4',
  standards: ['ibp.E.4.2', 'ibp.E.4.3'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 2,

  params: {
    k: { min: 1.0005, max: 1.003, step: 0.0005, base: 1.001, dp: 4 },
    tau: { min: 0.05, max: 0.2, step: 0.05, base: 0.1, dp: 2 },
    t: { min: 30, max: 120, step: 30, base: 60 },
  },
  // A noticeable but not explosive increase (1.1 to 1000 times).
  constraint: (p) => {
    const g = p.k ** (p.t / p.tau);
    return g >= 1.1 && g <= 1000;
  },

  compute: (p) => {
    const gens = p.t / p.tau;
    const growth = p.k ** gens;
    return { gens, growth };
  },

  stem: () => 'This question is about the chain reaction in a nuclear reactor.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which row gives the roles of the control rods and the moderator?',
      response: {
        kind: 'mcq',
        columns: ['Control rods', 'Moderator'],
        options: () => [
          { cells: ['absorb neutrons', 'slows neutrons down'], correct: true },
          { cells: ['slow neutrons down', 'absorbs neutrons'] },
          { cells: ['absorb neutrons', 'absorbs gamma radiation'] },
          { cells: ['reflect neutrons back', 'slows neutrons down'] },
        ],
      },
      solution: () => [{ text: 'Control rods (for example boron or cadmium) absorb neutrons, so moving them in or out changes the rate of fission. The moderator slows neutrons so that uranium-235 can capture them.' }],
      markscheme: () => [{ note: 'Control rods absorb neutrons; the moderator slows them.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'What is meant by the critical mass of a fissile material?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The smallest mass in which, on average, one neutron from each fission goes on to cause another fission', correct: true },
          { text: 'The mass of fuel used by a reactor in one year' },
          { text: 'The largest mass that can be stored safely without shielding' },
          { text: 'The mass that is converted to energy in each fission' },
        ],
      },
      solution: () => [
        {
          text: 'In a small piece of fuel too many neutrons escape through the surface. Above the critical mass, at least one neutron per fission causes another fission, so the chain reaction sustains itself.',
        },
      ],
      markscheme: () => [{ note: 'Self-sustaining chain reaction: on average one neutron per fission causes another.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'The control rods are lowered further into the core. What happens?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'More neutrons are absorbed, so the rate of fission and the power decrease.', correct: true },
          { text: 'More neutrons are slowed down, so the power increases.' },
          { text: 'The temperature of the moderator increases, so the power increases.' },
          { text: 'Nothing changes until the fuel is replaced.' },
        ],
      },
      solution: () => [{ text: 'Fewer neutrons are left to cause fissions, so the chain reaction slows and the power falls. Fully inserted rods shut the reactor down.' }],
      markscheme: () => [{ note: 'More absorption, less fission, less power.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) =>
        `In steady operation each fission leads, on average, to exactly one more fission. For a short time the control rods are raised slightly, so that each fission leads on average to ${d.k} further fissions. Each generation of fissions takes ${Q(d.tau, 's')}. Calculate the factor by which the power increases in ${Q(d.t, 's')}.`,
      response: { kind: 'numeric', answer: 'growth', symbol: '\\text{factor}', positive: true },
      solution: ({ d, r }) => [
        { text: 'The number of fissions, and so the power, is multiplied by the same factor every generation.', math: tex`\text{generations} = \frac{${d.t}}{${d.tau}} = ${fmtA(r.gens)}` },
        { math: tex`\text{factor} = ${d.k}^{${fmtA(r.gens)}} = ${fmtA(r.growth)}` },
        { text: 'Even a multiplication factor only slightly above 1 makes the power rise quickly, which is why reactors are controlled continuously. (Delayed neutrons make the generation time long enough to control.)' },
      ],
      markscheme: ({ r }) => [{ mark: tex`Number of generations $= ${fmtA(r.gens)}$` }, { mark: tex`Factor $= ${fmtA(r.growth)}$` }],
    },
  ],
});
