import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';

/** Nuclides for the notation part: symbol, Z, A, and the elements with proton numbers Z − 1 and Z + 1. */
const NUCLIDES: Record<string, { sym: string; Z: number; A: number; below: string; above: string }> = {
  'Au-197': { sym: 'Au', Z: 79, A: 197, below: 'Pt', above: 'Hg' },
  'Ag-107': { sym: 'Ag', Z: 47, A: 107, below: 'Pd', above: 'Cd' },
  'Pt-195': { sym: 'Pt', Z: 78, A: 195, below: 'Ir', above: 'Au' },
  'Al-27': { sym: 'Al', Z: 13, A: 27, below: 'Mg', above: 'Si' },
  'Cu-63': { sym: 'Cu', Z: 29, A: 63, below: 'Ni', above: 'Zn' },
  'Fe-56': { sym: 'Fe', Z: 26, A: 56, below: 'Mn', above: 'Co' },
  'Pb-208': { sym: 'Pb', Z: 82, A: 208, below: 'Tl', above: 'Bi' },
  'U-238': { sym: 'U', Z: 92, A: 238, below: 'Pa', above: 'Np' },
  'Ni-58': { sym: 'Ni', Z: 28, A: 58, below: 'Co', above: 'Cu' },
  'Zn-64': { sym: 'Zn', Z: 30, A: 64, below: 'Cu', above: 'Ga' },
  'Sn-120': { sym: 'Sn', Z: 50, A: 120, below: 'In', above: 'Sb' },
  'Ba-138': { sym: 'Ba', Z: 56, A: 138, below: 'Cs', above: 'La' },
  'W-184': { sym: 'W', Z: 74, A: 184, below: 'Ta', above: 'Re' },
  'Hg-202': { sym: 'Hg', Z: 80, A: 202, below: 'Au', above: 'Tl' },
  'Bi-209': { sym: 'Bi', Z: 83, A: 209, below: 'Pb', above: 'Po' },
  'Th-232': { sym: 'Th', Z: 90, A: 232, below: 'Ac', above: 'Pa' },
};

const nuc = (A: number, Z: number, sym: string) => `{}^{${A}}_{${Z}}\\mathrm{${sym}}`;

export default defineQuestion({
  id: 'ibp-e1-rutherford-scattering',
  version: 1,
  title: 'The Geiger–Marsden experiment and nuclear notation',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.1', 'ibp.E.1.2'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 1,

  params: {
    n: { choices: Object.keys(NUCLIDES), base: 'Au-197' },
  },

  compute: (p) => {
    const x = NUCLIDES[p.n as string];
    return { N: x.A - x.Z, A: x.A, Z: x.Z };
  },

  stem: () =>
    'In the Geiger–Marsden experiment, alpha particles were fired at a very thin gold foil in a vacuum. Most of the alpha particles passed straight through the foil, some were deflected through small angles, and a very small number were deflected through angles greater than 90°.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'What can be concluded from the observation that most of the alpha particles passed straight through the foil?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Most of the volume of an atom is empty space.', correct: true },
          { text: 'The positive charge of an atom is spread evenly through it.' },
          { text: 'Alpha particles have too much energy to be deflected by atoms.' },
          { text: 'Gold atoms contain no electrons.' },
        ],
      },
      solution: () => [
        {
          text: 'If an alpha particle passes straight through, it has met nothing that exerts a large force on it. Since most do this, most of the atom must be (almost) empty space.',
        },
      ],
      markscheme: () => [{ note: 'Most of the atom is empty space.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'What can be concluded from the very small number of alpha particles deflected through more than 90°?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The positive charge and most of the mass of an atom are concentrated in a very small nucleus.', correct: true },
          { text: 'Electrons are much more massive than alpha particles.' },
          { text: 'The atom is a uniform sphere of positive charge with electrons embedded in it.' },
          { text: 'Alpha particles are attracted by the nucleus.' },
        ],
      },
      solution: () => [
        {
          text: 'Only a very large repulsive force can turn a fast, massive alpha particle back. That needs a large positive charge concentrated in a tiny region, which also contains most of the mass (otherwise the nucleus itself would be knocked away). Because the nucleus is so small, very few alpha particles pass close enough to it.',
        },
      ],
      markscheme: () => [{ note: 'A small, dense, positively charged nucleus.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ p }) => {
        const x = NUCLIDES[p.n as string];
        return `State the number of neutrons in a nucleus of $${nuc(x.A, x.Z, x.sym)}$.`;
      },
      response: { kind: 'numeric', answer: 'N', symbol: 'N', positive: true },
      solution: ({ p, r }) => {
        const x = NUCLIDES[p.n as string];
        return [
          {
            text: `In nuclear notation $${nuc(x.A, x.Z, x.sym)}$, the upper number is the nucleon number $A$ (protons + neutrons) and the lower number is the proton number $Z$. The number of neutrons is $A - Z = ${x.A} - ${x.Z} = ${fmtA(r.N)}$.`,
          },
        ];
      },
      markscheme: ({ r }) => [{ mark: `$N = ${fmtA(r.N)}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ p }) => {
        const x = NUCLIDES[p.n as string];
        return `Which of these nuclei is an isotope of $${nuc(x.A, x.Z, x.sym)}$?`;
      },
      response: {
        kind: 'mcq',
        options: ({ p }) => {
          const x = NUCLIDES[p.n as string];
          return [
            { text: `$${nuc(x.A + 2, x.Z, x.sym)}$`, correct: true },
            { text: `$${nuc(x.A, x.Z + 1, x.above)}$` },
            { text: `$${nuc(x.A + 1, x.Z + 1, x.above)}$` },
            { text: `$${nuc(x.A - 1, x.Z - 1, x.below)}$` },
          ];
        },
      },
      solution: () => [
        {
          text: 'Isotopes of an element have the same proton number (so they are the same element) but different numbers of neutrons, so a different nucleon number. Only the first option has the same proton number.',
        },
      ],
      markscheme: () => [{ note: 'Same Z, different A.' }],
    },
  ],
});
