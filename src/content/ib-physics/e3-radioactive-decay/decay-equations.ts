import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';

type Mode = 'alpha' | 'beta-' | 'beta+';
/** Parent nuclide, its decay and the daughter's symbol. */
const DECAYS: Record<string, { sym: string; Z: number; A: number; mode: Mode; daughter: string }> = {
  U238: { sym: 'U', Z: 92, A: 238, mode: 'alpha', daughter: 'Th' },
  Ra226: { sym: 'Ra', Z: 88, A: 226, mode: 'alpha', daughter: 'Rn' },
  Po210: { sym: 'Po', Z: 84, A: 210, mode: 'alpha', daughter: 'Pb' },
  Am241: { sym: 'Am', Z: 95, A: 241, mode: 'alpha', daughter: 'Np' },
  Rn222: { sym: 'Rn', Z: 86, A: 222, mode: 'alpha', daughter: 'Po' },
  Th232: { sym: 'Th', Z: 90, A: 232, mode: 'alpha', daughter: 'Ra' },
  C14: { sym: 'C', Z: 6, A: 14, mode: 'beta-', daughter: 'N' },
  Sr90: { sym: 'Sr', Z: 38, A: 90, mode: 'beta-', daughter: 'Y' },
  Co60: { sym: 'Co', Z: 27, A: 60, mode: 'beta-', daughter: 'Ni' },
  I131: { sym: 'I', Z: 53, A: 131, mode: 'beta-', daughter: 'Xe' },
  Cs137: { sym: 'Cs', Z: 55, A: 137, mode: 'beta-', daughter: 'Ba' },
  K40: { sym: 'K', Z: 19, A: 40, mode: 'beta-', daughter: 'Ca' },
  Na22: { sym: 'Na', Z: 11, A: 22, mode: 'beta+', daughter: 'Ne' },
  F18: { sym: 'F', Z: 9, A: 18, mode: 'beta+', daughter: 'O' },
};
const MODE_NAME: Record<Mode, string> = { alpha: 'alpha', 'beta-': 'beta-minus (β⁻)', 'beta+': 'beta-plus (β⁺)' };

const nuc = (A: number | string, Z: number | string, sym: string) => `{}^{${A}}_{${Z}}\\mathrm{${sym}}`;

export default defineQuestion({
  id: 'ibp-e3-decay-equations',
  version: 1,
  title: 'Completing a radioactive decay equation',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.4'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    n: { choices: Object.keys(DECAYS), base: 'U238' },
  },

  compute: (p) => {
    const x = DECAYS[p.n as string];
    const Zd = x.mode === 'alpha' ? x.Z - 2 : x.mode === 'beta-' ? x.Z + 1 : x.Z - 1;
    const Ad = x.mode === 'alpha' ? x.A - 4 : x.A;
    return { Zd, Ad, Nd: Ad - Zd };
  },

  stem: ({ p }) => {
    const x = DECAYS[p.n as string];
    return `The nuclide $${nuc(x.A, x.Z, x.sym)}$ decays by ${MODE_NAME[x.mode]} decay to an isotope of ${x.daughter}: $\\;${nuc(x.A, x.Z, x.sym)} \\rightarrow ${nuc('A', 'Z', x.daughter)} + \\ldots$`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'State the proton number $Z$ of the daughter nucleus.',
      response: { kind: 'numeric', answer: 'Zd', symbol: 'Z', positive: true },
      solution: ({ p, r }) => {
        const x = DECAYS[p.n as string];
        const why =
          x.mode === 'alpha'
            ? 'An alpha particle is a helium nucleus, $^{4}_{2}\\mathrm{He}$: the nucleus loses 2 protons.'
            : x.mode === 'beta-'
              ? 'In β⁻ decay a neutron changes into a proton, emitting an electron ($^{\\;\\,0}_{-1}\\mathrm{e}$) and an antineutrino: the proton number goes up by 1.'
              : 'In β⁺ decay a proton changes into a neutron, emitting a positron ($^{0}_{+1}\\mathrm{e}$) and a neutrino: the proton number goes down by 1.';
        return [{ text: `${why} Charge is conserved, so $Z = ${fmtA(r.Zd)}$.` }];
      },
      markscheme: ({ r }) => [{ mark: `$Z = ${fmtA(r.Zd)}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the number of neutrons in the daughter nucleus.',
      response: { kind: 'numeric', answer: 'Nd', symbol: 'N', positive: true },
      solution: ({ p, r }) => {
        const x = DECAYS[p.n as string];
        return [
          {
            text: `The nucleon number is conserved: ${x.mode === 'alpha' ? `the alpha particle carries away 4 nucleons, so $A = ${x.A} - 4 = ${r.Ad}$` : `beta decay does not change it, so $A = ${r.Ad}$`}. The number of neutrons is $A - Z = ${r.Ad} - ${r.Zd} = ${fmtA(r.Nd)}$.`,
          },
        ];
      },
      markscheme: ({ r }) => [{ mark: `$N = ${fmtA(r.Nd)}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Which particles are emitted in this decay, apart from any gamma rays?',
      response: {
        kind: 'mcq',
        options: ({ p }) => {
          const m = DECAYS[p.n as string].mode;
          return [
            { text: 'An alpha particle (a helium-4 nucleus) only', correct: m === 'alpha' },
            { text: 'An electron and an electron antineutrino', correct: m === 'beta-' },
            { text: 'A positron and an electron neutrino', correct: m === 'beta+' },
            { text: 'A neutron and a proton' },
          ];
        },
      },
      solution: ({ p }) => {
        const m = DECAYS[p.n as string].mode;
        return [
          {
            text:
              m === 'alpha'
                ? 'Alpha decay emits a helium-4 nucleus (two protons and two neutrons).'
                : m === 'beta-'
                  ? 'β⁻ decay emits an electron and an electron antineutrino, which shares the energy released.'
                  : 'β⁺ decay emits a positron (the antiparticle of the electron) and an electron neutrino.',
          },
        ];
      },
      markscheme: ({ p }) => [{ note: { alpha: 'Alpha particle.', 'beta-': 'Electron and antineutrino.', 'beta+': 'Positron and neutrino.' }[DECAYS[p.n as string].mode] }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which quantities are conserved in every radioactive decay equation?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Nucleon number and charge', correct: true },
          { text: 'Nucleon number and number of neutrons' },
          { text: 'Charge and number of protons' },
          { text: 'Number of protons and number of neutrons' },
        ],
      },
      solution: () => [
        {
          text: 'The top numbers (nucleon numbers) and the bottom numbers (charges, counting an electron as −1 and a positron as +1) balance on both sides. Protons and neutrons can change into each other in beta decay, so their separate numbers are not conserved.',
        },
      ],
      markscheme: () => [{ note: 'Nucleon number and charge.' }],
    },
  ],
});
