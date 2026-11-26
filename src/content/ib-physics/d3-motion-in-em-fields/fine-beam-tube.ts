import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** e/m for the electron (C/kg), used only to make realistic measured radii. */
const E_OVER_M = 1.7588e11;

interface P {
  V: number;
  B: number;
}

/** The radius (cm) a student measures, to 2 decimal places. */
const measured = (p: P) => Number(((Math.sqrt((2 * p.V) / E_OVER_M) / (p.B * 1e-3)) * 100).toFixed(2));

export default defineQuestion({
  id: 'ibp-d3-fine-beam-tube',
  version: 1,
  title: 'Measuring e/m for the electron with a fine beam tube',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.3',
  standards: ['ibp.D.3.2'],
  uses: ['ibp.B.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    V: { choices: [150, 200, 250, 300], base: 200 },
    B: { choices: [0.8, 1, 1.2, 1.5], base: 1, dp: 1 },
  },

  compute: (p, c) => {
    const v = Math.sqrt((2 * IB.e * p.V) / IB.me);
    const r = (IB.me * c.carry(v, 'v', 3)) / (IB.e * p.B * 1e-3);
    const rm = measured(p) / 100;
    const em = (2 * p.V) / ((p.B * 1e-3) ** 2 * rm ** 2);
    return { v, r, rm, em };
  },

  stem: ({ p, d }) =>
    `In a fine beam tube, electrons are accelerated from rest through a potential difference of ${Q(d.V, 'V')}. They then enter a uniform magnetic field of ${Q(d.B, 'mT')}, perpendicular to their velocity, and the glowing gas shows their circular path. A student measures its radius as ${Q(measured(p).toFixed(2), 'cm')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the speed of the electrons, using $e = 1.60 \\times 10^{-19}$ C and $m_e = 9.11 \\times 10^{-31}$ kg.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        { text: 'The work done by the accelerating potential difference becomes kinetic energy:', math: tex`eV = \tfrac{1}{2}m_ev^2 \;\Rightarrow\; v = \sqrt{\frac{2eV}{m_e}} = \sqrt{\frac{2 \times 1.60 \times 10^{-19} \times ${d.V}}{9.11 \times 10^{-31}}} = ${fmtA(r.v)}\ ${u('m s-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: '$eV = \\tfrac{1}{2}mv^2$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Predict the radius of the electrons’ path, in metres.',
      response: { kind: 'numeric', answer: 'r', symbol: 'r', unit: 'm', positive: true },
      solution: ({ d, r }) => [{ math: tex`r = \frac{m_ev}{eB} = \frac{9.11 \times 10^{-31} \times ${fmtW(r.v)}}{1.60 \times 10^{-19} \times ${d.B} \times 10^{-3}} = ${fmtA(r.r)}\ ${u('m')}` }],
      markscheme: ({ r }) => [{ mark: '$evB = m_ev^2/r$' }, { mark: tex`$r = ${fmtA(r.r)}\ ${u('m')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Combining $eV = \\tfrac{1}{2}m_ev^2$ and $r = \\dfrac{m_ev}{eB}$ gives $\\dfrac{e}{m_e} = \\dfrac{2V}{B^2r^2}$. Use the student’s measured radius to calculate $e/m_e$.',
      response: { kind: 'numeric', answer: 'em', symbol: 'e/m_e', unit: 'C kg-1', positive: true },
      solution: ({ d, r }) => [{ math: tex`\frac{e}{m_e} = \frac{2V}{B^2r^2} = \frac{2 \times ${d.V}}{(${d.B} \times 10^{-3})^2 \times (${fmtW(r.rm)})^2} = ${fmtA(r.em)}\ ${u('C kg-1')}` }],
      markscheme: ({ r }) => [{ mark: 'Field in T and radius in m' }, { mark: tex`$e/m_e = ${fmtA(r.em)}\ ${u('C kg-1')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The accelerating potential difference is made four times larger, with the same magnetic field. What happens to the radius of the path?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It doubles: $v \\propto \\sqrt{V}$ and $r \\propto v$.', correct: true },
          { text: 'It becomes four times larger: $r \\propto V$.' },
          { text: 'It halves: faster electrons are deflected more.' },
          { text: 'It is unchanged: the radius depends only on the magnetic field.' },
        ],
      },
      solution: () => [{ text: 'Four times the potential difference gives four times the kinetic energy, so twice the speed; the radius is proportional to the speed.' }],
      markscheme: () => [{ note: 'r ∝ v ∝ √V: doubles.' }],
    },
  ],
});
