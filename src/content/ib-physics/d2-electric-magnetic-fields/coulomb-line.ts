import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

interface P {
  qA: number;
  qB: number;
  qC: number;
  a: number;
  b: number;
}

/** Forces on B (N), positive towards C: from A (repulsion if B is positive) and from C. */
const forces = (p: P) => {
  const FA = (IB.k * p.qA * 1e-6 * Math.abs(p.qB) * 1e-6) / (p.a / 100) ** 2;
  const FC = (IB.k * p.qC * 1e-6 * Math.abs(p.qB) * 1e-6) / (p.b / 100) ** 2;
  return { FA, FC };
};

export default defineQuestion({
  id: 'ibp-d2-coulomb-line',
  version: 1,
  title: 'Coulomb’s law: the resultant force on a charge between two others',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    qA: { choices: [2, 3, 4, 6], base: 4 },
    qB: { choices: [-2, -1, 1, 2], base: -1 },
    qC: { choices: [1, 2, 3], base: 1 },
    a: { choices: [2, 3, 4], base: 3 },
    b: { choices: [2, 3, 5], base: 2 },
  },
  // The two forces on B differ clearly, so the resultant is not a small difference.
  constraint: (p) => {
    const { FA, FC } = forces(p);
    return Math.abs(FA - FC) >= 0.25 * Math.max(FA, FC);
  },

  compute: (p, c) => {
    const { FA, FC } = forces(p);
    const fa = c.carry(FA, 'FA', 3);
    const fc = c.carry(FC, undefined, 3);
    const net = Math.abs(fa - fc);
    const L = p.a + p.b;
    const x = (L * Math.sqrt(p.qA)) / (Math.sqrt(p.qA) + Math.sqrt(p.qC));
    return { FA, FC, net, L, x };
  },

  stem: ({ d, p }) =>
    `Three small charged spheres A, B and C are fixed on a straight line. A has charge ${Q(`+${d.qA}`, 'μC')}, B has charge ${Q(`${p.qB > 0 ? '+' : '−'}${Math.abs(p.qB)}`, 'μC')} and C has charge ${Q(`+${d.qC}`, 'μC')}. B is ${Q(d.a, 'cm')} from A and ${Q(d.b, 'cm')} from C, between them.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the magnitude of the electric force that A exerts on B.',
      response: { kind: 'numeric', answer: 'FA', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, p, r }) => [
        { math: tex`F = \frac{kq_Aq_B}{r^2} = \frac{8.99 \times 10^{9} \times ${d.qA} \times 10^{-6} \times ${Math.abs(p.qB)} \times 10^{-6}}{(${p.a / 100})^2} = ${fmtA(r.FA)}\ ${u('N')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Coulomb’s law with charges in C and distance in m' }, { mark: tex`$F = ${fmtA(r.FA)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the magnitude of the resultant electric force on B.',
      response: { kind: 'numeric', answer: 'net', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, p, r }) => [
        { math: tex`F_C = \frac{8.99 \times 10^{9} \times ${d.qC} \times 10^{-6} \times ${Math.abs(p.qB)} \times 10^{-6}}{(${p.b / 100})^2} = ${fmtW(r.FC)}\ ${u('N')}` },
        { text: 'A and C have the same sign, so their forces on B point in opposite directions along the line:', math: tex`F = ${fmtW(Math.max(r.FA, r.FC))} - ${fmtW(Math.min(r.FA, r.FC))} = ${fmtA(r.net)}\ ${u('N')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Forces from A and C in opposite directions, subtracted' }, { mark: tex`$F = ${fmtA(r.net)}\ ${u('N')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'In which direction is the resultant force on B?',
      response: {
        kind: 'mcq',
        ordered: true,
        options: ({ p }) => {
          const { FA, FC } = forces(p);
          // B positive: A pushes it towards C, C pushes it towards A. B negative: the reverse.
          const towardsC = (p.qB > 0) === FA > FC;
          return [
            { text: 'Towards A', correct: !towardsC },
            { text: 'Towards C', correct: towardsC },
            { text: 'Perpendicular to the line' },
            { text: 'There is no resultant force' },
          ];
        },
      },
      solution: ({ p }) => {
        const { FA, FC } = forces(p);
        const sign = p.qB > 0 ? 'positive, so both A and C repel it' : 'negative, so both A and C attract it';
        return [{ text: `B is ${sign}. The larger force is the one from ${FA > FC ? 'A' : 'C'}, so the resultant points ${(p.qB > 0) === FA > FC ? 'towards C' : 'towards A'}.` }];
      },
      markscheme: () => [{ note: 'Direction of the larger force (repulsion for a positive B, attraction for a negative B).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'B is moved along the line between A and C. Find its distance from A when the resultant force on it is zero.',
      response: { kind: 'numeric', answer: 'x', symbol: 'x', unit: 'cm', positive: true },
      solution: ({ d, r }) => [
        { text: `The forces balance where $\\dfrac{kq_Aq_B}{x^2} = \\dfrac{kq_Cq_B}{(L - x)^2}$, with $L = ${r.L}$ cm. The charge of B cancels:`, math: tex`x = \frac{L\sqrt{q_A}}{\sqrt{q_A} + \sqrt{q_C}} = \frac{${r.L}\sqrt{${d.qA}}}{\sqrt{${d.qA}} + \sqrt{${d.qC}}} = ${fmtA(r.x)}\ ${u('cm')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$q_A/x^2 = q_C/(L - x)^2$' }, { mark: tex`$x = ${fmtA(r.x)}\ ${u('cm')}$` }],
    },
  ],
});
