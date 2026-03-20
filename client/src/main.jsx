import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';
import ErrorFallback from './components/ui/ErrorFallback';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary
    FallbackComponent={ErrorFallback}
    onError={(error, info) => {
      console.error('[ErrorBoundary]', error, info);
    }}
    onReset={() => window.location.assign('/')}
  >
    <App />
    <Toaster position="top-center" richColors />
  </ErrorBoundary>
);
