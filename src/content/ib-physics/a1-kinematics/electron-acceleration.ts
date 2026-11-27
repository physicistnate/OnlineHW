import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, knowns, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a1-electron-acceleration',
  version: 1,
  title: 'Accelerating an electron',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 2,

  params: {
    v: { min: 1.0e7, max: 3.0e7, step: 1e6, base: 2.0e7, sci: 2 },
    d: { min: 1.0, max: 5.0, step: 0.2, base: 2.0, dp: 1 },
    L: { min: 10, max: 30, step: 2, base: 20 },
  },

  compute: (p, c) => {
    const s1 = p.d / 100;
    const a = p.v ** 2 / (2 * s1);
    const t = p.v / c.carry(a, 'a');
    // Alternative method: average velocity ½(u + v), then t = s / v̄.
    const vbar = p.v / 2;
    const t__avg = s1 / c.carry(vbar);
    const sL = p.L / 100;
    const t2 = sL / p.v;
    const tTotal = c.carry(t, 't') + c.carry(t2);
    return { s1, a, t, vbar, t__avg, sL, t2, tTotal };
  },

  stem: ({ d }) =>
    `In a cathode-ray tube, an electron starts from rest and is accelerated uniformly to a speed of ${Q(d.v, 'm s-1')} over a distance of ${Q(d.d, 'cm')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the acceleration of the electron.',
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Convert the distance to metres, then list what is known. The time is not given, so use the equation of motion without $t$.',
          math: knowns([['u', '0'], ['v', d.v, 'm s-1'], ['s', fmtW(r.s1), 'm'], ['a', '?']]),
        },
        {
          text: 'Rearrange $v^2 = u^2 + 2as$ with $u = 0$, and substitute. Powers of ten are easiest to handle in scientific notation.',
          math: tex`a = \frac{v^2}{2s} = \frac{(${d.v})^2}{2 \times ${fmtW(r.s1)}} = ${fmtA(r.a)}\ ${u('m s-2')}`,
        },
        {
          text: 'The acceleration is enormous because the electron reaches a very high speed over a very short distance. Its speed is still well below the speed of light, so the equations of motion apply.',
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $v^2 = u^2 + 2as$ with distance in metres' }, { mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the time taken for the electron to reach this speed.',
      response: { kind: 'numeric', answer: 't', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Use $v = u + at$ with $u = 0$ and the acceleration from (a).',
          math: tex`t = \frac{v}{a} = \frac{${d.v}}{${fmtW(r.a)}} = ${fmtA(r.t)}\ ${u('s')}`,
        },
        {
          text: 'Check without using (a): for uniform acceleration from rest the average velocity is $\\tfrac{1}{2}v$, and time = distance ÷ average velocity.',
          math: tex`t = \frac{s}{\tfrac{1}{2}v} = \frac{${fmtW(r.s1)}}{${fmtW(r.vbar)}} = ${fmtA(r.t__avg)}\ ${u('s')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of $v = u + at$ **or** $s = \\tfrac{1}{2}(u + v)t$' },
        { mark: tex`$t = ${fmtA(r.t)}\ ${u('s')}$` },
        { note: 'Allow ECF from (a).' },
      ],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: ({ d }) =>
        `After reaching this speed, the electron travels at constant speed for a further ${Q(d.L, 'cm')} to the screen. Calculate the total time from when the electron starts from rest to when it reaches the screen.`,
      response: { kind: 'numeric', answer: 'tTotal', symbol: 't_{\\text{total}}', unit: 's', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At constant speed, time = distance ÷ speed. Convert the distance to metres first.',
          math: tex`t_2 = \frac{${fmtW(r.sL)}}{${d.v}} = ${fmtW(r.t2)}\ ${u('s')}`,
        },
        {
          text: 'Add the time spent accelerating, from (b). Write both times with the same power of ten before adding.',
          math: tex`t_{\text{total}} = ${fmtW(r.t)} + ${fmtW(r.t2)} = ${fmtA(r.tTotal)}\ ${u('s')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: tex`Time at constant speed $= ${fmtA(r.t2)}\ ${u('s')}$` },
        { mark: tex`$t_{\text{total}} = ${fmtA(r.tTotal)}\ ${u('s')}$` },
        { note: 'Allow ECF from (b).' },
      ],
    },
  ],
});
