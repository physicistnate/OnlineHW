import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-loop-the-loop',
  version: 1,
  title: 'Energy and forces in a vertical loop',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.4', 'apcm.3.1'],
  uses: ['apcm.2'],
  style: 'AP',
  paper: 'Free-response style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    m: { min: 0.1, max: 2, step: 0.1, base: 0.5, dp: 1 },
    R: { min: 0.2, max: 1, step: 0.05, base: 0.4, dp: 2 },
    h: { min: 0.6, max: 5, step: 0.1, base: 1.4, dp: 1 },
  },
  // Released well above the minimum height (so the block presses on the track at the top).
  constraint: (p) => p.h >= 3 * p.R && p.h <= 6 * p.R,

  compute: (p, c) => {
    const vt = Math.sqrt(2 * c.g * (p.h - 2 * p.R));
    // mv²/R − mg: the two terms are subtracted, so students keep 3 s.f. of v.
    const Fc = (p.m * c.carry(vt, 'vt', 3) ** 2) / p.R;
    const mg = p.m * c.g;
    const N = c.carry(Fc, undefined, 3) - mg;
    // Or substitute v² = 2g(h − 2R) directly.
    const N__energy = p.m * c.g * ((2 * (p.h - 2 * p.R)) / p.R - 1);
    const hmin = 2.5 * p.R;
    return { vt, Fc, mg, N, N__energy, hmin };
  },

  stem: ({ d }) =>
    `A small block of mass ${Q(d.m, 'kg')} is released from rest at a height of ${Q(d.h, 'm')} above the bottom of a frictionless track. The track then goes around a vertical circular loop of radius ${Q(d.R, 'm')}.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the speed of the block at the top of the loop.',
      response: { kind: 'numeric', answer: 'vt', symbol: 'v', unit: 'm/s', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Mechanical energy is conserved (no friction; the normal force is perpendicular to the motion and does no work). The top of the loop is $2R$ above the bottom.',
          math: tex`mgh = mg(2R) + \tfrac{1}{2}mv^2 \quad\Rightarrow\quad v = \sqrt{2g(h - 2R)}`,
        },
        { math: tex`v = \sqrt{2 \times ${g} \times (${d.h} - 2 \times ${d.R})} = ${fmtA(r.vt)}\ ${u('m/s')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Conservation of energy with a height of $2R$ at the top' }, { mark: tex`$v = ${fmtA(r.vt)}\ ${u('m/s')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the magnitude of the normal force exerted by the track on the block at the top of the loop.',
      response: { kind: 'numeric', answer: 'N', symbol: 'F_N', unit: 'N', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'At the top, both the normal force and the weight point down, toward the center of the loop. Together they provide the centripetal force.',
          math: tex`F_N + mg = \frac{mv^2}{R} \quad\Rightarrow\quad F_N = \frac{mv^2}{R} - mg`,
        },
        { math: tex`\frac{mv^2}{R} = \frac{${d.m} \times ${fmtW(r.vt)}^2}{${d.R}} = ${fmtW(r.Fc)}\ ${u('N')}, \qquad mg = ${d.m} \times ${g} = ${fmtW(r.mg)}\ ${u('N')}` },
        { math: tex`F_N = ${fmtW(r.Fc)} - ${fmtW(r.mg)} = ${fmtA(r.N)}\ ${u('N')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Newton’s second law toward the center, with both forces downward' }, { mark: tex`$F_N = ${fmtA(r.N)}\ ${u('N')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the minimum release height for which the block stays in contact with the track all the way around the loop.',
      response: { kind: 'numeric', answer: 'hmin', symbol: 'h_{\\min}', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'At the minimum height the normal force at the top is just zero, so gravity alone provides the centripetal force: $mg = mv^2/R$, so $v^2 = gR$.',
          math: tex`mgh = mg(2R) + \tfrac{1}{2}m(gR) \quad\Rightarrow\quad h = 2.5R = 2.5 \times ${d.R} = ${fmtA(r.hmin)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Normal force zero at the top, so $v^2 = gR$' }, { mark: tex`$h = 2.5R = ${fmtA(r.hmin)}\ ${u('m')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'How does the normal force on the block at the bottom of the loop compare with the normal force at the top?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'It is greater by $6mg$, whatever the release height.', correct: true },
          { text: 'It is greater by $2mg$, whatever the release height.' },
          { text: 'It is the same, because energy is conserved.' },
          { text: 'It is greater, by an amount that depends on the release height.' },
        ],
      },
      solution: () => [
        {
          text: 'At the bottom, $F_{N,\\text{bottom}} = mg + mv_b^2/R$; at the top, $F_{N,\\text{top}} = mv_t^2/R - mg$. Energy conservation gives $v_b^2 = v_t^2 + 4gR$. Subtracting: $F_{N,\\text{bottom}} - F_{N,\\text{top}} = 2mg + m(v_b^2 - v_t^2)/R = 2mg + 4mg = 6mg$, which does not depend on the release height.',
        },
      ],
      markscheme: () => [{ note: 'Difference = 6mg.' }],
    },
  ],
});
