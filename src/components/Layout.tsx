import type { ReactNode } from 'react';
import { SITE } from '../config/site';
import { useSession } from '../store/session';

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#16213a" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="none" stroke="#e9c46a" strokeOpacity="0.35" />
      <path d="M16 27V11.5" stroke="#e9c46a" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="16" cy="8.6" rx="2.4" ry="4.2" fill="#e9c46a" />
      <ellipse cx="11.4" cy="14.6" rx="2.1" ry="3.9" transform="rotate(-38 11.4 14.6)" fill="#e9c46a" />
      <ellipse cx="20.6" cy="14.6" rx="2.1" ry="3.9" transform="rotate(38 20.6 14.6)" fill="#e9c46a" />
      <ellipse cx="11.8" cy="21" rx="1.9" ry="3.5" transform="rotate(-42 11.8 21)" fill="#e9c46a" fillOpacity="0.8" />
      <ellipse cx="20.2" cy="21" rx="1.9" ry="3.5" transform="rotate(42 20.2 21)" fill="#e9c46a" fillOpacity="0.8" />
    </svg>
  );
}

const NAV = [
  { href: '#/bank', label: 'Question bank', match: ['bank', 'q'] },
  { href: '#/builder', label: 'Assignment builder', match: ['builder', 'print'] },
  { href: '#/student', label: 'Student view', match: ['student'] },
];

export function Header({ section }: { section: string }) {
  const session = useSession();
  return (
    <header className="site-header no-print">
      <div className="container header-inner">
        <a className="brand" href="#/" aria-label={`${SITE.orgName} ${SITE.productName}, home`}>
          <Logo />
          <span className="brand-text">
            <span className="brand-org">{SITE.orgName}</span>
            <span className="brand-product">{SITE.productName}</span>
          </span>
        </a>
        <nav className="main-nav" aria-label="Main">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={item.match.includes(section) ? 'is-active' : undefined}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-right">
          {session ? (
            <a className="chip chip-user" href="#/student" title="Signed in to the student demo">
              {session.username} · {session.classCode}
            </a>
          ) : (
            <span className="chip chip-phase" title={SITE.phaseNote}>
              Preview
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer no-print">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo size={22} />
          <span>
            © {SITE.year} {SITE.orgName} · {SITE.productName}
          </span>
        </div>
        <div className="muted small">{SITE.phaseNote}</div>
      </div>
    </footer>
  );
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {children && <div className="page-sub">{children}</div>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
