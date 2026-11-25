import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, fmtWA, sinD, tanD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'up1-t3-ramp-variable-friction',
  version: 1,
  title: 'Energy lost to friction on a ramp that gets rougher',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.5', 'up1.3.2'],
  uses: ['up1.2'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { min: 2, max: 20, step: 1, base: 10 },
    theta: { min: 25, max: 45, step: 5, base: 35 },
    mu0: { min: 0.05, max: 0.2, step: 0.05, base: 0.1, dp: 2 },
    cc: { min: 0.02, max: 0.2, step: 0.02, base: 0.1, dp: 2 },
    L: { min: 2, max: 12, step: 0.5, base: 8, dp: 1 },
  },
  // The speed is greatest partway down (where μ = tan θ), and the crate still reaches the
  // bottom with a clear speed: 1.15 s* ≤ L ≤ 1.6 s*.
  constraint: (p) => {
    const sStar = (tanD(p.theta) - p.mu0) / p.cc;
    return sStar > 0 && p.L >= 1.15 * sStar && p.L <= 1.6 * sStar;
  },

  compute: (p, c) => {
    const co = cosD(p.theta);
    const N = p.m * c.g * co;
    const integral = p.mu0 * p.L + (p.cc * p.L ** 2) / 2; // ∫μ ds, in m
    // Wf is later subtracted from a similar number, so students keep 3 s.f. of the normal force too.
    const Wf = -c.carry(N, undefined, 3) * integral;
    const Wg = p.m * c.g * p.L * sinD(p.theta);
    // The two works nearly cancel, so students keep 3 s.f. of each.
    const K = c.carry(Wg, undefined, 3) + c.carry(Wf, 'Wf', 3);
    c.assume(K > 0);
    const v = Math.sqrt((2 * K) / p.m);
    const sStar = (tanD(p.theta) - p.mu0) / p.cc;
    return { N, integral, Wf, Wg, K, v, sStar };
  },

  stem: ({ d }) =>
    `A crate of mass ${Q(d.m, 'kg')} is released from rest at the top of a straight ramp of length ${Q(d.L, 'm')}, inclined at ${Q(d.theta, 'deg')} to the horizontal. The ramp gets rougher further down: the coefficient of kinetic friction is $\\mu_k(s) = \\mu_0 + cs$, where $s$ is the distance travelled down the ramp, $\\mu_0 = ${d.mu0}$ and $c = ${d.cc}\\ \\mathrm{m^{-1}}$.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Find the work done on the crate by friction as it slides the full length of the ramp.',
      response: { kind: 'numeric', answer: 'Wf', symbol: 'W_f', unit: 'J' },
      solution: ({ d, r, g }) => [
        {
          text: 'The normal force is $mg\\cos\\theta$ everywhere on the ramp, but the friction force $\\mu_k(s)\\,mg\\cos\\theta$ changes with $s$, so integrate. Friction is opposite to the motion, so its work is negative.',
          math: tex`W_f = -\int_0^{L} \mu_k(s)\,mg\cos\theta\,ds = -mg\cos\theta\left(\mu_0 L + \tfrac{1}{2}cL^2\right)`,
        },
        {
          math: tex`mg\cos\theta = ${d.m} \times ${g} \times \cos ${d.theta}^{\circ} = ${fmtW(r.N)}\ ${u('N')}, \qquad \mu_0 L + \tfrac{1}{2}cL^2 = ${d.mu0} \times ${d.L} + \tfrac{1}{2} \times ${d.cc} \times ${d.L}^2 = ${fmtW(r.integral)}\ ${u('m')}`,
        },
        { math: tex`W_f = -${fmtW(r.N)} \times ${fmtW(r.integral)} = ${fmtWA(r.Wf)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Friction force $\\mu_k(s)\\,mg\\cos\\theta$ integrated over the length' },
        { mark: '$\\mu_0 L + \\tfrac{1}{2}cL^2$' },
        { mark: tex`$W_f = ${fmtA(r.Wf)}\ ${u('J')}$ (negative)` },
      ],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the speed of the crate at the bottom of the ramp.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Work–energy theorem: gravity does positive work $mgL\\sin\\theta$ and friction does the negative work from (a). The normal force does no work.',
          math: tex`W_g = mgL\sin\theta = ${d.m} \times ${g} \times ${d.L} \times \sin ${d.theta}^{\circ} = ${fmtW(r.Wg)}\ ${u('J')}`,
        },
        {
          math: tex`K = W_g + W_f = ${fmtW(r.Wg)} - ${fmtW(-r.Wf)} = ${fmtW(r.K)}\ ${u('J')}, \qquad v = \sqrt{\frac{2K}{m}} = \sqrt{\frac{2 \times ${fmtW(r.K)}}{${d.m}}} = ${fmtA(r.v)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$\\tfrac{1}{2}mv^2 = mgL\\sin\\theta + W_f$' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m/s')}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'How far down the ramp is the crate moving fastest?',
      response: { kind: 'numeric', answer: 'sStar', symbol: 's', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The crate speeds up while the component of gravity along the ramp exceeds friction, and slows down after that. The speed is greatest where the net force along the ramp is zero: $mg\\sin\\theta = \\mu_k(s)\\,mg\\cos\\theta$, so $\\mu_0 + cs = \\tan\\theta$.',
          math: tex`s = \frac{\tan\theta - \mu_0}{c} = \frac{\tan ${d.theta}^{\circ} - ${d.mu0}}{${d.cc}} = ${fmtA(r.sStar)}\ ${u('m')}`,
        },
        { text: 'Equivalently, $dK/ds = mg\\sin\\theta - \\mu_k(s)\\,mg\\cos\\theta = 0$ at the maximum of $K(s)$.' },
      ],
      markscheme: ({ r }) => [{ mark: 'Net force (or $dK/ds$) zero: $\\mu_0 + cs = \\tan\\theta$' }, { mark: tex`$s = ${fmtA(r.sStar)}\ ${u('m')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Suppose the ramp were rougher at the top instead, with $\\mu_k = \\mu_0 + c(L - s)$. How would the total work done by friction over the whole ramp compare?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It would be the same.', correct: true },
          { text: 'It would be greater in magnitude, because the crate meets the rough part first.' },
          { text: 'It would be smaller in magnitude, because the crate is moving faster on the rough part.' },
          { text: 'It cannot be found without knowing the speed of the crate.' },
        ],
      },
      solution: () => [
        {
          text: 'The work done by friction depends only on $\\int_0^L \\mu_k\\,ds$ along the path (the normal force is the same everywhere), not on the speed or on the order in which the rough and smooth parts are met. Reversing the roughness gives the same integral, so the same energy is transferred to internal energy and the speed at the bottom is the same, although the speed partway down is different.',
        },
      ],
      markscheme: () => [{ note: 'Same ∫μ ds, so the same work done by friction.' }],
    },
  ],
});
