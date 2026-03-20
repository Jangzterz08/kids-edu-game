import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div role="alert" style={styles.banner}>
      You&apos;re offline — progress may not save 🌊
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    background: 'var(--accent-red, #EF4444)',
    color: '#fff',
    textAlign: 'center',
    padding: '8px',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: '18px',
    fontWeight: 400,
  },
};
