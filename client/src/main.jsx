import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import ErrorFallback from './components/ui/ErrorFallback';
import App from './App.jsx';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.MODE !== 'development',
  tracesSampleRate: 0.1,
  integrations: [Sentry.browserTracingIntegration()],
});

createRoot(document.getElementById('root')).render(
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      console.error('[ErrorBoundary]', error, info);
      Sentry.captureException(error, { extra: info });
    }}
    onReset={() => window.location.assign('/')}
  >
    <App />
    <Toaster position="top-center" richColors />
  </ErrorBoundary>
);
