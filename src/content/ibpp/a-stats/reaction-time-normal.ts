import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';
import { normalCdf } from '../helpers';

/** The distance to the hazard (m), set so that a typical driver only just stops (or only just fails to). */
const hazard = (p: { mu: number; sigma: number; v: number; a: number; z: number }) => Math.round(p.v * (p.mu + p.z * p.sigma) + p.v ** 2 / (2 * p.a));

export default defineQuestion({
  id: 'ibpp-a4-reaction-time-normal',
  version: 1,
  title: 'Reaction times, stopping distances and the normal distribution',
  courses: ['ibpp-physics-math'],
  topic: 'ibp.A.1',
  standards: ['ibp.A.1.4'],
  math: { topic: 'ibm.4', standards: ['ibm.4.9', 'ibm.4.5'] },
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation'],
  difficulty: 2,

  params: {
    mu: { choices: [0.7, 0.75, 0.8], base: 0.75 },
    sigma: { choices: [0.1, 0.12, 0.15], base: 0.12 },
    v: { choices: [20, 25, 30], base: 25 },
    a: { choices: [6, 7, 7.5], base: 7 },
    z: { choices: [-1, -0.5, 0.5, 1], base: 0.5 },
  },

  compute: (p, c) => {
    const brake = p.v ** 2 / (2 * p.a);
    const sMean = p.v * p.mu + brake;
    const pSlow = 1 - normalCdf(1, p.mu, p.sigma);
    const D = hazard(p as never);
    // The braking distance is subtracted from a similar distance: students keep it in full.
    const tmax = (D - brake) / p.v;
    const pStop = normalCdf(c.carry(tmax, 'tmax', 3), p.mu, p.sigma);
    const nFail = 500 * (1 - c.carry(pStop, 'pStop', 3));
    return { brake, sMean, pSlow, D, tmax, pStop, nFail };
  },

  stem: ({ d, p }) =>
    `The reaction times $T$ of drivers are modelled by a normal distribution with mean ${Q(Number(d.mu).toFixed(2), 's')} and standard deviation ${Q(Number(d.sigma).toFixed(2), 's')}. A car travels at ${Q(d.v, 'm s-1')}. When its driver reacts, the brakes give a constant deceleration of ${Q(Number(d.a).toFixed(1), 'm s-2')}. A child steps into the road ${Q(hazard(p as never), 'm')} in front of the car.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the stopping distance for a driver whose reaction time is the mean reaction time.',
      response: { kind: 'numeric', answer: 'sMean', symbol: 's', unit: 'm', positive: true },
      solution: ({ d, r }) => [
        { text: 'During the reaction time the car moves at constant speed; then it decelerates to rest ($v^2 = u^2 + 2as$).', math: tex`s = ${d.v} \times ${Number(d.mu).toFixed(2)} + \frac{${d.v}^2}{2 \times ${Number(d.a).toFixed(1)}} = ${fmtA(r.sMean)}\ ${u('m')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Thinking distance $vt$ and braking distance $v^2/2a$' }, { mark: tex`$s = ${fmtA(r.sMean)}\ ${u('m')}$` }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'Find the probability that a randomly chosen driver has a reaction time of more than 1.00 s.',
      response: { kind: 'numeric', answer: 'pSlow', symbol: 'P(T > 1.00)', positive: true },
      solution: ({ d, r }) => [{ text: `Using the normal distribution on a calculator: $P(T > 1.00) = ${fmtA(r.pSlow)}$ (with mean ${Number(d.mu).toFixed(2)} and standard deviation ${Number(d.sigma).toFixed(2)}).` }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.pSlow)}$` }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Find the longest reaction time that still lets the car stop before it reaches the child.',
      response: { kind: 'numeric', answer: 'tmax', symbol: 't', unit: 's', positive: true },
      solution: ({ d, r }) => [
        { math: tex`\text{braking distance} = \frac{${d.v}^2}{2 \times ${Number(d.a).toFixed(1)}} = ${fmtW(r.brake)}\ ${u('m')}` },
        { text: 'The rest of the distance can be used up while the driver reacts:', math: tex`t = \frac{${r.D} - ${fmtW(r.brake)}}{${d.v}} = ${fmtA(r.tmax)}\ ${u('s')}` },
      ],
      markscheme: ({ r }) => [{ mark: 'Thinking distance = hazard distance − braking distance' }, { mark: tex`$t = ${fmtA(r.tmax)}\ ${u('s')}$` }],
    },
    {
      label: '(d)',
      marks: 2,
      prompt: () => 'Find the probability that a randomly chosen driver stops the car before it reaches the child.',
      response: { kind: 'numeric', answer: 'pStop', symbol: 'P', positive: true },
      solution: ({ d, r }) => [{ text: `The driver stops in time if $T$ is less than the time found in (c): $P(T < ${fmtW(r.tmax)}) = ${fmtA(r.pStop)}$ (normal distribution, mean ${Number(d.mu).toFixed(2)}, standard deviation ${Number(d.sigma).toFixed(2)}).` }],
      markscheme: ({ r }) => [{ mark: '$P(T < t)$ with $t$ from (c)' }, { mark: tex`$${fmtA(r.pStop)}$` }, { note: 'Allow ECF from (c).' }],
    },
    {
      label: '(e)',
      marks: 1,
      prompt: () => 'Of 500 drivers in this situation, how many would be expected not to stop in time?',
      response: { kind: 'numeric', answer: 'nFail', symbol: '\\text{number}', positive: true },
      solution: ({ r }) => [{ math: tex`500 \times (1 - ${fmtW(r.pStop)}) = ${fmtA(r.nFail)}` }, { text: 'A small change in speed changes this a lot, because the braking distance depends on $v^2$.' }],
      markscheme: ({ r }) => [{ mark: tex`$${fmtA(r.nFail)}$` }, { note: 'Allow ECF from (d).' }],
    },
  ],
});
