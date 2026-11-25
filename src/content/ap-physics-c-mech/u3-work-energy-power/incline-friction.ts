import { defineQuestion } from '../../../engine/define';
import { cosD, fmtA, fmtW, sinD, tanD } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-incline-friction',
  version: 1,
  title: 'Up and back down a rough incline: work done by friction',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.4', 'apcm.3.2', 'apcm.3.1'],
  uses: ['apcm.2'],
  style: 'AP',
  paper: 'AP-style problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    m: { min: 0.5, max: 5, step: 0.5, base: 2, dp: 1 },
    theta: { min: 20, max: 45, step: 5, base: 30 },
    mu: { min: 0.1, max: 0.4, step: 0.05, base: 0.2, dp: 2 },
    v0: { min: 3, max: 10, step: 0.5, base: 6, dp: 1 },
  },
  // The block slides back down (tan θ is well above the coefficient of friction).
  constraint: (p) => tanD(p.theta) >= p.mu + 0.15,

  compute: (p, c) => {
    const s = sinD(p.theta);
    const co = cosD(p.theta);
    const d = p.v0 ** 2 / (2 * c.g * (s + p.mu * co));
    const f = p.mu * p.m * c.g * co;
    const Wf = -c.carry(f) * c.carry(d, 'd');
    // Down the incline: gravity does mg d sinθ, friction does −f d.
    const vb = Math.sqrt(2 * c.g * c.carry(d, 'd') * (s - p.mu * co));
    // Or for the whole round trip: K = K0 − 2fd (gravity does no net work).
    const vb2 = p.v0 ** 2 - 4 * p.mu * c.g * co * c.carry(d, 'd', 3);
    c.assume(vb2 > 0);
    const vb__roundTrip = Math.sqrt(vb2);
    return { d, f, Wf, vb, vb__roundTrip };
  },

  stem: ({ d }) =>
    `A block of mass ${Q(d.m, 'kg')} is given a push so that it slides up a straight incline at an angle of ${Q(d.theta, 'deg')} above the horizontal. It starts up the incline with speed ${Q(d.v0, 'm/s')}. The coefficient of kinetic friction between the block and the incline is ${d.mu}. The block stops momentarily and then slides back down to its starting point.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Calculate the distance the block travels up the incline before it stops.',
      response: { kind: 'numeric', answer: 'd', symbol: 'd', unit: 'm', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'On the way up, both gravity and friction do negative work. The normal force is $mg\\cos\\theta$, so friction is $f_k = \\mu_k mg\\cos\\theta$. Work–energy theorem from the start to the stop:',
          math: tex`-\tfrac{1}{2}mv_0^2 = -mgd\sin\theta - \mu_k mgd\cos\theta \quad\Rightarrow\quad d = \frac{v_0^2}{2g(\sin\theta + \mu_k\cos\theta)}`,
        },
        { math: tex`d = \frac{${d.v0}^2}{2 \times ${g} \times (\sin ${d.theta}^{\circ} + ${d.mu}\cos ${d.theta}^{\circ})} = ${fmtA(r.d)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [
        { mark: 'Friction force $\\mu_k mg\\cos\\theta$' },
        { mark: 'Energy (or work–energy) equation with gravity and friction' },
        { mark: tex`$d = ${fmtA(r.d)}\ ${u('m')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Calculate the work done on the block by friction as the block slides up the incline.',
      response: { kind: 'numeric', answer: 'Wf', symbol: 'W_f', unit: 'J' },
      solution: ({ d, r, g }) => [
        {
          text: 'Friction acts down the incline while the block moves up, so the work is negative. This is the mechanical energy dissipated as internal energy on the way up.',
          math: tex`f_k = \mu_k mg\cos\theta = ${d.mu} \times ${d.m} \times ${g} \times \cos ${d.theta}^{\circ} = ${fmtW(r.f)}\ ${u('N')}`,
        },
        { math: tex`W_f = -f_k d = -${fmtW(r.f)} \times ${fmtW(r.d)} = ${fmtA(r.Wf)}\ ${u('J')}` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W_f = ${fmtA(r.Wf)}\ ${u('J')}$ (negative)` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the speed of the block when it returns to its starting point.',
      response: { kind: 'numeric', answer: 'vb', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'On the way down, gravity does positive work $mgd\\sin\\theta$ and friction (now acting up the incline) does $-\\mu_k mgd\\cos\\theta$. The mass cancels.',
          math: tex`\tfrac{1}{2}mv^2 = mgd(\sin\theta - \mu_k\cos\theta) \quad\Rightarrow\quad v = \sqrt{2 \times ${g} \times ${fmtW(r.d)} \times (\sin ${d.theta}^{\circ} - ${d.mu}\cos ${d.theta}^{\circ})} = ${fmtA(r.vb)}\ ${u('m/s')}`,
        },
        {
          text: 'Check with the whole round trip: gravity does no net work, and friction removes $f_k d$ each way, so $\\tfrac{1}{2}mv^2 = \\tfrac{1}{2}mv_0^2 - 2f_k d$.',
          math: tex`v = \sqrt{v_0^2 - 4\mu_k g d\cos\theta} = ${fmtA(r.vb__roundTrip)}\ ${u('m/s')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Work done by gravity and by friction on the way down (or for the round trip)' }, { mark: tex`$v = ${fmtA(r.vb)}\ ${u('m/s')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'How does the time the block takes to slide up the incline compare with the time it takes to slide back down?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The time down is longer, because the acceleration down the incline is smaller than the deceleration up it.', correct: true },
          { text: 'The time up is longer, because the block starts with its greatest speed.' },
          { text: 'The times are equal, because the block covers the same distance each way.' },
          { text: 'It depends on the mass of the block.' },
        ],
      },
      solution: () => [
        {
          text: 'Going up, gravity and friction both act down the incline: $a_{\\text{up}} = g(\\sin\\theta + \\mu_k\\cos\\theta)$. Coming down, friction acts up the incline: $a_{\\text{down}} = g(\\sin\\theta - \\mu_k\\cos\\theta)$, which is smaller. For the same distance from rest (or to rest), $d = \\tfrac{1}{2}at^2$, so the smaller acceleration means a longer time. The mass cancels from both accelerations.',
        },
      ],
      markscheme: () => [{ note: 'Smaller acceleration on the way down, so a longer time.' }],
    },
  ],
  extensions: [
    {
      prompt: () =>
        'Derive expressions for the time taken to slide up the incline and the time taken to slide back down, in terms of $d$, $g$, $\\theta$ and $\\mu_k$. Use them to justify your answer to (d).',
      marks: 3,
      lines: 8,
      markscheme: () => [
        { mark: '$a_{\\text{up}} = g(\\sin\\theta + \\mu_k\\cos\\theta)$ and $a_{\\text{down}} = g(\\sin\\theta - \\mu_k\\cos\\theta)$' },
        { mark: 'From $d = \\tfrac{1}{2}at^2$ (the trip up, reversed in time, starts from rest): $t_{\\text{up}} = \\sqrt{2d/a_{\\text{up}}}$ and $t_{\\text{down}} = \\sqrt{2d/a_{\\text{down}}}$' },
        { mark: 'Since $a_{\\text{down}} < a_{\\text{up}}$, $t_{\\text{down}} > t_{\\text{up}}$' },
      ],
    },
  ],
});
