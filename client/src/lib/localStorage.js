const KEY = (kidId) => `edu_progress_${kidId}`;

export function loadOfflineProgress(kidId) {
  try {
    const raw = localStorage.getItem(KEY(kidId));
    return raw ? JSON.parse(raw) : { kidId, dirty: false, entries: {} };
  } catch {
    return { kidId, dirty: false, entries: {} };
  }
}

export function saveOfflineProgress(kidId, entries, dirty = true) {
  const data = { kidId, dirty, entries, lastSavedAt: new Date().toISOString() };
  localStorage.setItem(KEY(kidId), JSON.stringify(data));
}

export function upsertOfflineLesson(kidId, lessonId, update) {
  const store = loadOfflineProgress(kidId);
  const existing = store.entries[lessonId] || {};
  store.entries[lessonId] = {
    ...existing,
    ...update,
    lessonId,
    syncedAt: null,
  };
  store.dirty = true;
  saveOfflineProgress(kidId, store.entries, true);
}

export function markSynced(kidId) {
  const store = loadOfflineProgress(kidId);
  Object.values(store.entries).forEach(e => { e.syncedAt = new Date().toISOString(); });
  store.dirty = false;
  saveOfflineProgress(kidId, store.entries, false);
}
