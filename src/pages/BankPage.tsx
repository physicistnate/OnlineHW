import { useState } from 'react';
import { IB_PHYSICS_SL, findStandard, findTopic } from '../content/catalog';
import { questionsForTopic } from '../content/registry';
import { PageHeader } from '../components/Layout';
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

export function BankPage({ topicId }: { topicId?: string }) {
  const course = IB_PHYSICS_SL;
  const active = topicId && findTopic(topicId) ? topicId : 'ibp.A.1';
  const topic = findTopic(active)!;
  const [type, setType] = useState<QuestionType | ''>('');
  const [standard, setStandard] = useState('');
  const [search, setSearch] = useState('');

  const questions = questionsForTopic(active).filter(
    (q) =>
      (!type || q.types.includes(type)) &&
      (!standard || q.standards.includes(standard)) &&
      (!search || q.title.toLowerCase().includes(search.toLowerCase())),
  );
  const typesHere = [...new Set(questionsForTopic(active).flatMap((q) => q.types))];

  return (
    <div className="container">
      <PageHeader eyebrow={course.name} title="Question bank">
        Preview any question with a student’s numbers, then add it to an assignment.
      </PageHeader>

      <div className="bank-layout">
        <aside className="card sidebar" aria-label="Topics">
          {course.themes.map((theme) => (
            <div key={theme.code} className="side-group">
              <div className="side-theme">
                {theme.code} · {theme.name}
              </div>
              {theme.topics.map((t) => {
                const n = questionsForTopic(t.id).length;
                return (
                  <a key={t.id} href={href('/bank', { topic: t.id })} className={`side-topic${t.id === active ? ' is-active' : ''}${n === 0 ? ' is-empty' : ''}`}>
                    <span>
                      {t.code} {t.name}
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
            <span className="muted">{questionsForTopic(active).length} questions</span>
          </div>

          {questionsForTopic(active).length === 0 ? (
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
                {topic.standards.length > 0 && (
                  <select value={standard} onChange={(e) => setStandard(e.target.value)} aria-label="Filter by standard">
                    <option value="">All standards</option>
                    {topic.standards.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} {s.text}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="q-list">
                {questions.map((q) => (
                  <article key={q.id} className="card q-card">
                    <div className="q-card-main">
                      <a className="q-card-title" href={href(`/q/${q.id}`)}>
                        {q.title}
                      </a>
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
                        <a className="btn btn-sm" href={href('/builder', { add: q.id })}>
                          Add to assignment
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
                {questions.length === 0 && <div className="card empty">No questions match these filters.</div>}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
