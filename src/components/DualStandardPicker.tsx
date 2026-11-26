/**
 * Standards for an IB++ course: one box per subject (physics, then mathematics), each
 * with its own topic menu, its own SL/HL switch and its own standards. Standards stay
 * chosen when a box shows another topic; every chosen standard is listed underneath in
 * two columns, where a click removes it.
 */
import type { Course, Subject, Topic } from '../content/catalog';
import { findStandard } from '../content/catalog';
import { dualQuestionsAtLevels, type DualChoice } from '../content/registry';

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

/** Repairs a saved or linked choice: unknown topics and standards are dropped. */
export function cleanDualChoice(course: Course, saved: Partial<DualChoice> | null | undefined): DualChoice {
  const base = defaultDualChoice(course);
  if (!saved) return base;
  const topicsOf = (key: 'physics' | 'math') => course.subjects?.find((s) => s.key === key)?.themes.flatMap((t) => t.topics) ?? [];
  const okTopic = (key: 'physics' | 'math', id: unknown) => typeof id === 'string' && topicsOf(key).some((t) => t.id === id);
  const okStandards = (key: 'physics' | 'math', ids: unknown) =>
    Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string' && topicsOf(key).some((t) => t.standards.some((s) => s.id === id))) : [];
  return {
    physicsTopic: okTopic('physics', saved.physicsTopic) ? (saved.physicsTopic as string) : base.physicsTopic,
    mathTopic: okTopic('math', saved.mathTopic) ? (saved.mathTopic as string) : base.mathTopic,
    physics: okStandards('physics', saved.physics),
    math: okStandards('math', saved.math),
    physicsLevel: saved.physicsLevel === 'SL' ? 'SL' : 'HL',
    mathLevel: saved.mathLevel === 'SL' ? 'SL' : 'HL',
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
  const topics = subject.themes.flatMap((t) => t.topics);
  const topic = topics.find((t) => t.id === choice[TOPIC_KEY[key]]) ?? topics[0];
  const visible = topic.standards.filter((s) => level === 'HL' || !s.hl);
  const chosen = choice[key];
  const inTopic = (t: Topic) => pool.filter((q) => (key === 'physics' ? q.topic === t.id : q.math?.topic === t.id)).length;
  const toggle = (id: string) => onChange({ ...choice, [key]: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] });
  const setLevel = (l: 'SL' | 'HL') => {
    // At SL, HL-only standards are hidden, so they are no longer chosen either.
    const keep = l === 'HL' ? chosen : chosen.filter((id) => !findStandard(id)?.hl);
    onChange({ ...choice, [LEVEL_KEY[key]]: l, [key]: keep });
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
              .filter((t) => level === 'HL' || !t.hlOnly)
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
