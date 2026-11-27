import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-d4-lenz-magnet',
  version: 1,
  title: 'A magnet falling through a coil: Lenz’s law, emf and charge',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.4',
  standards: ['ibp.D.4.3', 'ibp.D.4.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    N: { choices: [200, 400, 500, 800], base: 500 },
    phi: { choices: [1.2, 1.5, 2, 2.5, 3], base: 2, dp: 1 },
    dt: { choices: [20, 25, 40, 50], base: 40 },
    R: { choices: [5, 10, 20, 25], base: 20 },
  },

  compute: (p) => {
    const emf = (p.N * p.phi * 1e-4) / (p.dt * 1e-3);
    const q = (p.N * p.phi * 1e-4) / p.R;
    return { emf, q };
  },

  stem: ({ d }) =>
    `A bar magnet is held above a vertical coil of ${d.N} turns and dropped, north pole first, so that it falls through the coil. The coil is connected to a data logger, and the total resistance of the circuit is ${Q(d.R, 'Ω')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'As the north pole approaches the top of the coil, which statement about the induced current is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It makes the top of the coil a north pole, which repels the approaching magnet.', correct: true },
          { text: 'It makes the top of the coil a south pole, which attracts the magnet into the coil.' },
          { text: 'It makes the top of the coil a south pole, which speeds the magnet up.' },
          { text: 'There is no induced current until the magnet is inside the coil.' },
        ],
      },
      solution: () => [{ text: 'By Lenz’s law the induced current opposes the change that causes it. The flux through the coil is increasing as the north pole approaches, so the current makes a north pole at the top of the coil, which pushes back on the magnet.' }],
      markscheme: () => [{ note: 'North pole at the top, opposing the approach (Lenz’s law).' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ d }) => `As the magnet enters the coil, the flux through each turn rises from zero to $${d.phi} \\times 10^{-4}$ Wb in ${Q(d.dt, 'ms')}. Calculate the average emf induced in the coil.`,
      response: { kind: 'numeric', answer: 'emf', symbol: '\\varepsilon', unit: 'V', positive: true },
      solution: ({ d, r }) => [{ math: tex`\varepsilon = N\frac{\Delta\Phi}{\Delta t} = \frac{${d.N} \times ${d.phi} \times 10^{-4}}{${d.dt} \times 10^{-3}} = ${fmtA(r.emf)}\ ${u('V')}` }],
      markscheme: ({ r }) => [{ mark: '$\\varepsilon = N\\Delta\\Phi/\\Delta t$ with the time in seconds' }, { mark: tex`$\varepsilon = ${fmtA(r.emf)}\ ${u('V')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the charge that flows round the circuit while the magnet enters the coil.',
      response: { kind: 'numeric', answer: 'q', symbol: 'Q', unit: 'C', positive: true },
      solution: ({ d, r }) => [
        { text: 'The average current is $I = \\varepsilon/R$ and it flows for $\\Delta t$, so $Q = I\\,\\Delta t = \\dfrac{N\\,\\Delta\\Phi}{R}$: the time cancels.', math: tex`Q = \frac{N\,\Delta\Phi}{R} = \frac{${d.N} \times ${d.phi} \times 10^{-4}}{${d.R}} = ${fmtA(r.q)}\ ${u('C')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$Q = I\\Delta t$ with $I = \\varepsilon/R$' }, { mark: tex`$Q = ${fmtA(r.q)}\ ${u('C')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The magnet falls right through the coil and out of the bottom. Which describes the graph of emf against time?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Two pulses in opposite directions; the second is taller and narrower, because the magnet is moving faster as it leaves.', correct: true },
          { text: 'Two pulses in opposite directions, of equal height and width.' },
          { text: 'Two pulses in the same direction; the second is taller and narrower.' },
          { text: 'A single pulse, while the magnet is inside the coil.' },
        ],
      },
      solution: () => [
        { text: 'The flux linkage rises as the magnet enters and falls as it leaves, so the two emfs have opposite signs. The magnet speeds up as it falls, so the flux changes faster as it leaves: the second pulse is taller and shorter. The areas under the two pulses are equal, since each is the same change of flux linkage, $N\\Delta\\Phi$.' },
      ],
      markscheme: () => [{ note: 'Opposite signs; the second pulse taller and narrower (equal areas).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The magnet is now dropped from a greater height. What happens to the charge that flows while it enters the coil?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is unchanged: the change of flux linkage is the same, so $Q = N\\Delta\\Phi/R$ is the same.', correct: true },
          { text: 'It increases, because the emf is larger.' },
          { text: 'It decreases, because the current flows for a shorter time.' },
          { text: 'It increases, because the magnet has more kinetic energy.' },
        ],
      },
      solution: () => [{ text: 'The faster magnet induces a larger emf and current, but for a shorter time. As (c) shows, the charge depends only on the change of flux linkage and the resistance.' }],
      markscheme: () => [{ note: 'Unchanged: Q = NΔΦ/R.' }],
    },
  ],
});
