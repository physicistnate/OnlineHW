import { defineQuestion } from '../../../engine/define';

export default defineQuestion({
  id: 'ibp-e5-stellar-evolution',
  version: 1,
  title: 'How a star’s mass decides its life',
  courses: ['ib-physics-sl'],
  topic: 'ibp.E.5',
  standards: ['ibp.E.5.3', 'ibp.E.5.4'],
  style: 'IB',
  paper: 'Paper 1A style',
  types: ['multiple-choice'],
  difficulty: 2,

  params: {},

  compute: () => ({}),

  stem: () => 'This question is about how stars of different masses evolve after the main sequence.',

  parts: [
    {
      label: '(a)',
      marks: 1,
      prompt: () => 'A star with the same mass as the Sun runs out of hydrogen in its core. Which sequence of stages follows?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Red giant → planetary nebula → white dwarf', correct: true },
          { text: 'Red supergiant → supernova → neutron star' },
          { text: 'White dwarf → red giant → planetary nebula' },
          { text: 'Red giant → supernova → black hole' },
        ],
      },
      solution: () => [{ text: 'The core contracts and heats while the outer layers expand (red giant). The outer layers are later thrown off as a planetary nebula, leaving the hot core as a white dwarf.' }],
      markscheme: () => [{ note: 'Red giant, planetary nebula, white dwarf.' }],
    },
    {
      label: '(b)',
      marks: 1,
      prompt: () => 'A star of about 20 solar masses reaches the end of its life. Which sequence of stages follows?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Red supergiant → supernova → neutron star or black hole', correct: true },
          { text: 'Red giant → planetary nebula → white dwarf' },
          { text: 'Red supergiant → planetary nebula → white dwarf' },
          { text: 'White dwarf → supernova → red supergiant' },
        ],
      },
      solution: () => [{ text: 'Massive stars fuse heavier elements up to iron in a red supergiant. The core then collapses and the star explodes as a supernova, leaving a neutron star or, for the most massive cores, a black hole.' }],
      markscheme: () => [{ note: 'Red supergiant, supernova, neutron star or black hole.' }],
    },
    {
      label: '(c)',
      marks: 1,
      prompt: () => 'Why does fusion in the core of a massive star stop producing energy once the core is iron?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Iron has the greatest binding energy per nucleon, so fusing it would absorb energy rather than release it.', correct: true },
          { text: 'Iron nuclei are too small to fuse.' },
          { text: 'The core becomes too cold for any fusion.' },
          { text: 'Iron is radioactive and decays before it can fuse.' },
        ],
      },
      solution: () => [{ text: 'Fusion releases energy only while the products are more tightly bound than the reactants. Binding energy per nucleon peaks near iron-56 (and nickel-62), so beyond iron, fusion needs an energy input.' }],
      markscheme: () => [{ note: 'Peak of the binding energy per nucleon curve.' }],
    },
    {
      label: '(d)',
      marks: 1,
      prompt: () => 'Why does a more massive main-sequence star have a shorter life on the main sequence than a less massive one?',
      response: {
        kind: 'mcq',
        options: () => [
          { text: 'Its luminosity is much greater, so it uses up its hydrogen much faster, even though it has more of it.', correct: true },
          { text: 'It has less hydrogen in its core.' },
          { text: 'Its gravity is weaker, so it expands sooner.' },
          { text: 'It is cooler, so fusion happens more slowly.' },
        ],
      },
      solution: () => [{ text: 'A more massive star has a hotter, denser core, so fusion is much faster. Its luminosity rises far more steeply than its mass, so its fuel lasts a much shorter time: millions of years rather than billions.' }],
      markscheme: () => [{ note: 'Much greater luminosity: fuel used faster.' }],
    },
  ],
});
