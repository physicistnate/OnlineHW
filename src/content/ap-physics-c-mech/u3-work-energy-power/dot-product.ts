import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** A vector in unit-vector notation, e.g. (4 î − 6 ĵ) N. */
function vec(x: number, y: number, unit: string): string {
  const yPart = y < 0 ? `- ${-y}` : `+ ${y}`;
  return `(${x}\\,\\hat{\\imath} ${yPart}\\,\\hat{\\jmath})\\ ${u(unit)}`;
}

const acosD = (x: number) => (Math.acos(x) * 180) / Math.PI;
/** Direction of a vector, in degrees anticlockwise from +x (−180 to 180). */
const dirD = (x: number, y: number) => (Math.atan2(y, x) * 180) / Math.PI;

export default defineQuestion({
  id: 'apcm-u3-dot-product',
  version: 1,
  title: 'Work as a dot product: which part of a force does work',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.2'],
  style: 'AP',
  paper: 'AP-style problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Fx: { min: 2, max: 15, step: 1, base: 8 },
    Fy: { min: -8, max: 12, step: 1, base: 6 },
    dx: { min: 2, max: 10, step: 1, base: 5 },
    dy: { min: -6, max: 8, step: 1, base: -2 },
  },
  // No zero components, |dx| ≠ |dy| (so the answer choices in (d) are all different), and an
  // angle between the vectors that is clearly not 0°, 90° or 180°.
  constraint: (p) => {
    if (p.Fy === 0 || p.dy === 0 || Math.abs(p.dx) === Math.abs(p.dy)) return false;
    const cos = (p.Fx * p.dx + p.Fy * p.dy) / (Math.hypot(p.Fx, p.Fy) * Math.hypot(p.dx, p.dy));
    return Math.abs(cos) >= 0.15 && Math.abs(cos) <= 0.85;
  },

  compute: (p, c) => {
    const W = p.Fx * p.dx + p.Fy * p.dy;
    const Fmag = Math.hypot(p.Fx, p.Fy);
    const dmag = Math.hypot(p.dx, p.dy);
    // Students keep 3 s.f. of the magnitudes: the angle is sensitive to them.
    const cos = W / (c.carry(Fmag, undefined, 3) * c.carry(dmag, undefined, 3));
    const theta = acosD(cos);
    // Or from the direction of each vector.
    let diff = Math.abs(dirD(p.Fx, p.Fy) - dirD(p.dx, p.dy));
    if (diff > 180) diff = 360 - diff;
    const theta__directions = diff;
    const Fpar = W / c.carry(dmag, undefined, 3);
    return { W, Fmag, dmag, cos, theta, theta__directions, Fpar };
  },

  stem: ({ p }) =>
    `An object moves in a straight line. Its displacement is $\\vec{d} = ${vec(p.dx, p.dy, 'm')}$. One of the forces on the object is the constant force $\\vec{F} = ${vec(p.Fx, p.Fy, 'N')}$.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the work done on the object by $\\vec{F}$.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J' },
      solution: ({ p, r }) => [
        {
          text: 'For a constant force, $W = \\vec{F}\\cdot\\vec{d} = F_x d_x + F_y d_y$.',
          math: tex`W = (${p.Fx})(${p.dx}) + (${p.Fy})(${p.dy}) = ${p.Fx * p.dx} ${p.Fy * p.dy < 0 ? '-' : '+'} ${Math.abs(p.Fy * p.dy)} = ${fmtA(r.W)}\ ${u('J')}`,
        },
        {
          text:
            r.W > 0
              ? 'The work is positive: the force has a component in the direction of the displacement, so it transfers energy to the object.'
              : 'The work is negative: the force has a component opposite to the displacement, so it takes energy from the object.',
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the angle between $\\vec{F}$ and $\\vec{d}$.',
      response: { kind: 'numeric', answer: 'theta', symbol: '\\theta', unit: 'deg', positive: true },
      solution: ({ r }) => [
        {
          text: 'The dot product is also $\\vec{F}\\cdot\\vec{d} = Fd\\cos\\theta$. Find the magnitudes first.',
          math: tex`F = \sqrt{F_x^2 + F_y^2} = ${fmtW(r.Fmag)}\ ${u('N')}, \qquad d = \sqrt{d_x^2 + d_y^2} = ${fmtW(r.dmag)}\ ${u('m')}`,
        },
        {
          math: tex`\cos\theta = \frac{W}{Fd} = \frac{${fmtW(r.W)}}{${fmtW(r.Fmag)} \times ${fmtW(r.dmag)}} = ${fmtW(r.cos)} \quad\Rightarrow\quad \theta = ${fmtA(r.theta)}^{\circ}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$\\cos\\theta = \\vec{F}\\cdot\\vec{d}/(Fd)$' }, { mark: tex`$\theta = ${fmtA(r.theta)}^{\circ}$` }, { note: 'Allow credit for an answer consistent with (a). Finding the direction of each vector and subtracting is also correct.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the component of $\\vec{F}$ in the direction of the displacement.',
      response: { kind: 'numeric', answer: 'Fpar', symbol: 'F_{\\parallel}', unit: 'N' },
      solution: ({ r }) => [
        {
          text: 'Only the component of the force along the displacement does work: $W = F_{\\parallel}d$, so $F_{\\parallel} = W/d$ (equal to $F\\cos\\theta$). The perpendicular component does no work at all. This is the physical meaning of the dot product.',
          math: tex`F_{\parallel} = \frac{W}{d} = \frac{${fmtW(r.W)}}{${fmtW(r.dmag)}} = ${fmtA(r.Fpar)}\ ${u('N')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$F_{\parallel} = ${fmtA(r.Fpar)}\ ${u('N')}$` }, { note: 'The sign shows whether the component is along or against the displacement.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which of the following forces would do no work on the object during the same displacement?',
      response: {
        kind: 'mcq',
        options: ({ p }) => [
          { text: `$${vec(-p.dy, p.dx, 'N')}$`, correct: true },
          { text: `$${vec(p.dx, p.dy, 'N')}$` },
          { text: `$${vec(p.dy, p.dx, 'N')}$` },
          { text: `$${vec(p.dx, -p.dy, 'N')}$` },
        ],
      },
      solution: ({ p }) => [
        {
          text: `A force does no work when it is perpendicular to the displacement, so its dot product with $\\vec{d}$ is zero. For $${vec(-p.dy, p.dx, 'N')}$: $(${-p.dy})(${p.dx}) + (${p.dx})(${p.dy}) = 0$. Each of the other forces has a nonzero dot product with $\\vec{d}$.`,
        },
      ],
      markscheme: () => [{ note: 'Zero work: the force is perpendicular to the displacement (dot product zero).' }],
    },
  ],
});
