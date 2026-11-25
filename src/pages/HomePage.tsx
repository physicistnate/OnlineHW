import { SITE, TOLERANCE } from '../config/site';
import { IB_PHYSICS_SL, allTopics } from '../content/catalog';
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
    title: 'Printable assignments',
    body: 'Choose questions by topic or standard and download a PDF of the base version or any student’s version, with or without full solutions.',
  },
];

export function HomePage() {
  const topics = allTopics(IB_PHYSICS_SL);
  const withQuestions = topics.filter((t) => questionsForTopic(t.id).length > 0);
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
            <div className="stat-num">{IB_PHYSICS_SL.name}</div>
            <div className="stat-label">
              {withQuestions.length} of {topics.length} SL topics started
            </div>
          </div>
          <div className="stat">
            <div className="stat-num">{TOLERANCE.carrySigFigs.join(' or ')} s.f.</div>
            <div className="stat-label">intermediate rounding accepted in multi-step answers</div>
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
              <li>IB Physics SL · A.1 Kinematics: {questionsForTopic('ibp.A.1').length} questions (calculation, graph reading and drawing, multiple choice, written)</li>
              <li>Question preview with any student’s numbers, worked solutions and markschemes</li>
              <li>Assignment builder and printable PDFs (base or per-student version)</li>
              <li>Student demo: sign in with a class code, work is saved and numbers stay fixed</li>
            </ul>
          </div>
          <div>
            <h4 className="next">Coming next</h4>
            <ul>
              <li>Remaining questions for A.1, then the other SL topics</li>
              <li>Supabase database: real teacher and student accounts, classes and saved work across devices</li>
              <li>Teacher gradebook by class, assignment and student, with live progress</li>
              <li>Deployment to GitHub Pages</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
