import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** A charge in nC, with its sign, for question text. */
const nC = (q: number) => (q > 0 ? `+${q}` : q < 0 ? `−${-q}` : '0');

export default defineQuestion({
  id: 'ibp-d2-charging-and-fields',
  version: 1,
  title: 'Sharing charge, charging by induction, and magnetic field patterns',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.2', 'ibp.D.2.1', 'ibp.D.2.6'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    q1: { choices: [6, 8, 10, 12, -4], base: 10 },
    q2: { choices: [-6, -4, -2, 0, 2], base: -4 },
  },
  // The charges differ, so some charge does move when the spheres touch.
  constraint: (p) => p.q1 !== p.q2,

  compute: (p) => {
    const shared = (p.q1 + p.q2) / 2; // nC each
    const moved = Math.abs(p.q1 - shared) * 1e-9;
    const electrons = moved / IB.e;
    return { shared, moved, electrons };
  },

  stem: ({ p }) =>
    `Two identical small conducting spheres, X and Y, carry charges of ${Q(nC(p.q1), 'nC')} and ${Q(nC(p.q2), 'nC')}. They are touched together and then separated.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the charge on X after the spheres are separated.',
      response: { kind: 'numeric', answer: 'shared', symbol: 'q', unit: 'nC' },
      solution: ({ p, r }) => [
        { text: 'Charge is conserved, and identical spheres share the total charge equally:', math: tex`q = \frac{(${p.q1}) + (${p.q2})}{2} = ${r.shared}\ ${u('nC')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Total charge conserved and shared equally' }, { mark: tex`$q = ${r.shared}\ ${u('nC')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'How many electrons moved from one sphere to the other?',
      response: { kind: 'numeric', answer: 'electrons', symbol: 'N', positive: true },
      solution: ({ p, r }) => [
        { text: `The charge on X changed from ${nC(p.q1)} nC to ${nC(r.shared)} nC, a change of ${fmtA(r.moved * 1e9)} nC carried by electrons:`, math: tex`N = \frac{${fmtA(r.moved * 1e9)} \times 10^{-9}}{1.60 \times 10^{-19}} = ${fmtA(r.electrons)}` },
        { text: `Electrons moved ${p.q1 > r.shared ? 'from Y to X' : 'from X to Y'} (only electrons move in a metal; positive charges stay with the fixed ions).` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.electrons)}$ electrons` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () =>
        'A positively charged rod is held near an uncharged metal sphere on an insulating stand. With the rod still in place, the sphere is touched briefly with an earthed wire. The wire is then removed, and after that the rod is taken away. What is the final charge on the sphere?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Negative: electrons attracted by the rod flowed up from the earth and are trapped when the wire is removed.', correct: true },
          { text: 'Positive: the rod has passed some of its charge to the sphere.' },
          { text: 'Zero: any charge on the sphere flows to the earth.' },
          { text: 'Positive: electrons flowed from the sphere to the earth.' },
        ],
      },
      solution: () => [{ text: 'This is charging by induction. The rod attracts electrons; with the sphere earthed, electrons flow up from the earth onto the sphere. Removing the wire before the rod traps them, so the sphere ends up with the opposite charge to the rod. The rod never touches the sphere.' }],
      markscheme: () => [{ note: 'Induction: opposite charge to the rod (negative).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which describes the magnetic field of a long solenoid carrying a steady current?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Inside: strong, uniform and parallel to the axis. Outside: weak, with a shape like the field of a bar magnet.', correct: true },
          { text: 'Inside: zero. Outside: circles around the solenoid.' },
          { text: 'Inside: circles around the axis. Outside: uniform and parallel to the axis.' },
          { text: 'Inside and outside: radial lines pointing away from the axis.' },
        ],
      },
      solution: () => [{ text: 'The fields of the turns add inside the solenoid to give a strong, nearly uniform field along the axis. Outside, the field lines spread out and return from one end to the other, like those of a bar magnet.' }],
      markscheme: () => [{ note: 'Uniform field inside along the axis; bar-magnet pattern outside.' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'A long straight wire carries a current into the page. Seen from above the page, what is the direction of the magnetic field around it?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Clockwise circles centred on the wire', correct: true },
          { text: 'Anticlockwise circles centred on the wire' },
          { text: 'Straight lines pointing away from the wire' },
          { text: 'Straight lines pointing towards the wire' },
        ],
      },
      solution: () => [{ text: 'Right-hand grip rule: point the thumb along the current (into the page); the fingers curl clockwise.' }],
      markscheme: () => [{ note: 'Clockwise (right-hand grip rule).' }],
    },
  ],
});
