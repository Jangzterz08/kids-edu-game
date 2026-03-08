import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api';

const KidContext = createContext(null);

export function KidProvider({ children }) {
  const [kids, setKids]           = useState([]);
  const [activeKid, setActiveKid] = useState(null);

  const refreshKids = useCallback(async () => {
    try {
      const { kids } = await api.get('/api/kids');
      setKids(kids);
      // If active kid was deleted, clear it
      if (activeKid && !kids.find(k => k.id === activeKid.id)) {
        setActiveKid(null);
      }
      return kids;
    } catch (err) {
      console.error('Failed to refresh kids', err);
      return [];
    }
  }, [activeKid]);

  function selectKid(kid) { setActiveKid(kid); }
  function clearKid()     { setActiveKid(null); }

  return (
    <KidContext.Provider value={{ kids, activeKid, setKids, selectKid, clearKid, refreshKids }}>
      {children}
    </KidContext.Provider>
  );
}

export function useKid() { return useContext(KidContext); }
