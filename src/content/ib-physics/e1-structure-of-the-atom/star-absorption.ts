import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/**
 * Strong absorption lines in starlight: the absorbing species and wavelength (nm). The
 * 393 nm and 397 nm lines (the H and K lines) come from singly ionized calcium, Ca⁺
 * (Ca II); the others from neutral atoms.
 */
const LINES: Record<string, { element: string; nm: number }> = {
  'H-656': { element: 'hydrogen', nm: 656 },
  'H-486': { element: 'hydrogen', nm: 486 },
  'H-434': { element: 'hydrogen', nm: 434 },
  'Na-589': { element: 'sodium', nm: 589 },
  'Mg-518': { element: 'magnesium', nm: 518 },
  'Ca-393': { element: 'singly ionized calcium (Ca$^{+}$)', nm: 393 },
  'Ca-397': { element: 'singly ionized calcium (Ca$^{+}$)', nm: 397 },
  'Fe-527': { element: 'iron', nm: 527 },
  'Fe-438': { element: 'iron', nm: 438 },
  'He-588': { element: 'helium', nm: 588 },
  'K-766': { element: 'potassium', nm: 766 },
  'Li-671': { element: 'lithium', nm: 671 },
};

export default defineQuestion({
  id: 'ibp-e1-star-absorption',
  version: 1,
  title: 'Dark lines in the spectrum of a star',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.3', 'ibp.E.1.5', 'ibp.E.1.4'],
  style: 'IB',
  paper: 'Paper 1A and 2 style',
  types: ['multiple-choice', 'calculation'],
  difficulty: 1,

  params: {
    el: { choices: Object.keys(LINES), base: 'Na-589' },
  },

  compute: (p) => {
    const nm = LINES[p.el as string].nm;
    const EJ = (IB.h * IB.c) / (nm * 1e-9);
    const eV = EJ / IB.e;
    return { nm, EJ, eV };
  },

  stem: ({ p }) =>
    `The spectrum of light from a star is continuous, but it is crossed by dark lines. One dark line, at a wavelength of ${Q(LINES[p.el as string].nm, 'nm')}, is caused by ${LINES[p.el as string].element} in the cooler outer layers of the star.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Which statement explains how the dark lines are produced?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Atoms (or ions) in the cooler gas absorb photons of particular energies and re-emit them in all directions, so less of that light reaches us.', correct: true },
          { text: 'The hot core of the star does not emit light of those wavelengths.' },
          { text: 'The gas reflects light of those wavelengths back into the star.' },
          { text: 'Dust between the star and the Earth absorbs light of all wavelengths equally.' },
        ],
      },
      solution: () => [
        {
          text: 'A photon is absorbed only if its energy exactly matches the difference between two energy levels of an atom in the gas. The excited atoms then re-emit photons in random directions, so in the direction of the Earth light of those wavelengths is weaker: a dark line.',
        },
      ],
      markscheme: () => [{ note: 'Absorption by the cooler gas at energies matching the energy-level differences; re-emission in all directions.' }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the energy, in eV, of the photons absorbed to form this dark line.',
      response: { kind: 'numeric', answer: 'eV', symbol: 'E', unit: 'eV', positive: true },
      solution: ({ r }) => [
        {
          math: tex`E = \frac{hc}{\lambda} = \frac{6.63 \times 10^{-34} \times 3.00 \times 10^{8}}{${r.nm} \times 10^{-9}} = ${fmtW(r.EJ)}\ ${u('J')}`,
        },
        {
          text: 'Convert to electronvolts by dividing by $1.60 \\times 10^{-19}$ J per eV.',
          math: tex`E = \frac{${fmtW(r.EJ)}}{1.60 \times 10^{-19}} = ${fmtA(r.eV)}\ ${u('eV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $E = hc/\\lambda$' }, { mark: tex`$E = ${fmtA(r.eV)}\ ${u('eV')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: ({ p }) =>
        `In a laboratory, a low-pressure gas of ${LINES[p.el as string].element}, the same particles that form this line, is made to glow by an electric discharge. Which describes its spectrum?`,
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Bright lines at the same wavelengths as the dark lines from those particles', correct: true },
          { text: 'Bright lines at different wavelengths from the dark lines' },
          { text: 'A continuous spectrum with no lines' },
          { text: 'Dark lines at the same wavelengths as in the star’s spectrum' },
        ],
      },
      solution: () => [
        {
          text: 'The same energy levels give the same energy differences. A glowing gas emits photons with exactly the energies the same atoms or ions can absorb, so its emission lines are at the same wavelengths as their absorption lines. (An ion such as Ca$^{+}$ has different energy levels from the neutral atom, so the comparison must be with the same particles.)',
        },
      ],
      markscheme: () => [{ note: 'Emission lines at the same wavelengths as the absorption lines.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why can the dark lines be used to find which elements are in the outer layers of a star?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Each element has its own set of energy levels, so it absorbs its own set of wavelengths.', correct: true },
          { text: 'Heavier elements absorb more light, so their lines are darker.' },
          { text: 'Each element absorbs only one wavelength.' },
          { text: 'The lines are caused by the temperature of the star, not by its elements.' },
        ],
      },
      solution: () => [
        {
          text: 'The pattern of lines is like a fingerprint: the energy levels, and so the wavelengths absorbed, are different for every element. Matching the lines with laboratory spectra identifies the elements.',
        },
      ],
      markscheme: () => [{ note: 'Unique energy levels give a unique pattern of lines.' }],
    },
  ],
});
