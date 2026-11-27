import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-d2-field-two-charges',
  version: 1,
  title: 'The electric field between a positive and a negative charge',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.4', 'ibp.D.2.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Q1: { choices: [2, 4, 5, 8], base: 4 },
    Q2: { choices: [1, 2, 3, 4], base: 2 },
    L: { choices: [4, 6, 10], base: 6 },
  },

  compute: (p, c) => {
    const half = p.L / 200; // m
    const E1 = (IB.k * p.Q1 * 1e-9) / half ** 2;
    const E2 = (IB.k * p.Q2 * 1e-9) / half ** 2;
    const E = c.carry(E1, 'E1', 3) + c.carry(E2, undefined, 3);
    const F = IB.e * c.carry(E, 'E', 3);
    return { half, E1, E2, E, F };
  },

  stem: ({ d }) =>
    `A point charge of ${Q(`+${d.Q1}`, 'nC')} is fixed ${Q(d.L, 'cm')} from a point charge of ${Q(`−${d.Q2}`, 'nC')}. Point M is halfway between them.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the electric field strength at M due to the positive charge alone.',
      response: { kind: 'numeric', answer: 'E1', symbol: 'E', unit: 'N C-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`E = \frac{kQ}{r^2} = \frac{8.99 \times 10^{9} \times ${d.Q1} \times 10^{-9}}{(${r.half})^2} = ${fmtA(r.E1)}\ ${u('N C-1')}` }],
      markscheme: ({ r }) => [{ mark: '$E = kQ/r^2$ with $r$ half the separation, in metres' }, { mark: tex`$E = ${fmtA(r.E1)}\ ${u('N C-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the resultant electric field strength at M.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'N C-1', positive: true },
      solution: ({ d, r }) => [
        { math: tex`E_2 = \frac{8.99 \times 10^{9} \times ${d.Q2} \times 10^{-9}}{(${r.half})^2} = ${fmtW(r.E2)}\ ${u('N C-1')}` },
        { text: 'The field points away from the positive charge and towards the negative charge. At M both of these are the same direction, so the fields add:', math: tex`E = ${fmtW(r.E1)} + ${fmtW(r.E2)} = ${fmtA(r.E)}\ ${u('N C-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Both fields point towards the negative charge: added' }, { mark: tex`$E = ${fmtA(r.E)}\ ${u('N C-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'An electron is placed at M. Calculate the magnitude of the electric force on it.',
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ r }) => [
        { math: tex`F = eE = 1.60 \times 10^{-19} \times ${fmtW(r.E)} = ${fmtA(r.F)}\ ${u('N')}` },
        { text: 'The force on the negative electron is opposite to the field: towards the positive charge.' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about the electric field lines of these two charges is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They point away from the positive charge and towards the negative charge, never cross, and are closest together near the charges, where the field is strongest.', correct: true },
          { text: 'They point away from the negative charge and towards the positive charge.' },
          { text: 'They form closed loops around each charge.' },
          { text: 'They are evenly spaced everywhere, because the field is uniform.' },
        ],
      },
      solution: ({ p }) => [
        { text: 'Field lines show the direction of the force on a small positive test charge: away from positive charges and towards negative ones. Their spacing shows the strength of the field, which is greatest near the charges. Two lines cannot cross, because the field has only one direction at each point.' },
        {
          text:
            p.Q1 > p.Q2
              ? 'The number of lines on each charge is proportional to its size. Here the positive charge is the larger, so only some of its lines end on the negative charge: the rest go off to infinity.'
              : p.Q1 < p.Q2
                ? 'The number of lines on each charge is proportional to its size. Here the negative charge is the larger, so it also receives lines that come in from infinity, besides those from the positive charge.'
                : 'The number of lines on each charge is proportional to its size. Here the charges are equal in size, so every line that leaves the positive charge ends on the negative charge.',
        },
      ],
      markscheme: () => [{ note: 'Away from + and towards −; never cross; spacing shows field strength.' }],
    },
  ],
});
