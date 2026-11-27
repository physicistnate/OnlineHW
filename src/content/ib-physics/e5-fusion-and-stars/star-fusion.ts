import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Energy released when four protons become one helium-4 nucleus, MeV. */
const Q_PP = 26.7;

export default defineQuestion({
  id: 'ibp-e5-star-fusion',
  version: 1,
  title: 'The fusion that powers a star',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.2', 'ibp.E.5.1'],
  uses: ['ibp.E.3.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    f: { min: 0.5, max: 8, step: 0.5, base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const L = p.f * IB.Lsun;
    const mdot = L / IB.c ** 2;
    const rate = L / (Q_PP * 1e6 * IB.e);
    const H = 4 * c.carry(rate, 'rate') * IB.mp;
    return { L, mdot, rate, H };
  },

  stem: ({ d }) =>
    `A main-sequence star has a luminosity of ${d.f} times the luminosity of the Sun, $L_\\odot = 3.83 \\times 10^{26}\\ \\mathrm{W}$. In its core, hydrogen fuses into helium: overall, four protons become one helium-4 nucleus, releasing ${Q_PP} MeV. Neglect the small fraction of this energy carried away by neutrinos: assume it all leaves the star as radiation.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the mass that the star loses each second because of the energy it radiates.',
      response: { kind: 'numeric', answer: 'mdot', symbol: '\\Delta m/\\Delta t', unit: 'kg s-1', positive: true },
      solution: ({ d, r }) => [
        { math: tex`L = ${d.f} \times 3.83 \times 10^{26} = ${fmtW(r.L)}\ ${u('W')}` },
        { text: 'Each second, energy $L \\times 1$ s leaves the star, and $\\Delta E = \\Delta m c^2$.', math: tex`\frac{\Delta m}{\Delta t} = \frac{L}{c^2} = \frac{${fmtW(r.L)}}{(3.00 \times 10^{8})^2} = ${fmtA(r.mdot)}\ ${u('kg s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $\\Delta E = \\Delta mc^2$' }, { mark: tex`$${fmtA(r.mdot)}\ ${u('kg s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the number of helium-4 nuclei formed in the core each second.',
      response: { kind: 'numeric', answer: 'rate', symbol: '\\text{nuclei per second}', unit: 's-1', positive: true },
      solution: ({ r }) => [
        { math: tex`\text{energy per helium nucleus} = ${Q_PP} \times 1.60 \times 10^{-13} = 4.272 \times 10^{-12}\ ${u('J')}` },
        { math: tex`\frac{${fmtW(r.L)}}{4.272 \times 10^{-12}} = ${fmtA(r.rate)}\ ${u('s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy per reaction in joules' }, { mark: tex`$${fmtA(r.rate)}\ ${u('s-1')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'The mass of a proton is $1.673 \\times 10^{-27}$ kg. Calculate the mass of hydrogen that is fused into helium each second.',
      response: { kind: 'numeric', answer: 'H', symbol: 'm', unit: 'kg', positive: true },
      solution: ({ r }) => [
        { math: tex`m = 4 \times ${fmtW(r.rate)} \times 1.673 \times 10^{-27} = ${fmtA(r.H)}\ ${u('kg')}` },
        { text: 'Hundreds of millions of tonnes of hydrogen fuse every second, yet less than 1% of this mass is converted to radiated energy, the mass found in (a).' },
      ],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.H)}\ ${u('kg')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does the star neither collapse nor expand while it is on the main sequence?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The outward pressure of the hot gas and the radiation balances the inward pull of gravity.', correct: true },
          { text: 'The strong nuclear force holds the outer layers in place.' },
          { text: 'The star’s rotation balances the pull of gravity.' },
          { text: 'There is no gravity inside a star, because it is a gas.' },
        ],
      },
      solution: () => [
        {
          text: 'Fusion keeps the core hot, so the gas and radiation pressure pushing outwards balances gravity pulling inwards. When the hydrogen in the core runs out, this equilibrium is lost and the star changes.',
        },
      ],
      markscheme: () => [{ note: 'Radiation (and gas) pressure balances gravity.' }],
    },
  ],
});
