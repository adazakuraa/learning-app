import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles/global.css';
import App from './App';
import { CatalogProvider } from './lib/catalog';
import { ProgressProvider } from './lib/progress/ProgressProvider';
import { SettingsProvider } from './lib/settings';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <CatalogProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </CatalogProvider>
    </SettingsProvider>
  </StrictMode>,
);
