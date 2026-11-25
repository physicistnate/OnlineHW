/**
 * Printable assignment. "Download PDF" opens the browser's print dialog, where
 * "Save as PDF" produces the file. Layout is white paper with exam-style answer space.
 */
import { useMemo } from 'react';
import { CONSTANTS, SITE } from '../config/site';
import { courseOrDefault } from '../content/catalog';
import { getQuestion } from '../content/registry';
import { Graph } from '../components/Graph';
import { Logo } from '../components/Layout';
import { Markscheme, MarkschemeList, SolutionSteps, questionMeta } from '../components/QuestionView';
import { formatDue } from '../components/time';
import { Tex } from '../components/Tex';
import { instantiate } from '../engine/instance';
import { unitTex } from '../engine/units';
import type { AnyTemplate, PartInstance, QuestionInstance } from '../engine/types';
import { getAssignment } from '../store/assignments';
import { assignmentTemplates, studentInstance } from '../store/studentData';
import { marksLabel } from './BankPage';

/**
 * ?a=<assignment id>: a saved assignment, with the question versions it was made with.
 * ?ids=<id,id,...>&course=<course id>&title=...: the builder's current selection.
 * &student=<CLASS:username>: that student's numbers (the ones they see online, if this
 * browser has them pinned), otherwise the base version. &sol=1, &ms=1: answer key.
 */
export function PrintPage({ query }: { query: URLSearchParams }) {
  const assignment = query.get('a') ? getAssignment(query.get('a')!) : undefined;
  const ids = query.get('ids') ?? '';
  const title = query.get('title') || assignment?.title || 'Homework';
  const assignmentKey = assignment?.id ?? 'worksheet';
  const student = query.get('student') || '';
  const withSolutions = query.get('sol') === '1';
  const withMarkscheme = query.get('ms') === '1';
  const withExtensions = query.get('ext') === '1';

  const items = useMemo(() => {
    const templates: AnyTemplate[] = assignment
      ? assignmentTemplates(assignment).map((r) => r.template)
      : ids
          .split(',')
          .filter(Boolean)
          .map((id) => getQuestion(id))
          .filter((t): t is AnyTemplate => t !== undefined);
    return templates.map((t) => ({ template: t, instance: student ? studentInstance(t, student, assignmentKey, false) : instantiate(t, null) }));
  }, [assignment?.id, ids, student, assignmentKey]);

  const extMarks = (inst: QuestionInstance) => (withExtensions ? inst.extensions.reduce((s, x) => s + x.marks, 0) : 0);
  const marks = items.reduce((s, it) => s + it.instance.totalMarks + extMarks(it.instance), 0);
  const course = courseOrDefault(assignment?.courseId ?? query.get('course') ?? items[0]?.template.courses[0]);

  return (
    <div className="print-page">
      <div className="container print-toolbar no-print">
        <a className="btn btn-ghost btn-sm" href="#/builder">
          ← Back to builder
        </a>
        <div className="print-summary">
          <strong>{title}</strong> · {items.length} questions · {marksLabel(marks)} · {student ? `version for ${student}` : 'base version'}
          {(withSolutions || withMarkscheme) && ' · with answer key'}
          {withExtensions && ' · with written extensions'}
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Download PDF
        </button>
        <span className="muted small print-hint">In the print dialog, set the destination to “Save as PDF”.</span>
      </div>

      <div className="paper">
        <header className="paper-head">
          <div className="paper-brand">
            <Logo size={22} />
            <span>
              {SITE.orgName} · {SITE.productName}
            </span>
          </div>
          <h1>{title}</h1>
          <div className="paper-meta">
            {course.name} · {items.length} question{items.length === 1 ? '' : 's'} · {marksLabel(marks)}
            {assignment?.settings.dueAt ? ` · due ${formatDue(assignment.settings.dueAt)}` : ''}
          </div>
          {student ? (
            <div className="paper-student">
              Version for <strong>{student}</strong>. The numbers in this paper are this student’s own.
            </div>
          ) : (
            <div className="paper-fields">
              <span>Name</span>
              <span className="fill" />
              <span>Class</span>
              <span className="fill short" />
              <span>Date</span>
              <span className="fill short" />
            </div>
          )}
        </header>

        {course.printInstructions.length > 0 && (
          <div className="paper-instructions">
            <strong>Instructions</strong>
            <ul>
              {course.printInstructions.map((line) => (
                <li key={line}>
                  <Tex text={line.replace('{g}', String(CONSTANTS[course.style].g.primary))} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {items.length === 0 && <p>No questions selected.</p>}

        {items.map(({ template, instance }, i) => (
          <PrintQuestion key={template.id} number={i + 1} template={template} instance={instance} withExtensions={withExtensions} />
        ))}

        {(withSolutions || withMarkscheme) && items.length > 0 && (
          <section className="paper-key">
            <h2>{withSolutions ? 'Worked solutions' : 'Markscheme'}{withSolutions && withMarkscheme ? ' and markscheme' : ''}</h2>
            {items.map(({ template, instance }, i) => (
              <div key={template.id} className="key-question">
                <h3>
                  Question {i + 1}: {template.title}
                </h3>
                {instance.parts.map((part) => (
                  <div key={part.id} className="key-part">
                    {part.label && <div className="key-label">{part.label}</div>}
                    {withSolutions && <SolutionSteps steps={part.solution} />}
                    {withMarkscheme && <Markscheme part={part} />}
                  </div>
                ))}
                {withExtensions &&
                  instance.extensions.map((x, j) => (
                    <div key={`ext${j}`} className="key-part">
                      <div className="key-label">{instance.extensions.length > 1 ? `Extension ${j + 1}` : 'Extension'}</div>
                      <MarkschemeList marks={x.marks} lines={x.markscheme} />
                    </div>
                  ))}
              </div>
            ))}
          </section>
        )}

        <footer className="paper-foot">
          Generated by {SITE.orgName} {SITE.productName}
          {student ? ` · ${student} · ${assignmentKey}` : ''}
        </footer>
      </div>
    </div>
  );
}

function PrintQuestion({ number, template, instance, withExtensions }: { number: number; template: AnyTemplate; instance: QuestionInstance; withExtensions: boolean }) {
  const extensions = withExtensions ? instance.extensions : [];
  const total = instance.totalMarks + extensions.reduce((s, x) => s + x.marks, 0);
  // Multiple-choice questions are short: keep the stem and all options on one page.
  const keepTogether = instance.parts.every((p) => p.response.kind === 'mcq');
  return (
    <section className={`paper-question${keepTogether ? ' pq-keep' : ''}`}>
      <div className="pq-head">
        <span className="pq-num">{number}.</span>
        <span className="pq-meta">{questionMeta(template)}</span>
        <span className="pq-total">[{marksLabel(total)}]</span>
      </div>
      {instance.stem && <Tex block className="pq-stem" text={instance.stem} />}
      {instance.figure && <Graph spec={instance.figure} className="graph-print" />}
      {instance.parts.map((part) => (
        <PrintPart key={part.id} part={part} />
      ))}
      {extensions.map((x, i) => (
        <div key={`ext${i}`} className="pq-part pq-extension">
          <div className="pq-part-head">
            <span className="pq-label">{extensions.length > 1 ? `Extension ${i + 1}` : 'Extension'}</span>
            <Tex className="pq-prompt" text={x.prompt} />
            <span className="pq-marks">[{x.marks}]</span>
          </div>
          <Lines count={x.lines} className="writing-lines" />
        </div>
      ))}
    </section>
  );
}

/** Ruled lines drawn as borders (backgrounds are dropped when "Background graphics" is off). */
function Lines({ count, className }: { count: number; className: string }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

function PrintPart({ part }: { part: PartInstance }) {
  const r = part.response;
  return (
    <div className="pq-part">
      {(part.label || part.prompt) && (
        <div className="pq-part-head">
          {part.label && <span className="pq-label">{part.label}</span>}
          <Tex className="pq-prompt" text={part.prompt} />
          <span className="pq-marks">[{part.marks}]</span>
        </div>
      )}
      {r.kind === 'numeric' && (
        <>
          {/* Space for working on multi-mark calculations (one more line than marks). */}
          {part.marks > 1 && <Lines count={part.marks + 1} className="working-lines" />}
          <div className="answer-line">
            {r.symbol && <Tex text={`$${r.symbol} =$`} />}
            <span className="dots" />
            {r.unit && <Tex text={`$${unitTex(r.unit)}$`} />}
          </div>
        </>
      )}
      {r.kind === 'text' && <Lines count={r.lines} className="writing-lines" />}
      {r.kind === 'graph' && <Graph spec={r.axes} className="graph-print" />}
      {r.kind === 'mcq' && (
        <table className="mcq-print">
          {r.columns && (
            <thead>
              <tr>
                <th />
                {r.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {r.options.map((o) => (
              <tr key={o.key}>
                <td className="mcq-print-letter">{o.letter}.</td>
                {(o.cells ?? [o.text ?? '']).map((c, i) => (
                  <td key={i}>
                    <Tex text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
