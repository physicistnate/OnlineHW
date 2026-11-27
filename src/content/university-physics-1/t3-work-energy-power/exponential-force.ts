import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'up1-t3-exponential-force',
  version: 1,
  title: 'Work done by an exponentially decreasing force',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.2', 'up1.3.3'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    F0: { min: 20, max: 100, step: 5, base: 50 },
    lam: { min: 0.1, max: 0.5, step: 0.05, base: 0.3, dp: 2 },
    d: { min: 0.2, max: 1.2, step: 0.1, base: 0.6, dp: 1 },
    m: { min: 0.2, max: 2, step: 0.1, base: 0.5, dp: 1 },
  },
  // The launcher is between half a decay length and five decay lengths long.
  constraint: (p) => p.d / p.lam >= 0.5 && p.d / p.lam <= 5,

  compute: (p, c) => {
    const Wmax = p.F0 * p.lam;
    const W = Wmax * (1 - Math.exp(-p.d / p.lam));
    const v = Math.sqrt((2 * c.carry(W, 'W')) / p.m);
    return { Wmax, W, v };
  },

  stem: ({ d }) =>
    `A pneumatic launcher pushes a cart of mass ${Q(d.m, 'kg')} along a straight, horizontal, frictionless track. As the compressed air expands, the force on the cart decreases with the distance $x$ the cart has moved: $F(x) = F_0 e^{-x/\\lambda}$, where $F_0 = ${d.F0}\\ \\mathrm{N}$ and $\\lambda = ${d.lam}\\ \\mathrm{m}$. The cart starts from rest at $x = 0$ and leaves the launcher at $x = d = ${d.d}\\ \\mathrm{m}$.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Find the work done on the cart by the launcher.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The force varies with position, so integrate it over the displacement.',
          math: tex`W = \int_0^{d} F_0 e^{-x/\lambda}\,dx = \Big[-F_0\lambda e^{-x/\lambda}\Big]_0^{d} = F_0\lambda\left(1 - e^{-d/\lambda}\right)`,
        },
        { math: tex`W = ${d.F0} \times ${d.lam} \times \left(1 - e^{-${d.d}/${d.lam}}\right) = ${fmtWA(r.W)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Correct integral and antiderivative, $-F_0\\lambda e^{-x/\\lambda}$' }, { mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the speed of the cart as it leaves the launcher.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Work–energy theorem: the net work equals the change in kinetic energy, and the cart starts from rest. (Gravity and the normal force are perpendicular to the motion and do no work.)',
          math: tex`v = \sqrt{\frac{2W}{m}} = \sqrt{\frac{2 \times ${fmtW(r.W)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$W = \\Delta K$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Find the work the force would do if the launcher were infinitely long.',
      response: { kind: 'numeric', answer: 'Wmax', symbol: 'W_{\\infty}', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'This is an improper integral. As $d \\to \\infty$, $e^{-d/\\lambda} \\to 0$, so the work approaches a finite limit even though the force acts over an infinite distance.',
          math: tex`W_{\infty} = \int_0^{\infty} F_0 e^{-x/\lambda}\,dx = F_0\lambda = ${d.F0} \times ${d.lam} = ${fmtA(r.Wmax)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W_{\infty} = F_0\lambda = ${fmtA(r.Wmax)}\ ${u('J')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'What fraction of the work in (c) is done while the cart moves through the first distance $\\lambda$?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: '$1 - e^{-1}$, about 63 %', correct: true },
          { text: '$e^{-1}$, about 37 %' },
          { text: 'One half' },
          { text: 'All of it' },
        ],
      },
      solution: () => [
        {
          text: 'From (a) with $d = \\lambda$: $W = F_0\\lambda(1 - e^{-1})$, which is $1 - e^{-1} \\approx 0.63$ of $W_{\\infty} = F_0\\lambda$. Each further distance $\\lambda$ adds $e^{-1}$ times as much work as the one before.',
        },
      ],
      markscheme: () => [{ note: '1 − 1/e ≈ 0.63.' }],
    },
  ],
});
