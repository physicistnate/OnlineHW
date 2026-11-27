import { defineQuestion } from '../../../engine/define';
import { fmtA, snapZero } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

const walking = (d: number, t: number) => d / t >= 0.8 && d / t <= 2.2;

export default defineQuestion({
  id: 'ibp-a1-walk-displacement',
  version: 1,
  title: 'Distance and displacement on a walk',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.2', 'ibp.A.1.3'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 1,

  params: {
    d1: { min: 300, max: 900, step: 10, base: 600 },
    d2: { min: 100, max: 600, step: 10, base: 250 },
    t1: { min: 200, max: 600, step: 10, base: 400 },
    t2: { min: 100, max: 500, step: 10, base: 200 },
    t3: { min: 100, max: 400, step: 10, base: 250 },
  },
  // Walking speeds (0.8 to 2.2 m s⁻¹) on every stretch, and the student ends up well east of the start.
  constraint: (p) => p.d1 - p.d2 >= 100 && walking(p.d1, p.t1) && walking(p.d2, p.t2) && walking(p.d1 - p.d2, p.t3),

  compute: (p, c) => {
    const dist = p.d1 + p.d2;
    const disp = p.d1 - p.d2;
    const vavg = c.carry(disp, 'disp') / (p.t1 + p.t2);
    // Walking straight back covers a distance equal to the size of the displacement.
    const back = c.carry(disp, 'disp');
    const totalDist = c.carry(dist, 'dist') + back;
    const T = p.t1 + p.t2 + p.t3;
    const speedAll = totalDist / T;
    const dispAll = snapZero(disp - back, disp, back);
    const velAll = dispAll / T;
    return { dist, disp, vavg, back, totalDist, T, speedAll, dispAll, velAll };
  },

  stem: ({ d }) =>
    `A student walks ${Q(d.d1, 'm')} due east along a straight path in a time of ${Q(d.t1, 's')}. The student then turns around and walks ${Q(d.d2, 'm')} due west along the same path in a time of ${Q(d.t2, 's')}.`,

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'Calculate the total distance walked by the student.',
      response: { kind: 'numeric', answer: 'dist', symbol: 'd', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Distance is a scalar: it is the total length of path covered, whatever the direction. Add the two stretches.',
          math: tex`d = ${d.d1} + ${d.d2} = ${fmtA(r.dist)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$d = ${fmtA(r.dist)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Determine the displacement of the student from the starting point. Take east as positive.',
      response: { kind: 'numeric', answer: 'disp', symbol: 's', unit: 'm' },
      solution: ({ d, r }) => [
        {
          text: 'Displacement is a vector: it depends only on where the student ends up compared with the start. With east positive, the walk west counts as negative.',
          math: tex`s = (+${d.d1}) + (-${d.d2}) = +${fmtA(r.disp)}\ ${u('m')}`,
        },
        { text: `The student finishes ${Q(fmtA(r.disp), 'm')} east of the starting point.` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$s = ${fmtA(r.disp)}\ ${u('m')}$ (east)` }, { note: 'Accept an answer that gives the size and states "east".' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the average velocity of the student for this walk.',
      response: { kind: 'numeric', answer: 'vavg', symbol: '\\bar{v}', unit: 'm s-1' },
      solution: ({ d, r }) => [
        {
          text: 'Average velocity is displacement divided by the total time taken (not distance divided by time, which would be the average speed).',
          math: tex`\bar{v} = \frac{s}{t} = \frac{${fmtA(r.disp)}}{${d.t1} + ${d.t2}} = ${fmtA(r.vavg)}\ ${u('m s-1')}`,
        },
        { text: 'It is positive, so the average velocity is directed east.' },
      ],
      markscheme: ({ r }) => [
        { mark: 'Use of displacement ÷ total time' },
        { mark: tex`$\bar{v} = ${fmtA(r.vavg)}\ ${u('m s-1')}$ (east)` },
        { note: 'Allow ECF from (b).' },
      ],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: ({ d }) =>
        `The student then walks directly back to the starting point, which takes a further ${Q(d.t3, 's')}. Calculate the average speed of the student for the whole journey.`,
      response: { kind: 'numeric', answer: 'speedAll', symbol: '\\text{average speed}', unit: 'm s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Walking straight back to the start covers a distance equal to the size of the displacement from (b). Add it to the distance from (a).',
          math: tex`d_{\text{total}} = ${fmtA(r.dist)} + ${fmtA(r.back)} = ${fmtA(r.totalDist)}\ ${u('m')}`,
        },
        {
          text: 'Add up the times for the whole journey.',
          math: tex`t_{\text{total}} = ${d.t1} + ${d.t2} + ${d.t3} = ${fmtA(r.T)}\ ${u('s')}`,
        },
        {
          text: 'Average speed is total distance divided by total time.',
          math: tex`\text{average speed} = \frac{${fmtA(r.totalDist)}}{${fmtA(r.T)}} = ${fmtA(r.speedAll)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: tex`Total distance $= ${fmtA(r.totalDist)}\ ${u('m')}$ and total time $= ${fmtA(r.T)}\ ${u('s')}$` },
        { mark: tex`Average speed $= ${fmtA(r.speedAll)}\ ${u('m s-1')}$` },
        { note: 'Allow ECF from (a) and (b).' },
      ],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'State the average velocity of the student for the whole journey.',
      response: { kind: 'numeric', answer: 'velAll', symbol: '\\bar{v}', unit: 'm s-1' },
      solution: ({ r }) => [
        {
          text: 'The student finishes where they started, so the displacement for the whole journey is zero. The average velocity is therefore zero, however long the journey took.',
          math: tex`\bar{v} = \frac{0}{${fmtA(r.T)}} = ${fmtA(r.velAll)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: () => [
        { mark: 'Zero' },
        { note: 'Average speed and average velocity differ: speed uses the distance travelled, velocity uses the displacement.' },
      ],
    },
  ],
});
