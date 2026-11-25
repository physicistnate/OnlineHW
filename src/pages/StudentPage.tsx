/**
 * Student demo: sign in with a class code and username, see assignments with
 * progress, and work through them. Work is saved after every change and the
 * numbers come from the student's seed, so they are the same at every login.
 */
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getQuestion } from '../content/registry';
import { PageHeader } from '../components/Layout';
import { QuestionView } from '../components/QuestionView';
import { summarize } from '../engine/grading';
import { instantiate, seedFor } from '../engine/instance';
import type { AnyTemplate } from '../engine/types';
import { href } from '../router';
import { getAssignment, useAssignments, type Assignment } from '../store/assignments';
import { loadWork, useQuestionWork } from '../store/progress';
import { signIn, signOut, studentKey, useSession } from '../store/session';
import { storageAvailable, subscribe } from '../store/storage';

function StorageWarning() {
  if (storageAvailable()) return null;
  return (
    <div className="banner banner-warn" role="alert">
      This browser is blocking storage (for example in a private window), so your answers will not be saved. Open the site in a normal window.
    </div>
  );
}

function useStorageTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  return tick;
}

interface Progress {
  partsDone: number;
  parts: number;
  earned: number;
  autoMax: number;
  pending: number;
}

function assignmentProgress(a: Assignment, sKey: string): Progress {
  const p: Progress = { partsDone: 0, parts: 0, earned: 0, autoMax: 0, pending: 0 };
  for (const id of a.questionIds) {
    const t = getQuestion(id);
    if (!t) continue;
    const inst = instantiate(t, seedFor(sKey, a.id, t.id));
    const work = loadWork(sKey, a.id, t.id);
    const results = Object.fromEntries(inst.parts.map((part) => [part.id, work[part.id]?.result]));
    const s = summarize(inst, results);
    p.parts += inst.parts.length;
    p.partsDone += inst.parts.filter((part) => work[part.id]?.result && work[part.id]?.result?.status !== 'invalid').length;
    p.earned += s.earned;
    p.autoMax += s.autoMax;
    p.pending += s.pendingMarks;
  }
  return p;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((100 * value) / max) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function SignIn({ message }: { message?: string }) {
  const [classCode, setClassCode] = useState('DEMO');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9-]{2,12}$/.test(classCode.trim())) return setError('Class codes are 2–12 letters or numbers.');
    if (!/^[A-Za-z0-9._-]{2,30}$/.test(username.trim())) return setError('Usernames are 2–30 letters, numbers, dots or dashes.');
    signIn(classCode, username);
  };
  return (
    <div className="signin-wrap">
      <form className="card signin" onSubmit={submit}>
        <h1>Student sign in</h1>
        {message && <p className="muted">{message}</p>}
        <label className="field">
          <span>Class code</span>
          <input value={classCode} onChange={(e) => setClassCode(e.target.value)} autoComplete="off" />
        </label>
        <label className="field">
          <span>Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus placeholder="e.g. alex" />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit">
          Sign in
        </button>
        <p className="muted small">
          Demo mode: any class code works and there is no password yet. Work is saved in this browser. Accounts with passwords arrive with the database in Phase 3.
        </p>
      </form>
    </div>
  );
}

export function StudentHome() {
  const session = useSession();
  const assignments = useAssignments();
  useStorageTick();
  if (!session) return <SignIn />;
  const sKey = studentKey(session.classCode, session.username);

  return (
    <div className="container">
      <PageHeader
        eyebrow={`Class ${session.classCode}`}
        title={`Hi, ${session.username}`}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
        }
      >
        Your assignments. Answers are saved as you work, and your numbers stay the same every time you sign in.
      </PageHeader>
      <StorageWarning />
      <div className="assignment-grid">
        {assignments.map((a) => {
          const p = assignmentProgress(a, sKey);
          return (
            <a key={a.id} className="card assignment-card" href={href(`/student/a/${a.id}`)}>
              <div className="ac-title">{a.title}</div>
              <div className="muted small">
                {a.questionIds.length} questions{a.releaseSolutions ? ' · solutions released' : ''}
              </div>
              <ProgressBar value={p.partsDone} max={p.parts} />
              <div className="ac-stats">
                <span>
                  {p.partsDone}/{p.parts} parts done
                </span>
                <span>
                  {p.earned}/{p.autoMax} marks{p.pending ? ` · ${p.pending} teacher-marked` : ''}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function StudentQuestion({ template, number, sKey, assignment }: { template: AnyTemplate; number: number; sKey: string; assignment: Assignment }) {
  const seed = seedFor(sKey, assignment.id, template.id);
  const instance = useMemo(() => instantiate(template, seed), [template, seed]);
  const { work, update } = useQuestionWork(sKey, assignment.id, template.id);
  return (
    <QuestionView
      template={template}
      instance={instance}
      number={number}
      work={work}
      onWork={update}
      showSolutions={assignment.releaseSolutions}
      showMarkscheme={assignment.releaseSolutions}
    />
  );
}

export function StudentAssignment({ id }: { id: string }) {
  const session = useSession();
  useAssignments();
  useStorageTick();
  if (!session) return <SignIn message="Sign in to open this assignment." />;
  const assignment = getAssignment(id);
  if (!assignment) {
    return (
      <div className="container">
        <div className="card empty">
          Assignment not found. <a href="#/student">Back to your assignments</a>
        </div>
      </div>
    );
  }
  const sKey = studentKey(session.classCode, session.username);
  const p = assignmentProgress(assignment, sKey);
  const templates = assignment.questionIds.map((qid) => getQuestion(qid)).filter((t): t is AnyTemplate => t !== undefined);

  return (
    <div className="container">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="#/student">My assignments</a>
        <span>/</span>
        <span>{assignment.title}</span>
      </nav>
      <div className="card assignment-head">
        <div>
          <h1>{assignment.title}</h1>
          <div className="muted small">
            Signed in as <strong>{sKey}</strong> · {templates.length} questions
          </div>
        </div>
        <div className="assignment-score">
          <ProgressBar value={p.partsDone} max={p.parts} />
          <div className="ac-stats">
            <span>
              {p.partsDone}/{p.parts} parts done
            </span>
            <span>
              {p.earned}/{p.autoMax} marks{p.pending ? ` · ${p.pending} teacher-marked` : ''}
            </span>
          </div>
        </div>
      </div>
      <StorageWarning />
      {assignment.releaseSolutions && <div className="banner banner-info">Your teacher has released the worked solutions and markscheme for this assignment. They use your numbers.</div>}
      {templates.map((t, i) => (
        <StudentQuestion key={t.id} template={t} number={i + 1} sKey={sKey} assignment={assignment} />
      ))}
    </div>
  );
}
