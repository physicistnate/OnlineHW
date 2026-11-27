/**
 * IB++ Physics/Math: IB Physics problems that need IB Mathematics on purpose. Checks the
 * mathematics each question names, the balance of the bank (for each pairing of a
 * physics theme with a mathematics topic, three SL questions and two or three HL), the
 * two-subject filter with its SL/HL switches, and that IB++ questions stay in IB++.
 */
import { describe, expect, it } from 'vitest';
import { COURSES, IBPP_PHYSICS_MATH, findStandard, findTopic, topicOf } from '../src/content/catalog';
import { ALL_QUESTIONS, dualQuestions, dualQuestionsAtLevels, questionsForCourse, type DualChoice } from '../src/content/registry';
import { cleanDualChoice, defaultDualChoice, dualCodes, isHLStandard } from '../src/components/DualStandardPicker';
import { instantiate } from '../src/engine/instance';

const ID = IBPP_PHYSICS_MATH.id;
const IBPP = ALL_QUESTIONS.filter((q) => q.courses.includes(ID));
const isHL = (q: (typeof IBPP)[number]) => q.level === 'HL' || q.math?.level === 'HL';
const theme = (q: (typeof IBPP)[number]) => q.topic.split('.')[1];

const choice = (over: Partial<DualChoice>): DualChoice => ({ ...defaultDualChoice(IBPP_PHYSICS_MATH), ...over });

describe('IB++ questions', () => {
  it('each names the mathematics it needs, from IB Mathematics: analysis and approaches', () => {
    expect(IBPP.length).toBeGreaterThan(0);
    for (const q of IBPP) {
      expect(q.math, q.id).toBeDefined();
      const topic = findTopic(q.math!.topic);
      expect(topic?.id.startsWith('ibm.'), `${q.id}: ${q.math!.topic} is not a mathematics topic`).toBe(true);
      expect(q.math!.standards.length, q.id).toBeGreaterThan(0);
      // The first standard is from the question's own mathematics topic; others may come from another topic.
      expect(topic!.standards.some((s) => s.id === q.math!.standards[0]), `${q.id}: ${q.math!.standards[0]} is not in ${q.math!.topic}`).toBe(true);
      for (const s of q.math!.standards) {
        expect(findStandard(s), `${q.id}: unknown standard ${s}`).toBeDefined();
        expect(s.startsWith('ibm.'), `${q.id}: ${s} is not a mathematics standard`).toBe(true);
      }
      // The physics side is IB Physics.
      expect(q.topic.startsWith('ibp.'), q.id).toBe(true);
      expect(q.style, q.id).toBe('IB');
    }
  });

  it('labels the mathematics HL exactly when it uses an HL standard', () => {
    for (const q of IBPP) {
      const usesHL = q.math!.standards.some((s) => findStandard(s)?.hl);
      expect(q.math!.level === 'HL', `${q.id}: math level does not match its standards`).toBe(usesHL);
    }
  });

  it('labels the physics HL exactly when it uses an HL standard or an HL-only topic', () => {
    for (const q of IBPP) {
      const usesHL = q.standards.some(isHLStandard) || !!findTopic(q.topic)?.hlOnly;
      expect(q.level === 'HL', `${q.id}: physics level does not match its standards`).toBe(usesHL);
    }
  });

  it('has a balanced set for each pairing: three SL questions and two or three HL', () => {
    const pairings: [string, string, number, number][] = [
      ['A', 'ibm.4', 3, 2],
      ['A', 'ibm.5', 3, 2],
      ['D', 'ibm.4', 3, 2],
      ['D', 'ibm.5', 3, 4],
      ['E', 'ibm.4', 3, 2],
      ['E', 'ibm.5', 3, 2],
    ];
    for (const [th, mt, sl, hl] of pairings) {
      const set = IBPP.filter((q) => theme(q) === th && q.math!.topic === mt);
      expect(set.filter((q) => !isHL(q)).length, `Theme ${th} with ${mt}: SL questions`).toBe(sl);
      expect(set.filter(isHL).length, `Theme ${th} with ${mt}: HL questions`).toBe(hl);
    }
    expect(IBPP).toHaveLength(32);
  });

  it('has the Theme D problems that were asked for, and Theme D statistics without regression lines', () => {
    const byId = (id: string) => IBPP.find((q) => q.id === id)!;
    // E = −dV/dr with spherical symmetry.
    expect(byId('ibpp-d5-debye-field').standards).toContain('ibp.D.2.8');
    // Poisson's equation with spherical symmetry, the second derivative and the second derivative test.
    expect(byId('ibpp-d5-poisson-sphere').math!.standards).toEqual(expect.arrayContaining(['ibm.5.7', 'ibm.5.8']));
    // Differential equations for circuits: an induction circuit, and an RC circuit (capacitors are not in the
    // IB guide, but they are fine where the differential equation is the point).
    expect(byId('ibpp-d5-rod-ode').math!.standards).toContain('ibm.5.18');
    expect(byId('ibpp-d5-rc-plates').math!.standards).toContain('ibm.5.18');
    // Capacitors stay a small part of the bank: only this IB++ problem mentions them.
    const capacitorQs = ALL_QUESTIONS.filter((q) => /capacitor/i.test(JSON.stringify(instantiate(q, null)))).map((q) => q.id);
    expect(capacitorQs).toEqual(['ibpp-d5-rc-plates']);
    for (const q of IBPP.filter((x) => theme(x) === 'D' && x.math!.topic === 'ibm.4')) {
      expect(q.math!.standards, q.id).not.toContain('ibm.4.4');
      expect(q.math!.standards, q.id).not.toContain('ibm.4.10');
    }
  });

  it('has ids that say which pairing they belong to', () => {
    for (const q of IBPP) {
      expect(q.id, q.id).toMatch(new RegExp(`^ibpp-${theme(q).toLowerCase()}${q.math!.topic.split('.')[1]}-`));
    }
  });

  it('stays in IB++: no other course lists these questions', () => {
    for (const course of COURSES.filter((c) => c.id !== ID)) {
      const ids = new Set(questionsForCourse(course.id).map((q) => q.id));
      for (const q of IBPP) expect(ids.has(q.id), `${q.id} appears in ${course.id}`).toBe(false);
    }
    expect(new Set(questionsForCourse(ID).map((q) => q.id))).toEqual(new Set(IBPP.map((q) => q.id)));
  });

  it('every part is marked online, with a worked solution', () => {
    for (const q of IBPP) {
      const inst = instantiate(q, null);
      expect(inst.parts.length, q.id).toBeGreaterThanOrEqual(4);
      for (const p of inst.parts) {
        expect(p.response.kind, `${q.id} ${p.label}`).not.toBe('text');
        expect(p.solution.length, `${q.id} ${p.label}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('the two-subject filter', () => {
  it('lists nothing until a standard is chosen', () => {
    expect(dualQuestions(ID, choice({}))).toEqual([]);
  });

  it('matches any chosen standard within a subject', () => {
    const regression = dualQuestions(ID, choice({ math: ['ibm.4.4'] })).map((q) => q.id);
    expect(regression).toContain('ibpp-a4-free-fall-regression');
    expect(regression).toContain('ibpp-e4-balmer-regression');
    const both = dualQuestions(ID, choice({ math: ['ibm.4.4', 'ibm.4.8'] })).map((q) => q.id);
    expect(both).toContain('ibpp-e4-decay-binomial');
    expect(both.length).toBeGreaterThan(regression.length);
  });

  it('needs a match in both subjects when both have choices', () => {
    const r = dualQuestions(ID, choice({ physics: ['ibp.E.3.6'], math: ['ibm.5.6'] })).map((q) => q.id);
    expect(r).toContain('ibpp-e5-activity-tangent');
    for (const id of r) {
      const q = IBPP.find((x) => x.id === id)!;
      expect(q.standards).toContain('ibp.E.3.6');
      expect(q.math!.standards).toContain('ibm.5.6');
    }
    // Physics alone finds more than physics and mathematics together.
    expect(dualQuestions(ID, choice({ physics: ['ibp.E.3.6'] })).length).toBeGreaterThan(r.length);
  });

  it('finds a question by a standard from its second mathematics topic', () => {
    expect(dualQuestions(ID, choice({ math: ['ibm.5.16'] })).map((q) => q.id)).toContain('ibpp-e4-lifetime-distribution');
  });

  it('hides HL questions in a subject set to SL, independently for each subject', () => {
    const all = dualQuestionsAtLevels(ID, 'HL', 'HL');
    expect(all).toHaveLength(32);
    const physicsSL = dualQuestionsAtLevels(ID, 'SL', 'HL');
    const mathSL = dualQuestionsAtLevels(ID, 'HL', 'SL');
    const bothSL = dualQuestionsAtLevels(ID, 'SL', 'SL');
    expect(physicsSL.every((q) => q.level !== 'HL')).toBe(true);
    expect(mathSL.every((q) => q.math?.level !== 'HL')).toBe(true);
    expect(bothSL.every((q) => !isHL(q))).toBe(true);
    expect(bothSL).toHaveLength(18);
    // Physics HL with mathematics SL keeps, for example, the photoelectric regression.
    expect(mathSL.map((q) => q.id)).toContain('ibpp-e4-photoelectric-regression');
    expect(physicsSL.map((q) => q.id)).not.toContain('ibpp-e4-photoelectric-regression');
    // Physics SL with mathematics HL keeps the air-resistance question.
    expect(physicsSL.map((q) => q.id)).toContain('ibpp-a5-air-resistance-limits');
    expect(mathSL.map((q) => q.id)).not.toContain('ibpp-a5-air-resistance-limits');
  });
});

describe('saved and linked choices', () => {
  it('start with nothing chosen, both subjects at HL, on topics that have questions', () => {
    const d = defaultDualChoice(IBPP_PHYSICS_MATH);
    expect(d.physics).toEqual([]);
    expect(d.math).toEqual([]);
    expect([d.physicsLevel, d.mathLevel]).toEqual(['HL', 'HL']);
    expect(IBPP.some((q) => q.topic === d.physicsTopic)).toBe(true);
    expect(IBPP.some((q) => q.math?.topic === d.mathTopic)).toBe(true);
  });

  it('drop unknown topics and standards', () => {
    const c = cleanDualChoice(IBPP_PHYSICS_MATH, { physicsTopic: 'nope', mathTopic: 'ibm.9', physics: ['ibp.A.3.2', 'ibp.Z.1', 7 as never], math: ['ibm.5.5', 'ibp.A.1.1'] });
    expect(c.physicsTopic).toBe(defaultDualChoice(IBPP_PHYSICS_MATH).physicsTopic);
    expect(c.mathTopic).toBe(defaultDualChoice(IBPP_PHYSICS_MATH).mathTopic);
    expect(c.physics).toEqual(['ibp.A.3.2']);
    expect(c.math).toEqual(['ibm.5.5']);
  });

  it('drop HL standards and topics from a subject set to SL', () => {
    expect(isHLStandard('ibp.E.2.1')).toBe(true); // E.2 is an HL-only topic
    expect(isHLStandard('ibp.E.3.8')).toBe(true);
    expect(isHLStandard('ibm.5.18')).toBe(true);
    expect(isHLStandard('ibp.E.3.6')).toBe(false);
    const c = cleanDualChoice(IBPP_PHYSICS_MATH, {
      physicsTopic: 'ibp.E.2',
      physicsLevel: 'SL',
      physics: ['ibp.E.2.1', 'ibp.E.3.8', 'ibp.E.3.6'],
      mathLevel: 'SL',
      math: ['ibm.5.18', 'ibm.5.6'],
    });
    expect(c.physics).toEqual(['ibp.E.3.6']);
    expect(c.math).toEqual(['ibm.5.6']);
    expect(findTopic(c.physicsTopic)?.hlOnly).toBeFalsy();
    // At HL the same standards are kept.
    const h = cleanDualChoice(IBPP_PHYSICS_MATH, { physicsTopic: 'ibp.E.2', physics: ['ibp.E.2.1'], math: ['ibm.5.18'] });
    expect(h.physicsTopic).toBe('ibp.E.2');
    expect(h.physics).toEqual(['ibp.E.2.1']);
    expect(h.math).toEqual(['ibm.5.18']);
  });

  it('show both subjects’ codes in question lists', () => {
    const q = IBPP.find((x) => x.id === 'ibpp-a5-riemann-work')!;
    expect(dualCodes(q)).toBe('A.3.2, A.3.3, A.3.6 · Math 5.5, 5.11');
    expect(topicOf('ibm.5.11')?.code).toBe('Topic 5');
  });
});
