import { useEffect, useState, useRef } from 'react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    // Increment visit counter
    const visits = parseInt(localStorage.getItem('kl_visit_count') || '0', 10) + 1;
    localStorage.setItem('kl_visit_count', String(visits));

    // Don't show if < 2 visits or already dismissed
    if (visits < 2) return;
    if (localStorage.getItem('kl_pwa_dismissed') === '1') return;

    // Check iOS (no beforeinstallprompt on iOS)
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua) && !window.MSStream) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Android / Chrome — listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Hide if already installed
    const installed = () => { setShow(false); };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  function dismiss() {
    localStorage.setItem('kl_pwa_dismissed', '1');
    setShow(false);
  }

  async function handleInstall() {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    dismiss();
  }

  if (!show) return null;

  return (
    <div role="complementary" aria-label="Install app prompt" style={styles.pill}>
      <span style={styles.text}>
        {isIOS
          ? "Tap Share then 'Add to Home Screen'"
          : 'Add KidsLearn to your home screen!'}
      </span>
      {!isIOS && (
        <button onClick={handleInstall} style={styles.installBtn}>
          Install App
        </button>
      )}
      <button onClick={dismiss} aria-label="Dismiss install prompt" style={styles.dismissBtn}>
        ✕
      </button>
    </div>
  );
}

const styles = {
  pill: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#6C5CE7',
    color: '#fff',
    borderRadius: '16px',
    padding: '12px 20px',
    fontFamily: "'Fredoka', sans-serif",
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 9999,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  text: {
    flex: 1,
  },
  installBtn: {
    background: '#fff',
    color: '#6C5CE7',
    border: 'none',
    borderRadius: '12px',
    padding: '8px 16px',
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    minHeight: '44px',
    whiteSpace: 'nowrap',
  },
  dismissBtn: {
    background: 'transparent',
    color: '#fff',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    minHeight: '44px',
    minWidth: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
