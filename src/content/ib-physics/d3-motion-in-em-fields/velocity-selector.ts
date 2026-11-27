import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Masses of the two neon isotopes Aston separated (kg): 20 u and 22 u. */
const M20 = 20 * IB.u;
const M22 = 22 * IB.u;

export default defineQuestion({
  id: 'ibp-d3-velocity-selector',
  version: 1,
  title: 'A velocity selector between charged plates, then a mass spectrometer',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.3', 'ibp.D.3.2'],
  uses: ['ibp.D.2.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { choices: [200, 300, 400, 500, 600], base: 400 },
    d: { choices: [5, 8, 10], base: 8 },
    B1: { choices: [0.05, 0.08, 0.1, 0.12], base: 0.1, dp: 2 },
    B2: { choices: [0.2, 0.3, 0.4], base: 0.3, dp: 1 },
  },
  // A selected speed of at most 1.2 × 10⁶ m/s keeps the spectrometer a sensible size.
  constraint: (p) => p.V / (p.d * 1e-3) / p.B1 <= 1.2e6,

  compute: (p, c) => {
    const E = p.V / (p.d * 1e-3);
    const v = c.carry(E, 'E', 3) / p.B1;
    const vc = c.carry(v, 'v', 3);
    const r20 = (M20 * vc) / (IB.e * p.B2);
    const gap = (2 * (M22 - M20) * vc) / (IB.e * p.B2);
    return { E, v, r20, gap };
  },

  stem: ({ d }) =>
    `Singly charged positive neon ions, with a range of speeds, enter the space between two parallel plates ${Q(d.d, 'mm')} apart with a potential difference of ${Q(d.V, 'V')} between them. A uniform magnetic field of ${Q(d.B1, 'T')}, perpendicular to both the electric field and the ions’ velocity, acts in the same region. The electric force on the ions is upwards and the magnetic force is downwards. Ions that pass straight through then enter a region with only a uniform magnetic field of ${Q(d.B2, 'T')}, perpendicular to their velocity. Neon has two common isotopes, of mass 20 u and 22 u, where $1\\ \\mathrm{u} = 1.661 \\times 10^{-27}$ kg.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the electric field strength between the plates.',
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'V m-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`E = \frac{V}{d} = \frac{${d.V}}{${d.d} \times 10^{-3}} = ${fmtA(r.E)}\ ${u('V m-1')}` }],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('V m-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the speed of the ions that pass straight through the plates without being deflected.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'Undeflected ions feel no resultant force: the electric and magnetic forces balance.', math: tex`qE = qvB \;\Rightarrow\; v = \frac{E}{B} = \frac{${fmtW(r.E)}}{${d.B1}} = ${fmtA(r.v)}\ ${u('m s-1')}` },
        { text: 'The charge cancels, so the selected speed is the same for every ion, whatever its mass or charge.' },
      ],
      markscheme: ({ r }) => [{ mark: '$qE = qvB$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'An ion moving faster than the speed in (b) enters the plates. What happens to it?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is deflected downwards: the magnetic force $qvB$ is larger than before, but the electric force $qE$ is the same.', correct: true },
          { text: 'It is deflected upwards: the electric force on it is larger.' },
          { text: 'It passes straight through: both forces increase by the same factor.' },
          { text: 'It is slowed down until it reaches the selected speed.' },
        ],
      },
      solution: () => [{ text: 'The electric force does not depend on speed, but the magnetic force is proportional to it. For a faster ion the downward magnetic force wins, and the ion curves downwards into a plate.' }],
      markscheme: () => [{ note: 'Magnetic force increases with v; electric force does not: deflected downwards.' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Calculate the radius of the path of the neon-20 ions in the second magnetic field.',
      response: { kind: 'numeric', answer: 'r20', symbol: 'r', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'The magnetic force provides the centripetal force:', math: tex`qvB = \frac{mv^2}{r} \;\Rightarrow\; r = \frac{mv}{qB} = \frac{20 \times 1.661 \times 10^{-27} \times ${fmtW(r.v)}}{1.60 \times 10^{-19} \times ${d.B2}} = ${fmtA(r.r20)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$r = mv/qB$' }, { mark: tex`$r = ${fmtA(r.r20)}\ ${u('m')}$` }, { note: 'Allow ECF from (b).' }],
    },
    {
      label: '(e)',
      marks: 2,
      prompt: () => 'The ions travel through half a circle and land on a detector. Calculate the distance between the landing points of the neon-20 and neon-22 ions.',
      response: { kind: 'numeric', answer: 'gap', symbol: '\\Delta x', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'Each ion lands one diameter from where it entered. The radius is proportional to the mass, so the gap is twice the difference in radii:', math: tex`\Delta x = \frac{2(m_{22} - m_{20})v}{qB} = \frac{2 \times 2 \times 1.661 \times 10^{-27} \times ${fmtW(r.v)}}{1.60 \times 10^{-19} \times ${d.B2}} = ${fmtA(r.gap)}\ ${u('m')}` },
        { text: 'This is how Francis Aston showed in 1919 that neon has two isotopes.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Gap = 2 × difference of radii (diameters)' }, { mark: tex`$\Delta x = ${fmtA(r.gap)}\ ${u('m')}$` }, { note: 'Allow ECF from (b).' }],
    },
  ],
});
