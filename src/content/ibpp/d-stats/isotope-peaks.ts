import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../../ib-physics/constants';
import { binomialPdf } from '../helpers';

/**
 * Molecules with n atoms of chlorine (35 or 37) or bromine (79 or 81); p is the fraction of the
 * heavier isotope (24.2 % ³⁷Cl and 49.3 % ⁸¹Br in nature, rounded). M0 is the mass number of the
 * lightest molecular ion, with ¹²C and ¹H.
 */
const MOLECULES: Record<string, { name: string; formula: string; element: string; light: number; heavy: number; n: number; p: number; M0: number }> = {
  cl2: { name: 'chlorine', formula: '\\mathrm{Cl_2}', element: 'chlorine', light: 35, heavy: 37, n: 2, p: 0.24, M0: 70 },
  chcl3: { name: 'chloroform', formula: '\\mathrm{CHCl_3}', element: 'chlorine', light: 35, heavy: 37, n: 3, p: 0.24, M0: 118 },
  ccl4: { name: 'tetrachloromethane', formula: '\\mathrm{CCl_4}', element: 'chlorine', light: 35, heavy: 37, n: 4, p: 0.24, M0: 152 },
  br2: { name: 'bromine', formula: '\\mathrm{Br_2}', element: 'bromine', light: 79, heavy: 81, n: 2, p: 0.49, M0: 158 },
  ch2br2: { name: 'dibromomethane', formula: '\\mathrm{CH_2Br_2}', element: 'bromine', light: 79, heavy: 81, n: 2, p: 0.49, M0: 172 },
  chbr3: { name: 'bromoform', formula: '\\mathrm{CHBr_3}', element: 'bromine', light: 79, heavy: 81, n: 3, p: 0.49, M0: 250 },
};

export default defineQuestion({
  id: 'ibpp-d4-isotope-peaks',
  version: 1,
  title: 'Isotope peaks in a mass spectrometer: binomial counts and a linear transformation',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.2', 'ibp.D.3.3'],
  math: { topic: 'ibm.4', standards: ['ibm.4.8', 'ibm.4.14', 'ibm.4.7'], level: 'HL' },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 3,

  params: {
    mol: { choices: Object.keys(MOLECULES), base: 'cl2' },
    v: { choices: [4, 5, 8], base: 5 },
    B: { choices: [0.5, 0.8, 1], base: 0.8, dp: 1 },
  },

  compute: (p, c) => {
    const m = MOLECULES[p.mol];
    const P1 = binomialPdf(m.n, 1, m.p);
    const EX = m.n * m.p;
    const EM = m.M0 + 2 * EX;
    const varX = m.n * m.p * (1 - m.p);
    const sdM = 2 * Math.sqrt(varX);
    const r0 = (m.M0 * IB.u * p.v * 1e4) / (IB.e * p.B);
    const ED = ((2 * IB.u * p.v * 1e4) / (IB.e * p.B)) * c.carry(EM, 'EM', 3);
    return { P1, EX, EM, varX, sdM, r0, ED };
  },

  stem: ({ p, d }) => {
    const m = MOLECULES[p.mol];
    return `Each atom of ${m.element} in a sample is ${m.element}-${m.heavy} with probability ${m.p}, and otherwise ${m.element}-${m.light}, independently of the others. A molecule of ${m.name}, $${m.formula}$, contains ${m.n} ${m.element} atoms; let $X$ be the number of them that are ${m.element}-${m.heavy}. Its mass number is then $M = ${m.M0} + 2X$ (ignore the rare isotopes of carbon and hydrogen). In a mass spectrometer, singly charged molecular ions leave a velocity selector at $${d.v} \\times 10^{4}\\ \\mathrm{m\\,s^{-1}}$ and enter a uniform magnetic field of ${Q(d.B, 'T')} at right angles. Each ion moves in a semicircle and lands on a detector a distance $D = 2r$ from the entrance slit. Take $u = 1.661 \\times 10^{-27}$ kg and $e = 1.60 \\times 10^{-19}$ C.`;
  },

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ p }) => `Find the probability that a molecule contains exactly one atom of ${MOLECULES[p.mol].element}-${MOLECULES[p.mol].heavy}.`,
      response: { kind: 'numeric', answer: 'P1', symbol: 'P(X = 1)', positive: true },
      solution: ({ p, r }) => {
        const m = MOLECULES[p.mol];
        const power = m.n === 2 ? '' : `^{${m.n - 1}}`;
        return [{ text: `$X \\sim B(${m.n}, ${m.p})$:`, math: tex`P(X = 1) = ${m.n} \times ${m.p} \times ${(1 - m.p).toFixed(2)}${power} = ${fmtA(r.P1)}` }];
      },
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.P1)}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the mean mass number $E(M)$ of the molecular ions.',
      response: { kind: 'numeric', answer: 'EM', symbol: 'E(M)', positive: true },
      solution: ({ p, r }) => {
        const m = MOLECULES[p.mol];
        return [{ text: `$E(X) = np = ${m.n} \\times ${m.p} = ${fmtW(r.EX)}$, and $E(aX + b) = aE(X) + b$:`, math: tex`E(M) = ${m.M0} + 2 \times ${fmtW(r.EX)} = ${fmtA(r.EM)}` }];
      },
      markscheme: ({ r }) => [{ mark: tex`$E(M) = ${fmtA(r.EM)}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the standard deviation of $M$.',
      response: { kind: 'numeric', answer: 'sdM', symbol: '\\sigma_M', positive: true },
      solution: ({ p, r }) => {
        const m = MOLECULES[p.mol];
        return [
          { math: tex`\mathrm{Var}(X) = np(1 - p) = ${m.n} \times ${m.p} \times ${(1 - m.p).toFixed(2)} = ${fmtW(r.varX)}` },
          { text: 'Adding a constant does not change the spread, and multiplying by 2 multiplies the variance by $2^2$: $\\mathrm{Var}(M) = 4\\,\\mathrm{Var}(X)$.', math: tex`\sigma_M = \sqrt{4 \times ${fmtW(r.varX)}} = ${fmtA(r.sdM)}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$\\mathrm{Var}(aX + b) = a^2\\,\\mathrm{Var}(X)$' }, { mark: tex`$\sigma_M = ${fmtA(r.sdM)}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the radius of the semicircle followed by the lightest molecular ions.',
      response: { kind: 'numeric', answer: 'r0', symbol: 'r', unit: 'm', positive: true },
      solution: ({ p, d, r }) => {
        const m = MOLECULES[p.mol];
        return [
          { text: 'The magnetic force provides the centripetal force: $qvB = \\dfrac{mv^2}{r}$, so $r = \\dfrac{mv}{qB}$.', math: tex`r = \frac{${m.M0} \times 1.661 \times 10^{-27} \times ${d.v} \times 10^{4}}{1.60 \times 10^{-19} \times ${d.B}} = ${fmtA(r.r0)}\ ${u('m')}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: '$r = mv/qB$ with the mass in kg' }, { mark: tex`$r = ${fmtA(r.r0)}\ ${u('m')}$` }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => 'Find the mean distance $E(D)$ from the slit at which the molecular ions land.',
      response: { kind: 'numeric', answer: 'ED', symbol: 'E(D)', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'All the ions have the same speed, so $D = 2r = \\dfrac{2uv}{eB}\\,M$ is a linear function of $M$, and $E(D) = \\dfrac{2uv}{eB}\\,E(M)$:', math: tex`E(D) = \frac{2 \times 1.661 \times 10^{-27} \times ${d.v} \times 10^{4}}{1.60 \times 10^{-19} \times ${d.B}} \times ${fmtW(r.EM)} = ${fmtA(r.ED)}\ ${u('m')}` },
        { text: 'For the same reason, neighbouring peaks (mass numbers 2 apart) land equally spaced along the detector.' },
      ],
      markscheme: ({ r }) => [{ mark: '$E(D)$ from $E(M)$ by the linear relation (or by weighting each peak)' }, { mark: tex`$E(D) = ${fmtA(r.ED)}\ ${u('m')}$` }, { note: 'Allow ECF from (b).' }],
    },
  ],
});
