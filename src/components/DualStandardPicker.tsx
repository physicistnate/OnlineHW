/**
 * Standards for an IB++ course: one box per subject (physics, then mathematics), each
 * with its own topic menu, its own SL/HL switch and its own standards. Standards stay
 * chosen when a box shows another topic; every chosen standard is listed underneath in
 * two columns, where a click removes it.
 */
import type { Course, Subject, Topic } from '../content/catalog';
import { findStandard, topicOf } from '../content/catalog';
import { dualQuestionsAtLevels, type DualChoice } from '../content/registry';

/** Higher level only: an HL standard, or any standard of an HL-only topic (such as E.2). */
export function isHLStandard(id: string): boolean {
  return !!findStandard(id)?.hl || !!topicOf(id)?.hlOnly;
}

/** The topics a subject box offers at a level (HL-only topics only at HL). */
function offeredTopics(subject: Subject | undefined, level: 'SL' | 'HL'): Topic[] {
  return (subject?.themes.flatMap((t) => t.topics) ?? []).filter((t) => level === 'HL' || !t.hlOnly);
}

interface Props {
  course: Course;
  choice: DualChoice;
  onChange: (next: DualChoice) => void;
}

/** A sensible starting choice: nothing chosen, both subjects at HL, the first topics that have questions. */
export function defaultDualChoice(course: Course): DualChoice {
  const subjects = course.subjects ?? [];
  const pool = dualQuestionsAtLevels(course.id, 'HL', 'HL');
  const firstTopic = (key: 'physics' | 'math') => {
    const topics = subjects.find((s) => s.key === key)?.themes.flatMap((t) => t.topics) ?? [];
    const used = (t: Topic) => pool.some((q) => (key === 'physics' ? q.topic === t.id : q.math?.topic === t.id));
    return (topics.find(used) ?? topics.find((t) => t.standards.length > 0) ?? topics[0])?.id ?? '';
  };
  return { physicsTopic: firstTopic('physics'), mathTopic: firstTopic('math'), physics: [], math: [], physicsLevel: 'HL', mathLevel: 'HL' };
}

/** A choice as a bank address writes it: pt, mt (topics), ps, ms (standards), pl, ml (levels). */
export function dualFromQuery(query: URLSearchParams): Partial<DualChoice> {
  const list = (k: string) => (query.get(k) ?? '').split(',').filter(Boolean);
  return {
    physicsTopic: query.get('pt') ?? undefined,
    mathTopic: query.get('mt') ?? undefined,
    physics: list('ps'),
    math: list('ms'),
    physicsLevel: query.get('pl') === 'SL' ? 'SL' : 'HL',
    mathLevel: query.get('ml') === 'SL' ? 'SL' : 'HL',
  };
}

/** The address parameters for a choice (the inverse of dualFromQuery). */
export function dualQuery(c: DualChoice): Record<string, string> {
  return { pt: c.physicsTopic, mt: c.mathTopic, ps: c.physics.join(','), ms: c.math.join(','), pl: c.physicsLevel, ml: c.mathLevel };
}

/**
 * Repairs a saved or linked choice: unknown topics and standards are dropped, and so are
 * HL standards and topics in a subject set to SL.
 */
export function cleanDualChoice(course: Course, saved: Partial<DualChoice> | null | undefined): DualChoice {
  const base = defaultDualChoice(course);
  if (!saved) return base;
  const physicsLevel = saved.physicsLevel === 'SL' ? 'SL' : 'HL';
  const mathLevel = saved.mathLevel === 'SL' ? 'SL' : 'HL';
  const levelOf = { physics: physicsLevel, math: mathLevel } as const;
  const topicsOf = (key: 'physics' | 'math') => offeredTopics(course.subjects?.find((s) => s.key === key), levelOf[key]);
  const topicFor = (key: 'physics' | 'math', id: unknown) => (typeof id === 'string' && topicsOf(key).some((t) => t.id === id) ? id : (topicsOf(key).find((t) => t.id === base[TOPIC_KEY[key]]) ?? topicsOf(key)[0])?.id ?? '');
  const okStandards = (key: 'physics' | 'math', ids: unknown) =>
    Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === 'string' && topicsOf(key).some((t) => t.standards.some((s) => s.id === id)) && (levelOf[key] === 'HL' || !isHLStandard(id)))
      : [];
  return {
    physicsTopic: topicFor('physics', saved.physicsTopic),
    mathTopic: topicFor('math', saved.mathTopic),
    physics: okStandards('physics', saved.physics),
    math: okStandards('math', saved.math),
    physicsLevel,
    mathLevel,
  };
}

const LEVEL_KEY = { physics: 'physicsLevel', math: 'mathLevel' } as const;
const TOPIC_KEY = { physics: 'physicsTopic', math: 'mathTopic' } as const;

export function DualStandardPicker({ course, choice, onChange }: Props) {
  const subjects = course.subjects ?? [];
  const pool = dualQuestionsAtLevels(course.id, choice.physicsLevel, choice.mathLevel);
  const count = (key: 'physics' | 'math', id: string) => pool.filter((q) => (key === 'physics' ? q.standards : (q.math?.standards ?? [])).includes(id)).length;

  return (
    <div className="dual-picker">
      <div className="dual-boxes">
        {subjects.map((subject) => (
          <SubjectBox key={subject.key} subject={subject} choice={choice} onChange={onChange} count={(id) => count(subject.key, id)} pool={pool} />
        ))}
      </div>
      <div className="dual-chosen" aria-label="Chosen standards">
        {subjects.map((subject) => {
          const chosen = choice[subject.key];
          return (
            <div key={subject.key} className={`dual-chosen-col is-${subject.key}`}>
              <div className="dual-chosen-title">
                {subject.name}: {chosen.length === 0 ? 'none chosen' : `${chosen.length} chosen`}
              </div>
              {chosen.length === 0 ? (
                <p className="muted small">{subject.key === 'physics' ? 'Any physics standard.' : 'Any mathematics standard.'}</p>
              ) : (
                <ul>
                  {chosen.map((id) => {
                    const s = findStandard(id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className="dual-chosen-chip"
                          title="Remove"
                          aria-label={`Remove ${subject.name} ${s?.code ?? id}`}
                          onClick={() => onChange({ ...choice, [subject.key]: chosen.filter((x) => x !== id) })}
                        >
                          <strong>{s?.code ?? id}</strong> <span>{s?.text}</span> <span aria-hidden="true">✕</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {choice.physics.length === 0 && choice.math.length === 0 && (
        <p className="std-prompt" role="status">
          Choose at least one standard, in physics, mathematics or both, to see questions. Questions must match a chosen standard in each subject you choose from.
        </p>
      )}
    </div>
  );
}

function SubjectBox({
  subject,
  choice,
  onChange,
  count,
  pool,
}: {
  subject: Subject;
  choice: DualChoice;
  onChange: (next: DualChoice) => void;
  count: (id: string) => number;
  pool: { topic: string; math?: { topic: string } }[];
}) {
  const key = subject.key;
  const level = choice[LEVEL_KEY[key]];
  const topics = offeredTopics(subject, level);
  const topic = topics.find((t) => t.id === choice[TOPIC_KEY[key]]) ?? topics[0];
  const visible = topic.standards.filter((s) => level === 'HL' || !isHLStandard(s.id));
  const chosen = choice[key];
  const inTopic = (t: Topic) => pool.filter((q) => (key === 'physics' ? q.topic === t.id : q.math?.topic === t.id)).length;
  const toggle = (id: string) => onChange({ ...choice, [key]: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] });
  const setLevel = (l: 'SL' | 'HL') => {
    // At SL, HL-only standards and topics are hidden, so they are no longer chosen either.
    const keep = l === 'HL' ? chosen : chosen.filter((id) => !isHLStandard(id));
    const shown = offeredTopics(subject, l);
    const topicId = shown.some((t) => t.id === topic.id) ? topic.id : shown[0]?.id;
    onChange({ ...choice, [LEVEL_KEY[key]]: l, [key]: keep, [TOPIC_KEY[key]]: topicId });
  };
  const allIds = visible.map((s) => s.id);

  return (
    <section className={`dual-box is-${key}`} aria-label={`${subject.name} standards`}>
      <div className="dual-box-head">
        <h3>{subject.name}</h3>
        <div className="segmented segmented-sm" role="group" aria-label={`${subject.name} level`}>
          {(['SL', 'HL'] as const).map((l) => (
            <button key={l} type="button" className={level === l ? 'is-active' : ''} aria-pressed={level === l} onClick={() => setLevel(l)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <select value={topic.id} onChange={(e) => onChange({ ...choice, [TOPIC_KEY[key]]: e.target.value })} aria-label={`${subject.name} topic`}>
        {subject.themes.map((theme) => (
          <optgroup key={theme.code} label={key === 'physics' ? `${theme.code} · ${theme.name}` : theme.name}>
            {theme.topics
              .filter((t) => topics.includes(t))
              .map((t) => {
                const n = inTopic(t);
                return (
                  <option key={t.id} value={t.id}>
                    {t.code} {t.name}
                    {t.hlOnly ? ' (HL)' : ''} ({t.standards.length === 0 ? 'coming soon' : n})
                  </option>
                );
              })}
          </optgroup>
        ))}
      </select>
      {visible.length === 0 ? (
        <p className="muted small">No standards for this topic yet.</p>
      ) : (
        <>
          <div className="std-chips" role="group" aria-label={`${subject.name} standards in ${topic.code} ${topic.name}`}>
            {visible.map((s) => {
              const on = chosen.includes(s.id);
              const n = count(s.id);
              return (
                <button key={s.id} type="button" className={`std-chip${on ? ' is-on' : ''}`} aria-pressed={on} title={s.text} onClick={() => toggle(s.id)}>
                  {s.code}
                  {s.hl && <span className="std-hl">HL</span>}
                  <span className="std-count">
                    {n}
                    <span className="sr-only"> {n === 1 ? 'question' : 'questions'}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="dual-box-actions">
            <button type="button" className="btn btn-sm" onClick={() => onChange({ ...choice, [key]: [...new Set([...chosen, ...allIds])] })} disabled={allIds.every((id) => chosen.includes(id))}>
              Select all in {topic.code}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange({ ...choice, [key]: chosen.filter((id) => !allIds.includes(id)) })} disabled={!allIds.some((id) => chosen.includes(id))}>
              Unselect {topic.code}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/** "A.3.2, A.3.5 · Math 5.5, 5.11" for question lists. */
export function dualCodes(q: { standards: string[]; math?: { standards: string[] } }): string {
  const physics = q.standards.map((s) => findStandard(s)?.code ?? s).join(', ');
  const math = (q.math?.standards ?? []).map((s) => findStandard(s)?.code ?? s).join(', ');
  return math ? `${physics} · Math ${math}` : physics;
}
