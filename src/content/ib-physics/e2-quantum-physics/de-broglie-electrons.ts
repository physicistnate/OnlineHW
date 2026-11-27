import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-e2-de-broglie-electrons',
  version: 1,
  title: 'The de Broglie wavelength of electrons',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { min: 50, max: 1000, step: 50, base: 150 },
  },

  compute: (p, c) => {
    const Ek = p.V * IB.e;
    const pm = Math.sqrt(2 * IB.me * c.carry(Ek, 'Ek'));
    const lam = IB.h / c.carry(pm, 'pm');
    return { Ek, pm, lam };
  },

  stem: ({ d }) =>
    `In an electron diffraction tube, electrons are accelerated from rest through a potential difference of ${Q(d.V, 'V')}. They then pass through a thin layer of graphite and form rings on a screen. Relativistic effects are negligible.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the kinetic energy of an electron after it has been accelerated.',
      response: { kind: 'numeric', answer: 'Ek', symbol: 'E_k', unit: 'J', positive: true },
      solution: ({ d, r }) => [{ text: 'The work done on the electron by the electric field is $qV = eV$.', math: tex`E_k = eV = 1.60 \times 10^{-19} \times ${d.V} = ${fmtA(r.Ek)}\ ${u('J')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E_k = ${fmtA(r.Ek)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the momentum of the electron.',
      response: { kind: 'numeric', answer: 'pm', symbol: 'p', unit: 'kg m s-1', positive: true },
      solution: ({ r }) => [
        {
          text: 'From $E_k = \\dfrac{p^2}{2m}$:',
          math: tex`p = \sqrt{2m_eE_k} = \sqrt{2 \times 9.11 \times 10^{-31} \times ${fmtW(r.Ek)}} = ${fmtA(r.pm)}\ ${u('kg m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$p = ${fmtA(r.pm)}\ ${u('kg m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the de Broglie wavelength of the electrons.',
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'm', positive: true },
      solution: ({ r }) => [
        {
          math: tex`\lambda = \frac{h}{p} = \frac{6.63 \times 10^{-34}}{${fmtW(r.pm)}} = ${fmtA(r.lam)}\ ${u('m')}`,
        },
        { text: 'This is similar to the spacing of atoms in graphite (about $10^{-10}$ m), which is why the electrons are diffracted strongly.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $\\lambda = h/p$' }, { mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('m')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The accelerating potential difference is made four times greater. What happens to the rings on the screen?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'They get smaller (closer to the centre), because the wavelength halves.', correct: true },
          { text: 'They get larger, because the wavelength doubles.' },
          { text: 'They get smaller, because the wavelength becomes a quarter.' },
          { text: 'They do not change, because the graphite is the same.' },
        ],
      },
      solution: () => [
        {
          text: 'The momentum is $p = \\sqrt{2meV}$, so four times the voltage gives twice the momentum and half the wavelength. Shorter waves are diffracted through smaller angles, so the rings shrink.',
        },
      ],
      markscheme: () => [{ note: 'p ∝ √V, so λ halves; smaller diffraction angles.' }],
    },
  ],
});
