/**
 * Constants for the University Modern Physics questions, to 4 significant figures as
 * most US textbooks give them. Each question states the values it needs. Students may
 * use other common values: the answer ranges include a 0.5 % allowance, which covers,
 * for example, c = 3.00 × 10⁸ m/s or hc = 1239.8 eV·nm.
 */
export const UMP = {
  /** Speed of light, m/s. */
  c: 2.998e8,
  /** Elementary charge, C (also J per eV). */
  e: 1.602e-19,
  /** Planck constant and ħ, J·s. */
  h: 6.626e-34,
  hbar: 1.055e-34,
  /** hc in eV·nm, which is also keV·pm. */
  hc: 1240,
  /** Electron mass, kg. */
  me: 9.109e-31,
  /** Compton wavelength of the electron, h/mₑc, in pm. */
  lambdaC: 2.426,
  /** ke² in MeV·fm. */
  ke2: 1.44,
  /** Bohr radius (nm) and the ionization energy of hydrogen (eV). */
  a0: 0.05292,
  Ry: 13.61,
  /** Atomic mass unit: kg, and its energy equivalent in MeV. */
  u: 1.6605e-27,
  uMeV: 931.5,
  /** Boltzmann constant, J/K. */
  kB: 1.381e-23,
  /** Stefan–Boltzmann constant, W/(m²·K⁴). */
  sigma: 5.67e-8,
  /** Gravitational constant, N·m²/kg². */
  G: 6.674e-11,
  /** The Sun: mass (kg), radius (m) and luminosity (W). */
  Msun: 1.989e30,
  Rsun: 6.957e8,
  Lsun: 3.828e26,
  /** Astronomical unit (m) and one year (s). */
  AU: 1.496e11,
  year: 3.156e7,
} as const;

/** Atomic masses (u) of the nuclides in the fission and fusion questions. */
export const MASS = {
  n: 1.008665,
  H1: 1.007825,
  H2: 2.014102,
  H3: 3.016049,
  He3: 3.016029,
  He4: 4.002602,
  U235: 235.04393,
  Ba141: 140.914411,
  Kr92: 91.926156,
  Xe140: 139.92164,
  Sr94: 93.915361,
  Cs137: 136.907089,
  Rb96: 95.934273,
  La147: 146.928235,
  Br87: 86.920711,
} as const;
