import { defineQuestion } from '../../../engine/define';
import { fmt, fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** A's velocity after the collision and the coefficient of restitution, from the given data. */
function outcome(p: { mA: number; mB: number; uA: number; vB: number }) {
  const vA = (p.mA * p.uA - p.mB * p.vB) / p.mA;
  return { vA, e: (p.vB - vA) / p.uA };
}

/** "0.6^2", or "(-0.6)^2" for a negative value. */
const squared = (x: number) => (x < 0 ? `(${fmtW(x)})^2` : `${fmtW(x)}^2`);

export default defineQuestion({
  id: 'ibp-a2-trolley-collision',
  version: 1,
  title: 'A collision between two trolleys',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.6', 'ibp.A.2.8'],
  uses: ['ibp.A.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    mA: { min: 0.5, max: 2.0, step: 0.1, base: 1.2, dp: 2 },
    mB: { min: 0.5, max: 2.0, step: 0.1, base: 0.8, dp: 2 },
    uA: { min: 1.0, max: 3.0, step: 0.1, base: 2.0, dp: 1 },
    vB: { min: 0.2, max: 4.0, step: 0.1, base: 2.1, dp: 1 },
  },
  // A real collision: B ends up moving faster than A (they separate), some kinetic energy
  // is lost (coefficient of restitution 0.2 to 0.9), and A's final velocity is clearly not zero.
  constraint: (p) => {
    const { vA, e } = outcome(p);
    return e >= 0.2 && e <= 0.9 && Math.abs(vA) >= 0.1;
  },

  compute: (p, c) => {
    const pA = p.mA * p.uA;
    const pB = p.mB * p.vB;
    const vA = (c.carry(pA, 'pA') - pB) / p.mA;
    const KE1 = 0.5 * p.mA * p.uA ** 2;
    // Each kinetic energy is written down, then the two are added.
    const KEA = c.carry(0.5 * p.mA * c.carry(vA, 'vA') ** 2);
    const KEB = c.carry(0.5 * p.mB * p.vB ** 2);
    const KE2 = KEA + KEB;
    return { pA, pB, vA, KE1, KEA, KEB, KE2 };
  },

  stem: ({ d }) =>
    `Trolley A of mass ${Q(d.mA, 'kg')} moves at ${Q(d.uA, 'm s-1')} along a straight horizontal track towards trolley B of mass ${Q(d.mB, 'kg')}, which is at rest. After the collision, B moves at ${Q(d.vB, 'm s-1')} in the original direction of motion of A. Friction is negligible. Take the original direction of motion of A as positive.`,

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
      prompt: () => 'Determine the velocity of trolley A immediately after the collision.',
      response: { kind: 'numeric', answer: 'vA', symbol: 'v_A', unit: 'm s-1' },
      solution: ({ d, r }) => [
        {
          text: 'No external horizontal force acts, so the total momentum is conserved: the momentum of A before equals the total momentum of A and B after.',
          math: tex`m_A u_A = m_A v_A + m_B v_B \quad\Rightarrow\quad v_A = \frac{m_A u_A - m_B v_B}{m_A}`,
        },
        {
          text: 'Substitute, using the momentum from (a).',
          math: tex`v_A = \frac{${fmtW(r.pA)} - ${d.mB} \times ${d.vB}}{${d.mA}} = \frac{${fmtW(r.pA)} - ${fmtW(r.pB)}}{${d.mA}} = ${fmtA(r.vA)}\ ${u('m s-1')}`,
        },
        {
          text:
            r.vA > 0
              ? 'The answer is positive, so A keeps moving in its original direction, more slowly than before.'
              : 'The answer is negative, so A bounces back: it moves in the opposite direction to its original motion.',
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Conservation of momentum: $m_A u_A = m_A v_A + m_B v_B$' },
        { mark: tex`$v_A = ${fmtA(r.vA)}\ ${u('m s-1')}$` },
        { note: 'Allow ECF from (a). The sign shows the direction: negative means A moves backwards.' },
      ],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the total kinetic energy of the trolleys immediately after the collision.',
      response: { kind: 'numeric', answer: 'KE2', symbol: 'E_k', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Work out the kinetic energy of each trolley with $E_k = \\tfrac{1}{2}mv^2$, using the velocity of A from (b). Kinetic energy is never negative, because the velocity is squared.',
          math: tex`\begin{aligned} E_{k,A} &= \tfrac{1}{2} \times ${d.mA} \times ${squared(r.vA)} = ${fmtW(r.KEA)}\ ${u('J')} \\ E_{k,B} &= \tfrac{1}{2} \times ${d.mB} \times ${squared(Number(d.vB))} = ${fmtW(r.KEB)}\ ${u('J')} \end{aligned}`,
        },
        {
          text: 'Add them.',
          math: tex`E_k = ${fmtW(r.KEA)} + ${fmtW(r.KEB)} = ${fmtA(r.KE2)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Kinetic energy of each trolley, using $E_k = \\tfrac{1}{2}mv^2$' },
        { mark: tex`$E_k = ${fmtA(r.KE2)}\ ${u('J')}$` },
        { note: 'Allow ECF from (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which statement about the collision is correct?',
      response: {
        kind: 'mcq',
        options: ({ r }) => [
          { text: `It is inelastic: the total kinetic energy falls from ${Q(fmt(r.KE1), 'J')} to ${Q(fmt(r.KE2), 'J')}.`, correct: true },
          { text: `It is elastic: the total kinetic energy stays at ${Q(fmt(r.KE1), 'J')}.` },
          { text: `It is inelastic: the total momentum falls from ${Q(fmt(r.pA), 'kg m s-1')} to ${Q(fmt(r.pB), 'kg m s-1')}.` },
          { text: `It is elastic: the total momentum stays at ${Q(fmt(r.pA), 'kg m s-1')}.` },
        ],
      },
      solution: ({ d, r }) => [
        {
          text: 'Find the kinetic energy before the collision (only A moves) and compare it with your answer to (c).',
          math: tex`E_{k,\text{before}} = \tfrac{1}{2} \times ${d.mA} \times ${d.uA}^2 = ${fmtA(r.KE1)}\ ${u('J')} \quad > \quad E_{k,\text{after}} = ${fmtA(r.KE2)}\ ${u('J')}`,
        },
        {
          text: 'The kinetic energy decreases, so the collision is inelastic. The total momentum is conserved in every collision of an isolated system (that is how $v_A$ was found in (b)), so momentum cannot tell an elastic collision from an inelastic one.',
        },
      ],
      markscheme: () => [{ note: 'Momentum is always conserved in an isolated system; kinetic energy is conserved only in an elastic collision.' }],
    },
  ],
});
