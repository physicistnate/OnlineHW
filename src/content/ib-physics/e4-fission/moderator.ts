import { defineQuestion } from '../../../engine/define';
import { fmtA, fmtW } from '../../../engine/numbers';
import { Q, tex, unitTex as u } from '../../../engine/units';

/** Moderator nuclei: name and nucleon number (mass in units of the neutron mass). */
const MODERATORS: Record<string, { name: string; A: number }> = {
  D: { name: 'deuterium (in heavy water)', A: 2 },
  Be: { name: 'beryllium-9', A: 9 },
  C: { name: 'carbon-12 (in graphite)', A: 12 },
  O: { name: 'oxygen-16', A: 16 },
};
/** Thermal neutron energy, eV. */
const THERMAL = 0.025;

export default defineQuestion({
  id: 'ibp-e4-moderator',
  version: 1,
  title: 'Slowing neutrons down in a moderator',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.4',
  standards: ['ibp.E.4.3', 'ibp.E.4.2'],
  uses: ['ibp.A.2.8'],
  style: 'IB',
  paper: 'Paper 2 style',
  types: ['calculation', 'multiple-choice'],
  difficulty: 3,

  params: {
    mod: { choices: Object.keys(MODERATORS), base: 'C' },
    E0: { min: 1, max: 2, step: 0.1, base: 2, dp: 1 },
  },

  compute: (p, c) => {
    const A = MODERATORS[p.mod as string].A;
    const ratio = (A - 1) / (A + 1);
    const f = ratio ** 2;
    const E1 = p.E0 * f; // MeV
    const n = Math.log((THERMAL * 1e-6) / p.E0) / Math.log(c.carry(f, 'f', 3));
    return { A, ratio, f, E1, n };
  },

  stem: ({ d, p }) =>
    `Fission neutrons start with a kinetic energy of about ${Q(d.E0, 'MeV')}. In a reactor they are slowed down by collisions with the nuclei of a moderator, here ${MODERATORS[p.mod as string].name}. Treat each collision as a head-on elastic collision with a nucleus at rest whose mass is $A$ times the neutron’s mass.`,

  parts: [
    {
      label: '(a)',
      marks: 2,
      prompt: () => 'In a head-on elastic collision, the neutron rebounds with $\\dfrac{A - 1}{A + 1}$ of its speed. Calculate the kinetic energy of the neutron after one collision, in MeV.',
      response: { kind: 'numeric', answer: 'E1', symbol: 'E_k', unit: 'MeV', positive: true },
      solution: ({ d, r }) => [
        {
          text: 'Kinetic energy is proportional to the square of the speed, so each collision multiplies the energy by $\\left(\\dfrac{A - 1}{A + 1}\\right)^2$. (This follows from conservation of momentum and of kinetic energy in the collision.)',
          math: tex`\left(\frac{${r.A} - 1}{${r.A} + 1}\right)^2 = ${fmtW(r.f)}, \qquad E_k = ${d.E0} \times ${fmtW(r.f)} = ${fmtA(r.E1)}\ ${u('MeV')}`,
        },
      ],
      markscheme: ({ r }) => [{ mark: 'Energy fraction $((A-1)/(A+1))^2$' }, { mark: tex`$E_k = ${fmtA(r.E1)}\ ${u('MeV')}$` }],
    },
    {
      label: '(b)',
      marks: 2,
      prompt: () => `Estimate the number of such collisions needed to slow the neutron to a thermal energy of 0.025 eV.`,
      response: { kind: 'numeric', answer: 'n', symbol: 'n', positive: true, tolerance: { rel: 0.03 } },
      solution: ({ d, r }) => [
        {
          text: 'After $n$ collisions the energy is $E_0 f^n$. Solve $E_0 f^n = 0.025$ eV using logarithms.',
          math: tex`n = \frac{\ln(0.025 \times 10^{-6}/${d.E0})}{\ln ${fmtW(r.f)}} = ${fmtA(r.n)}`,
        },
        { text: 'So roughly this many collisions, in practice more, because most collisions are not head-on.' },
      ],
      markscheme: ({ r }) => [{ mark: '$E_0 f^n = 0.025$ eV, with consistent units' }, { mark: tex`$n \approx ${fmtA(r.n)}$` }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Why are materials with light nuclei good moderators?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'A neutron loses a large fraction of its energy in each collision with a nucleus of similar mass.', correct: true },
          { text: 'Light nuclei absorb neutrons easily.' },
          { text: 'Light nuclei repel neutrons electrically.' },
          { text: 'Neutrons bounce off light nuclei with more speed than they had.' },
        ],
      },
      solution: () => [
        {
          text: 'A neutron hitting a heavy nucleus bounces off with almost the same speed (like a ball off a wall). With a nucleus of similar mass, much of its kinetic energy is passed on, so fewer collisions are needed. A good moderator must also absorb few neutrons.',
        },
      ],
      markscheme: () => [{ note: 'Similar masses: large energy transfer per collision.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why must the neutrons be slowed down?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Slow (thermal) neutrons are much more likely to be absorbed by uranium-235 and cause fission, keeping the chain reaction going.', correct: true },
          { text: 'Fast neutrons would make the reactor explode.' },
          { text: 'Slow neutrons release more energy in each fission.' },
          { text: 'Fast neutrons cannot leave the fuel rods.' },
        ],
      },
      solution: () => [
        { text: 'Uranium-235 captures slow neutrons far more readily than fast ones. Without a moderator, too few neutrons would cause further fissions for a chain reaction in natural or slightly enriched uranium.' },
      ],
      markscheme: () => [{ note: 'Thermal neutrons are far more likely to cause fission.' }],
    },
  ],
});
