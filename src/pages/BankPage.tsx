import { useState } from 'react';
import { COURSES, allTopics, courseOrDefault, courseTopic, findStandard } from '../content/catalog';
import { questionsCombining, questionsForTopic } from '../content/registry';
import { PageHeader } from '../components/Layout';
import { StandardPicker, countByStandard } from '../components/StandardPicker';
import { CombineTopics, LaterTopicsToggle, ModeSwitch, UsesChips, filterLater, type ChooseMode } from '../components/TopicFilters';
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
 * Browse questions by course and topic. Two ways to choose:
 * - One topic (the default): pick a topic and its standards. Questions that also need
 *   ideas from later topics are left out unless the teacher asks for them.
 * - Combine topics: pick two or more topics and see only questions that use them all.
 * Choices are kept in the address (?std=..., &later=1, &mode=combine&topics=...), so
 * coming back from a preview shows the same questions.
 */
export function BankPage(props: {
  courseId?: string | null;
  topicId?: string;
  standards?: string[];
  includeLater?: boolean;
  mode?: ChooseMode;
  combine?: string[];
}) {
  const course = courseOrDefault(props.courseId);
  const topics = allTopics(course);
  const active =
    props.topicId && topics.some((t) => t.id === props.topicId) ? props.topicId : (topics.find((t) => questionsForTopic(t.id, course.id).length > 0) ?? topics[0]).id;
  const topic = courseTopic(course, active)!;
  const [type, setType] = useState<QuestionType | ''>('');
  const [search, setSearch] = useState('');
  const [standards, setStandardsState] = useState<string[]>(() => (props.standards ?? []).filter((s) => topic.standards.some((x) => x.id === s)));
  const [includeLater, setIncludeLaterState] = useState(props.includeLater === true);
  const [mode, setModeState] = useState<ChooseMode>(props.mode === 'combine' ? 'combine' : 'topic');
  const [combine, setCombineState] = useState<string[]>(() => (props.combine ?? []).filter((id) => topics.some((t) => t.id === id)));

  const remember = (next: { standards?: string[]; includeLater?: boolean; mode?: ChooseMode; combine?: string[] }) => {
    const v = { standards, includeLater, mode, combine, ...next };
    window.history.replaceState(
      null,
      '',
      href('/bank', {
        course: course.id,
        topic: active,
        std: v.standards.join(','),
        later: v.includeLater,
        mode: v.mode === 'combine' ? 'combine' : '',
        topics: v.mode === 'combine' ? v.combine.join(',') : '',
      }),
    );
  };
  const setStandards = (ids: string[]) => (setStandardsState(ids), remember({ standards: ids }));
  const setIncludeLater = (on: boolean) => (setIncludeLaterState(on), remember({ includeLater: on }));
  const setMode = (m: ChooseMode) => (setModeState(m), remember({ mode: m }));
  const setCombine = (ids: string[]) => (setCombineState(ids), remember({ combine: ids }));

  const inTopic = questionsForTopic(active, course.id);
  const { visible, hidden } = filterLater(inTopic, course.id, includeLater);
  const pool = mode === 'combine' ? (combine.length >= 2 ? questionsCombining(combine, course.id) : []) : visible.filter((q) => q.standards.some((s) => standards.includes(s)));
  const questions = pool.filter((q) => (!type || q.types.includes(type)) && (!search || q.title.toLowerCase().includes(search.toLowerCase())));
  const listShown = mode === 'combine' ? combine.length >= 2 : standards.length > 0;
  const typesHere = [...new Set((mode === 'combine' ? pool : inTopic).flatMap((q) => q.types))];

  const filters = (
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
  );

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
                  <a
                    key={t.id}
                    href={href('/bank', { course: course.id, topic: t.id })}
                    className={`side-topic${mode === 'topic' && t.id === active ? ' is-active' : ''}${n === 0 ? ' is-empty' : ''}`}
                  >
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
          <div className="bank-mode">
            <ModeSwitch mode={mode} onChange={setMode} />
          </div>

          {mode === 'combine' ? (
            <>
              <CombineTopics course={course} selected={combine} onChange={setCombine} />
              {listShown && filters}
            </>
          ) : (
            <>
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
                  {filters}
                  <StandardPicker topic={topic} selected={standards} onChange={setStandards} counts={countByStandard(visible)} />
                  <LaterTopicsToggle checked={includeLater} onChange={setIncludeLater} hidden={hidden} />
                </>
              )}
              <p className="muted small mode-hint">
                Want questions that mix topics, such as forces with energy?{' '}
                <button className="link-btn" onClick={() => setMode('combine')}>
                  Use Combine topics
                </button>
                .
              </p>
            </>
          )}

          <div className="q-list" hidden={!listShown}>
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} courseId={course.id} />
            ))}
            {questions.length === 0 && listShown && (
              <div className="card empty">
                {mode === 'combine' && pool.length === 0 ? 'No questions combine all of these topics yet. Try choosing fewer topics.' : 'No questions match these filters.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function QuestionCard({ q, courseId }: { q: AnyTemplate; courseId: string }) {
  return (
    <article className="card q-card">
      <div className="q-card-main">
        <a className="q-card-title" href={href(`/q/${q.id}`)}>
          {q.title}
        </a>
        {q.level === 'HL' && <span className="chip chip-small chip-hl">HL</span>}
        <div className="q-card-meta">
          <TypeChips types={q.types} />
          <span className="muted small">{q.paper}</span>
          <UsesChips q={q} courseId={courseId} />
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
          <a className="btn btn-sm" href={href('/builder', { add: q.id, course: courseId })}>
            Add to assignment
          </a>
        </div>
      </div>
    </article>
  );
}
