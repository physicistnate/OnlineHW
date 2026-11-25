/**
 * Courses, topics and standards that questions are tagged with.
 *
 * IB Physics topics follow the IB DP Physics guide (first assessment 2025).
 * Standard labels paraphrase the guide's "understandings"; the numbering
 * (A.1.1, A.1.2, ...) is ours, because the guide lists them as bullet points.
 */
import type { Style } from '../config/site';

export interface Standard {
  id: string;
  code: string;
  text: string;
}

export interface Topic {
  id: string;
  code: string;
  name: string;
  standards: Standard[];
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
  themes: Theme[];
}

function topic(code: string, name: string, standards: [string, string][] = []): Topic {
  return {
    id: `ibp.${code}`,
    code,
    name,
    standards: standards.map(([c, text]) => ({ id: `ibp.${c}`, code: c, text })),
  };
}

export const IB_PHYSICS_SL: Course = {
  id: 'ib-physics-sl',
  name: 'IB Physics SL',
  shortName: 'IB Phys SL',
  style: 'IB',
  themes: [
    {
      code: 'A',
      name: 'Space, time and motion',
      topics: [
        topic('A.1', 'Kinematics', [
          ['A.1.1', 'Describing motion: position, displacement, velocity and acceleration'],
          ['A.1.2', 'Distance and displacement'],
          ['A.1.3', 'Instantaneous and average speed, velocity and acceleration'],
          ['A.1.4', 'Equations of motion for uniform acceleration'],
          ['A.1.5', 'Motion graphs: gradients and areas, uniform and non-uniform acceleration'],
          ['A.1.6', 'Projectile motion without fluid resistance (horizontal and vertical components)'],
          ['A.1.7', 'Qualitative effects of fluid resistance on projectiles; terminal speed'],
        ]),
        topic('A.2', 'Forces and momentum'),
        topic('A.3', 'Work, energy and power'),
      ],
    },
    {
      code: 'B',
      name: 'The particulate nature of matter',
      topics: [
        topic('B.1', 'Thermal energy transfers'),
        topic('B.2', 'Greenhouse effect'),
        topic('B.3', 'Gas laws'),
        topic('B.5', 'Current and circuits'),
      ],
    },
    {
      code: 'C',
      name: 'Wave behaviour',
      topics: [
        topic('C.1', 'Simple harmonic motion'),
        topic('C.2', 'Wave model'),
        topic('C.3', 'Wave phenomena'),
        topic('C.4', 'Standing waves and resonance'),
        topic('C.5', 'Doppler effect'),
      ],
    },
    {
      code: 'D',
      name: 'Fields',
      topics: [
        topic('D.1', 'Gravitational fields'),
        topic('D.2', 'Electric and magnetic fields'),
        topic('D.3', 'Motion in electromagnetic fields'),
      ],
    },
    {
      code: 'E',
      name: 'Nuclear and quantum physics',
      topics: [
        topic('E.1', 'Structure of the atom'),
        topic('E.3', 'Radioactive decay'),
        topic('E.4', 'Fission'),
        topic('E.5', 'Fusion and stars'),
      ],
    },
  ],
};

export const COURSES: Course[] = [IB_PHYSICS_SL];

export function allTopics(course: Course): Topic[] {
  return course.themes.flatMap((t) => t.topics);
}

export function findTopic(topicId: string): Topic | undefined {
  for (const course of COURSES) {
    const found = allTopics(course).find((t) => t.id === topicId);
    if (found) return found;
  }
  return undefined;
}

export function findStandard(standardId: string): Standard | undefined {
  for (const course of COURSES) {
    for (const t of allTopics(course)) {
      const s = t.standards.find((x) => x.id === standardId);
      if (s) return s;
    }
  }
  return undefined;
}

export function findCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId);
}
