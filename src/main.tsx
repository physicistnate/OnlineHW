import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles/theme.css';
import './styles/app.css';
import './styles/print.css';
import { App } from './App';
import { migrateStorage } from './store/migrate';

migrateStorage(); // carry over assignments, drafts and sign-in saved by earlier builds

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
