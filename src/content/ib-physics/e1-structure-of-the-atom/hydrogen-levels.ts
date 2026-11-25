import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Energy levels of hydrogen in eV, as printed in the question. */
const LEVELS: Record<number, number> = { 1: -13.6, 2: -3.4, 3: -1.51, 4: -0.85, 5: -0.54, 6: -0.38 };
const show = (e: number) => e.toFixed(2);
/** Transitions as "upper-lower". */
const TRANSITIONS = ['3-2', '4-2', '5-2', '6-2', '4-3', '5-3', '6-3', '5-4', '2-1', '3-1', '4-1', '5-1'];

export default defineQuestion({
  id: 'ibp-e1-hydrogen-levels',
  version: 1,
  title: 'Photons from the energy levels of hydrogen',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.3', 'ibp.E.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    tr: { choices: TRANSITIONS, base: '3-2' },
  },

  compute: (p, c) => {
    const [hi, lo] = (p.tr as string).split('-').map(Number);
    const dE = Math.round((LEVELS[hi] - LEVELS[lo]) * 100) / 100; // eV, exact from the printed levels
    const EJ = dE * IB.e;
    const lam = (IB.h * IB.c) / c.carry(EJ, 'EJ'); // m
    const nm = lam * 1e9;
    return { hi, lo, dE, EJ, lam, nm };
  },

  stem: () =>
    'The diagram shows some of the energy levels of the hydrogen atom.\n$$\\begin{array}{cc} n & E\\ /\\ \\mathrm{eV} \\\\ \\hline 6 & -0.38 \\\\ 5 & -0.54 \\\\ 4 & -0.85 \\\\ 3 & -1.51 \\\\ 2 & -3.40 \\\\ 1 & -13.60 \\end{array}$$',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ r }) => `An electron makes a transition from the level $n = ${r.hi}$ to the level $n = ${r.lo}$. Calculate the energy of the photon emitted, in eV.`,
      response: { kind: 'numeric', answer: 'dE', symbol: 'E', unit: 'eV', positive: true },
      solution: ({ r }) => [
        {
          text: 'The photon carries away the difference in energy between the two levels.',
          math: tex`E = E_{${r.hi}} - E_{${r.lo}} = ${show(LEVELS[r.hi])} - (${show(LEVELS[r.lo])}) = ${fmtA(r.dE)}\ ${u('eV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.dE)}\ ${u('eV')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the energy of this photon in joules.',
      response: { kind: 'numeric', answer: 'EJ', symbol: 'E', unit: 'J', positive: true },
      solution: ({ r }) => [
        {
          text: '$1\\ \\mathrm{eV} = 1.60 \\times 10^{-19}\\ \\mathrm{J}$.',
          math: tex`E = ${fmtA(r.dE)} \times 1.60 \times 10^{-19} = ${fmtA(r.EJ)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.EJ)}\ ${u('J')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the wavelength of the photon, in nm.',
      response: { kind: 'numeric', answer: 'nm', symbol: '\\lambda', unit: 'nm', positive: true },
      solution: ({ r }) => [
        {
          text: 'Combine $E = hf$ with $c = f\\lambda$: $E = \\dfrac{hc}{\\lambda}$.',
          math: tex`\lambda = \frac{hc}{E} = \frac{6.63 \times 10^{-34} \times 3.00 \times 10^{8}}{${fmtW(r.EJ)}} = ${fmtW(r.lam)}\ ${u('m')} = ${fmtA(r.nm)}\ ${u('nm')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $E = hc/\\lambda$' }, { mark: tex`$\lambda = ${fmtA(r.nm)}\ ${u('nm')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'In which part of the electromagnetic spectrum is this photon?',
      response: {
        kind: 'mcq',
        options: ({ r }) => [
          { text: 'Ultraviolet', correct: r.nm < 400 },
          { text: 'Visible light', correct: r.nm >= 400 && r.nm <= 700 },
          { text: 'Infrared', correct: r.nm > 700 },
          { text: 'X-rays' },
        ],
      },
      solution: ({ r }) => [
        {
          text: `Visible light has wavelengths from about 400 nm (violet) to 700 nm (red). ${fmtA(r.nm)} nm is ${r.nm < 400 ? 'shorter than visible light: ultraviolet' : r.nm > 700 ? 'longer than visible light: infrared' : 'in the visible range'}. (X-rays have wavelengths below about 10 nm.)`,
        },
      ],
      markscheme: ({ r }) => [{ note: r.nm < 400 ? 'Ultraviolet.' : r.nm > 700 ? 'Infrared.' : 'Visible.' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Electrons in many hydrogen atoms are excited to the level $n = 4$. How many different photon energies can be emitted as they return to the ground state?',
      response: {
        kind: 'mcq',
        options: () => [{ text: '6', correct: true }, { text: '3' }, { text: '4' }, { text: '10' }],
      },
      solution: () => [
        {
          text: 'An electron can drop between any two of the four levels $n = 1, 2, 3, 4$, directly or in steps: 4→3, 4→2, 4→1, 3→2, 3→1 and 2→1. That is 6 different energy differences, so 6 spectral lines.',
        },
      ],
      markscheme: () => [{ note: 'Six possible transitions between four levels.' }],
    },
  ],
});
