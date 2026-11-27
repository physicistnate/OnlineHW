import { defineQuestion } from '../../../engine/define';
import { atanD, fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-explosion-2d',
  version: 1,
  title: 'A firework shell explodes into three pieces',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.10', 'ibp.A.2.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    mA: { min: 0.1, max: 0.5, step: 0.02, base: 0.24, dp: 2 },
    mB: { min: 0.1, max: 0.5, step: 0.02, base: 0.18, dp: 2 },
    mC: { min: 0.1, max: 0.5, step: 0.02, base: 0.3, dp: 2 },
    vA: { min: 5, max: 30, step: 1, base: 12 },
    vB: { min: 5, max: 30, step: 1, base: 17 },
  },
  // C moves off at a clear angle and a believable speed.
  constraint: (p) => {
    const ax = p.mA * p.vA;
    const by = p.mB * p.vB;
    const angle = atanD(by / ax);
    const vC = Math.hypot(ax, by) / p.mC;
    return angle >= 15 && angle <= 75 && vC <= 60;
  },

  compute: (p, c) => {
    const pA = p.mA * p.vA;
    const pB = p.mB * p.vB;
    const ax = c.carry(pA, 'pA');
    const by = c.carry(pB, 'pB');
    const pC = Math.sqrt(ax ** 2 + by ** 2);
    const vC = c.carry(pC, 'pC') / p.mC;
    const angle = atanD(by / ax);
    return { pA, pB, pC, vC, angle };
  },

  stem: ({ d }) =>
    `A firework shell is at rest when it explodes into three fragments, which all move off horizontally. Fragment A, of mass ${Q(d.mA, 'kg')}, moves due east at ${Q(d.vA, 'm s-1')}. Fragment B, of mass ${Q(d.mB, 'kg')}, moves due north at ${Q(d.vB, 'm s-1')}. Fragment C has a mass of ${Q(d.mC, 'kg')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the magnitude of the momentum of fragment C.',
      response: { kind: 'numeric', answer: 'pC', symbol: 'p_C', unit: 'kg m s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The shell was at rest, so the total momentum is zero after the explosion too, in every direction. The momenta of A (east) and B (north) are perpendicular.',
          math: tex`p_A = ${d.mA} \times ${d.vA} = ${fmtW(r.pA)}\ ${u('kg m s-1')}, \qquad p_B = ${d.mB} \times ${d.vB} = ${fmtW(r.pB)}\ ${u('kg m s-1')}`,
        },
        {
          text: 'C must cancel both: it has a westward component equal to $p_A$ and a southward component equal to $p_B$. Combine them with Pythagoras.',
          math: tex`p_C = \sqrt{p_A^{\,2} + p_B^{\,2}} = \sqrt{${fmtW(r.pA)}^2 + ${fmtW(r.pB)}^2} = ${fmtA(r.pC)}\ ${u('kg m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Total momentum zero: C’s components cancel the momenta of A and B' },
        { mark: tex`$p_C = ${fmtA(r.pC)}\ ${u('kg m s-1')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the speed of fragment C.',
      response: { kind: 'numeric', answer: 'vC', symbol: 'v_C', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Speed = momentum ÷ mass.',
          math: tex`v_C = \frac{${fmtW(r.pC)}}{${d.mC}} = ${fmtA(r.vC)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v_C = ${fmtA(r.vC)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Fragment C moves in a direction between west and south. Determine the angle between the velocity of C and due west.',
      response: { kind: 'numeric', answer: 'angle', symbol: '\\theta', unit: 'deg', positive: true },
      solution: ({ r }) => [
        {
          text: 'The southward component of C’s momentum is $p_B$ and the westward component is $p_A$. Measured from due west, the southward component is opposite the angle.',
          math: tex`\tan\theta = \frac{p_B}{p_A} = \frac{${fmtW(r.pB)}}{${fmtW(r.pA)}} \quad\Rightarrow\quad \theta = ${fmtA(r.angle)}^{\circ}\ \text{south of west}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $\\tan\\theta = p_B / p_A$' }, { mark: tex`$\theta = ${fmtA(r.angle)}^{\circ}$ south of west` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about the total momentum of the three fragments just after the explosion is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is zero, the same as the momentum of the shell before it exploded.', correct: true },
          { text: 'It is equal to the momentum of fragment C.' },
          { text: 'It is greater than zero, because the explosion releases energy.' },
          { text: 'It cannot be found without knowing the time the explosion lasted.' },
        ],
      },
      solution: () => [
        {
          text: 'The forces in the explosion are internal: the fragments push on each other. With no resultant external force, the total momentum stays at its value before the explosion, which is zero. Energy is released as kinetic energy, but that does not change the total momentum.',
        },
      ],
      markscheme: () => [{ note: 'Internal forces cannot change the total momentum of the system.' }],
    },
  ],
});
