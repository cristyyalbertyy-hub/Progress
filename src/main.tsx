import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProgressSyncProvider } from './context/ProgressSyncContext';
import { detectLanguage } from './i18n';
import './index.css';

document.documentElement.lang = detectLanguage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <ProgressSyncProvider>
          <App />
        </ProgressSyncProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
);
