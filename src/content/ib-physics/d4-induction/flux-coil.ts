import { cosD, fmtA, fmtW } from '../../../engine/numbers';
import { defineQuestion } from '../../../engine/define';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-d4-flux-coil',
  version: 1,
  title: 'Magnetic flux, flux linkage and the emf of a turning coil',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.D.4',
  standards: ['ibp.D.4.1', 'ibp.D.4.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    N: { choices: [50, 100, 200, 250], base: 200 },
    r: { choices: [2, 3, 4, 5], base: 3 },
    B: { choices: [0.1, 0.2, 0.3, 0.5], base: 0.2, dp: 1 },
    th: { choices: [0, 30, 60], base: 30 },
    t: { choices: [0.05, 0.1, 0.2], base: 0.1, dp: 2 },
  },

  compute: (p, c) => {
    const A = Math.PI * (p.r / 100) ** 2;
    const phi = p.B * c.carry(A, undefined, 3) * cosD(p.th);
    const link = p.N * c.carry(phi, 'phi', 3);
    const emf = c.carry(link, 'link', 3) / p.t;
    return { A, phi, link, emf };
  },

  stem: ({ d }) =>
    `A flat circular coil of ${d.N} turns has a radius of ${Q(d.r, 'cm')}. It is in a uniform magnetic field of ${Q(d.B, 'T')}. The field makes an angle of ${d.th}° with the normal to the plane of the coil.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the magnetic flux through one turn of the coil.',
      response: { kind: 'numeric', answer: 'phi', symbol: '\\Phi', unit: 'Wb', positive: true },
      solution: ({ d, r }) => [
        { math: tex`A = \pi r^2 = \pi \times (${Number(d.r) / 100})^2 = ${fmtW(r.A)}\ ${u('m2')}` },
        { math: tex`\Phi = BA\cos\theta = ${d.B} \times ${fmtW(r.A)} \times \cos ${d.th}^{\circ} = ${fmtA(r.phi)}\ ${u('Wb')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Area in m² and $\\theta$ measured from the normal' }, { mark: tex`$\Phi = ${fmtA(r.phi)}\ ${u('Wb')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the flux linkage of the coil.',
      response: { kind: 'numeric', answer: 'link', symbol: 'N\\Phi', unit: 'Wb', positive: true },
      solution: ({ d, r }) => [{ math: tex`N\Phi = ${d.N} \times ${fmtW(r.phi)} = ${fmtA(r.link)}\ ${u('Wb')}` }],
      markscheme: ({ r }) => [{ mark: tex`$N\Phi = ${fmtA(r.link)}\ ${u('Wb')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `The coil is turned steadily, in ${Q(d.t, 's')}, until its plane is parallel to the field. Calculate the average emf induced in the coil.`,
      response: { kind: 'numeric', answer: 'emf', symbol: '\\varepsilon', unit: 'V', positive: true },
      solution: ({ d, r }) => [
        { text: 'With the plane parallel to the field, no field lines pass through the coil: the flux linkage falls to zero. Faraday’s law:', math: tex`\varepsilon = \frac{\Delta(N\Phi)}{\Delta t} = \frac{${fmtW(r.link)}}{${d.t}} = ${fmtA(r.emf)}\ ${u('V')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Change of flux linkage = the whole flux linkage (final flux zero)' }, { mark: tex`$\varepsilon = ${fmtA(r.emf)}\ ${u('V')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Instead, the coil is moved sideways through the uniform field without turning. What emf is induced?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'None: the flux through the coil does not change.', correct: true },
          { text: 'An emf proportional to the speed of the coil.' },
          { text: 'An emf equal to the one in (c).' },
          { text: 'An alternating emf.' },
        ],
      },
      solution: () => [{ text: 'An emf is induced only when the flux linkage changes. In a uniform field, sliding the coil without turning it keeps the same flux through it.' }],
      markscheme: () => [{ note: 'Zero: no change of flux linkage.' }],
    },
  ],
});
