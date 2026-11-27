import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** hc in MeV pm, from the data-booklet values (1.243 MeV pm). */
const HC = 1.243;

export default defineQuestion({
  id: 'ibp-e3-nuclear-stability',
  version: 1,
  title: 'Nuclear stability, beta spectra and nuclear energy levels',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.7', 'ibp.E.3.4'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 2,

  params: {
    E: { min: 0.1, max: 2.5, step: 0.05, base: 1.15, dp: 2 },
  },

  compute: (p) => ({ lam: HC / p.E }),

  stem: () => 'This question is about the stability of nuclei and the radiation they emit.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'A nuclide lies above the line of stability on a graph of neutron number against proton number: it has too many neutrons. Which decay is it most likely to undergo?',
      response: {
        kind: 'mcq',
        options: () => [{ text: 'β⁻ decay', correct: true }, { text: 'β⁺ decay' }, { text: 'Alpha decay' }, { text: 'Gamma decay only' }],
      },
      solution: () => [
        {
          text: 'In β⁻ decay a neutron changes into a proton, which lowers the neutron–proton ratio towards the line of stability. (Proton-rich nuclides undergo β⁺ decay; heavy nuclides often decay by alpha emission.)',
        },
      ],
      markscheme: () => [{ note: 'Neutron-rich: β⁻.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Beta particles from a sample are emitted with a continuous range of kinetic energies up to a maximum. What does this show?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A second particle, the (anti)neutrino, shares the energy released in each decay.', correct: true },
          { text: 'Energy is not conserved in beta decay.' },
          { text: 'Each nucleus releases a different amount of energy.' },
          { text: 'Beta particles lose energy as they leave the nucleus.' },
        ],
      },
      solution: () => [
        {
          text: 'Each decay releases the same energy. If only the beta particle were emitted it would always have the same energy. A continuous spectrum means the energy is shared, in different proportions each time, with another particle that is hard to detect: the neutrino (or antineutrino).',
        },
      ],
      markscheme: () => [{ note: 'Energy shared with a neutrino/antineutrino.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `After a decay, the daughter nucleus is left in an excited state and emits a gamma-ray photon of energy ${Q(d.E, 'MeV')}. Calculate the wavelength of the photon, in pm.`,
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'pm', positive: true },
      solution: ({ d, r }) => [
        {
          text: '$\\lambda = hc/E$. With the data-booklet values, $hc = 6.63 \\times 10^{-34} \\times 3.00 \\times 10^{8}$ J m $= 1.243$ MeV pm.',
          math: tex`\lambda = \frac{hc}{E} = \frac{1.243}{${d.E}} = ${fmtA(r.lam)}\ ${u('pm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy converted, and $\\lambda = hc/E$' }, { mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('pm')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The alpha particles and gamma rays emitted by a nuclide have only certain discrete energies. What does this show?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Nuclei have discrete energy levels.', correct: true },
          { text: 'Nuclei contain alpha particles before they decay.' },
          { text: 'The strong force has a long range.' },
          { text: 'Alpha and gamma radiation are electromagnetic waves.' },
        ],
      },
      solution: () => [
        {
          text: 'Just as line spectra show atomic energy levels, the discrete energies of alpha particles and gamma rays show that a nucleus can only exist in certain energy states, and these emissions are transitions between them.',
        },
      ],
      markscheme: () => [{ note: 'Discrete nuclear energy levels.' }],
    },
  ],
});
