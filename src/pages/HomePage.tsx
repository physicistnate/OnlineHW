import { ASSIGNMENT_DEFAULTS, SITE } from '../config/site';
import { AP_PHYSICS_C_MECH, COURSES, IBPP_PHYSICS_MATH, IB_PHYSICS_HL, IB_PHYSICS_SL, UNIVERSITY_MODERN_PHYSICS, UNIVERSITY_PHYSICS_1, allTopics } from '../content/catalog';
import { ALL_QUESTIONS, questionsForCourse, questionsForTopic } from '../content/registry';
import { Logo } from '../components/Layout';

const FEATURES = [
  {
    title: 'Every student gets their own numbers',
    body: 'Given data are randomized per student and per assignment from a fixed seed, so numbers never change between logins and worked solutions use the same values.',
  },
  {
    title: 'Answers checked the way a teacher would',
    body: `Each calculation is re-run with every intermediate value kept exact, rounded to 3 s.f. or rounded to 2 s.f. Any answer in that range, or within 2% of the exact answer, is accepted, and significant figures are never penalized.`,
  },
  {
    title: 'Worked solutions and marking keys',
    body: 'Step-by-step worked solutions put the explanation beside the maths. IB markschemes award marks the IB way, including error carried forward; AP questions have scoring guidelines and university questions grading rubrics in the same spirit.',
  },
  {
    title: 'Tries, due dates and two grades',
    body: `Each part has a set number of tries (multiple choice: half the choices). Assignments close at their due time, with a warning ${ASSIGNMENT_DEFAULTS.warningMinutes.join(' and ')} minutes before, and can open each student’s own answer key afterwards. Students see a class grade (${ASSIGNMENT_DEFAULTS.penaltyPerTry} points off per extra try) and their IB marks.`,
  },
  {
    title: 'Assignments from any mix of courses',
    body: 'Tick questions as you browse any course and topic: they collect in your assignment until you save it, and you can edit it later. Download a PDF of the base version or any student’s version, with or without full solutions.',
  },
];

export function HomePage() {
  const topics = allTopics(IB_PHYSICS_SL);
  // IB Physics questions only (HL includes every SL question); IB++ questions share these topics.
  const ib = (topicId: string) => questionsForTopic(topicId, IB_PHYSICS_HL.id);
  const withQuestions = topics.filter((t) => questionsForTopic(t.id, IB_PHYSICS_SL.id).length > 0);
  const hlOnlyToCome = allTopics(IB_PHYSICS_HL).filter((t) => t.hlOnly && ib(t.id).length === 0).length;
  const themeB = allTopics(IB_PHYSICS_HL).filter((t) => t.id.startsWith('ibp.B.'));
  const themeD = allTopics(IB_PHYSICS_HL).filter((t) => t.id.startsWith('ibp.D.'));
  const themeE = allTopics(IB_PHYSICS_HL).filter((t) => t.id.startsWith('ibp.E.'));
  const hlCount = (topicId: string) => ib(topicId).filter((q) => q.level === 'HL').length;
  /** "D.1 Gravitational fields: 6 questions (2 HL only); …" for a theme's topics. */
  const themeCounts = (theme: typeof themeE) =>
    theme
      .map((t) => {
        const n = ib(t.id).length;
        const hl = hlCount(t.id);
        return `${t.code} ${t.name}: ${n} questions${t.hlOnly ? ' (HL only)' : hl ? ` (${hl} HL only)` : ''}`;
      })
      .join('; ');
  const marks = ALL_QUESTIONS.reduce((sum, q) => sum + q.parts.reduce((s, p) => s + p.marks, 0), 0);
  const ibpp = questionsForCourse(IBPP_PHYSICS_MATH.id);

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
            <div className="stat-num">{COURSES.length} courses</div>
            <div className="stat-label">
              IB Physics SL &amp; HL ({withQuestions.length} of {topics.length} SL topics started · {hlOnlyToCome} HL-only topics to come), AP Physics C: Mechanics,
              University Physics I, University Modern Physics and IB++ Physics/Math
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
                IB Physics · A.1 Kinematics: {ib('ibp.A.1').length} questions; A.2 Forces and momentum: {ib('ibp.A.2').length} questions (
                {hlCount('ibp.A.2')} HL only); A.3 Work, energy and power: {ib('ibp.A.3').length} questions.
                Calculation, graph reading and drawing, and multiple choice, all marked by the computer
              </li>
              <li>
                IB Physics · Theme B The particulate nature of matter: {themeCounts(themeB)}, including energy balance of the Earth, a p–V cycle and
                graphs for absolute zero and internal resistance
              </li>
              <li>
                IB Physics · Theme D Fields: {themeCounts(themeD)}, including a velocity selector and graphs of potential and of a changing field
              </li>
              <li>
                IB Physics · Theme E Nuclear and quantum physics: {themeCounts(themeE)}, including graph questions (half-life, photoelectric effect)
              </li>
              <li>
                Trial units: {AP_PHYSICS_C_MECH.name} Unit 3 Work, Energy, and Power ({questionsForCourse(AP_PHYSICS_C_MECH.id).length} questions) and{' '}
                {UNIVERSITY_PHYSICS_1.name} Topic 3 Work, energy and power ({questionsForCourse(UNIVERSITY_PHYSICS_1.id).length} questions, with integrals)
              </li>
              <li>
                {UNIVERSITY_MODERN_PHYSICS.name}: {questionsForCourse(UNIVERSITY_MODERN_PHYSICS.id).length} questions on the Theme E ideas (light, atoms, matter
                waves, decay, fission and fusion, stars), with integrals, differentials and differential equations
              </li>
              <li>
                {IBPP_PHYSICS_MATH.name} (trial): {ibpp.length} IB Physics problems that need IB Mathematics on purpose, for Themes A, D and E with Topics 4
                (statistics and probability) and 5 (calculus); {ibpp.filter((q) => q.level !== 'HL' && q.math?.level !== 'HL').length} use only SL physics and
                SL mathematics. Choose physics and mathematics standards side by side, with SL or HL for each subject
              </li>
              <li>Question preview with any student’s numbers, worked solutions and markschemes</li>
              <li>
                Assignment builder: questions from any number of courses and topics in one assignment, collected as you browse; several standards at once; tries
                per part, due date, answer key release, class-grade rules; saved assignments can be edited
              </li>
              <li>Printable PDFs (base or per-student version)</li>
              <li>Student demo: sign in with a class code; numbers are pinned, work is saved, countdown before the due time, class grade and IB marks</li>
            </ul>
          </div>
          <div>
            <h4 className="next">Coming next</h4>
            <ul>
              <li>Theme C Wave behaviour (the remaining SL topics), the HL-only topics A.4 and A.5; more AP and university units if the trial units work well</li>
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
