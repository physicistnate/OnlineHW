import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, snapZero } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-skaters-push',
  version: 1,
  title: 'Two skaters push apart',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.8', 'ibp.A.2.6', 'ibp.A.2.1', 'ibp.A.2.7'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    mA: { min: 40, max: 80, step: 1, base: 50 },
    mB: { min: 40, max: 80, step: 1, base: 75 },
    vA: { min: 0.5, max: 3.0, step: 0.1, base: 1.8, dp: 1 },
    tp: { min: 0.3, max: 0.8, step: 0.1, base: 0.5, dp: 1 },
  },
  // Clearly different masses, so the two speeds differ.
  constraint: (p) => Math.abs(p.mA - p.mB) >= 5,

  compute: (p, c) => {
    const pA = p.mA * p.vA;
    const vB = c.carry(pA, 'pA') / p.mB;
    // Total momentum afterwards: A one way, B the other. Exactly zero, as before the push.
    const pB = p.mB * vB;
    const total = snapZero(pA - pB, pA, pB);
    const F = c.carry(pA, 'pA') / p.tp;
    return { pA, vB, total, F };
  },

  stem: ({ d }) =>
    `Two ice skaters stand at rest, facing each other, on smooth horizontal ice. Skater A has a mass of ${Q(d.mA, 'kg')} and skater B has a mass of ${Q(d.mB, 'kg')}. They push against each other, and A moves off at ${Q(d.vA, 'm s-1')}. Friction between the skates and the ice is negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'State the total momentum of the two skaters after they push apart.',
      response: { kind: 'numeric', answer: 'total', symbol: 'p_{\\text{total}}', unit: 'kg m s-1' },
      solution: () => [
        {
          text: 'No external horizontal force acts on the two skaters, so their total momentum is conserved. They start at rest, so the total momentum is zero before the push, and it is still zero afterwards: the skaters move apart with momenta of equal size in opposite directions.',
          math: tex`p_{\text{total}} = 0`,
        },
      ],
      markscheme: () => [{ mark: 'Zero' }, { note: 'The momenta of the skaters are equal in size and opposite in direction.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the speed of skater B.',
      response: { kind: 'numeric', answer: 'vB', symbol: 'v_B', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The two momenta are equal in size. Find A’s momentum, then divide by B’s mass.',
          math: tex`m_A v_A = m_B v_B \quad\Rightarrow\quad v_B = \frac{${d.mA} \times ${d.vA}}{${d.mB}} = \frac{${fmtW(r.pA)}}{${d.mB}} = ${fmtA(r.vB)}\ ${u('m s-1')}`,
        },
        { text: 'B moves in the opposite direction to A, and more slowly if B is heavier.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Momenta equal in size: $m_A v_A = m_B v_B$' }, { mark: tex`$v_B = ${fmtA(r.vB)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `The push lasts for ${Q(d.tp, 's')}. Calculate the magnitude of the average force exerted on skater A by skater B.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The impulse on A equals A’s change in momentum. A starts at rest, so the change is A’s final momentum.',
          math: tex`F = \frac{\Delta p}{\Delta t} = \frac{${fmtW(r.pA)}}{${d.tp}} = ${fmtA(r.F)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Impulse = change in momentum, $F = \\Delta p / \\Delta t$' }, { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about the forces during the push is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The force of A on B is equal in size and opposite in direction to the force of B on A.', correct: true },
          { text: 'The heavier skater exerts the larger force.' },
          { text: 'The lighter skater exerts the larger force, because the lighter skater moves off faster.' },
          { text: 'Each skater pushes only on the ice, not on the other skater.' },
        ],
      },
      solution: () => [
        {
          text: 'By Newton’s third law, the forces the skaters exert on each other are an equal and opposite pair, whatever their masses. The lighter skater moves off faster because the same impulse gives a smaller mass a larger velocity.',
        },
      ],
      markscheme: () => [{ note: 'Newton’s third law: equal and opposite forces on the two skaters.' }],
    },
  ],
});
