import { defineQuestion } from '../../../engine/define';
import { atanD, cosD, fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/**
 * The outcome of the collision, from the given data (used by the constraint). Smooth
 * pucks push on each other only along the line joining their centres, so B (which
 * starts at rest) moves off along that line, at the angle phi below A's original
 * direction. Along that line the pucks must separate after the collision: the
 * coefficient of restitution e = separation speed / approach speed is between 0 and 1.
 */
function after(p: { mA: number; mB: number; uA: number; vA: number; th: number }) {
  const bx = p.mA * (p.uA - p.vA * cosD(p.th));
  const by = p.mA * p.vA * sinD(p.th);
  const vB = Math.hypot(bx, by) / p.mB;
  const phi = atanD(by / bx);
  const e = (vB - p.vA * cosD(p.th + phi)) / (p.uA * cosD(phi));
  const keBefore = 0.5 * p.mA * p.uA ** 2;
  const keAfter = 0.5 * p.mA * p.vA ** 2 + 0.5 * p.mB * vB ** 2;
  return { bx, by, phi, e, ratio: keAfter / keBefore };
}

export default defineQuestion({
  id: 'ibp-a2-collision-2d',
  version: 1,
  title: 'A glancing collision on an air table',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.10', 'ibp.A.2.6'],
  uses: ['ibp.A.3.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['long-response', 'calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    mA: { min: 0.1, max: 0.3, step: 0.02, base: 0.2, dp: 2 },
    mB: { min: 0.1, max: 0.3, step: 0.02, base: 0.16, dp: 2 },
    uA: { min: 2.0, max: 6.0, step: 0.2, base: 4.0, dp: 1 },
    vA: { min: 0.6, max: 4.0, step: 0.2, base: 2.4, dp: 1 },
    th: { min: 20, max: 60, step: 5, base: 35 },
  },
  // B moves forwards at a clear angle, the pucks separate along the line of centres
  // (0.3 ≤ e ≤ 0.95), and the collision loses some kinetic energy, as real ones do.
  constraint: (p) => {
    const a = after(p);
    return a.bx >= 0.15 * p.mA * p.uA && a.phi >= 10 && a.phi <= 75 && a.e >= 0.3 && a.e <= 0.95 && a.ratio <= 0.92 && a.ratio >= 0.4;
  },

  compute: (p, c) => {
    const pAx = p.mA * p.uA;
    const pAxAfter = p.mA * p.vA * cosD(p.th);
    const pBx = pAx - pAxAfter;
    const pBy = p.mA * p.vA * sinD(p.th);
    const bx = c.carry(pBx, 'pBx');
    const by = c.carry(pBy, 'pBy');
    c.assume(bx > 0 && by > 0);
    const vB = Math.sqrt(bx ** 2 + by ** 2) / p.mB;
    const phi = atanD(by / bx);
    const KEb = 0.5 * p.mA * p.uA ** 2;
    const KEa = 0.5 * p.mA * p.vA ** 2 + 0.5 * p.mB * c.carry(vB, 'vB') ** 2;
    return { pAx, pAxAfter, pBx, pBy, vB, phi, KEb, KEa };
  },

  stem: ({ d }) =>
    `On a horizontal air table, where friction is negligible, puck A of mass ${Q(d.mA, 'kg')} moves at ${Q(d.uA, 'm s-1')} towards puck B of mass ${Q(d.mB, 'kg')}, which is at rest. After the collision, A moves at ${Q(d.vA, 'm s-1')} in a direction at ${Q(d.th, 'deg')} to its original direction of motion. B moves off on the other side of the line along which A was moving. The pucks are smooth, so they push on each other only along the line joining their centres.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the component of the momentum of B after the collision in the original direction of motion of A.',
      response: { kind: 'numeric', answer: 'pBx', symbol: 'p_{Bx}', unit: 'kg m s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Take $x$ along the original direction of A and $y$ perpendicular to it. No external force acts in the plane of the table, so momentum is conserved separately in each direction.',
        },
        {
          text: 'In the $x$-direction: momentum of A before = $x$-momentum of A after + $x$-momentum of B after.',
          math: tex`m_A u_A = m_A v_A\cos\theta + p_{Bx}`,
        },
        {
          text: 'Rearrange and substitute.',
          math: tex`p_{Bx} = ${d.mA} \times ${d.uA} - ${d.mA} \times ${d.vA}\cos ${d.th}^{\circ} = ${fmtW(r.pAx)} - ${fmtW(r.pAxAfter)} = ${fmtA(r.pBx)}\ ${u('kg m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Conservation of momentum in the original direction, using $m_A v_A \\cos\\theta$' },
        { mark: tex`$p_{Bx} = ${fmtA(r.pBx)}\ ${u('kg m s-1')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the magnitude of the component of the momentum of B after the collision perpendicular to the original direction of motion of A.',
      response: { kind: 'numeric', answer: 'pBy', symbol: 'p_{By}', unit: 'kg m s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Before the collision there is no momentum in the $y$-direction, so afterwards the $y$-momenta of A and B are equal and opposite.',
          math: tex`p_{By} = m_A v_A \sin\theta = ${d.mA} \times ${d.vA}\sin ${d.th}^{\circ} = ${fmtA(r.pBy)}\ ${u('kg m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$p_{By} = m_A v_A \sin\theta = ${fmtA(r.pBy)}\ ${u('kg m s-1')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Determine the speed of B after the collision.',
      response: { kind: 'numeric', answer: 'vB', symbol: 'v_B', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Combine the perpendicular components of the momentum of B, then divide by its mass.',
          math: tex`v_B = \frac{\sqrt{p_{Bx}^{\,2} + p_{By}^{\,2}}}{m_B} = \frac{\sqrt{${fmtW(r.pBx)}^2 + ${fmtW(r.pBy)}^2}}{${d.mB}} = ${fmtA(r.vB)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Magnitude of the momentum from its components' },
        { mark: tex`$v_B = ${fmtA(r.vB)}\ ${u('m s-1')}$` },
        { note: 'Allow ECF from (a) and (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Determine the angle between the velocity of B and the original direction of motion of A.',
      response: { kind: 'numeric', answer: 'phi', symbol: '\\phi', unit: 'deg', positive: true },
      solution: ({ r }) => [
        {
          text: 'The velocity of B is in the same direction as its momentum.',
          math: tex`\tan\phi = \frac{p_{By}}{p_{Bx}} = \frac{${fmtW(r.pBy)}}{${fmtW(r.pBx)}} \quad\Rightarrow\quad \phi = ${fmtA(r.phi)}^{\circ}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\phi = ${fmtA(r.phi)}^{\circ}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which statement about this collision is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is inelastic, because the total kinetic energy decreases.', correct: true },
          { text: 'It is elastic, because the total momentum is conserved.' },
          { text: 'It is elastic, because the total kinetic energy is conserved.' },
          { text: 'It is inelastic, because the total momentum decreases.' },
        ],
      },
      solution: ({ d, r }) => [
        {
          text: 'Compare the total kinetic energy before and after the collision.',
          math: tex`E_{k,\text{before}} = \tfrac{1}{2} \times ${d.mA} \times ${d.uA}^2 = ${fmtW(r.KEb)}\ ${u('J')}`,
        },
        { math: tex`E_{k,\text{after}} = \tfrac{1}{2} \times ${d.mA} \times ${d.vA}^2 + \tfrac{1}{2} \times ${d.mB} \times ${fmtW(r.vB)}^2 = ${fmtW(r.KEa)}\ ${u('J')}` },
        {
          text: 'The kinetic energy decreases, so the collision is inelastic. Momentum is conserved in every collision of an isolated system, elastic or not, so it cannot decide the question.',
        },
      ],
      markscheme: () => [{ note: 'Total kinetic energy after < before: inelastic.' }],
    },
  ],
});
