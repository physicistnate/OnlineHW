import { ASSIGNMENT_DEFAULTS, SITE } from '../config/site';
import { IB_PHYSICS_HL, IB_PHYSICS_SL, allTopics } from '../content/catalog';
import { ALL_QUESTIONS, questionsForTopic } from '../content/registry';
import { Logo } from '../components/Layout';

const FEATURES = [
  {
    title: 'Every student gets their own numbers',
    body: 'Given data are randomized per student and per assignment from a fixed seed, so numbers never change between logins and worked solutions use the same values.',
  },
  {
    title: 'Answers checked the way a teacher would',
    body: `Each calculation is re-run with every intermediate value kept exact, rounded to 3 s.f. or rounded to 2 s.f. Any answer in that range is accepted, and significant figures are never penalized.`,
  },
  {
    title: 'IB-style solutions and markschemes',
    body: 'Step-by-step worked solutions put the explanation beside the maths, and markschemes award marks the IB way, including error carried forward.',
  },
  {
    title: 'Tries, due dates and two grades',
    body: `Each part has a set number of tries (multiple choice: half the choices). Assignments close at their due time, with a warning ${ASSIGNMENT_DEFAULTS.warningMinutes.join(' and ')} minutes before, and can open each student’s own answer key afterwards. Students see a class grade (${ASSIGNMENT_DEFAULTS.penaltyPerTry} points off per extra try) and their IB marks.`,
  },
  {
    title: 'Printable assignments',
    body: 'Choose questions by course, topic and standards, and download a PDF of the base version or any student’s version, with or without full solutions.',
  },
];

export function HomePage() {
  const topics = allTopics(IB_PHYSICS_SL);
  const withQuestions = topics.filter((t) => questionsForTopic(t.id, IB_PHYSICS_SL.id).length > 0);
  const hlOnly = allTopics(IB_PHYSICS_HL).filter((t) => t.hlOnly).length;
  const marks = ALL_QUESTIONS.reduce((sum, q) => sum + q.parts.reduce((s, p) => s + p.marks, 0), 0);

  return (
    <div className="container home">
      <section className="hero">
        <div className="hero-text">
          <div className="eyebrow">
            <Logo size={18} /> {SITE.orgName}
          </div>
          <h1>{SITE.productName}</h1>
          <p className="lead">{SITE.tagline}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/bank">
              Browse the question bank
            </a>
            <a className="btn" href="#/builder">
              Build an assignment
            </a>
            <a className="btn btn-ghost" href="#/student">
              Try the student view →
            </a>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat">
            <div className="stat-num">{ALL_QUESTIONS.length}</div>
            <div className="stat-label">questions ({marks} marks)</div>
          </div>
          <div className="stat">
            <div className="stat-num">IB Physics SL &amp; HL</div>
            <div className="stat-label">
              {withQuestions.length} of {topics.length} SL topics started · {hlOnly} HL-only topics to come
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="card feature">
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="card status-card">
        <h2>Phase 1 status</h2>
        <div className="status-cols">
          <div>
            <h4 className="ok">Working now</h4>
            <ul>
              <li>Question engine: seeded randomization, rounding-aware marking, error carried forward</li>
              <li>
                IB Physics · A.1 Kinematics: {questionsForTopic('ibp.A.1').length} questions; A.2 Forces and momentum: {questionsForTopic('ibp.A.2').length} questions (one HL
                only). Calculation, graph reading and drawing, and multiple choice, all marked by the computer
              </li>
              <li>Question preview with any student’s numbers, worked solutions and markschemes</li>
              <li>Assignment builder: SL or HL, several standards at once, tries per part, due date, answer key release, class-grade rules</li>
              <li>Printable PDFs (base or per-student version)</li>
              <li>Student demo: sign in with a class code; numbers are pinned, work is saved, countdown before the due time, class grade and IB marks</li>
            </ul>
          </div>
          <div>
            <h4 className="next">Coming next</h4>
            <ul>
              <li>A.3 Work, energy and power, then the other SL topics and the HL-only topics</li>
              <li>Supabase database: real teacher and student accounts, classes, saved work across devices, server-side marking and deadlines</li>
              <li>Teacher gradebook by class, assignment, student and standard</li>
              <li>Hosting on a host school networks allow (Cloudflare Pages or Netlify)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
