import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-e2-wave-particle-duality',
  version: 1,
  title: 'Waves and particles: evidence and scale',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.1', 'ibp.E.2.3'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 1,

  params: {
    m: { min: 0.05, max: 0.45, step: 0.05, base: 0.15, dp: 2 },
    v: { min: 5, max: 40, step: 1, base: 30 },
  },

  compute: (p) => {
    const mom = p.m * p.v;
    const lam = IB.h / mom;
    return { mom, lam };
  },

  stem: () => 'This question is about evidence for the wave and particle natures of light and matter.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which observation is evidence for the particle nature of light?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Photoelectrons are emitted only if the light’s frequency is above a threshold, however bright the light.', correct: true },
          { text: 'Light passing through two narrow slits produces bright and dark fringes.' },
          { text: 'Light spreads out after passing through a narrow gap.' },
          { text: 'Light can be polarized.' },
        ],
      },
      solution: () => [
        {
          text: 'Interference, diffraction and polarization are wave effects. The threshold frequency shows that energy arrives in packets of $hf$: one photon either has enough energy to free an electron or it does not.',
        },
      ],
      markscheme: () => [{ note: 'Photoelectric threshold frequency.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Which observation is evidence for the wave nature of electrons?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A beam of electrons passing through a thin crystal produces a pattern of rings.', correct: true },
          { text: 'Electrons are deflected by a magnetic field.' },
          { text: 'Electrons are emitted from a metal in the photoelectric effect.' },
          { text: 'Electrons have a definite charge of $-1.60 \\times 10^{-19}$ C.' },
        ],
      },
      solution: () => [
        {
          text: 'Rings are a diffraction pattern, which only waves produce. Their size matches the de Broglie wavelength $\\lambda = h/p$ of the electrons.',
        },
      ],
      markscheme: () => [{ note: 'Electron diffraction.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) => `A ball of mass ${Q(d.m, 'kg')} is thrown at a speed of ${Q(d.v, 'm s-1')}. Calculate its de Broglie wavelength.`,
      response: { kind: 'numeric', answer: 'lam', symbol: '\\lambda', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { math: tex`p = mv = ${d.m} \times ${d.v} = ${fmtW(r.mom)}\ ${u('kg m s-1')}` },
        { math: tex`\lambda = \frac{h}{p} = \frac{6.63 \times 10^{-34}}{${fmtW(r.mom)}} = ${fmtA(r.lam)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $\\lambda = h/mv$' }, { mark: tex`$\lambda = ${fmtA(r.lam)}\ ${u('m')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why is the ball never observed to diffract?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Its wavelength is far smaller than any gap or obstacle it could pass, so diffraction is far too small to observe.', correct: true },
          { text: 'Only charged particles have a de Broglie wavelength.' },
          { text: 'Its wavelength is far larger than any gap, so it cannot pass through.' },
          { text: 'Objects that can be seen do not have momentum.' },
        ],
      },
      solution: () => [
        {
          text: 'Diffraction is noticeable only when the wavelength is comparable to the size of the gap. The ball’s wavelength is about $10^{-34}$ m, far smaller even than a nucleus.',
        },
      ],
      markscheme: () => [{ note: 'Wavelength far smaller than any aperture.' }],
    },
  ],
});
