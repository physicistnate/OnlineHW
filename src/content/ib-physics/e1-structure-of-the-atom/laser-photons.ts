import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-e1-laser-photons',
  version: 1,
  title: 'Photons from a laser pointer',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.1',
  standards: ['ibp.E.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 1,

  params: {
    P: { min: 1, max: 5, step: 0.5, base: 1, dp: 1 },
    nm: { choices: [405, 450, 520, 532, 635, 650], base: 532 },
  },

  compute: (p, c) => {
    const E = (IB.h * IB.c) / ((p.nm as number) * 1e-9);
    const eV = c.carry(E, 'E') / IB.e;
    const N = (p.P * 1e-3) / c.carry(E, 'E');
    return { E, eV, N };
  },

  stem: ({ d }) => `A laser pointer emits light of wavelength ${Q(d.nm, 'nm')}. The power of the light it emits is ${Q(d.P, 'mW')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the energy of one photon of this light.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'For light, $E = hf$ and $c = f\\lambda$, so $E = \\dfrac{hc}{\\lambda}$.',
          math: tex`E = \frac{6.63 \times 10^{-34} \times 3.00 \times 10^{8}}{${d.nm} \times 10^{-9}} = ${fmtA(r.E)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the energy of one photon in electronvolts.',
      response: { kind: 'numeric', answer: 'eV', symbol: 'E', unit: 'eV', positive: true },
      solution: ({ r }) => [{ math: tex`E = \frac{${fmtW(r.E)}}{1.60 \times 10^{-19}} = ${fmtA(r.eV)}\ ${u('eV')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.eV)}\ ${u('eV')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the number of photons the laser emits each second.',
      response: { kind: 'numeric', answer: 'N', symbol: 'N', unit: 's-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The power is the energy emitted each second, and each photon carries the energy from (a). Convert the power to watts.',
          math: tex`N = \frac{P}{E} = \frac{${d.P} \times 10^{-3}}{${fmtW(r.E)}} = ${fmtA(r.N)}\ ${u('s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Number per second = power ÷ energy of one photon' }, { mark: tex`$${fmtA(r.N)}\ ${u('s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'A red laser and a violet laser emit light with the same power. Which statement is correct?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The red laser emits more photons each second, and each photon has less energy.', correct: true },
          { text: 'The red laser emits more photons each second, and each photon has more energy.' },
          { text: 'Both emit the same number of photons each second, because the power is the same.' },
          { text: 'The violet laser emits more photons each second, because violet light has a higher frequency.' },
        ],
      },
      solution: () => [
        {
          text: 'Red light has a longer wavelength (lower frequency), so each photon has less energy ($E = hc/\\lambda$). To deliver the same energy each second, the red laser must emit more photons.',
        },
      ],
      markscheme: () => [{ note: 'Red: lower photon energy, so more photons for the same power.' }],
    },
  ],
});
