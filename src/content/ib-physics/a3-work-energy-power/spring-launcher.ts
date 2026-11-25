import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

export default defineQuestion({
  id: 'ibp-a3-spring-launcher',
  version: 1,
  title: 'A spring launches a ball upwards',
  courses: ['ib-physics-sl'],
  topic: 'ibp.A.3',
  standards: ['ibp.A.3.3', 'ibp.A.3.4'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 2,

  params: {
    k: { min: 200, max: 800, step: 20, base: 400 },
    x: { min: 2, max: 8, step: 0.5, base: 5, dp: 1 },
    m: { min: 10, max: 60, step: 5, base: 25 },
  },
  // A launch speed of 2 to 15 m/s.
  constraint: (p) => {
    const v = Math.sqrt((p.k * (p.x / 100) ** 2) / (p.m / 1000));
    return v >= 2 && v <= 15;
  },

  compute: (p, c) => {
    const xm = p.x / 100;
    const mkg = p.m / 1000;
    const Ee = 0.5 * p.k * xm ** 2;
    const v = Math.sqrt((2 * c.carry(Ee, 'Ee')) / mkg);
    // Method 1: all the elastic energy becomes gravitational potential energy at the top.
    const h = c.carry(Ee, 'Ee') / (mkg * c.g);
    // Method 2: from the launch speed in (b).
    const h__speed = c.carry(v, 'v') ** 2 / (2 * c.g);
    return { xm, mkg, Ee, v, h, h__speed };
  },

  stem: ({ d }) =>
    `A toy launcher contains a spring of spring constant ${Q(d.k, 'N m-1')}. The spring is compressed by ${Q(d.x, 'cm')} and then released, launching a ball of mass ${Q(d.m, 'g')} vertically upwards. Air resistance and the mass of the spring are negligible. Ignore the small change in height while the spring extends.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'Calculate the elastic potential energy stored in the compressed spring.',
      response: { kind: 'numeric', answer: 'Ee', symbol: 'E_H', unit: 'J', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Use the elastic potential energy of a spring, $E_H = \\tfrac{1}{2}k\\Delta x^2$, with the compression in metres.',
          math: tex`E_H = \tfrac{1}{2} \times ${d.k} \times ${fmtW(r.xm)}^2 = ${fmtA(r.Ee)}\ ${u('J')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Use of $E_H = \\tfrac{1}{2}k\\Delta x^2$ with $\\Delta x$ in metres' }, { mark: tex`$E_H = ${fmtA(r.Ee)}\ ${u('J')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => 'Calculate the speed of the ball as it leaves the launcher.',
      response: { kind: 'numeric', answer: 'v', symbol: 'v', unit: 'm s-1', positive: true },
      solution: ({ r }) => [
        {
          text: 'All the elastic potential energy becomes kinetic energy of the ball. Convert the mass to kilograms.',
          math: tex`\tfrac{1}{2}mv^2 = E_H \quad\Rightarrow\quad v = \sqrt{\frac{2E_H}{m}} = \sqrt{\frac{2 \times ${fmtW(r.Ee)}}{${fmtW(r.mkg)}}} = ${fmtA(r.v)}\ ${u('m s-1')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Elastic potential energy = kinetic energy' }, { mark: tex`$v = ${fmtA(r.v)}\ ${u('m s-1')}$` }, { note: 'Allow ECF from (a).' }],
    },
    {
      label: '(c)',
      marks: 2,
      prompt: () => 'Calculate the maximum height reached by the ball above its launch position.',
      response: { kind: 'numeric', answer: 'h', symbol: 'h', unit: 'm', positive: true },
      solution: ({ r, g }) => [
        {
          text: 'At the top the ball is momentarily at rest, so all the elastic potential energy has become gravitational potential energy.',
          math: tex`mgh = E_H \quad\Rightarrow\quad h = \frac{E_H}{mg} = \frac{${fmtW(r.Ee)}}{${fmtW(r.mkg)} \times ${g}} = ${fmtA(r.h)}\ ${u('m')}`,
        },
        {
          text: 'Check with the speed from (b): the kinetic energy at launch becomes gravitational potential energy.',
          math: tex`h = \frac{v^2}{2g} = \frac{${fmtW(r.v)}^2}{2 \times ${g}} = ${fmtA(r.h__speed)}\ ${u('m')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: '$E_H = mgh$ or $\\tfrac{1}{2}mv^2 = mgh$' }, { mark: tex`$h = ${fmtA(r.h)}\ ${u('m')}$` }, { note: 'Allow ECF from (a) or (b).' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'The spring is compressed by twice the distance. By what factor does the maximum height of the ball increase?',
      response: {
        kind: 'mcq',
        options: () => [{ text: '$4$', correct: true }, { text: '$2$' }, { text: '$\\sqrt{2}$' }, { text: '$8$' }],
      },
      solution: () => [
        {
          text: 'The elastic potential energy is proportional to the square of the compression: doubling $\\Delta x$ multiplies $E_H = \\tfrac{1}{2}k\\Delta x^2$ by 4. The maximum height is proportional to that energy ($h = E_H/mg$), so it is 4 times greater.',
        },
      ],
      markscheme: () => [{ note: 'E ∝ Δx², and h ∝ E.' }],
    },
  ],
});
