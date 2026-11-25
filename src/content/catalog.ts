/**
 * Courses, topics and standards that questions are tagged with.
 *
 * IB Physics topics follow the IB DP Physics guide (first assessment 2025).
 * Standard labels paraphrase the guide's "understandings"; the numbering
 * (A.1.1, A.1.2, ...) is ours, because the guide lists them as bullet points.
 *
 * IB Physics HL includes every SL topic (so SL questions appear in HL too) plus
 * the HL-only topics. A question marked level: 'HL' appears only in HL.
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

export interface Course {
  id: string;
  name: string;
  shortName: string;
  style: Style;
  level?: 'SL' | 'HL';
  /** Courses whose questions also belong to this one (HL includes SL). */
  includes?: string[];
  /** Instructions printed at the top of PDFs. "{g}" is replaced by the course's value of g. */
  printInstructions: string[];
  themes: Theme[];
}

function topic(code: string, name: string, standards: [string, string, 'HL'?][] = [], hlOnly = false): Topic {
  return {
    id: `ibp.${code}`,
    code,
    name,
    standards: standards.map(([c, text, level]) => ({ id: `ibp.${c}`, code: c, text, ...(level === 'HL' ? { hl: true } : {}) })),
    ...(hlOnly ? { hlOnly } : {}),
  };
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
  B1: topic('B.1', 'Thermal energy transfers'),
  B2: topic('B.2', 'Greenhouse effect'),
  B3: topic('B.3', 'Gas laws'),
  B4: topic('B.4', 'Thermodynamics', [], true),
  B5: topic('B.5', 'Current and circuits'),
  C1: topic('C.1', 'Simple harmonic motion'),
  C2: topic('C.2', 'Wave model'),
  C3: topic('C.3', 'Wave phenomena'),
  C4: topic('C.4', 'Standing waves and resonance'),
  C5: topic('C.5', 'Doppler effect'),
  D1: topic('D.1', 'Gravitational fields'),
  D2: topic('D.2', 'Electric and magnetic fields'),
  D3: topic('D.3', 'Motion in electromagnetic fields'),
  D4: topic('D.4', 'Induction', [], true),
  E1: topic('E.1', 'Structure of the atom'),
  E2: topic('E.2', 'Quantum physics', [], true),
  E3: topic('E.3', 'Radioactive decay'),
  E4: topic('E.4', 'Fission'),
  E5: topic('E.5', 'Fusion and stars'),
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
  style: 'IB',
  level: 'HL',
  includes: ['ib-physics-sl'],
  printInstructions: IB_PRINT_INSTRUCTIONS,
  themes: IB_PHYSICS_THEMES,
};

export const COURSES: Course[] = [IB_PHYSICS_SL, IB_PHYSICS_HL];
export const DEFAULT_COURSE_ID = IB_PHYSICS_SL.id;

export function allTopics(course: Course): Topic[] {
  return course.themes.flatMap((t) => t.topics);
}

/** Every topic with all of its standards (SL and HL). */
export const ALL_TOPICS: Topic[] = Object.values(T);

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
