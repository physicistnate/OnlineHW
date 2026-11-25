/**
 * Leaving out questions that need later topics, and finding questions that combine topics.
 */
import { describe, expect, it } from 'vitest';
import { IB_PHYSICS_HL, IB_PHYSICS_SL, courseTopic, topicOf } from '../src/content/catalog';
import { ALL_QUESTIONS, getQuestion, laterTopicsUsed, questionsCombining, questionsForTopic, topicsOfQuestion } from '../src/content/registry';
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
