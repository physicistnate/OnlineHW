import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, sinD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-d4-generator',
  version: 1,
  title: 'The alternating emf of a simple generator',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.4',
  standards: ['ibp.D.4.4', 'ibp.D.4.1', 'ibp.D.4.2'],
  uses: ['ibp.A.2.9'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    N: { choices: [50, 100, 200], base: 100 },
    a: { choices: [5, 8, 10], base: 10 },
    b: { choices: [4, 5, 6], base: 5 },
    B: { choices: [0.05, 0.1, 0.2, 0.25], base: 0.1, dp: 2 },
    rpm: { choices: [600, 900, 1200, 1500, 3000], base: 1500 },
    th: { choices: [30, 45, 60], base: 30 },
  },

  compute: (p, c) => {
    const A = p.a * p.b * 1e-4;
    const w = (2 * Math.PI * p.rpm) / 60;
    const e0 = p.N * p.B * A * c.carry(w, 'w', 3);
    const e = c.carry(e0, 'e0', 3) * sinD(p.th);
    return { A, w, e0, e };
  },

  stem: ({ d }) =>
    `A simple generator has a rectangular coil of ${d.N} turns, ${Q(d.a, 'cm')} by ${Q(d.b, 'cm')}. The coil rotates at ${d.rpm} revolutions per minute about an axis perpendicular to a uniform magnetic field of ${Q(d.B, 'T')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the angular velocity of the coil.',
      response: { kind: 'numeric', answer: 'w', symbol: '\\omega', unit: 'rad s-1', positive: true },
      solution: ({ p, d, r }) => [
        { text: 'The frequency of rotation in revolutions per second:', math: tex`f = \frac{${d.rpm}}{60} = ${p.rpm / 60}\ ${u('Hz')}` },
        { math: tex`\omega = 2\pi f = 2\pi \times ${p.rpm / 60} = ${fmtA(r.w)}\ ${u('rad s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\omega = ${fmtA(r.w)}\ ${u('rad s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the peak emf of the generator.',
      response: { kind: 'numeric', answer: 'e0', symbol: '\\varepsilon_0', unit: 'V', positive: true },
      solution: ({ d, r }) => [
        { text: 'With the flux through each turn $\\Phi = BA\\cos\\omega t$, Faraday’s law gives $\\varepsilon = NBA\\omega\\sin\\omega t$, so the peak emf is $NBA\\omega$.', math: tex`A = ${Number(d.a) / 100} \times ${Number(d.b) / 100} = ${fmtW(r.A)}\ ${u('m2')}` },
        { math: tex`\varepsilon_0 = NBA\omega = ${d.N} \times ${d.B} \times ${fmtW(r.A)} \times ${fmtW(r.w)} = ${fmtA(r.e0)}\ ${u('V')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\varepsilon_0 = NBA\\omega$ with the area in m²' }, { mark: tex`$\varepsilon_0 = ${fmtA(r.e0)}\ ${u('V')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `Calculate the emf at the instant when the normal to the plane of the coil makes an angle of ${d.th}° with the magnetic field.`,
      response: { kind: 'numeric', answer: 'e', symbol: '\\varepsilon', unit: 'V', positive: true },
      solution: ({ d, r }) => [
        { text: 'The angle $\\omega t$ in $\\Phi = BA\\cos\\omega t$ is the angle between the normal and the field, so:', math: tex`\varepsilon = \varepsilon_0\sin\omega t = ${fmtW(r.e0)} \times \sin ${d.th}^{\circ} = ${fmtA(r.e)}\ ${u('V')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$\\varepsilon = \\varepsilon_0\\sin\\theta$, $\\theta$ from the normal' }, { mark: tex`$\varepsilon = ${fmtA(r.e)}\ ${u('V')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'At which position of the coil is the emf largest?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'When the plane of the coil is parallel to the field: the flux through it is zero, but changing fastest.', correct: true },
          { text: 'When the plane of the coil is perpendicular to the field: the flux through it is largest.' },
          { text: 'When the plane of the coil is at 45° to the field.' },
          { text: 'The emf is the same in every position, because the coil turns at a steady rate.' },
        ],
      },
      solution: () => [{ text: 'The emf depends on the rate of change of flux, not on the flux. $\\Phi = BA\\cos\\omega t$ changes fastest as it passes through zero, when the plane of the coil is parallel to the field.' }],
      markscheme: () => [{ note: 'Plane parallel to the field (flux zero, rate of change largest).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'The coil is turned twice as fast. What happens to the peak emf and to the frequency of the emf?',
      response: {
        kind: 'mcq',
        columns: ['Peak emf', 'Frequency'],
        options: () => [
          { cells: ['doubles', 'doubles'], correct: true },
          { cells: ['doubles', 'unchanged'] },
          { cells: ['unchanged', 'doubles'] },
          { cells: ['quadruples', 'doubles'] },
        ],
      },
      solution: () => [{ text: 'The frequency of the emf is the frequency of rotation, so it doubles. The peak emf $NBA\\omega$ is proportional to $\\omega$, so it doubles too: the flux changes by the same amount in half the time.' }],
      markscheme: () => [{ note: 'Both double.' }],
    },
  ],
});
