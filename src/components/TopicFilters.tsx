/**
 * Shared controls for the question bank and the assignment builder:
 * - "One topic" or "Combine topics" mode;
 * - leaving out questions that need ideas from later topics (the default);
 * - choosing several topics to find questions that combine them;
 * - chips saying which other topics a question uses.
 */
import { allTopics, findStandard, findTopic, topicOf, type Course } from '../content/catalog';
import { laterTopicsUsed, questionsForCourse, topicsOfQuestion } from '../content/registry';
import type { AnyTemplate } from '../engine/types';

export type ChooseMode = 'topic' | 'combine';

export function ModeSwitch({ mode, onChange }: { mode: ChooseMode; onChange: (m: ChooseMode) => void }) {
  return (
    <div className="segmented" role="group" aria-label="How to choose questions">
      <button className={mode === 'topic' ? 'is-active' : ''} aria-pressed={mode === 'topic'} onClick={() => onChange('topic')}>
        One topic
      </button>
      <button className={mode === 'combine' ? 'is-active' : ''} aria-pressed={mode === 'combine'} onClick={() => onChange('combine')}>
        Combine topics
      </button>
    </div>
  );
}

/** The other topics a question uses, e.g. "Also uses A.3 Work, energy and power (later topic)". */
export function UsesChips({ q, courseId }: { q: AnyTemplate; courseId: string }) {
  const others = topicsOfQuestion(q).slice(1);
  if (others.length === 0) return null;
  const later = laterTopicsUsed(q, courseId);
  return (
    <span className="chips">
      {others.map((id) => {
        const t = findTopic(id);
        const isLater = later.includes(id);
        // The specific ideas used, when the question names standards (not just the topic).
        const ideas = (q.uses ?? []).filter((u) => topicOf(u)?.id === id && !findTopic(u)).map((u) => findStandard(u)?.text);
        return (
          <span key={id} className={`chip chip-small chip-uses${isLater ? ' is-later' : ''}`} title={ideas.length ? `Uses: ${ideas.join('; ')}` : undefined}>
            Also uses {t?.code} {t?.name}
            {isLater ? ' (later topic)' : ''}
          </span>
        );
      })}
    </span>
  );
}

/** "Also include questions that use ideas from later topics", with how many that adds. */
export function LaterTopicsToggle({ checked, onChange, hidden }: { checked: boolean; onChange: (v: boolean) => void; hidden: number }) {
  return (
    <label className="later-toggle check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        Also include questions that use ideas from later topics
        <span className="muted small">
          {' '}
          ({hidden === 0 ? 'none in this topic yet' : `${hidden} more question${hidden === 1 ? '' : 's'}`}; later means later in the IB guide’s order, e.g. kinetic energy (A.3) in an A.2 question)
        </span>
      </span>
    </label>
  );
}

/** Questions in a topic, with those that need later topics left out unless asked for. */
export function filterLater(questions: AnyTemplate[], courseId: string, includeLater: boolean) {
  const needsLater = questions.filter((q) => laterTopicsUsed(q, courseId).length > 0);
  return { visible: includeLater ? questions : questions.filter((q) => !needsLater.includes(q)), hidden: needsLater.length };
}

/** The instructions and topic ovals for "Combine topics" mode. */
export function CombineTopics({ course, selected, onChange }: { course: Course; selected: string[]; onChange: (ids: string[]) => void }) {
  const pool = questionsForCourse(course.id);
  const involving = (id: string) => pool.filter((q) => topicsOfQuestion(q).includes(id)).length;
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="combine">
      <div className="combine-help" role="note">
        <strong>Combine topics: questions that bring two or more topics together</strong>
        <ol>
          <li>Choose two or more topics below. They turn green.</li>
          <li>
            The list shows only questions that use ideas from <em>every</em> topic you chose. For example, A.2 Forces and momentum with A.3 Work, energy and power
            gives collision questions that also ask about kinetic energy.
          </li>
          <li>Tick the questions you want, as usual. Choose fewer topics if nothing matches.</li>
        </ol>
        <p className="muted small">
          This is not the same as choosing questions from several topics: those can simply be added one topic at a time. The number in each oval is how many
          questions involve that topic.
        </p>
      </div>
      <div className="std-picker-head">
        <span className="std-picker-title">Topics</span>
        <div className="std-picker-actions">
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange([])} disabled={selected.length === 0}>
            Unselect all
          </button>
        </div>
      </div>
      {course.themes.map((theme) => {
        const topics = theme.topics.filter((t) => involving(t.id) > 0 || selected.includes(t.id));
        if (topics.length === 0) return null;
        return (
          <div key={theme.code} className="combine-theme">
            <div className="side-theme">
              {theme.code} · {theme.name}
            </div>
            <div className="std-chips" role="group" aria-label={`Topics in theme ${theme.code}`}>
              {topics.map((t) => {
                const on = selected.includes(t.id);
                const n = involving(t.id);
                return (
                  <button key={t.id} type="button" className={`std-chip${on ? ' is-on' : ''}`} aria-pressed={on} title={t.name} onClick={() => toggle(t.id)}>
                    {t.code} {t.name}
                    <span className="std-count">
                      {n}
                      <span className="sr-only"> {n === 1 ? 'question' : 'questions'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {allTopics(course).filter((t) => involving(t.id) === 0).length > 0 && (
        <p className="muted small">Topics with no questions yet are not shown.</p>
      )}
      {selected.length < 2 && (
        <p className="std-prompt" role="status">
          Choose at least two topics to see questions that combine them.
        </p>
      )}
    </div>
  );
}
