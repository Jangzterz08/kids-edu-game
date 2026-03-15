import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const KidContext = createContext(null);

export function KidProvider({ children }) {
  const [kids, setKids]           = useState([]);
  const [activeKid, setActiveKid] = useState(null);
  const { kidSession } = useAuth();

  // Auto-set activeKid when kid logs in directly via PIN
  useEffect(() => {
    if (kidSession?.kid) {
      setActiveKid(kidSession.kid);
    }
  }, [kidSession]);

  const refreshKids = useCallback(async () => {
    try {
      const { kids } = await api.get('/api/kids');
      setKids(kids);
      if (activeKid) {
        const updated = kids.find(k => k.id === activeKid.id);
        if (updated) {
          setActiveKid(updated);
        } else {
          setActiveKid(null);
        }
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
