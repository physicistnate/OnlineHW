import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a2-friction-crate',
  version: 1,
  title: 'Pulling a crate across a floor',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.2',
  standards: ['ibp.A.2.3', 'ibp.A.2.1', 'ibp.A.2.2'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 2,

  params: {
    m: { min: 20, max: 80, step: 2, base: 40 },
    mus: { min: 0.4, max: 0.7, step: 0.05, base: 0.55, dp: 2 },
    mud: { min: 0.2, max: 0.5, step: 0.05, base: 0.35, dp: 2 },
    F: { min: 150, max: 600, step: 10, base: 300 },
    t: { min: 2, max: 6, step: 1, base: 3 },
  },
  // Dynamic friction below static; the pull is clearly enough to start the crate moving
  // (for g = 9.81 too); a sensible acceleration.
  constraint: (p) =>
    p.mud <= p.mus - 0.1 + 1e-9 && p.F >= 1.1 * p.mus * p.m * 9.81 && (p.F - p.mud * p.m * 9.8) / p.m <= 6,

  compute: (p, c) => {
    const N = p.m * c.g;
    const Fs = p.mus * N;
    const Fd = p.mud * N;
    const a = (p.F - c.carry(Fd, 'Fd')) / p.m;
    c.assume(a > 0);
    const v = c.carry(a, 'a') * p.t;
    return { N, Fs, Fd, a, v };
  },

  stem: ({ d }) =>
    `A crate of mass ${Q(d.m, 'kg')} rests on a horizontal floor. The coefficient of static friction between the crate and the floor is $\\mu_s = ${d.mus}$ and the coefficient of dynamic friction is $\\mu_d = ${d.mud}$. A worker pulls the crate with a horizontal rope.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the minimum horizontal force needed to start the crate moving.',
      response: { kind: 'numeric', answer: 'Fs', symbol: 'F', unit: 'N', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'The floor is horizontal and the pull is horizontal, so vertically the normal force balances the weight.',
          math: tex`F_N = mg = ${d.m} \times ${g} = ${fmtW(r.N)}\ ${u('N')}`,
        },
        {
          text: 'Static friction can grow up to a maximum of $\\mu_s F_N$. The crate starts to move when the pull just exceeds this.',
          math: tex`F = \mu_s F_N = ${d.mus} \times ${fmtW(r.N)} = ${fmtA(r.Fs)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $F_f \\le \\mu_s F_N$ with $F_N = mg$' }, { mark: tex`$F = ${fmtA(r.Fs)}\ ${u('N')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) =>
        `The worker pulls the crate with a horizontal force of ${Q(d.F, 'N')} and the crate starts to move. Calculate the frictional force on the moving crate.`,
      response: { kind: 'numeric', answer: 'Fd', symbol: 'F_f', unit: 'N', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Once the crate slides, the friction is dynamic friction, $\\mu_d F_N$. It does not depend on the pulling force or on the speed.',
          math: tex`F_f = \mu_d F_N = ${d.mud} \times ${fmtW(r.N)} = ${fmtW(r.Fd)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F_f = \mu_d F_N = ${fmtA(r.Fd)}\ ${u('N')}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the acceleration of the crate.',
      response: { kind: 'numeric', answer: 'a', symbol: 'a', unit: 'm s-2', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Horizontally, the pull acts forwards and friction acts backwards. The resultant force gives the acceleration (Newton’s second law).',
          math: tex`F - F_f = ma \quad\Rightarrow\quad a = \frac{F - F_f}{m}`,
        },
        {
          text: 'Substitute, using the friction from (b).',
          math: tex`a = \frac{${d.F} - ${fmtW(r.Fd)}}{${d.m}} = ${fmtA(r.a)}\ ${u('m s-2')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Resultant force $= F - F_f$' },
        { mark: tex`$a = ${fmtA(r.a)}\ ${u('m s-2')}$` },
        { note: 'Allow ECF from (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: ({ d }) => `The forces stay the same. Calculate the speed of the crate ${Q(d.t, 's')} after it starts to move.`,
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The resultant force is constant, so the acceleration is uniform. The crate starts from rest, so use $v = u + at$ with $u = 0$.',
          math: tex`v = at = ${fmtW(r.a)} \times ${d.t} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (c).' }],
    },
  ],
});
