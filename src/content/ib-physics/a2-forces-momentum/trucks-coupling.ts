import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-trucks-coupling',
  version: 1,
  title: 'Railway trucks that couple together',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.8', 'ibp.A.2.6', 'ibp.A.2.7'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    mA: { min: 12000, max: 30000, step: 1000, base: 18000, sci: 2 },
    mB: { min: 12000, max: 30000, step: 1000, base: 24000, sci: 2 },
    uA: { min: 1.0, max: 4.0, step: 0.1, base: 2.5, dp: 1 },
    t: { min: 0.8, max: 2.0, step: 0.1, base: 1.5, dp: 1 },
  },

  compute: (p, c) => {
    const pA = p.mA * p.uA;
    const mTot = p.mA + p.mB;
    const v = c.carry(pA, 'pA') / mTot;
    // Method 1: the buffers remove the momentum of the coupled trucks, (m_A + m_B) v.
    const F = (mTot * c.carry(v, 'v')) / p.t;
    // Method 2: that momentum equals A's momentum before the collision (momentum is conserved).
    const F__direct = c.carry(pA, 'pA') / p.t;
    return { pA, mTot, v, F, F__direct };
  },

  stem: ({ d }) =>
    `A railway truck A of mass ${Q(d.mA, 'kg')} moves at ${Q(d.uA, 'm s-1')} along a straight, level track. It collides with a stationary truck B of mass ${Q(d.mB, 'kg')}. The trucks couple (join together) and move off together. Friction is negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the momentum of truck A before the collision.',
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
      prompt: () => 'Calculate the speed of the trucks immediately after they couple.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ r }) => [
        {
          text: 'No external horizontal force acts on the two trucks during the collision, so their total momentum is conserved. After coupling they move as one body of mass $m_A + m_B$.',
          math: tex`m_A u_A = (m_A + m_B)\,v \quad\Rightarrow\quad v = \frac{m_A u_A}{m_A + m_B}`,
        },
        {
          text: 'Substitute the momentum from (a).',
          math: tex`v = \frac{${fmtW(r.pA)}}{${fmtW(r.mTot)}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
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
      prompt: ({ d }) =>
        `The coupled trucks then hit buffers at the end of the track and are brought to rest in a time of ${Q(d.t, 's')}. Calculate the magnitude of the average force exerted on the trucks by the buffers.`,
      response: { kind: 'numeric', answer: 'F', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The impulse of the buffers equals the change in momentum of the trucks, which go from moving to rest. Average force = change in momentum ÷ time.',
          math: tex`F = \frac{(m_A + m_B)\,v}{t} = \frac{${fmtW(r.mTot)} \times ${fmtW(r.v)}}{${d.t}} = ${fmtWA(r.F)}\ ${u('N')}`,
        },
        {
          text: 'Check: the momentum of the coupled trucks is the momentum truck A had before the collision, so the same result comes from (a) directly.',
          math: tex`F = \frac{${fmtW(r.pA)}}{${d.t}} = ${fmtWA(r.F__direct)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Impulse = change in momentum, $F = \\Delta p / \\Delta t$' },
        { mark: tex`$F = ${fmtA(r.F)}\ ${u('N')}$` },
        { note: 'Allow ECF from (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about the impulse exerted by the buffers on the coupled trucks is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is equal in size to the momentum that truck A had before the collision.', correct: true },
          { text: 'It is twice the momentum that truck A had before the collision.' },
          { text: 'It is zero, because the trucks end up at rest.' },
          { text: 'It depends only on the time the trucks take to stop.' },
        ],
      },
      solution: () => [
        {
          text: 'The buffers remove all the momentum of the coupled trucks. Momentum was conserved in the coupling, so this is the momentum truck A had at the start. A shorter or longer stopping time changes the force, not the impulse.',
        },
      ],
      markscheme: () => [{ note: 'Impulse = change in momentum = momentum of the coupled trucks = momentum of A before the collision.' }],
    },
  ],
});
