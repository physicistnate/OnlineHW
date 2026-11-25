/**
 * Leaving out questions that need later topics, and finding questions that combine topics.
 */
import { describe, expect, it } from 'vitest';
import { AP_PHYSICS_C_MECH, IB_PHYSICS_HL, IB_PHYSICS_SL, UNIVERSITY_MODERN_PHYSICS, UNIVERSITY_PHYSICS_1, allTopics, courseTopic, topicOf, type Course } from '../src/content/catalog';
import { ALL_QUESTIONS, getQuestion, laterTopicsUsed, questionsCombining, questionsForCourse, questionsForTopic, topicsOfQuestion } from '../src/content/registry';
import { filterLater } from '../src/components/TopicFilters';

const SL = IB_PHYSICS_SL.id;
const HL = IB_PHYSICS_HL.id;

describe('questions that use ideas from other topics', () => {
  it('knows which topics a question involves, and which of them come later', () => {
    const trolley = getQuestion('ibp-a2-trolley-collision')!;
    expect(topicsOfQuestion(trolley)).toEqual(['ibp.A.2', 'ibp.A.3']);
    expect(laterTopicsUsed(trolley, SL)).toEqual(['ibp.A.3']); // kinetic energy is taught in A.3
    expect(laterTopicsUsed(getQuestion('ibp-a1-skydiver-terminal')!, SL)).toEqual(['ibp.A.2']); // forces at terminal speed
    expect(laterTopicsUsed(getQuestion('ibp-a2-lift-scales')!, SL)).toEqual([]);
    expect(topicOf('ibp.A.3.3')?.id).toBe('ibp.A.3');
    expect(topicOf('ibp.A.2')?.id).toBe('ibp.A.2');
  });

  it('leaves those questions out unless asked, and says how many', () => {
    const a2 = questionsForTopic('ibp.A.2', SL);
    const off = filterLater(a2, SL, false);
    const on = filterLater(a2, SL, true);
    expect(on.visible).toHaveLength(a2.length);
    expect(off.visible.length + off.hidden).toBe(a2.length);
    expect(off.visible.some((q) => q.id === 'ibp-a2-trolley-collision')).toBe(false);
    expect(on.visible.some((q) => q.id === 'ibp-a2-trolley-collision')).toBe(true);
  });

  it('still has a question for every A.1 and A.2 standard without later topics (SL and HL)', () => {
    for (const course of [SL, HL]) {
      for (const topicId of ['ibp.A.1', 'ibp.A.2']) {
        const { visible } = filterLater(questionsForTopic(topicId, course), course, false);
        for (const s of courseTopic(course === SL ? IB_PHYSICS_SL : IB_PHYSICS_HL, topicId)!.standards) {
          expect(visible.some((q) => q.standards.includes(s.id)), `${course} ${s.code} has no question that avoids later topics`).toBe(true);
        }
      }
    }
  });

  it('has a question for every A.3, AP Unit 3 and University Topic 3 standard without later topics', () => {
    const cases: [Course, string][] = [
      [IB_PHYSICS_SL, 'ibp.A.3'],
      [IB_PHYSICS_HL, 'ibp.A.3'],
      [AP_PHYSICS_C_MECH, 'apcm.3'],
      [UNIVERSITY_PHYSICS_1, 'up1.3'],
    ];
    for (const [course, topicId] of cases) {
      const { visible } = filterLater(questionsForTopic(topicId, course.id), course.id, false);
      expect(visible.length, `${course.id} ${topicId}`).toBeGreaterThanOrEqual(10);
      for (const s of courseTopic(course, topicId)!.standards) {
        expect(visible.some((q) => q.standards.includes(s.id)), `${course.id} ${s.code} has no question that avoids later topics`).toBe(true);
      }
    }
  });

  it('has a question for every Theme E standard, in SL and in HL, without later topics', () => {
    for (const course of [IB_PHYSICS_SL, IB_PHYSICS_HL]) {
      const themeE = allTopics(course).filter((t) => t.id.startsWith('ibp.E.'));
      // SL leaves out the HL-only topic E.2.
      expect(themeE.map((t) => t.code)).toEqual(course === IB_PHYSICS_SL ? ['E.1', 'E.3', 'E.4', 'E.5'] : ['E.1', 'E.2', 'E.3', 'E.4', 'E.5']);
      for (const topic of themeE) {
        const { visible } = filterLater(questionsForTopic(topic.id, course.id), course.id, false);
        expect(visible.length, `${course.id} ${topic.code}`).toBeGreaterThanOrEqual(4);
        for (const s of topic.standards) {
          expect(visible.some((q) => q.standards.includes(s.id)), `${course.id} ${s.code} has no question that avoids later topics`).toBe(true);
        }
      }
    }
    // HL-only questions stay out of SL.
    expect(questionsForCourse(SL).some((q) => q.level === 'HL')).toBe(false);
    expect(questionsForTopic('ibp.E.2', SL)).toEqual([]);
  });

  it('has a question for every standard of the University Modern Physics topics that have questions', () => {
    const course = UNIVERSITY_MODERN_PHYSICS;
    const withStandards = allTopics(course).filter((t) => t.standards.length > 0);
    expect(withStandards.map((t) => t.code)).toEqual(['Topic 2', 'Topic 3', 'Topic 4', 'Topic 5', 'Topic 6', 'Topic 7']);
    for (const topic of withStandards) {
      const { visible } = filterLater(questionsForTopic(topic.id, course.id), course.id, false);
      expect(visible.length, topic.code).toBeGreaterThanOrEqual(1);
      for (const s of topic.standards) {
        expect(visible.some((q) => q.standards.includes(s.id)), `${s.code} has no question that avoids later topics`).toBe(true);
      }
    }
  });

  it('keeps each course’s questions to that course', () => {
    const ap = questionsForCourse(AP_PHYSICS_C_MECH.id);
    const uni = questionsForCourse(UNIVERSITY_PHYSICS_1.id);
    const modern = questionsForCourse(UNIVERSITY_MODERN_PHYSICS.id);
    expect(ap.length).toBe(10);
    expect(uni.length).toBe(10);
    expect(modern.length).toBe(12);
    expect(ap.every((q) => q.style === 'AP' && q.topic.startsWith('apcm.'))).toBe(true);
    expect(uni.every((q) => q.style === 'General' && q.topic.startsWith('up1.'))).toBe(true);
    expect(modern.every((q) => q.style === 'General' && q.topic.startsWith('ump.'))).toBe(true);
    for (const id of [IB_PHYSICS_SL.id, IB_PHYSICS_HL.id]) {
      expect(questionsForCourse(id).some((q) => !q.topic.startsWith('ibp.')), id).toBe(false);
    }
    expect(uni.some((q) => q.topic.startsWith('ump.'))).toBe(false);
  });

  it('only names real topics or standards other than the question’s own', () => {
    for (const q of ALL_QUESTIONS) {
      for (const id of q.uses ?? []) {
        expect(topicOf(id), `${q.id}: unknown topic or standard "${id}"`).toBeDefined();
        expect(topicOf(id)?.id, `${q.id}: "${id}" is in its own topic`).not.toBe(q.topic);
      }
    }
  });
});

describe('combining topics', () => {
  it('finds only questions that involve every chosen topic', () => {
    const forcesAndEnergy = questionsCombining(['ibp.A.2', 'ibp.A.3'], SL).map((q) => q.id);
    expect(forcesAndEnergy).toContain('ibp-a2-trolley-collision');
    expect(forcesAndEnergy).toContain('ibp-a3-sledge-pull'); // an A.3 question that uses Newton’s first law
    expect(forcesAndEnergy).not.toContain('ibp-a2-lift-scales');
    expect(forcesAndEnergy).not.toContain('ibp-a2-collision-2d'); // HL only
    expect(questionsCombining(['ibp.A.2', 'ibp.A.3'], HL).map((q) => q.id)).toContain('ibp-a2-collision-2d');
    expect(questionsCombining(['ibp.A.1', 'ibp.A.2'], SL).map((q) => q.id)).toContain('ibp-a1-skydiver-terminal');
    for (const q of questionsCombining(['ibp.A.1', 'ibp.A.2'], SL)) {
      expect(topicsOfQuestion(q)).toEqual(expect.arrayContaining(['ibp.A.1', 'ibp.A.2']));
    }
    expect(questionsCombining(['ibp.A.1', 'ibp.E.5'], SL)).toEqual([]);
  });
});
