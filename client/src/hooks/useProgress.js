import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { loadOfflineProgress, upsertOfflineLesson, markSynced } from '../lib/localStorage';

export function useProgress(kidId) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(false);

  const fetchProgress = useCallback(async () => {
    if (!kidId) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/progress/${kidId}`);
      setProgress(data.progress);
    } catch (err) {
      console.error('Progress fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [kidId]);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  // Sync dirty offline progress on mount
  useEffect(() => {
    if (!kidId) return;
    const store = loadOfflineProgress(kidId);
    if (!store.dirty) return;
    const entries = Object.values(store.entries).filter(e => !e.syncedAt);
    if (entries.length === 0) return;
    api.post(`/api/progress/${kidId}/sync`, { entries })
      .then(() => { markSynced(kidId); fetchProgress(); })
      .catch(() => {
        toast.error('Progress not saved \u2014 reconnect to try again', { duration: 5000 });
      });
  }, [kidId]);

  async function recordLesson(lessonId, update) {
    // Optimistic local save
    upsertOfflineLesson(kidId, lessonId, update);
    try {
      const result = await api.post(`/api/progress/${kidId}/lesson/${lessonId}`, update);

      if (result.coinsDelta > 0) {
        toast.success(`+\uD83E\uDE99 ${result.coinsDelta} coins!`, { duration: 3000 });
      }
      if (result.streakCount) {
        toast(`\uD83D\uDD25 ${result.streakCount} day streak!`, { duration: 3500 });
      }

      return result;
    } catch (err) {
      console.error('Progress save failed \u2014 will sync later', err);
      toast.error('Something went wrong. Try again!', { duration: 4000 });
    }
  }

  return { progress, loading, recordLesson, refetch: fetchProgress };
}
