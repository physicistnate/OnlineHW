/**
 * Courses, topics and standards that questions are tagged with.
 *
 * IB Physics topics follow the IB DP Physics guide (first assessment 2025).
 * Standard labels paraphrase the guide's "understandings"; the numbering
 * (A.1.1, A.1.2, ...) is ours, because the guide lists them as bullet points.
 *
 * IB Physics HL includes every SL topic (so SL questions appear in HL too) plus
 * the HL-only topics. A question marked level: 'HL' appears only in HL.
 *
 * AP Physics C: Mechanics follows the College Board course and exam description
 * (units 1–7, effective fall 2024); topic numbers 3.1–3.5 are the CED's. University
 * Physics I is a typical first-semester calculus-based course, and University Modern
 * Physics a typical calculus-based modern physics course; their outlines and numbering
 * are ours. AP and University Physics I have questions for work, energy and power only
 * so far; University Modern Physics has questions for the ideas of IB Theme E.
 */
import type { Style } from '../config/site';

export interface Standard {
  id: string;
  code: string;
  text: string;
  /** Higher level only (hidden in SL courses). */
  hl?: boolean;
}

export interface Topic {
  id: string;
  code: string;
  name: string;
  standards: Standard[];
  /** Taught at HL only (additional higher level topic). */
  hlOnly?: boolean;
}

export interface Theme {
  code: string;
  name: string;
  topics: Topic[];
}

export interface Subject {
  key: 'physics' | 'math';
  name: string;
  themes: Theme[];
}

export interface Course {
  id: string;
  name: string;
  shortName: string;
  /** For grouping in course menus. */
  family: 'IB' | 'AP' | 'University' | 'IB++';
  /** The name in course menus, if shorter than `name` (e.g. "Physics/Math" under IB++). */
  menuName?: string;
  /**
   * IB++ courses combine two subjects. Each has its own topics, standards and level
   * (SL or HL), chosen separately in the bank and the builder.
   */
  subjects?: Subject[];
  style: Style;
  level?: 'SL' | 'HL';
  /** Courses whose questions also belong to this one (HL includes SL). */
  includes?: string[];
  /** Instructions printed at the top of PDFs. "{g}" is replaced by the course's value of g. */
  printInstructions: string[];
  themes: Theme[];
}

/** A topic whose id and standard ids start with `prefix` ('ibp.A.1', 'ibp.A.1.4'). */
function makeTopic(prefix: string, code: string, name: string, standards: [string, string, 'HL'?][] = [], hlOnly = false, idCode = code): Topic {
  return {
    id: `${prefix}.${idCode}`,
    code,
    name,
    standards: standards.map(([c, text, level]) => ({ id: `${prefix}.${c}`, code: c, text, ...(level === 'HL' ? { hl: true } : {}) })),
    ...(hlOnly ? { hlOnly } : {}),
  };
}

function topic(code: string, name: string, standards: [string, string, 'HL'?][] = [], hlOnly = false): Topic {
  return makeTopic('ibp', code, name, standards, hlOnly);
}

// Topics are shared objects, so SL and HL always list the same standards.
const T = {
  A1: topic('A.1', 'Kinematics', [
    ['A.1.1', 'Describing motion: position, displacement, velocity and acceleration'],
    ['A.1.2', 'Distance and displacement'],
    ['A.1.3', 'Instantaneous and average speed, velocity and acceleration'],
    ['A.1.4', 'Equations of motion for uniform acceleration'],
    ['A.1.5', 'Motion graphs: gradients and areas, uniform and non-uniform acceleration'],
    ['A.1.6', 'Projectile motion without fluid resistance (horizontal and vertical components)'],
    ['A.1.7', 'Qualitative effects of fluid resistance on projectiles; terminal speed'],
  ]),
  // The IB guide has no additional higher level content in A.2, except that HL
  // treats collisions and explosions in two dimensions (SL: one dimension).
  A2: topic('A.2', 'Forces and momentum', [
    ['A.2.1', 'Newton’s three laws of motion; forces as interactions between bodies'],
    ['A.2.2', 'Free-body diagrams, resultant force and translational equilibrium'],
    ['A.2.3', 'Contact forces: normal force, tension, and static and dynamic friction'],
    ['A.2.4', 'Elastic restoring force (Hooke’s law), viscous drag (Stokes’ law) and buoyancy'],
    ['A.2.5', 'Field forces: gravitational force (weight), electric and magnetic forces'],
    ['A.2.6', 'Linear momentum and its conservation in an isolated system'],
    ['A.2.7', 'Impulse and change of momentum; force–time graphs; F = Δp/Δt'],
    ['A.2.8', 'Collisions and explosions in one dimension; elastic and inelastic collisions; energy'],
    ['A.2.9', 'Circular motion: centripetal acceleration and force, angular velocity and period'],
    ['A.2.10', 'Collisions and explosions in two dimensions (HL)', 'HL'],
  ]),
  A3: topic('A.3', 'Work, energy and power', [
    ['A.3.1', 'Conservation of energy; energy transfers and Sankey diagrams'],
    ['A.3.2', 'Work done by a constant force, W = Fs cos θ, and the change in energy it causes'],
    ['A.3.3', 'Kinetic, gravitational potential and elastic potential energy'],
    ['A.3.4', 'Conservation of mechanical energy when there are no resistive forces'],
    ['A.3.5', 'Power as the rate of doing work or transferring energy, P = ΔW/Δt = Fv'],
    ['A.3.6', 'Efficiency'],
    ['A.3.7', 'Energy density of fuel sources'],
  ]),
  A4: topic('A.4', 'Rigid body mechanics', [], true),
  A5: topic('A.5', 'Galilean and special relativity', [], true),
  B1: topic('B.1', 'Thermal energy transfers', [
    ['B.1.1', 'The particulate model of solids, liquids and gases; density ρ = m/V'],
    ['B.1.2', 'Temperature in kelvin and degrees Celsius; the average kinetic energy of the particles is proportional to the absolute temperature'],
    ['B.1.3', 'Internal energy as the total kinetic and potential energy of the particles; thermal equilibrium'],
    ['B.1.4', 'Specific heat capacity, Q = mcΔT'],
    ['B.1.5', 'Changes of phase and specific latent heat of fusion and vaporization, Q = mL'],
    ['B.1.6', 'Conduction: the rate of thermal energy transfer, ΔQ/Δt = kAΔT/Δx'],
    ['B.1.7', 'Convection, qualitatively'],
    ['B.1.8', 'Black-body radiation and the Stefan–Boltzmann law, L = σAT⁴'],
    ['B.1.9', 'Apparent brightness, b = L/(4πd²)'],
    ['B.1.10', 'The emission spectrum of a black body and Wien’s displacement law, λmax T = 2.9 × 10⁻³ m K'],
  ]),
  B2: topic('B.2', 'Greenhouse effect', [
    ['B.2.1', 'Conservation of energy in the Earth–atmosphere system; the solar constant S'],
    ['B.2.2', 'Emissivity, e = power emitted/(σAT⁴), and albedo, the fraction of incident power scattered or reflected; how the Earth’s albedo varies'],
    ['B.2.3', 'The mean intensity absorbed by the Earth, (1 − albedo)S/4'],
    ['B.2.4', 'Energy balance and the Earth’s equilibrium temperature, (1 − albedo)S/4 = eσT⁴'],
    ['B.2.5', 'Greenhouse gases absorb and re-emit infrared radiation (molecular vibrations); the greenhouse effect and the enhanced greenhouse effect'],
  ]),
  B3: topic('B.3', 'Gas laws', [
    ['B.3.1', 'Pressure, p = F/A'],
    ['B.3.2', 'Amount of substance, n = N/N_A, and molar mass'],
    ['B.3.3', 'The empirical gas laws and the ideal gas law, pV = nRT = Nk_BT'],
    ['B.3.4', 'The kinetic model of an ideal gas and its assumptions'],
    ['B.3.5', 'Pressure from molecular motion, p = ⅓ρv̄², with v̄² the mean square speed'],
    ['B.3.6', 'The average kinetic energy of the molecules, Ē_k = (3/2)k_BT = (3/2)RT/N_A'],
    ['B.3.7', 'The internal energy of an ideal monatomic gas, U = (3/2)Nk_BT = (3/2)nRT'],
    ['B.3.8', 'Real gases: when the ideal gas model is a good approximation (low pressure, moderate temperature, low density)'],
  ]),
  B4: topic(
    'B.4',
    'Thermodynamics',
    [
      ['B.4.1', 'The first law of thermodynamics, Q = ΔU + W, and its sign convention'],
      ['B.4.2', 'Work done by or on a gas: W = pΔV at constant pressure, and the area under a p–V graph'],
      ['B.4.3', 'The change in internal energy of a monatomic ideal gas, ΔU = (3/2)nRΔT'],
      ['B.4.4', 'Entropy, ΔS = ΔQ/T and S = k_B ln Ω, and the second law of thermodynamics'],
      ['B.4.5', 'Isovolumetric, isobaric, isothermal and adiabatic changes; pV^(5/3) = constant for an adiabatic change of a monatomic ideal gas'],
      ['B.4.6', 'Cyclic processes and heat engines; efficiency η = useful work/thermal energy input'],
      ['B.4.7', 'The Carnot cycle and the Carnot efficiency, η = 1 − T_c/T_h'],
    ],
    true,
  ),
  B5: topic('B.5', 'Current and circuits', [
    ['B.5.1', 'Cells as sources of emf; primary and secondary cells; charge and discharge'],
    ['B.5.2', 'Electric current, I = Δq/Δt'],
    ['B.5.3', 'Potential difference, V = W/q'],
    ['B.5.4', 'Resistance, R = V/I; Ohm’s law; I–V characteristics of ohmic and non-ohmic conductors'],
    ['B.5.5', 'Resistivity, ρ = RA/L'],
    ['B.5.6', 'Electrical power, P = IV = I²R = V²/R'],
    ['B.5.7', 'Resistors in series and in parallel; circuit diagrams with ideal ammeters and voltmeters'],
    ['B.5.8', 'Potential dividers, including light-dependent resistors and thermistors'],
    ['B.5.9', 'Internal resistance: ε = I(R + r)'],
  ]),
  C1: topic('C.1', 'Simple harmonic motion'),
  C2: topic('C.2', 'Wave model'),
  C3: topic('C.3', 'Wave phenomena'),
  C4: topic('C.4', 'Standing waves and resonance'),
  C5: topic('C.5', 'Doppler effect'),
  D1: topic('D.1', 'Gravitational fields', [
    ['D.1.1', 'Kepler’s three laws of orbital motion'],
    ['D.1.2', 'Newton’s universal law of gravitation, F = Gm₁m₂/r², for point masses and spherical bodies'],
    ['D.1.3', 'Gravitational field strength g = F/m = GM/r², and the resultant field of more than one body'],
    ['D.1.4', 'Gravitational field lines'],
    ['D.1.5', 'Circular orbits: gravity provides the centripetal force; the orbital period and Kepler’s third law'],
    ['D.1.6', 'Gravitational potential energy Ep = −GMm/r and gravitational potential V = −GM/r (HL)', 'HL'],
    ['D.1.7', 'Field strength as the negative potential gradient, g = −ΔV/Δr; equipotential surfaces (HL)', 'HL'],
    ['D.1.8', 'Work done moving a mass between points, W = mΔV (HL)', 'HL'],
    ['D.1.9', 'Escape speed and orbital speed; the energy of an orbiting body (HL)', 'HL'],
    ['D.1.10', 'The effect of a small atmospheric drag force on the height and speed of an orbiting body (HL)', 'HL'],
  ]),
  D2: topic('D.2', 'Electric and magnetic fields', [
    ['D.2.1', 'Electric charge is conserved and quantized; Millikan’s experiment'],
    ['D.2.2', 'Charging by friction, by contact and by electrostatic induction'],
    ['D.2.3', 'Coulomb’s law, F = kq₁q₂/r² with k = 1/(4πε₀)'],
    ['D.2.4', 'Electric field strength E = F/q; field lines around point charges, spheres and plates'],
    ['D.2.5', 'The uniform field between parallel plates, E = V/d'],
    ['D.2.6', 'Magnetic field lines of magnets, straight wires and solenoids'],
    ['D.2.7', 'Electric potential energy Ep = kq₁q₂/r and electric potential V = kq/r (HL)', 'HL'],
    ['D.2.8', 'Field strength as the negative potential gradient, E = −ΔV/Δr; equipotential surfaces (HL)', 'HL'],
    ['D.2.9', 'Work done moving a charge between points, W = qΔV (HL)', 'HL'],
  ]),
  D3: topic('D.3', 'Motion in electromagnetic fields', [
    ['D.3.1', 'Motion of a charged particle in a uniform electric field'],
    ['D.3.2', 'Motion of a charged particle in a uniform magnetic field: F = qvB sin θ and circular paths'],
    ['D.3.3', 'Motion in perpendicular uniform electric and magnetic fields: the velocity selector, v = E/B'],
    ['D.3.4', 'The force on a current-carrying conductor in a magnetic field, F = BIL sin θ'],
    ['D.3.5', 'The force per unit length between parallel currents, F/L = μ₀I₁I₂/(2πr)'],
  ]),
  D4: topic(
    'D.4',
    'Induction',
    [
      ['D.4.1', 'Magnetic flux Φ = BA cos θ and flux linkage'],
      ['D.4.2', 'Faraday’s law, ε = −N ΔΦ/Δt, and the emf of a conductor moving through a field, ε = BvL'],
      ['D.4.3', 'Lenz’s law and the direction of induced currents'],
      ['D.4.4', 'Generators: the alternating emf of a coil rotating in a uniform field, and the effect of its speed of rotation'],
    ],
    true,
  ),
  // Theme E standards paraphrase the IB guide's understandings (numbering ours). E.2 is
  // an HL-only topic; E.1 and E.3 have HL-only understandings, marked 'HL'.
  E1: topic('E.1', 'Structure of the atom', [
    ['E.1.1', 'The Geiger–Marsden–Rutherford experiment and the discovery of the nucleus'],
    ['E.1.2', 'Nuclear notation: nucleon number A, proton number Z, isotopes'],
    ['E.1.3', 'Emission and absorption spectra as evidence for discrete atomic energy levels'],
    ['E.1.4', 'Photons emitted and absorbed in atomic transitions; E = hf for the energy difference'],
    ['E.1.5', 'Spectra as evidence of the chemical composition of gases and stars'],
    ['E.1.6', 'Nuclear radius R = R₀A^(1/3) and nuclear density (HL)', 'HL'],
    ['E.1.7', 'Distance of closest approach in head-on scattering; deviations from Rutherford scattering (HL)', 'HL'],
    ['E.1.8', 'The Bohr model of hydrogen: mvr = nh/2π and E = −13.6/n² eV (HL)', 'HL'],
  ]),
  E2: topic(
    'E.2',
    'Quantum physics',
    [
      ['E.2.1', 'The photoelectric effect as evidence for the particle nature of light; threshold frequency'],
      ['E.2.2', 'Einstein’s photoelectric equation E_max = hf − Φ and the work function'],
      ['E.2.3', 'Matter waves: diffraction of particles and the de Broglie wavelength λ = h/p'],
      ['E.2.4', 'Compton scattering: Δλ = (h/mₑc)(1 − cos θ) as evidence for photon momentum'],
    ],
    true,
  ),
  E3: topic('E.3', 'Radioactive decay', [
    ['E.3.1', 'Mass defect, nuclear binding energy and E = mc²'],
    ['E.3.2', 'Binding energy per nucleon and its variation with nucleon number'],
    ['E.3.3', 'The strong nuclear force; the random and spontaneous nature of decay'],
    ['E.3.4', 'Alpha, beta (β⁻ and β⁺) and gamma decay: decay equations, neutrinos and antineutrinos'],
    ['E.3.5', 'Penetration and ionizing ability of alpha, beta and gamma radiation'],
    ['E.3.6', 'Activity, count rate and half-life (whole numbers of half-lives); background radiation'],
    ['E.3.7', 'Nuclear stability and the neutron–proton ratio; alpha and gamma spectra and nuclear energy levels; the beta spectrum and the neutrino (HL)', 'HL'],
    ['E.3.8', 'The decay constant: N = N₀e^(−λt), A = λN, T½ = ln 2/λ; measuring half-lives (HL)', 'HL'],
  ]),
  E4: topic('E.4', 'Fission', [
    ['E.4.1', 'Energy released in spontaneous and neutron-induced fission'],
    ['E.4.2', 'Chain reactions and critical mass'],
    ['E.4.3', 'Nuclear power: control rods, moderator, heat exchanger and shielding'],
    ['E.4.4', 'Properties of the products of fission and their management'],
  ]),
  E5: topic('E.5', 'Fusion and stars', [
    ['E.5.1', 'Stellar stability: outward radiation pressure balances inward gravity'],
    ['E.5.2', 'Fusion as the energy source of stars; the conditions of density and temperature it needs'],
    ['E.5.3', 'The effect of stellar mass on the evolution of a star'],
    ['E.5.4', 'The Hertzsprung–Russell diagram: its main regions and the properties of their stars'],
    ['E.5.5', 'Stellar parallax: d (parsec) = 1/p (arc-second)'],
    ['E.5.6', 'Luminosity L = σ4πR²T⁴, apparent brightness b = L/4πd², Wien’s law and stellar radii'],
  ]),
};

const IB_PHYSICS_THEMES: Theme[] = [
  { code: 'A', name: 'Space, time and motion', topics: [T.A1, T.A2, T.A3, T.A4, T.A5] },
  { code: 'B', name: 'The particulate nature of matter', topics: [T.B1, T.B2, T.B3, T.B4, T.B5] },
  { code: 'C', name: 'Wave behaviour', topics: [T.C1, T.C2, T.C3, T.C4, T.C5] },
  { code: 'D', name: 'Fields', topics: [T.D1, T.D2, T.D3, T.D4] },
  { code: 'E', name: 'Nuclear and quantum physics', topics: [T.E1, T.E2, T.E3, T.E4, T.E5] },
];

const IB_PRINT_INSTRUCTIONS = [
  'Answer all questions in the spaces provided.',
  'Show your working. If a final answer is wrong, correct working can still earn marks.',
  'A calculator and the IB Physics data booklet may be used.',
  'Take $g = {g}\\ \\mathrm{m\\,s^{-2}}$.',
];

export const IB_PHYSICS_SL: Course = {
  id: 'ib-physics-sl',
  name: 'IB Physics SL',
  shortName: 'IB Phys SL',
  family: 'IB',
  style: 'IB',
  level: 'SL',
  printInstructions: IB_PRINT_INSTRUCTIONS,
  themes: IB_PHYSICS_THEMES.map((th) => ({
    ...th,
    topics: th.topics.filter((t) => !t.hlOnly).map((t) => ({ ...t, standards: t.standards.filter((s) => !s.hl) })),
  })),
};

export const IB_PHYSICS_HL: Course = {
  id: 'ib-physics-hl',
  name: 'IB Physics HL',
  shortName: 'IB Phys HL',
  family: 'IB',
  style: 'IB',
  level: 'HL',
  includes: ['ib-physics-sl'],
  printInstructions: IB_PRINT_INSTRUCTIONS,
  themes: IB_PHYSICS_THEMES,
};

// ---------- AP Physics C: Mechanics ----------

const AP_C_MECH_TOPICS = {
  U1: makeTopic('apcm', 'Unit 1', 'Kinematics', [], false, '1'),
  U2: makeTopic('apcm', 'Unit 2', 'Force and Translational Dynamics', [], false, '2'),
  U3: makeTopic(
    'apcm',
    'Unit 3',
    'Work, Energy, and Power',
    [
      ['3.1', 'Translational kinetic energy'],
      ['3.2', 'Work: constant forces (dot product) and variable forces (integral of F dx)'],
      ['3.3', 'Potential energy: springs, gravity, and F = −dU/dx'],
      ['3.4', 'Conservation of energy, including work done by nonconservative forces'],
      ['3.5', 'Power: average power and instantaneous power P = F · v'],
    ],
    false,
    '3',
  ),
  U4: makeTopic('apcm', 'Unit 4', 'Linear Momentum', [], false, '4'),
  U5: makeTopic('apcm', 'Unit 5', 'Torque and Rotational Dynamics', [], false, '5'),
  U6: makeTopic('apcm', 'Unit 6', 'Energy and Momentum of Rotating Systems', [], false, '6'),
  U7: makeTopic('apcm', 'Unit 7', 'Oscillations', [], false, '7'),
};

export const AP_PHYSICS_C_MECH: Course = {
  id: 'ap-physics-c-mech',
  name: 'AP Physics C: Mechanics',
  shortName: 'AP Phys C: Mech',
  family: 'AP',
  style: 'AP',
  printInstructions: [
    'Show your work for each part. Write equations before substituting numbers.',
    'A calculator and the AP Physics C equation sheet may be used.',
    'Use $g = {g}\\ \\mathrm{m\\,s^{-2}}$ (answers using $10\\ \\mathrm{m\\,s^{-2}}$ are also accepted online).',
  ],
  themes: [{ code: 'M', name: 'Mechanics', topics: Object.values(AP_C_MECH_TOPICS) }],
};

// ---------- University Physics I (calculus-based) ----------

const UNIVERSITY_1_TOPICS = {
  T1: makeTopic('up1', 'Topic 1', 'Motion in one and two dimensions', [], false, '1'),
  T2: makeTopic('up1', 'Topic 2', 'Newton’s laws and applications', [], false, '2'),
  T3: makeTopic(
    'up1',
    'Topic 3',
    'Work, energy and power',
    [
      ['3.1', 'Work done by a constant force as a dot product; when a force does no work'],
      ['3.2', 'Work done by a variable force: W = ∫F dx, including springs'],
      ['3.3', 'Kinetic energy and the work–energy theorem'],
      ['3.4', 'Conservative forces, potential energy, F = −dU/dx and energy diagrams'],
      ['3.5', 'Conservation of energy with nonconservative forces such as friction'],
      ['3.6', 'Power: P = dW/dt = F · v; energy use by homes and industry'],
    ],
    false,
    '3',
  ),
  T4: makeTopic('up1', 'Topic 4', 'Momentum and collisions', [], false, '4'),
  T5: makeTopic('up1', 'Topic 5', 'Rotation', [], false, '5'),
  T6: makeTopic('up1', 'Topic 6', 'Gravitation', [], false, '6'),
  T7: makeTopic('up1', 'Topic 7', 'Oscillations', [], false, '7'),
};

export const UNIVERSITY_PHYSICS_1: Course = {
  id: 'university-physics-1',
  name: 'University Physics I (calculus-based)',
  shortName: 'Univ Phys I',
  family: 'University',
  style: 'General',
  printInstructions: [
    'Show all working, including any integrals or derivatives.',
    'Calculators are allowed. Give answers to 3 significant figures unless stated otherwise.',
    'Take $g = {g}\\ \\mathrm{m\\,s^{-2}}$.',
  ],
  themes: [{ code: 'I', name: 'Mechanics', topics: Object.values(UNIVERSITY_1_TOPICS) }],
};

// ---------- University Modern Physics (calculus-based) ----------

const UNIVERSITY_MODERN_TOPICS = {
  T1: makeTopic('ump', 'Topic 1', 'Special relativity', [], false, '1'),
  T2: makeTopic(
    'ump',
    'Topic 2',
    'The particle nature of light',
    [
      ['2.1', 'The photoelectric effect: eV_s = hf − φ, work functions and Millikan’s measurement of h'],
      ['2.2', 'Compton scattering: photon momentum, Δλ = (h/mₑc)(1 − cos θ) and electron recoil'],
    ],
    false,
    '2',
  ),
  T3: makeTopic(
    'ump',
    'Topic 3',
    'Atomic structure',
    [
      ['3.1', 'Rutherford scattering: closest approach, impact parameter and scattering angle'],
      ['3.2', 'The Bohr model of hydrogen-like atoms: quantized angular momentum, radii, speeds and energy levels'],
      ['3.3', 'Line spectra: photon energies and wavelengths of transitions'],
    ],
    false,
    '3',
  ),
  T4: makeTopic(
    'ump',
    'Topic 4',
    'Matter waves and quantum mechanics',
    [
      ['4.1', 'De Broglie waves and standing matter waves'],
      ['4.2', 'The infinite square well: energy levels, normalized wave functions and probabilities'],
      ['4.3', 'Zero-point energy and the uncertainty principle'],
    ],
    false,
    '4',
  ),
  T5: makeTopic(
    'ump',
    'Topic 5',
    'Radioactive decay',
    [
      ['5.1', 'The decay law from dN/dt = −λN: activity, half-life and mean life'],
      ['5.2', 'Counting decays by integrating the activity, including over all time'],
      ['5.3', 'Decay chains: parent and daughter activities and transient equilibrium'],
    ],
    false,
    '5',
  ),
  T6: makeTopic(
    'ump',
    'Topic 6',
    'Nuclear reactions: fission and fusion',
    [
      ['6.1', 'Q-values from atomic masses; how the products share the kinetic energy'],
      ['6.2', 'Fission and nuclear reactors: fission rates, fuel use and mass–energy conversion'],
      ['6.3', 'Fusion: the Coulomb barrier, plasma temperatures and fusion reactions'],
    ],
    false,
    '6',
  ),
  T7: makeTopic(
    'ump',
    'Topic 7',
    'Stars and stellar energy',
    [
      ['7.1', 'Blackbody radiation from stars and planets: L = 4πR²σT⁴ and equilibrium temperatures'],
      ['7.2', 'The gravitational potential energy of a star and the Kelvin–Helmholtz timescale'],
      ['7.3', 'Nuclear fusion as the energy source of stars; nuclear timescales'],
    ],
    false,
    '7',
  ),
};

export const UNIVERSITY_MODERN_PHYSICS: Course = {
  id: 'university-modern-physics',
  name: 'University Modern Physics (calculus-based)',
  shortName: 'Modern Phys',
  family: 'University',
  style: 'General',
  printInstructions: [
    'Show all working, including any integrals or derivatives.',
    'Calculators are allowed. Give answers to 3 significant figures unless stated otherwise.',
    'Physical constants are given in each question.',
  ],
  themes: [{ code: 'M', name: 'Modern physics', topics: Object.values(UNIVERSITY_MODERN_TOPICS) }],
};

// ---------- IB Mathematics: analysis and approaches (used by IB++) ----------
// Standards paraphrase the IB Mathematics: analysis and approaches guide (first assessment
// 2021): SL content, then the additional higher level (AHL) content, marked 'HL'. Only
// Topics 4 and 5 have standards so far, the ones the first IB++ questions use.

function mathTopic(n: string, name: string, standards: [string, string, 'HL'?][] = []): Topic {
  return makeTopic('ibm', `Topic ${n}`, name, standards, false, n);
}

const MATH_TOPICS = {
  T1: mathTopic('1', 'Number and algebra'),
  T2: mathTopic('2', 'Functions'),
  T3: mathTopic('3', 'Geometry and trigonometry'),
  T4: mathTopic('4', 'Statistics and probability', [
    ['4.1', 'Populations, samples and sampling; discrete and continuous data; reliability of data'],
    ['4.2', 'Presenting data: frequency tables, histograms, cumulative frequency, box plots and outliers'],
    ['4.3', 'Mean, median, mode, quartiles, range, variance and standard deviation; effect of changing the data'],
    ['4.4', 'Bivariate data: scatter diagrams, Pearson’s correlation coefficient r, the regression line of y on x and predictions'],
    ['4.5', 'Probability: trials, outcomes, sample spaces, relative frequency and expected numbers of occurrences'],
    ['4.6', 'Combined, mutually exclusive, conditional and independent events; Venn and tree diagrams'],
    ['4.7', 'Discrete random variables, their probability distributions and expected values'],
    ['4.8', 'The binomial distribution, its mean and variance'],
    ['4.9', 'The normal distribution and normal probability calculations'],
    ['4.10', 'The regression line of x on y'],
    ['4.11', 'Conditional probability and independence: formal definitions and formulae'],
    ['4.12', 'Standardizing normal variables (z-values); inverse normal calculations with unknown mean or standard deviation'],
    ['4.13', 'Bayes’ theorem (AHL)', 'HL'],
    ['4.14', 'Variance of a discrete random variable; continuous random variables and probability density functions; their mean, median, mode and variance; linear transformations (AHL)', 'HL'],
  ]),
  T5: mathTopic('5', 'Calculus', [
    ['5.1', 'Limits; the derivative as a gradient function and as a rate of change'],
    ['5.2', 'Increasing and decreasing functions: the meaning of f′(x) > 0, f′(x) = 0 and f′(x) < 0'],
    ['5.3', 'Differentiating ax^n and sums of such terms'],
    ['5.4', 'Tangents and normals at a point, and their equations'],
    ['5.5', 'Integration as anti-differentiation of ax^n; definite integrals and areas under curves using technology'],
    ['5.6', 'Derivatives of x^n, sin x, cos x, e^x and ln x; the chain, product and quotient rules'],
    ['5.7', 'The second derivative; the graphs of f, f′ and f″'],
    ['5.8', 'Local maxima and minima, optimization, and points of inflexion'],
    ['5.9', 'Kinematics: displacement, velocity, acceleration and total distance travelled'],
    ['5.10', 'Indefinite integrals of x^n, sin x, cos x, 1/x and e^x and their linear composites; integration by substitution'],
    ['5.11', 'Definite integrals; areas under curves and between curves'],
    ['5.12', 'Continuity and differentiability; differentiation from first principles (AHL)', 'HL'],
    ['5.13', 'Limits using l’Hôpital’s rule or Maclaurin series (AHL)', 'HL'],
    ['5.14', 'Implicit differentiation; related rates of change; optimization (AHL)', 'HL'],
    ['5.15', 'Derivatives of tan x, sec x, a^x, log_a x and the inverse trigonometric functions; partial fractions (AHL)', 'HL'],
    ['5.16', 'Integration by substitution and by parts (AHL)', 'HL'],
    ['5.17', 'Areas bounded by curves and the y-axis; volumes of revolution (AHL)', 'HL'],
    ['5.18', 'First-order differential equations: Euler’s method, separating variables, integrating factors (AHL)', 'HL'],
    ['5.19', 'Maclaurin series and their use in approximations (AHL)', 'HL'],
  ]),
};

const MATH_THEMES: Theme[] = [{ code: 'Math', name: 'Mathematics: analysis and approaches', topics: Object.values(MATH_TOPICS) }];

// ---------- IB++: IB Physics problems that deliberately need IB Mathematics ----------

export const IBPP_PHYSICS_MATH: Course = {
  id: 'ibpp-physics-math',
  name: 'IB++ Physics/Math',
  menuName: 'Physics/Math',
  shortName: 'IB++ Phys/Math',
  family: 'IB++',
  style: 'IB',
  level: 'HL',
  printInstructions: [
    'Answer all questions in the spaces provided. Each question needs both physics and mathematics.',
    'Show your working, including any derivatives, integrals and statistics. If a final answer is wrong, correct working can still earn marks.',
    'A graphic display calculator, the IB Physics data booklet and the IB Mathematics formula booklet may be used.',
    'Take $g = {g}\\ \\mathrm{m\\,s^{-2}}$.',
  ],
  themes: [...IB_PHYSICS_THEMES, ...MATH_THEMES],
  subjects: [
    { key: 'physics', name: 'Physics', themes: IB_PHYSICS_THEMES },
    { key: 'math', name: 'Mathematics', themes: MATH_THEMES },
  ],
};

export const COURSES: Course[] = [IB_PHYSICS_SL, IB_PHYSICS_HL, AP_PHYSICS_C_MECH, UNIVERSITY_PHYSICS_1, UNIVERSITY_MODERN_PHYSICS, IBPP_PHYSICS_MATH];

/** The course a question belongs to, for labels: an HL-level IB question shows as IB Physics HL. */
export function courseOfQuestion(q: { courses: string[]; level?: 'SL' | 'HL' }): Course {
  if (q.level === 'HL' && q.courses.includes(IB_PHYSICS_SL.id)) return IB_PHYSICS_HL;
  return COURSES.find((c) => c.id === q.courses[0]) ?? IB_PHYSICS_SL;
}

/** Whether a course contains a question: HL contains every SL question, and SL leaves out HL-only ones. */
export function courseIncludes(course: Course, q: { courses: string[]; level?: 'SL' | 'HL' }): boolean {
  const ids = [course.id, ...(course.includes ?? [])];
  return q.courses.some((c) => ids.includes(c)) && !(course.level === 'SL' && q.level === 'HL');
}

/**
 * The course to name a question by in an assignment or paper made for `context`: an HL
 * worksheet names the SL questions it shares with SL as IB Physics HL. Questions from
 * other courses keep their own course.
 */
export function courseOfQuestionIn(q: { courses: string[]; level?: 'SL' | 'HL' }, context?: Course): Course {
  return context && courseIncludes(context, q) ? context : courseOfQuestion(q);
}

/** Instructions for a paper mixing IB, AP and university questions. */
const MIXED_PRINT_INSTRUCTIONS = [
  'Answer all questions in the spaces provided. Each question is labelled with its course.',
  'Show your working, including any integrals or derivatives. If a final answer is wrong, correct working can still earn marks.',
  'A calculator and the data booklet or equation sheet for each course may be used.',
  'Take $g = {g}\\ \\mathrm{m\\,s^{-2}}$ (9.81 is also accepted, and 10 for AP questions).',
];

/** The instructions printed on a paper with questions from these courses. */
export function printInstructionsFor(courses: Course[]): string[] {
  const unique = [...new Map(courses.map((c) => [c.id, c])).values()];
  if (unique.length === 0) return IB_PHYSICS_SL.printInstructions;
  // IB SL and HL share their instructions.
  if (unique.length === 1 || unique.every((c) => c.family === 'IB')) return unique[0].printInstructions;
  return MIXED_PRINT_INSTRUCTIONS;
}
export const DEFAULT_COURSE_ID = IB_PHYSICS_SL.id;

/** Courses grouped for menus: IB, AP, University. */
export const COURSE_GROUPS: { label: string; courses: Course[] }[] = [
  { label: 'IB', courses: COURSES.filter((c) => c.family === 'IB') },
  { label: 'AP', courses: COURSES.filter((c) => c.family === 'AP') },
  { label: 'University', courses: COURSES.filter((c) => c.family === 'University') },
  { label: 'IB++', courses: COURSES.filter((c) => c.family === 'IB++') },
];

export function allTopics(course: Course): Topic[] {
  return course.themes.flatMap((t) => t.topics);
}

/** Every topic with all of its standards (IB SL and HL, AP, university). */
export const ALL_TOPICS: Topic[] = [
  ...Object.values(T),
  ...Object.values(AP_C_MECH_TOPICS),
  ...Object.values(UNIVERSITY_1_TOPICS),
  ...Object.values(UNIVERSITY_MODERN_TOPICS),
  ...Object.values(MATH_TOPICS),
];

/** A topic with all of its standards, including HL-only ones. */
export function findTopic(topicId: string): Topic | undefined {
  return ALL_TOPICS.find((t) => t.id === topicId);
}

/** The topic a topic id or standard id ('ibp.A.3' or 'ibp.A.3.3') belongs to. */
export function topicOf(id: string): Topic | undefined {
  return findTopic(id) ?? ALL_TOPICS.find((t) => t.standards.some((s) => s.id === id));
}

/** A topic as a course sees it (SL courses leave out HL-only standards). */
export function courseTopic(course: Course, topicId: string): Topic | undefined {
  return allTopics(course).find((t) => t.id === topicId);
}

export function findStandard(standardId: string): Standard | undefined {
  for (const t of ALL_TOPICS) {
    const s = t.standards.find((x) => x.id === standardId);
    if (s) return s;
  }
  return undefined;
}

export function findCourse(courseId: string | null | undefined): Course | undefined {
  return COURSES.find((c) => c.id === courseId);
}

/** The course, or the default course if the id is missing or unknown. */
export function courseOrDefault(courseId: string | null | undefined): Course {
  return findCourse(courseId) ?? findCourse(DEFAULT_COURSE_ID)!;
}
