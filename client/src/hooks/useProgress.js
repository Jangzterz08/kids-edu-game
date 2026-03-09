import { useState, useEffect, useCallback } from 'react';
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
      .catch(() => {}); // silent — will retry next session
  }, [kidId]);

  async function recordLesson(lessonId, update) {
    // Optimistic local save
    upsertOfflineLesson(kidId, lessonId, update);
    try {
      await api.post(`/api/progress/${kidId}/lesson/${lessonId}`, update);
    } catch (err) {
      console.error('Progress save failed — will sync later', err);
    }
  }

  return { progress, loading, recordLesson, refetch: fetchProgress };
}
