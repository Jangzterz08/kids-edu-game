import { useCallback } from 'react';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  const handleReset = useCallback(() => {
    window.location.assign('/');
  }, []);

  return (
    <div role="main" style={styles.container}>
      <div style={styles.mascot}>🐙</div>
      <h2 style={styles.heading}>Oops! Something went wrong</h2>
      <p style={styles.subtext}>Don&apos;t worry — Ollie will help you get back.</p>
      <button onClick={handleReset} style={styles.button}>
        Try again
      </button>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #8BD4F2 0%, #3BBFE8 60%, #E8C87A 88%, #D4A84B 100%)',
    padding: '24px',
  },
  mascot: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  heading: {
    color: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    fontSize: '28px',
    lineHeight: 1.2,
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  subtext: {
    color: '#fff',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 400,
    fontSize: '18px',
    margin: '0 0 24px 0',
    textAlign: 'center',
  },
  button: {
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    fontSize: '18px',
    color: '#fff',
    background: 'var(--primary, #6C5CE7)',
    border: 'none',
    borderRadius: '16px',
    padding: '12px 32px',
    cursor: 'pointer',
    minHeight: '44px',
  },
};
