import { useState } from 'react';
import { COURSES, allTopics, courseOrDefault, courseTopic, findStandard } from '../content/catalog';
import { questionsForTopic } from '../content/registry';
import { PageHeader } from '../components/Layout';
import { StandardPicker, countByStandard } from '../components/StandardPicker';
import { QUESTION_TYPE_LABELS, type AnyTemplate, type QuestionType } from '../engine/types';
import { href } from '../router';

export function marksOf(t: AnyTemplate): number {
  return t.parts.reduce((s, p) => s + p.marks, 0);
}

/** "1 mark", "4 marks". */
export function marksLabel(n: number): string {
  return `${n} mark${n === 1 ? '' : 's'}`;
}

export function TypeChips({ types }: { types: QuestionType[] }) {
  return (
    <span className="chips">
      {types.map((t) => (
        <span key={t} className={`chip chip-type chip-${t}`}>
          {QUESTION_TYPE_LABELS[t]}
        </span>
      ))}
    </span>
  );
}

export function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="difficulty" title={`Difficulty ${level} of 3`} aria-label={`Difficulty ${level} of 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= level ? 'on' : ''} />
      ))}
    </span>
  );
}

/**
 * Browse questions by course and topic. The chosen standards are kept in the address
 * (?std=...), so coming back from a preview shows the same questions.
 */
export function BankPage({ courseId, topicId, standards: initialStandards = [] }: { courseId?: string | null; topicId?: string; standards?: string[] }) {
  const course = courseOrDefault(courseId);
  const topics = allTopics(course);
  const active = topicId && topics.some((t) => t.id === topicId) ? topicId : (topics.find((t) => questionsForTopic(t.id, course.id).length > 0) ?? topics[0]).id;
  const topic = courseTopic(course, active)!;
  const [type, setType] = useState<QuestionType | ''>('');
  const [standards, setStandardsState] = useState<string[]>(() => initialStandards.filter((s) => topic.standards.some((x) => x.id === s)));
  const [search, setSearch] = useState('');
  const setStandards = (ids: string[]) => {
    setStandardsState(ids);
    window.history.replaceState(null, '', href('/bank', { course: course.id, topic: active, std: ids.join(',') }));
  };

  const inTopic = questionsForTopic(active, course.id);
  const questions = inTopic.filter(
    (q) =>
      (!type || q.types.includes(type)) &&
      q.standards.some((s) => standards.includes(s)) &&
      (!search || q.title.toLowerCase().includes(search.toLowerCase())),
  );
  const typesHere = [...new Set(inTopic.flatMap((q) => q.types))];

  return (
    <div className="container">
      <PageHeader
        eyebrow={course.name}
        title="Question bank"
        actions={
          <div className="segmented" role="group" aria-label="Course">
            {COURSES.map((c) => (
              <a key={c.id} href={href('/bank', { course: c.id, topic: active })} className={c.id === course.id ? 'is-active' : ''} aria-current={c.id === course.id ? 'page' : undefined}>
                {c.name}
              </a>
            ))}
          </div>
        }
      >
        Preview any question with a student’s numbers, then add it to an assignment. HL includes every SL question plus the HL-only topics.
      </PageHeader>

      <div className="bank-layout">
        <aside className="card sidebar" aria-label="Topics">
          {course.themes.map((theme) => (
            <div key={theme.code} className="side-group">
              <div className="side-theme">
                {theme.code} · {theme.name}
              </div>
              {theme.topics.map((t) => {
                const n = questionsForTopic(t.id, course.id).length;
                return (
                  <a key={t.id} href={href('/bank', { course: course.id, topic: t.id })} className={`side-topic${t.id === active ? ' is-active' : ''}${n === 0 ? ' is-empty' : ''}`}>
                    <span>
                      {t.code} {t.name}
                      {t.hlOnly && <span className="chip chip-small chip-hl">HL</span>}
                    </span>
                    <span className="count">{n || 'soon'}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </aside>

        <section>
          <div className="topic-head">
            <h2>
              {topic.code} {topic.name}
            </h2>
            <span className="muted">{inTopic.length} questions</span>
          </div>

          {inTopic.length === 0 ? (
            <div className="card empty">No questions for this topic yet. They are on the list in PROJECT_GUIDE.txt.</div>
          ) : (
            <>
              <div className="filters">
                <input className="search" type="search" placeholder="Search titles" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search question titles" />
                <select value={type} onChange={(e) => setType(e.target.value as QuestionType | '')} aria-label="Filter by question type">
                  <option value="">All question types</option>
                  {typesHere.map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <StandardPicker topic={topic} selected={standards} onChange={setStandards} counts={countByStandard(inTopic)} />

              <div className="q-list" hidden={standards.length === 0}>
                {questions.map((q) => (
                  <article key={q.id} className="card q-card">
                    <div className="q-card-main">
                      <a className="q-card-title" href={href(`/q/${q.id}`)}>
                        {q.title}
                      </a>
                      {q.level === 'HL' && <span className="chip chip-small chip-hl">HL</span>}
                      <div className="q-card-meta">
                        <TypeChips types={q.types} />
                        <span className="muted small">{q.paper}</span>
                      </div>
                      <div className="q-card-standards">
                        {q.standards.map((s) => {
                          const st = findStandard(s);
                          return (
                            <span key={s} className="std" title={st?.text}>
                              {st?.code} {st?.text}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="q-card-side">
                      <div className="q-card-marks">
                        {marksOf(q)} <span>{marksOf(q) === 1 ? 'mark' : 'marks'}</span>
                      </div>
                      <Difficulty level={q.difficulty} />
                      <div className="q-card-actions">
                        <a className="btn btn-sm btn-primary" href={href(`/q/${q.id}`)}>
                          Preview
                        </a>
                        <a className="btn btn-sm" href={href('/builder', { add: q.id, course: course.id })}>
                          Add to assignment
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
                {questions.length === 0 && standards.length > 0 && <div className="card empty">No questions match these filters.</div>}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
