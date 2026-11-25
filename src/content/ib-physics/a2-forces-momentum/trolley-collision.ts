import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-trolley-collision',
  version: 1,
  title: 'Two trolleys stick together',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.6', 'ibp.A.2.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    mA: { min: 0.5, max: 2.0, step: 0.1, base: 0.8, dp: 2 },
    mB: { min: 0.5, max: 2.0, step: 0.1, base: 1.2, dp: 2 },
    uA: { min: 0.5, max: 3.0, step: 0.1, base: 1.5, dp: 1 },
  },

  compute: (p, c) => {
    const pA = p.mA * p.uA;
    const mTot = p.mA + p.mB;
    const v = c.carry(pA, 'pA') / mTot;
    const KE1 = 0.5 * p.mA * p.uA ** 2;
    const KE2 = 0.5 * mTot * c.carry(v, 'v') ** 2;
    return { pA, mTot, v, KE1, KE2 };
  },

  stem: ({ d }) =>
    `Trolley A of mass ${Q(d.mA, 'kg')} moves at ${Q(d.uA, 'm s-1')} along a straight horizontal track towards trolley B of mass ${Q(d.mB, 'kg')}, which is at rest. The trolleys collide and stick together. Friction is negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the momentum of trolley A before the collision.',
      response: { kind: 'numeric', answer: 'pA', symbol: 'p', unit: 'kg m s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Momentum = mass × velocity.',
          math: tex`p = m_A u_A = ${d.mA} \times ${d.uA} = ${fmtA(r.pA)}\ ${u('kg m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$p = ${fmtA(r.pA)}\ ${u('kg m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the velocity of the trolleys immediately after the collision.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'No external horizontal force acts, so the total momentum is conserved. Before: only A moves. After: the trolleys move together with one velocity $v$.',
          math: tex`m_A u_A = (m_A + m_B)\,v`,
        },
        {
          text: 'Rearrange and substitute the momentum from (a).',
          math: tex`v = \frac{${fmtW(r.pA)}}{${d.mA} + ${d.mB}} = \frac{${fmtW(r.pA)}}{${fmtW(r.mTot)}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Conservation of momentum: $m_A u_A = (m_A + m_B)v$' },
        { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` },
        { note: 'Allow ECF from (a).' },
      ],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the total kinetic energy of the trolleys immediately after the collision.',
      response: { kind: 'numeric', answer: 'KE2', symbol: 'E_k', unit: 'J', positive: true },
      solution: ({ r }) => [
        {
          text: 'After the collision the trolleys move together, so treat them as one body of mass $m_A + m_B$ moving at the velocity from (b).',
          math: tex`E_k = \tfrac{1}{2}(m_A + m_B)v^2 = \tfrac{1}{2} \times ${fmtW(r.mTot)} \times ${fmtW(r.v)}^2 = ${fmtA(r.KE2)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $E_k = \\tfrac{1}{2}mv^2$ with the combined mass' },
        { mark: tex`$E_k = ${fmtA(r.KE2)}\ ${u('J')}$` },
        { note: 'Allow ECF from (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about this collision is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Momentum is conserved but kinetic energy is not, so the collision is inelastic.', correct: true },
          { text: 'Kinetic energy is conserved but momentum is not, so the collision is inelastic.' },
          { text: 'Momentum and kinetic energy are both conserved, so the collision is elastic.' },
          { text: 'Neither momentum nor total energy is conserved.' },
        ],
      },
      solution: ({ d, r }) => [
        {
          text: 'Compare the kinetic energy before the collision with your answer to (c).',
          math: tex`E_{k,\text{before}} = \tfrac{1}{2} \times ${d.mA} \times ${d.uA}^2 = ${fmtA(r.KE1)}\ ${u('J')} \quad > \quad E_{k,\text{after}} = ${fmtA(r.KE2)}\ ${u('J')}`,
        },
        {
          text: 'Momentum is conserved in every collision of an isolated system. Kinetic energy is lost, so the collision is inelastic (trolleys that stick together always lose kinetic energy). The total energy is still conserved: the lost kinetic energy becomes internal energy and sound.',
        },
      ],
      markscheme: () => [{ note: 'Momentum is always conserved in an isolated system; kinetic energy is conserved only in an elastic collision.' }],
    },
  ],
});
