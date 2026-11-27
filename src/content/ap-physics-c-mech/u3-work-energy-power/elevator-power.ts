import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW, fmtWA } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'apcm-u3-elevator-power',
  version: 1,
  title: 'Power of an elevator motor with a counterweight',
  courses: ['ap-physics-c-mech'],
  topic: 'apcm.3',
  standards: ['apcm.3.5', 'apcm.3.4'],
  uses: ['apcm.2'],
  style: 'AP',
  paper: 'AP-style problem set',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    M: { min: 900, max: 1400, step: 50, base: 1100 },
    load: { min: 200, max: 1000, step: 50, base: 600 },
    Mc: { min: 1200, max: 1900, step: 50, base: 1500 },
    f: { min: 200, max: 1000, step: 100, base: 500 },
    v: { min: 1, max: 4, step: 0.5, base: 2.5, dp: 1 },
    H: { min: 15, max: 60, step: 3, base: 30 },
  },
  // The counterweight is heavier than the empty car, and the loaded car is clearly heavier than the counterweight.
  constraint: (p) => p.Mc >= p.M + 200 && p.M + p.load - p.Mc >= 150,

  compute: (p, c) => {
    const net = p.M + p.load - p.Mc;
    const F = net * c.g + p.f;
    const P = (c.carry(F) * p.v) / 1000; // kW
    const E = (c.carry(F) * p.H) / 1000; // kJ
    // Or power × time.
    const E__power = c.carry(P, 'P') * (p.H / p.v);
    const Fno = (p.M + p.load) * c.g + p.f;
    const Pno = (c.carry(Fno) * p.v) / 1000; // kW
    return { net, F, P, E, E__power, Fno, Pno, total: p.M + p.load };
  },

  stem: ({ d }) =>
    `An elevator car of mass ${Q(d.M, 'kg')} carries passengers with a total mass of ${Q(d.load, 'kg')}. The cable from the car passes over a pulley driven by an electric motor at the top of the building and down to a counterweight of mass ${Q(d.Mc, 'kg')}. The car rises at a constant speed of ${Q(d.v, 'm/s')}. Friction in the system is equivalent to a constant force of ${Q(d.f, 'N')} opposing the motion. The cables have negligible mass.`,

  parts: [
    {
      label: '(a)',
      marks: 3,
      prompt: () => 'Calculate the power output of the motor while the car rises at constant speed.',
      response: { kind: 'numeric', answer: 'P', symbol: 'P', unit: 'kW', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'At constant speed there is no acceleration. The cable on the car side pulls with a tension equal to the weight of the loaded car, and the cable on the counterweight side with a tension equal to the counterweight’s weight. The motor must supply the difference, plus the friction force.',
          math: tex`M + m - M_c = ${d.M} + ${d.load} - ${d.Mc} = ${r.net}\ ${u('kg')}`,
        },
        { math: tex`F = (M + m - M_c)g + f = ${r.net} \times ${g} + ${d.f} = ${fmtWA(r.F)}\ ${u('N')}` },
        {
          text: 'The power is $P = Fv$.',
          math: tex`P = ${fmtW(r.F)} \times ${d.v} = ${fmtW(r.P * 1000)}\ ${u('W')} = ${fmtA(r.P)}\ ${u('kW')}`,
        },
      ],
      markscheme: ({ r }) => [
        { mark: 'Net weight to be lifted is $(M + m - M_c)g$' },
        { mark: 'Friction force added' },
        { mark: tex`$P = Fv = ${fmtA(r.P)}\ ${u('kW')}$` },
      ],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: ({ d }) => `Calculate the energy delivered by the motor as the car rises through a height of ${Q(d.H, 'm')}.`,
      response: { kind: 'numeric', answer: 'E', symbol: 'E', unit: 'kJ', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'The work done by the motor is its force × the distance (or the power × the time, $t = H/v$).',
          math: tex`E = FH = ${fmtW(r.F)} \times ${d.H} = ${fmtW(r.E * 1000)}\ ${u('J')} = ${fmtA(r.E)}\ ${u('kJ')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: tex`$E = ${fmtA(r.E)}\ ${u('kJ')}$` }, { note: 'Allow credit for an answer consistent with (a).' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Calculate the power the motor would need to raise the same loaded car at the same speed if there were no counterweight. Assume the friction force is the same.',
      response: { kind: 'numeric', answer: 'Pno', symbol: 'P', unit: 'kW', positive: true },
      solution: ({ d, r, g }) => [
        {
          text: 'Now the motor must supply the whole weight of the loaded car, plus friction.',
          math: tex`F = (M + m)g + f = ${r.total} \times ${g} + ${d.f} = ${fmtWA(r.Fno)}\ ${u('N')}`,
        },
        { math: tex`P = Fv = ${fmtW(r.Fno)} \times ${d.v} = ${fmtW(r.Pno * 1000)}\ ${u('W')} = ${fmtA(r.Pno)}\ ${u('kW')}` },
        { text: `That is about ${Math.round(r.Pno / r.P)} times the power needed with the counterweight.` },
      ],
      markscheme: ({ r }) => [{ mark: tex`$P = ${fmtA(r.Pno)}\ ${u('kW')}$` }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'As the car rises, its gravitational potential energy increases. Where does most of this energy come from?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'The decrease in the gravitational potential energy of the counterweight as it moves down', correct: true },
          { text: 'The electrical energy supplied to the motor' },
          { text: 'The kinetic energy of the car' },
          { text: 'The work done by friction in the system' },
        ],
      },
      solution: () => [
        {
          text: 'The counterweight moves down as the car moves up, through the same distance, so its gravitational potential energy decreases by $M_c gH$. The motor supplies only the difference $(M + m - M_c)gH$ plus the energy dissipated by friction. The kinetic energy is constant, and friction removes mechanical energy rather than supplying it.',
        },
      ],
      markscheme: () => [{ note: 'The counterweight’s loss of gravitational potential energy.' }],
    },
  ],
});
