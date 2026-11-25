import { useEffect } from 'react';
import { SITE } from './config/site';
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
      page = <BankPage topicId={route.query.get('topic') ?? undefined} />;
      title = 'Question bank';
      break;
    case 'q':
      page = <PreviewPage key={id} id={id ?? ''} query={route.query} />;
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
      page = route.segments[1] === 'a' && route.segments[2] ? <StudentAssignment id={route.segments[2]} /> : <StudentHome />;
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
