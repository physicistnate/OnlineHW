import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';

/** The Bohr radius, pm. */
const A0 = 52.9;

const IONS: Record<number, string> = {
  1: 'a hydrogen atom',
  2: 'a helium ion, $\\mathrm{He^{+}}$',
  3: 'a lithium ion, $\\mathrm{Li^{2+}}$',
  4: 'a beryllium ion, $\\mathrm{Be^{3+}}$',
  5: 'a boron ion, $\\mathrm{B^{4+}}$',
  6: 'a carbon ion, $\\mathrm{C^{5+}}$',
};

/** The upper limit in (b), in words, for k times the most probable distance. */
const LIMIT: Record<number, string> = { 0.5: 'half of the most probable distance', 1: 'the most probable distance', 2: 'twice the most probable distance' };

/** P(R < x a/Z) = 1 − e^(−2x)(1 + 2x + 2x²). */
const within = (x: number) => 1 - Math.exp(-2 * x) * (1 + 2 * x + 2 * x * x);

export default defineQuestion({
  id: 'ibpp-d4-hydrogen-pdf',
  version: 1,
  title: 'Where is the electron? A probability density and the expected potential energy',
  courses: ['ibpp-physics-math'],
  level: 'HL',
  topic: 'ibp.D.2',
  standards: ['ibp.D.2.7'],
  math: { topic: 'ibm.4', standards: ['ibm.4.14', 'ibm.5.6', 'ibm.5.11'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    Z: { choices: [1, 2, 3, 4, 5, 6], base: 1 },
    k: { choices: [0.5, 1, 2], base: 1 },
  },

  compute: (p, c) => {
    const mode = A0 / p.Z;
    const limit = p.k * c.carry(mode, 'mode', 3);
    const P = within((limit * p.Z) / A0);
    const mean = (1.5 * A0) / p.Z;
    const inv = p.Z / (A0 * 1e-12); // E(1/R), m⁻¹
    const EU = -IB.k * p.Z * IB.e * c.carry(inv, undefined, 3); // in eV: the energy in joules divided by e
    return { mode, limit, P, mean, inv, EU };
  },

  stem: ({ p }) =>
    `Quantum mechanics predicts where the electron is likely to be found in the lowest energy state of a hydrogen-like ion: a nucleus of charge $+Ze$ with a single electron. Its distance $R$ from the nucleus is a continuous random variable with probability density function $$f(r) = \\frac{4Z^3}{a^3}\\,r^2e^{-2Zr/a}, \\qquad r \\ge 0$$ where $a = ${A0}$ pm. This question is about ${IONS[p.Z]}, for which $Z = ${p.Z}$. Take $k = 8.99 \\times 10^{9}\\ \\mathrm{N\\,m^2\\,C^{-2}}$ and $e = 1.60 \\times 10^{-19}$ C.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the most probable distance of the electron from the nucleus (the mode of $R$), in pm.',
      response: { kind: 'numeric', answer: 'mode', symbol: 'r', unit: 'pm', positive: true },
      solution: ({ p, r }) => [
        { text: 'The mode is where $f$ has its maximum. By the product rule,', math: String.raw`\frac{d}{dr}\left(r^2e^{-2Zr/a}\right) = 2re^{-2Zr/a} - \frac{2Z}{a}\,r^2e^{-2Zr/a} = 2re^{-2Zr/a}\left(1 - \frac{Zr}{a}\right)` },
        { text: 'This is zero at $r = 0$ (where $f = 0$, a minimum) and at $r = a/Z$, where $f$ changes from increasing to decreasing:', math: tex`r = \frac{a}{Z} = \frac{${A0}}{${p.Z}} = ${fmtA(r.mode)}\ \mathrm{pm}` },
        { text: 'This is the radius of the smallest orbit in Bohr’s model of the ion.' },
      ],
      markscheme: ({ r }) => [{ mark: '$f^{\\prime}(r) = 0$, using the product rule' }, { mark: tex`$r = a/Z = ${fmtA(r.mode)}\ \mathrm{pm}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: ({ p }) => `Find the probability that the electron is closer to the nucleus than ${LIMIT[p.k]}.`,
      response: { kind: 'numeric', answer: 'P', symbol: 'P', positive: true },
      solution: ({ p, r }) => [
        { text: 'Integrate the probability density with a calculator, up to', math: tex`r = ${p.k} \times ${fmtW(r.mode)} = ${fmtW(r.limit)}\ \mathrm{pm}` },
        { math: tex`P = \int_0^{${fmtW(r.limit)}} \frac{4 \times ${p.Z}^3}{${A0}^3}\,r^2e^{-2 \times ${p.Z}r/${A0}}\,dr = ${fmtA(r.P)}` },
        { text: 'Substituting $x = Zr/a$ shows that the answer is the same for every $Z$: the ions differ only in their size.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Integral of $f$ from 0 to the limit' }, { mark: tex`$P = ${fmtA(r.P)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the mean distance $E(R)$ of the electron from the nucleus, in pm.',
      response: { kind: 'numeric', answer: 'mean', symbol: 'E(R)', unit: 'pm', positive: true },
      solution: ({ r }) => [
        { text: 'With a calculator (a large upper limit, such as 2000 pm, is as good as infinity here):', math: tex`E(R) = \int_0^{\infty} r\,f(r)\,dr = ${fmtA(r.mean)}\ \mathrm{pm}` },
        { text: 'This is $\\tfrac{3}{2}\\,a/Z$: more than the most probable distance, because the distribution has a long tail towards large $r$.' },
      ],
      markscheme: ({ r }) => [{ mark: '$E(R) = \\int r f(r)\\,dr$' }, { mark: tex`$E(R) = ${fmtA(r.mean)}\ \mathrm{pm}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'The electric potential energy of the electron is $U = -\\dfrac{kZe^2}{R}$. Find its mean value $E(U)$, in electronvolts.',
      response: { kind: 'numeric', answer: 'EU', symbol: 'E(U)', unit: 'eV' },
      solution: ({ p, r }) => [
        { text: 'The mean of $1/R$, with a calculator (or by parts):', math: tex`E\!\left(\frac{1}{R}\right) = \int_0^{\infty} \frac{1}{r}\,f(r)\,dr = \frac{Z}{a} = \frac{${p.Z}}{${A0} \times 10^{-12}} = ${fmtW(r.inv)}\ \mathrm{m^{-1}}` },
        { text: 'Then $E(U) = -kZe^2\\,E(1/R)$; dividing by $e$ gives the answer in eV:', math: tex`E(U) = -8.99 \times 10^{9} \times ${p.Z} \times 1.60 \times 10^{-19} \times ${fmtW(r.inv)} = ${fmtA(r.EU)}\ \mathrm{eV}` },
      ],
      markscheme: ({ r }) => [{ mark: '$E(U) = -kZe^2E(1/R)$, with $E(1/R) = Z/a$' }, { mark: tex`$E(U) = ${fmtA(r.EU)}\ \mathrm{eV}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Would putting the mean distance from (c) into $U = -\\dfrac{kZe^2}{r}$ give the same answer as (d)?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'No: $E(1/R) \\ne 1/E(R)$. The mean of a function of $R$ is not, in general, that function of the mean of $R$.', correct: true },
          { text: 'Yes: the mean of $1/R$ is always $1/E(R)$.' },
          { text: 'No, but only because the potential energy is negative.' },
          { text: 'Yes, because $U$ is proportional to $1/R$.' },
        ],
      },
      solution: () => [
        { text: 'With $E(R) = \\tfrac{3}{2}a/Z$, the formula would give $-\\tfrac{2}{3}\\,kZ^2e^2/a$: only two-thirds of the true mean. The times when the electron is close to the nucleus, where $|U|$ is large, count for more than that single distance suggests. (The answer to (d) is also twice the energy of the state, $-13.6Z^2$ eV.)' },
      ],
      markscheme: () => [{ note: 'No: E(1/R) ≠ 1/E(R).' }],
    },
  ],
});
