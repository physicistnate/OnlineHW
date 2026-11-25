import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { tex, unitTex as u } from '../../../engine/units';

/** A vector in unit-vector notation, e.g. (3 î − 2 ĵ + 5 k̂) N. Zero components are left out. */
function vec3(x: number, y: number, z: number, unit: string): string {
  const parts: [number, string][] = [
    [x, '\\hat{\\imath}'],
    [y, '\\hat{\\jmath}'],
    [z, '\\hat{k}'],
  ];
  const body = parts
    .filter(([v]) => v !== 0)
    .map(([v, hat], i) => (i === 0 ? `${v}\\,${hat}` : `${v < 0 ? '-' : '+'} ${Math.abs(v)}\\,${hat}`))
    .join(' ');
  return `(${body})\\ ${u(unit)}`;
}

const acosD = (x: number) => (Math.acos(x) * 180) / Math.PI;

export default defineQuestion({
  id: 'up1-t3-dot-product-3d',
  version: 1,
  title: 'Work in three dimensions: dot product and perpendicular component',
  courses: ['university-physics-1'],
  topic: 'up1.3',
  standards: ['up1.3.1'],
  style: 'General',
  paper: 'Problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    Fx: { min: -8, max: 10, step: 1, base: 6 },
    Fy: { min: -8, max: 10, step: 1, base: -3 },
    Fz: { min: -8, max: 10, step: 1, base: 4 },
    dx: { min: -6, max: 6, step: 1, base: 2 },
    dy: { min: -6, max: 6, step: 1, base: 5 },
    dz: { min: -6, max: 6, step: 1, base: 3 },
  },
  // No zero components (so the answer choices in (d) differ), and an angle clearly not 0°, 90° or 180°.
  constraint: (p) => {
    if ([p.Fx, p.Fy, p.Fz, p.dx, p.dy, p.dz].includes(0)) return false;
    const cos = (p.Fx * p.dx + p.Fy * p.dy + p.Fz * p.dz) / (Math.hypot(p.Fx, p.Fy, p.Fz) * Math.hypot(p.dx, p.dy, p.dz));
    return Math.abs(cos) >= 0.15 && Math.abs(cos) <= 0.85;
  },

  compute: (p, c) => {
    const W = p.Fx * p.dx + p.Fy * p.dy + p.Fz * p.dz;
    const Fmag = Math.hypot(p.Fx, p.Fy, p.Fz);
    const dmag = Math.hypot(p.dx, p.dy, p.dz);
    // Students keep 3 s.f. of the magnitudes: the angle and the perpendicular part are sensitive to them.
    const cos = W / (c.carry(Fmag, undefined, 3) * c.carry(dmag, undefined, 3));
    const theta = acosD(cos);
    const Fpar = W / c.carry(dmag, undefined, 3);
    const Fperp = Math.sqrt(c.carry(Fmag, undefined, 3) ** 2 - c.carry(Fpar, undefined, 3) ** 2);
    // Or |F × d| / |d|.
    const cx = p.Fy * p.dz - p.Fz * p.dy;
    const cy = p.Fz * p.dx - p.Fx * p.dz;
    const cz = p.Fx * p.dy - p.Fy * p.dx;
    const Fperp__cross = Math.hypot(cx, cy, cz) / c.carry(dmag, undefined, 3);
    return { W, Fmag, dmag, cos, theta, Fpar, Fperp, Fperp__cross };
  },

  stem: ({ p }) =>
    `A particle moves in a straight line with displacement $\\Delta\\vec{r} = ${vec3(p.dx, p.dy, p.dz, 'm')}$ while a constant force $\\vec{F} = ${vec3(p.Fx, p.Fy, p.Fz, 'N')}$ acts on it.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Find the work done on the particle by $\\vec{F}$.',
      response: { kind: 'numeric', answer: 'W', symbol: 'W', unit: 'J' },
      solution: ({ p, r }) => [
        {
          text: 'For a constant force, $W = \\vec{F}\\cdot\\Delta\\vec{r} = F_x\\Delta x + F_y\\Delta y + F_z\\Delta z$.',
          math: tex`W = (${p.Fx})(${p.dx}) + (${p.Fy})(${p.dy}) + (${p.Fz})(${p.dz}) = ${fmtA(r.W)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$W = ${fmtA(r.W)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Find the angle between $\\vec{F}$ and $\\Delta\\vec{r}$.',
      response: { kind: 'numeric', answer: 'theta', symbol: '\\theta', unit: 'deg', positive: true },
      solution: ({ r }) => [
        {
          math: tex`|\vec{F}| = ${fmtW(r.Fmag)}\ ${u('N')}, \qquad |\Delta\vec{r}| = ${fmtW(r.dmag)}\ ${u('m')}`,
        },
        {
          text: 'From $\\vec{F}\\cdot\\Delta\\vec{r} = |\\vec{F}||\\Delta\\vec{r}|\\cos\\theta$:',
          math: tex`\cos\theta = \frac{${fmtW(r.W)}}{${fmtW(r.Fmag)} \times ${fmtW(r.dmag)}} = ${fmtW(r.cos)} \quad\Rightarrow\quad \theta = ${fmtA(r.theta)}^{\circ}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Both magnitudes and $\\cos\\theta = W/(Fd)$' }, { mark: tex`$\theta = ${fmtA(r.theta)}^{\circ}$` }, { note: 'Follow through from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the magnitude of the component of $\\vec{F}$ perpendicular to $\\Delta\\vec{r}$.',
      response: { kind: 'numeric', answer: 'Fperp', symbol: 'F_{\\perp}', unit: 'N', positive: true },
      solution: ({ r }) => [
        {
          text: 'The component along the displacement is $F_{\\parallel} = W/|\\Delta\\vec{r}|$; the rest of the force is perpendicular to the motion and does no work.',
          math: tex`F_{\parallel} = \frac{${fmtW(r.W)}}{${fmtW(r.dmag)}} = ${fmtW(r.Fpar)}\ ${u('N')}, \qquad F_{\perp} = \sqrt{F^2 - F_{\parallel}^2} = \sqrt{${fmtW(r.Fmag)}^2 - (${fmtW(r.Fpar)})^2} = ${fmtA(r.Fperp)}\ ${u('N')}`,
        },
        { text: 'Equivalently, $F_{\\perp} = |\\vec{F}\\times\\Delta\\vec{r}|/|\\Delta\\vec{r}|$.' },
      ],
      markscheme: ({ r }) => [{ mark: '$F_{\\parallel} = W/|\\Delta\\vec{r}|$, or the cross product' }, { mark: tex`$F_{\perp} = ${fmtA(r.Fperp)}\ ${u('N')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Which of these forces would do no work during the same displacement?',
      response: {
        kind: 'mcq',
        options: ({ p }) => [
          { text: `$${vec3(p.dy, -p.dx, 0, 'N')}$`, correct: true },
          { text: `$${vec3(p.dx, p.dy, p.dz, 'N')}$` },
          { text: `$${vec3(p.dy, p.dx, 0, 'N')}$` },
          { text: `$${vec3(0, p.dz, p.dy, 'N')}$` },
        ],
      },
      solution: ({ p }) => [
        {
          text: `A force does no work when its dot product with the displacement is zero (it is perpendicular to the motion). For $${vec3(p.dy, -p.dx, 0, 'N')}$: $(${p.dy})(${p.dx}) + (${-p.dx})(${p.dy}) + (0)(${p.dz}) = 0$. The others give nonzero dot products.`,
        },
      ],
      markscheme: () => [{ note: 'Perpendicular force: zero dot product, zero work.' }],
    },
  ],
});
