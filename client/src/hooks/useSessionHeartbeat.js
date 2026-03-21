import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

export default function useSessionHeartbeat() {
  const sessionIdRef = useRef(null);

  useEffect(() => {
    let interval;

    async function startSession() {
      try {
        const { sessionId } = await api.post('/api/sessions/heartbeat', {});
        sessionIdRef.current = sessionId;
      } catch (e) { /* silent — analytics non-critical */ }
    }

    async function heartbeat() {
      if (!sessionIdRef.current) return;
      try {
        await api.post('/api/sessions/heartbeat', { sessionId: sessionIdRef.current });
      } catch (e) { /* silent */ }
    }

    async function endSession() {
      if (!sessionIdRef.current) return;
      try {
        await api.post('/api/sessions/end', { sessionId: sessionIdRef.current });
      } catch (e) { /* silent */ }
    }

    startSession();
    interval = setInterval(heartbeat, 60000);

    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        navigator.sendBeacon(
          '/api/sessions/end',
          JSON.stringify({ sessionId: sessionIdRef.current })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
  }, []);
}
