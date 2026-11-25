import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

export default defineQuestion({
  id: 'ibp-e5-parallax-brightness',
  version: 1,
  title: 'A nearby star: distance from parallax, luminosity from brightness',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.5', 'ibp.E.5.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    par: { min: 0.05, max: 0.8, step: 0.025, base: 0.2, dp: 3 },
    b: { min: 0.5e-9, max: 9.5e-9, step: 0.5e-9, base: 2.0e-9, sci: 2 },
  },

  compute: (p, c) => {
    const dpc = 1 / p.par;
    const dm = c.carry(dpc, 'dpc') * IB.pc;
    const L = 4 * Math.PI * c.carry(dm, 'dm') ** 2 * p.b;
    const ratio = L / IB.Lsun;
    return { dpc, dm, L, ratio };
  },

  stem: ({ d }) =>
    `The parallax angle of a nearby star, measured from Earth, is ${Q(d.par, 'arcsec')}. The apparent brightness of the star is ${Q(d.b, 'W m-2')}. 1 pc $= 3.09 \\times 10^{16}$ m.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the distance to the star in parsecs.',
      response: { kind: 'numeric', answer: 'dpc', symbol: 'd', unit: 'pc', positive: true },
      solution: ({ d, r }) => [
        { text: 'With the parallax angle in arc-seconds, the distance in parsecs is its reciprocal.', math: tex`d = \frac{1}{p} = \frac{1}{${d.par}} = ${fmtA(r.dpc)}\ ${u('pc')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$d = ${fmtA(r.dpc)}\ ${u('pc')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the distance to the star in metres.',
      response: { kind: 'numeric', answer: 'dm', symbol: 'd', unit: 'm', positive: true },
      solution: ({ r }) => [{ math: tex`d = ${fmtW(r.dpc)} \times 3.09 \times 10^{16} = ${fmtA(r.dm)}\ ${u('m')}` }],
      markscheme: ({ r }) => [{ mark: tex`$d = ${fmtA(r.dm)}\ ${u('m')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the luminosity of the star.',
      response: { kind: 'numeric', answer: 'L', symbol: 'L', unit: 'W', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The star’s power spreads over a sphere of radius $d$, so $b = \\dfrac{L}{4\\pi d^2}$.',
          math: tex`L = 4\pi d^2 b = 4\pi \times (${fmtW(r.dm)})^2 \times ${d.b} = ${fmtA(r.L)}\ ${u('W')}`,
        },
        { text: `That is about ${fmtA(r.ratio)} times the luminosity of the Sun ($3.83 \\times 10^{26}$ W).` },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $b = L/4\\pi d^2$ with $d$ in metres' }, { mark: tex`$L = ${fmtA(r.L)}\ ${u('W')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why can stellar parallax be used to measure the distances of only relatively nearby stars?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'For distant stars the parallax angle is too small to measure accurately.', correct: true },
          { text: 'Distant stars are too faint for their spectra to be measured.' },
          { text: 'Distant stars move too quickly across the sky.' },
          { text: 'The light from distant stars is bent by the Sun.' },
        ],
      },
      solution: () => [
        {
          text: 'The parallax angle is inversely proportional to the distance. Beyond a few hundred parsecs (from Earth) or a few thousand (from space telescopes such as Gaia), the angle is smaller than the uncertainty in measuring it.',
        },
      ],
      markscheme: () => [{ note: 'The angle is too small to measure.' }],
    },
  ],
});
