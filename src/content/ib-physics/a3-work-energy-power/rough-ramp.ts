import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-rough-ramp',
  version: 1,
  title: 'A crate slides down a rough ramp',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.2', 'ibp.A.3.3', 'ibp.A.3.1'],
  uses: ['ibp.A.2.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 5, max: 40, step: 1, base: 12 },
    L: { min: 2, max: 8, step: 0.5, base: 4, dp: 1 },
    theta: { min: 20, max: 40, step: 5, base: 30 },
    Ff: { min: 5, max: 150, step: 5, base: 25 },
  },
  // Friction takes 15% to 70% of the gravitational energy, so the crate clearly speeds up.
  constraint: (p) => {
    const along = p.m * 9.81 * sinD(p.theta);
    return p.Ff >= 0.15 * along && p.Ff <= 0.7 * along;
  },

  compute: (p, c) => {
    const h = p.L * sinD(p.theta);
    const Ep = p.m * c.g * c.carry(h);
    const Wf = p.Ff * p.L;
    // The two energies are subtracted, so students keep at least 3 s.f. of them.
    const Ek = c.carry(Ep, 'Ep', 3) - c.carry(Wf, 'Wf', 3);
    c.assume(Ek > 0);
    const v = Math.sqrt((2 * c.carry(Ek)) / p.m);
    return { h, Ep, Wf, Ek, v };
  },

  stem: ({ d }) =>
    `A crate of mass ${Q(d.m, 'kg')} is released from rest at the top of a straight ramp of length ${Q(d.L, 'm')}, inclined at ${Q(d.theta, 'deg')} to the horizontal. As it slides down, a constant friction force of ${Q(d.Ff, 'N')} acts on it.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the decrease in the gravitational potential energy of the crate as it slides to the bottom of the ramp.',
      response: { kind: 'numeric', answer: 'Ep', symbol: '\\Delta E_p', unit: 'J', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'The crate moves along the ramp, but the gravitational potential energy depends only on the vertical height it falls.',
          math: tex`h = L\sin\theta = ${d.L}\sin ${d.theta}^{\circ} = ${fmtW(r.h)}\ ${u('m')}`,
        },
        {
          text: 'Then use $\\Delta E_p = mg\\Delta h$.',
          math: tex`\Delta E_p = mgh = ${d.m} \times ${g} \times ${fmtW(r.h)} = ${fmtWA(r.Ep)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Vertical height $h = L\\sin\\theta$' }, { mark: tex`$\Delta E_p = ${fmtA(r.Ep)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the work done against friction as the crate slides down the ramp.',
      response: { kind: 'numeric', answer: 'Wf', symbol: 'W_f', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Friction acts along the ramp, opposite to the motion, for the whole length of the ramp. This energy is transferred to internal energy of the crate and the ramp: it is "lost" from the mechanical energy.',
          math: tex`W_f = F_f L = ${d.Ff} \times ${d.L} = ${fmtA(r.Wf)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W_f = ${fmtA(r.Wf)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Determine the speed of the crate at the bottom of the ramp.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Energy is conserved: the gravitational potential energy lost becomes kinetic energy plus the energy transferred by friction.',
          math: tex`E_k = \Delta E_p - W_f = ${fmtW(r.Ep)} - ${fmtW(r.Wf)} = ${fmtW(r.Ek)}\ ${u('J')}`,
        },
        {
          text: 'Then use $E_k = \\tfrac{1}{2}mv^2$.',
          math: tex`v = \sqrt{\frac{2E_k}{m}} = \sqrt{\frac{2 \times ${fmtW(r.Ek)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Kinetic energy = loss of gravitational potential energy − work done against friction' },
        { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` },
        { note: 'Allow ECF from (a) and (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The ramp is replaced by a smooth ramp of the same length and angle. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The work done by gravity is the same, and the speed at the bottom is greater.', correct: true },
          { text: 'The work done by gravity is greater, and the speed at the bottom is greater.' },
          { text: 'The work done by gravity is the same, and the speed at the bottom is the same.' },
          { text: 'The work done by gravity is smaller, because the crate takes less time.' },
        ],
      },
      solution: () => [
        {
          text: 'The work done by gravity is $mgh$, which depends only on the height fallen, not on friction or time. Without friction, none of this energy is transferred to internal energy, so all of it becomes kinetic energy and the crate is faster at the bottom.',
        },
      ],
      markscheme: () => [{ note: 'Work done by gravity = mgh, independent of friction; no friction losses means more kinetic energy.' }],
    },
  ],
});
