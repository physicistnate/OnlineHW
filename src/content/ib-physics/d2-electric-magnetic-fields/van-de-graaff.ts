import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-d2-van-de-graaff',
  version: 1,
  title: 'The potential of a Van de Graaff dome: energy and speed of charged particles',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.7', 'ibp.D.2.9'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    R: { choices: [0.1, 0.15, 0.2, 0.25], base: 0.2, dp: 2 },
    Q: { choices: [1, 2, 3, 4], base: 2 },
  },
  // The field at the surface stays below the breakdown field of air (about 3 MV/m).
  constraint: (p) => (IB.k * p.Q * 1e-6) / p.R ** 2 <= 2.5e6,

  compute: (p, c) => {
    const V = (IB.k * p.Q * 1e-6) / p.R;
    const Vc = c.carry(V, 'V', 3);
    const Ep = IB.e * Vc;
    const v = Math.sqrt((2 * c.carry(Ep, 'Ep', 3)) / IB.mp);
    const W = IB.e * (Vc - Vc / 2);
    return { V, Ep, v, W };
  },

  stem: ({ d }) =>
    `The metal dome of a Van de Graaff generator is a sphere of radius ${Q(d.R, 'm')} carrying a charge of ${Q(`+${d.Q}`, 'μC')}. Outside the dome, its field and potential are those of a point charge at its centre. Take the potential to be zero far away.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the electric potential at the surface of the dome.',
      response: { kind: 'numeric', answer: 'V', symbol: 'V', unit: 'V', positive: true },
      solution: ({ d, r }) => [{ math: tex`V = \frac{kQ}{R} = \frac{8.99 \times 10^{9} \times ${d.Q} \times 10^{-6}}{${d.R}} = ${fmtA(r.V)}\ ${u('V')}` }],
      markscheme: ({ r }) => [{ mark: '$V = kQ/r$' }, { mark: tex`$V = ${fmtA(r.V)}\ ${u('V')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the electric potential energy of a proton at the surface of the dome.',
      response: { kind: 'numeric', answer: 'Ep', symbol: 'E_p', unit: 'J', positive: true },
      solution: ({ r }) => [{ math: tex`E_p = qV = 1.60 \times 10^{-19} \times ${fmtW(r.V)} = ${fmtA(r.Ep)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E_p = qV = ${fmtA(r.Ep)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'The proton is released from rest at the surface. Calculate its speed when it is far from the dome.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ r }) => [
        { text: 'The positive dome repels the proton. All of its electric potential energy becomes kinetic energy:', math: tex`\tfrac{1}{2}mv^2 = E_p \;\Rightarrow\; v = \sqrt{\frac{2 \times ${fmtW(r.Ep)}}{1.673 \times 10^{-27}}} = ${fmtA(r.v)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Loss of potential energy = gain of kinetic energy' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the work that must be done to move an electron from the surface of the dome to a point twice as far from its centre.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ r }) => [
        { text: 'At twice the distance the potential is halved. The work done on a charge $q$ is $W = q\\Delta V$, with $q = -e$:', math: tex`W = (-1.60 \times 10^{-19}) \times \left(\frac{${fmtW(r.V)}}{2} - ${fmtW(r.V)}\right) = ${fmtA(r.W)}\ ${u('J')}` },
        { text: 'The work is positive: the electron is attracted to the positive dome, so it must be pulled away.' },
      ],
      markscheme: ({ r }) => [{ mark: '$W = q\\Delta V$ with $V(2R) = V/2$' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Which statement about the inside of the conducting dome is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The electric field is zero and the potential is the same everywhere, equal to its value at the surface.', correct: true },
          { text: 'The electric field is zero, and so is the potential.' },
          { text: 'The electric field is greatest at the centre.' },
          { text: 'The potential is greatest at the centre and falls towards the surface.' },
        ],
      },
      solution: () => [{ text: 'The charge sits on the outer surface of the conductor, and inside it the field is zero. Zero field means zero potential gradient, so the potential everywhere inside equals the potential at the surface.' }],
      markscheme: () => [{ note: 'E = 0 inside, so V is constant and equal to the surface value.' }],
    },
  ],
});
