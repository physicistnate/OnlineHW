/**
 * Constants as the IB Physics data booklet (first assessment 2025) gives them, for
 * Theme E questions. Students may use more precise values: the answer ranges include
 * a 0.5 % allowance, which covers the difference (for example h = 6.626 × 10⁻³⁴ J s).
 */
export const IB = {
  /** Speed of light, m s⁻¹. */
  c: 3.0e8,
  /** Elementary charge, C (also J per eV). */
  e: 1.6e-19,
  /** Planck constant, J s. */
  h: 6.63e-34,
  /** Electron rest mass, kg. */
  me: 9.11e-31,
  /** Unified atomic mass unit: kg, and its energy equivalent in MeV. */
  u: 1.661e-27,
  uMeV: 931.5,
  /** Proton and neutron rest masses, u. */
  mpU: 1.007276,
  mnU: 1.008665,
  /** Coulomb constant, N m² C⁻². */
  k: 8.99e9,
  /** Stefan–Boltzmann constant, W m⁻² K⁻⁴. */
  sigma: 5.67e-8,
  /** Wien's displacement constant, m K. */
  wien: 2.9e-3,
  /** Fermi radius, m. */
  R0: 1.2e-15,
  /** Parsec and light year, m. */
  pc: 3.09e16,
  ly: 9.46e15,
  /** Luminosity, radius and mass of the Sun: W, m and kg. */
  Lsun: 3.83e26,
  Rsun: 6.96e8,
  Msun: 1.99e30,
  /** Mass of a proton (kg), for counting hydrogen nuclei. */
  mp: 1.673e-27,
  /** Gravitational constant, N m² kg⁻². */
  G: 6.67e-11,
  /** Permittivity and permeability of free space: C² N⁻¹ m⁻², T m A⁻¹. */
  eps0: 8.85e-12,
  mu0: 4 * Math.PI * 1e-7,
  /** Mass (kg) and radius (m) of the Earth. */
  ME: 5.97e24,
  RE: 6.37e6,
  /** Astronomical unit, m. */
  AU: 1.5e11,
} as const;
