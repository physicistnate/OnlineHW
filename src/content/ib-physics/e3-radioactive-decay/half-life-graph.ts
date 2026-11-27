import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import type { GraphSpec } from '../../../engine/types';
import { niceAxis } from '../graph-axes';

const decayGraph = (A0: number, T: number): GraphSpec => {
  const tEnd = 5 * T;
  const points: [number, number][] = Array.from({ length: 41 }, (_, i) => {
    const t = (i * tEnd) / 40;
    return [Number(t.toFixed(4)), Number((A0 * 2 ** (-t / T)).toFixed(3))];
  });
  // Hour grid lines, so the half-life can be read to the nearest hour.
  return { x: { label: 't / h', min: 0, max: Math.ceil(tEnd / 5) * 5, major: 5, minor: 1 }, y: niceAxis(A0, 'A / Bq'), series: [{ points }] };
};

export default defineQuestion({
  id: 'ibp-e3-half-life-graph',
  version: 1,
  title: 'Half-life from an activity–time graph',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.3',
  standards: ['ibp.E.3.6'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['graph-reading', 'calculation'],
  difficulty: 1,

  params: {
    A0: { min: 400, max: 1200, step: 100, base: 800 },
    T: { min: 2, max: 8, step: 1, base: 4 },
    C: { min: 300, max: 900, step: 50, base: 500 },
    B: { min: 20, max: 50, step: 5, base: 30 },
  },

  compute: (p, c) => {
    const A3 = p.A0 / 8;
    // Four half-lives of the student's own reading in (a) (follow-through).
    const t16 = 4 * c.carry(p.T, 'T');
    const source = p.C - p.B;
    const later = source / 4 + p.B;
    return { A3, t16, source, later, T: p.T };
  },

  stem: () => 'The graph shows how the activity $A$ of a radioactive sample changes with time $t$.',
  figure: ({ p }) => decayGraph(p.A0, p.T),

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Use the graph to determine the half-life of the sample.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T_{1/2}', unit: 'h', positive: true, tolerance: { rel: 0.05 } },
      solution: ({ p }) => [
        {
          text: `The half-life is the time for the activity to fall to half its value. It starts at ${p.A0} Bq and reaches ${p.A0 / 2} Bq after ${p.T} h (check: it reaches ${p.A0 / 4} Bq after another ${p.T} h).`,
        },
      ],
      markscheme: ({ p }) => [{ mark: `$T_{1/2} = ${p.T}$ h` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the activity after three half-lives.',
      response: { kind: 'numeric', answer: 'A3', symbol: 'A', unit: 'Bq', positive: true },
      solution: ({ p, r }) => [{ text: 'Each half-life halves the activity.', math: tex`A = \frac{${p.A0}}{2^3} = \frac{${p.A0}}{8} = ${fmtA(r.A3)}\ ${u('Bq')}` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.A3)}\ ${u('Bq')}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate how long it takes for the activity to fall to one-sixteenth of its initial value.',
      response: { kind: 'numeric', answer: 't16', symbol: 't', unit: 'h', positive: true },
      solution: ({ p, r }) => [{ text: `$\\tfrac{1}{16} = \\left(\\tfrac{1}{2}\\right)^4$, so it takes four half-lives: $4 \\times ${p.T} = ${fmtA(r.t16)}$ h.` }],
      markscheme: ({ r }) => [{ mark: tex`$t = ${fmtA(r.t16)}\ ${u('h')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) =>
        `Another sample of the same nuclide is placed near a detector, which records ${Q(d.C, 'min-1')}. The background count rate is ${Q(d.B, 'min-1')}. Calculate the count rate the detector will record two half-lives later.`,
      response: { kind: 'numeric', answer: 'later', symbol: '\\text{count rate}', unit: 'min-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Only the count rate from the sample halves; the background stays the same. Subtract the background first.',
          math: tex`\text{from the sample: } ${d.C} - ${d.B} = ${fmtW(r.source)}\ ${u('min-1')}`,
        },
        { math: tex`\text{after two half-lives: } \frac{${fmtW(r.source)}}{4} + ${d.B} = ${fmtA(r.later)}\ ${u('min-1')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Background subtracted before halving, and added back' }, { mark: tex`$${fmtA(r.later)}\ ${u('min-1')}$` }],
    },
  ],
});
