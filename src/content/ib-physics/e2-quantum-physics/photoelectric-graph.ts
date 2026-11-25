import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

/** Gradient of the graph: h/e in eV per 10¹⁴ Hz. */
const SLOPE = (IB.h / IB.e) * 1e14;

export default defineQuestion({
  id: 'ibp-e2-photoelectric-graph',
  version: 1,
  title: 'Planck’s constant from a photoelectric graph',
  courses: ['ib-physics-hl'],
  level: 'HL',
  topic: 'ibp.E.2',
  standards: ['ibp.E.2.2', 'ibp.E.2.1'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    f0: { min: 4.5, max: 9, step: 0.5, base: 5.5, dp: 1 },
    w: { min: 4, max: 6, step: 1, base: 5 },
  },

  compute: (p) => {
    const f0Hz = p.f0 * 1e14;
    const Eend = p.w * SLOPE; // eV at the end of the line
    const h = IB.h;
    const phi = p.f0 * SLOPE; // eV
    return { f0Hz, Eend, h, phi, fend: p.f0 + p.w };
  },

  stem: () =>
    'Light of different frequencies $f$ shines on a metal surface. The graph shows how the maximum kinetic energy $E_{\\max}$ of the photoelectrons varies with $f$.',
  figure: ({ p, r }) => ({
    x: { label: 'f / 10¹⁴ Hz', min: 0, max: 16, major: 2, minor: 0.5 },
    y: { label: 'Eₘₐₓ / eV', min: 0, max: 3, major: 0.5, minor: 0.1 },
    series: [{ points: [[p.f0, 0], [r.fend, r.Eend]], showPoints: true }],
  }),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'State the threshold frequency of the metal.',
      response: { kind: 'numeric', answer: 'f0Hz', symbol: 'f_0', unit: 'Hz', positive: true, tolerance: { rel: 0.02 } },
      solution: ({ d, r }) => [
        { text: `Below the threshold frequency no photoelectrons are emitted, so the line meets the frequency axis there: $f_0 = ${d.f0} \\times 10^{14}$ Hz $= ${fmtA(r.f0Hz)}$ Hz.` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$f_0 = ${fmtA(r.f0Hz)}\ ${u('Hz')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Use the graph to determine a value for the Planck constant.',
      response: { kind: 'numeric', answer: 'h', symbol: 'h', unit: 'J s', positive: true, tolerance: { rel: 0.05 } },
      solution: ({ p, r }) => [
        {
          text: 'From $E_{\\max} = hf - \\Phi$, the gradient of the graph is $h$. Use two points far apart on the line, here its two ends, and convert eV to J.',
          math: tex`\text{gradient} = \frac{${fmtW(r.Eend)} - 0}{(${r.fend} - ${p.f0}) \times 10^{14}} = ${fmtW(r.Eend / (p.w * 1e14))}\ \mathrm{eV\,s}`,
        },
        { math: tex`h = ${fmtW(r.Eend / (p.w * 1e14))} \times 1.60 \times 10^{-19} = ${fmtA(r.h)}\ ${u('J s')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Gradient = $h$, from a large triangle' }, { mark: tex`$h \approx ${fmtA(r.h)}\ ${u('J s')}$` }, { note: 'Accept values from reading the graph within about 5 %.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Determine the work function of the metal, in eV.',
      response: { kind: 'numeric', answer: 'phi', symbol: '\\Phi', unit: 'eV', positive: true, tolerance: { rel: 0.05 } },
      solution: ({ d, r }) => [
        {
          text: 'At the threshold frequency $E_{\\max} = 0$, so $\\Phi = hf_0$. (Equivalently, extend the line back: it meets the energy axis at $-\\Phi$.)',
          math: tex`\Phi = \frac{hf_0}{e} = \frac{6.63 \times 10^{-34} \times ${d.f0} \times 10^{14}}{1.60 \times 10^{-19}} = ${fmtA(r.phi)}\ ${u('eV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$\Phi = hf_0 \approx ${fmtA(r.phi)}\ ${u('eV')}$` }, { note: 'Allow ECF from (a) and (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The experiment is repeated with a metal that has a larger work function. How does its graph compare?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A parallel line, further to the right', correct: true },
          { text: 'A steeper line from the same threshold frequency' },
          { text: 'A parallel line, further to the left' },
          { text: 'A less steep line, further to the right' },
        ],
      },
      solution: () => [
        {
          text: 'The gradient is the Planck constant, the same for every metal, so the line is parallel. A larger work function means a larger threshold frequency $f_0 = \\Phi/h$, so the line starts further to the right.',
        },
      ],
      markscheme: () => [{ note: 'Same gradient h; larger threshold frequency.' }],
    },
  ],
});
