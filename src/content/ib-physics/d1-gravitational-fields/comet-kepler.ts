import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { IB } from '../constants';

interface P {
  rp: number;
  ra: number;
}

/** Speed at perihelion (km/s, 3 s.f., as given in the question) for an orbit around the Sun. */
const vPeri = (p: P) => {
  const a = ((p.rp + p.ra) / 2) * IB.AU;
  const v = Math.sqrt(IB.G * IB.Msun * (2 / (p.rp * IB.AU) - 1 / a)) / 1e3;
  return Number(v.toPrecision(3));
};

export default defineQuestion({
  id: 'ibp-d1-comet-kepler',
  version: 1,
  title: 'A comet’s orbit and Kepler’s laws (extension: an elliptical orbit)',
  courses: ['ib-physics-sl'],
  topic: 'ibp.D.1',
  standards: ['ibp.D.1.1', 'ibp.D.1.5'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    rp: { choices: [0.4, 0.5, 0.6, 0.8, 1], base: 0.6 },
    ra: { choices: [5, 10, 18, 30, 35], base: 18 },
  },

  compute: (p) => {
    const vp = vPeri(p);
    const va = (vp * p.rp) / p.ra;
    const a = (p.rp + p.ra) / 2;
    const T = a ** 1.5;
    return { vp, va, a, T };
  },

  stem: ({ p, d }) =>
    `This question goes beyond the IB guide, which uses Kepler’s laws in calculations only for circular orbits. A comet moves in an elliptical orbit around the Sun. Its closest distance from the Sun (perihelion) is ${Q(d.rp, 'AU')} and its greatest distance (aphelion) is ${Q(d.ra, 'AU')}. At perihelion its speed is ${Q(vPeri(p).toPrecision(3), 'km s-1')}. The Earth’s orbit is a circle of radius 1 AU with a period of 1 year.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Use Kepler’s second law to calculate the speed of the comet at aphelion.',
      response: { kind: 'numeric', answer: 'va', symbol: 'v', unit: 'km s-1', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The line from the Sun to the comet sweeps out equal areas in equal times. In a short time $\\Delta t$ at perihelion or aphelion, the area swept is a thin triangle of area $\\tfrac{1}{2}rv\\,\\Delta t$, so $rv$ is the same at both points:',
          math: tex`v_a = \frac{r_p v_p}{r_a} = \frac{${d.rp} \times ${r.vp.toPrecision(3)}}{${d.ra}} = ${fmtA(r.va)}\ ${u('km s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$r_pv_p = r_av_a$ (equal areas)' }, { mark: tex`$v_a = ${fmtA(r.va)}\ ${u('km s-1')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Why does the speed of the comet change around its orbit, when a planet in a circular orbit keeps a constant speed?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'In an ellipse the gravitational force has a component along the comet’s velocity (except at perihelion and aphelion), so it does work on the comet; in a circle the force is always perpendicular to the velocity.', correct: true },
          { text: 'The gravitational force on the comet is constant, but its mass changes as it loses material.' },
          { text: 'The Sun’s gravitational field is stronger in some directions than in others.' },
          { text: 'The comet speeds up when it moves away from the Sun, because the force on it decreases.' },
        ],
      },
      solution: () => [{ text: 'Moving towards the Sun, the force has a component along the motion and does positive work: the comet speeds up. Moving away, it does negative work. The comet is fastest at perihelion and slowest at aphelion.' }],
      markscheme: () => [{ note: 'Force not perpendicular to velocity: work done changes the kinetic energy.' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Kepler’s third law also applies to elliptical orbits, with the radius replaced by the semi-major axis (half the longest diameter of the ellipse). Calculate the period of the comet, in years.',
      response: { kind: 'numeric', answer: 'T', symbol: 'T', unit: 'years', positive: true },
      solution: ({ d, r }) => [
        { math: tex`a = \frac{${d.rp} + ${d.ra}}{2} = ${fmtW(r.a)}\ ${u('AU')}` },
        { text: 'For orbits around the Sun, $\\dfrac{T^2}{a^3}$ is the same as for the Earth: 1 year² per AU³.', math: tex`T = a^{3/2} = ${fmtW(r.a)}^{3/2} = ${fmtA(r.T)}\ \text{years}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Semi-major axis $= (r_p + r_a)/2$' }, { mark: tex`$T = ${fmtA(r.T)}$ years` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Where in its orbit does the comet spend most of its time?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Far from the Sun, near aphelion, where it moves slowly.', correct: true },
          { text: 'Close to the Sun, near perihelion, where the gravitational force is strongest.' },
          { text: 'Equally at all points of its orbit.' },
          { text: 'Halfway between perihelion and aphelion.' },
        ],
      },
      solution: () => [
        { text: 'The line from the Sun to the comet sweeps out area at a constant rate (equal areas in equal times). Far from the Sun, $r$ is large, so each degree of the orbit sweeps out a large area and takes a long time; the comet also moves slowly there. So most of the period is spent far from the Sun: comets are visible near the Sun for only a short part of each orbit.' },
      ],
      markscheme: () => [{ note: 'Near aphelion (slow, far away).' }],
    },
  ],
});
