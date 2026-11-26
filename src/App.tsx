import { useEffect } from 'react';
import { SITE } from './config/site';
import { dualFromQuery } from './components/DualStandardPicker';
import { Footer, Header } from './components/Layout';
import { BankPage } from './pages/BankPage';
import { BuilderPage } from './pages/BuilderPage';
import { HomePage } from './pages/HomePage';
import { PreviewPage } from './pages/PreviewPage';
import { PrintPage } from './pages/PrintPage';
import { StudentAssignment, StudentHome } from './pages/StudentPage';
import { useRoute } from './router';

export function App() {
  const route = useRoute();
  const [section = '', id] = route.segments;

  let page;
  let title = '';
  switch (section) {
    case '':
      page = <HomePage />;
      break;
    case 'bank':
      // Keyed by course and topic, so following a topic link starts with no standards chosen.
      page = (
        <BankPage
          key={`${route.query.get('course')}|${route.query.get('topic')}`}
          courseId={route.query.get('course')}
          topicId={route.query.get('topic') ?? undefined}
          standards={(route.query.get('std') ?? '').split(',').filter(Boolean)}
          includeLater={route.query.get('later') === '1'}
          mode={route.query.get('mode') === 'combine' ? 'combine' : 'topic'}
          combine={(route.query.get('topics') ?? '').split(',').filter(Boolean)}
          dual={dualFromQuery(route.query)}
        />
      );
      title = 'Question bank';
      break;
    case 'q':
      // Keyed by the whole address, so following a link to another student's version
      // (or other reveal settings) of the same question starts fresh.
      page = <PreviewPage key={`${id}?${route.query.toString()}`} id={id ?? ''} query={route.query} />;
      title = 'Question preview';
      break;
    case 'builder':
      page = <BuilderPage key={route.query.get('add') ?? ''} query={route.query} />;
      title = 'Assignment builder';
      break;
    case 'print':
      page = <PrintPage query={route.query} />;
      title = route.query.get('title') ?? 'Print';
      break;
    case 'student':
      page =
        route.segments[1] === 'a' && route.segments[2] ? (
          <StudentAssignment key={route.segments[2]} id={route.segments[2]} />
        ) : (
          <StudentHome closedId={route.query.get('closed')} />
        );
      title = 'Student view';
      break;
    default:
      page = (
        <div className="container">
          <div className="card empty">
            Page not found. <a href="#/">Go to the home page</a>
          </div>
        </div>
      );
  }

  useEffect(() => {
    document.title = title ? `${title} · ${SITE.orgName} ${SITE.productName}` : `${SITE.orgName} · ${SITE.productName}`;
  }, [title]);

  return (
    <div className={`app section-${section || 'home'}`}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Header section={section} />
      <main id="main" tabIndex={-1}>
        {page}
      </main>
      <Footer />
    </div>
  );
}
