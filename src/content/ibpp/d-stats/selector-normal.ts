import { defineQuestion } from '../../../engine/define';
import { fmtA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { normalCdf } from '../helpers';

/** z for the upper 10 % of a normal distribution. */
const Z90 = 1.2815516;

export default defineQuestion({
  id: 'ibpp-d4-selector-normal',
  version: 1,
  title: 'A velocity selector and normally distributed speeds',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.3'],
  math: { topic: 'ibm.4', standards: ['ibm.4.9', 'ibm.4.12'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    mu: { choices: [2, 2.5, 3], base: 2.5, dp: 1 },
    sigma: { choices: [2, 3, 4], base: 3 },
    E: { choices: [4, 5, 6], base: 5 },
    B: { choices: [0.2, 0.25], base: 0.2, dp: 2 },
    w: { choices: [5, 10], base: 5 },
  },

  compute: (p, c) => {
    const v = (p.E * 1e4) / p.B;
    const mu = p.mu * 1e5;
    const sigma = p.sigma * 1e4;
    const w = p.w * 1e3;
    const vc = c.carry(v, 'v', 3);
    const frac = normalCdf(vc + w, mu, sigma) - normalCdf(vc - w, mu, sigma);
    const v90 = mu + Z90 * sigma;
    const E90 = v90 * p.B;
    return { v, frac, v90, E90 };
  },

  stem: ({ d }) =>
    `Ions leave an oven with speeds $V$ that are normally distributed, with mean $${d.mu} \\times 10^{5}\\ \\mathrm{m\\,s^{-1}}$ and standard deviation $${d.sigma} \\times 10^{4}\\ \\mathrm{m\\,s^{-1}}$. They pass into a velocity selector: perpendicular electric and magnetic fields, with a slit at the far end. The magnetic field is ${Q(d.B, 'T')}. An ion passes through the slit if its speed is within $${d.w} \\times 10^{3}\\ \\mathrm{m\\,s^{-1}}$ of the selected speed.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: ({ d }) => `The electric field is set to $${d.E} \\times 10^{4}\\ \\mathrm{V\\,m^{-1}}$. Calculate the selected speed.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [{ text: 'The electric and magnetic forces balance when $qE = qvB$:', math: tex`v = \frac{E}{B} = \frac{${d.E} \times 10^{4}}{${d.B}} = ${fmtA(r.v)}\ ${u('m s-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$v = E/B = ${fmtA(r.v)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the fraction of the ions that pass through the slit.',
      response: { kind: 'numeric', answer: 'frac', symbol: 'P', positive: true },
      solution: ({ d, p, r }) => {
        const lo = r.v - p.w * 1e3;
        const hi = r.v + p.w * 1e3;
        return [
          { text: `The ions that pass have speeds between $${fmtA(lo)}$ and $${fmtA(hi)}\\ \\mathrm{m\\,s^{-1}}$. With the normal distribution on a calculator (mean $${d.mu} \\times 10^{5}$, standard deviation $${d.sigma} \\times 10^{4}$):`, math: tex`P(${fmtA(lo)} < V < ${fmtA(hi)}) = ${fmtA(r.frac)}` },
        ];
      },
      markscheme: ({ r }) => [{ mark: 'Both limits: selected speed ± the half-width' }, { mark: tex`$${fmtA(r.frac)}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'With the magnetic field unchanged, how should the electric field be set so that the largest fraction of the ions passes through the slit?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'So that the selected speed $E/B$ equals the mean speed, where the probability density is highest.', correct: true },
          { text: 'As large as possible, so that the fastest ions are selected.' },
          { text: 'As small as possible, so that the forces on the ions are small.' },
          { text: 'It makes no difference: the same fraction passes whatever speed is selected.' },
        ],
      },
      solution: () => [{ text: 'The window of accepted speeds has a fixed width. The area under the normal curve over a window of fixed width is largest when the window is centred on the peak, at the mean.' }],
      markscheme: () => [{ note: 'E/B = mean speed.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'The selector is to pick out the speed that only 10% of the ions exceed. Find the electric field needed.',
      response: { kind: 'numeric', answer: 'E90', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'With the inverse normal function, $P(V > v) = 0.1$ gives', math: tex`v = ${d.mu} \times 10^{5} + 1.2816 \times ${d.sigma} \times 10^{4} = ${fmtA(r.v90)}\ ${u('m s-1')}` },
        { math: tex`E = vB = ${fmtA(r.v90)} \times ${d.B} = ${fmtA(r.E90)}\ ${u('V m-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Inverse normal: $z = 1.28$' }, { mark: tex`$E = ${fmtA(r.E90)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'An ion faster than the selected speed enters the fields. Which way is it pushed as it enters?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is deflected in the direction of the magnetic force, because $qvB > qE$.', correct: true },
          { text: 'It is deflected in the direction of the electric force, because $qE > qvB$.' },
          { text: 'It goes straight through: the forces balance for every speed.' },
          { text: 'It is slowed down to the selected speed, then goes straight through.' },
        ],
      },
      solution: ({ d }) => [
        { text: `The electric force $qE$ is the same at every speed, but the magnetic force $qvB$ grows with the speed. For a faster ion the magnetic force is the larger, so the ion is pushed in the direction of the magnetic force. An ion only a little faster (by less than $${d.w} \\times 10^{3}\\ \\mathrm{m\\,s^{-1}}$ here) is pushed so little that it still reaches the slit: that is why the selector lets through a band of speeds, not a single speed.` },
      ],
      markscheme: () => [{ note: 'Towards the magnetic force: qvB > qE.' }],
    },
  ],
});
