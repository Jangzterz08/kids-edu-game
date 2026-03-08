import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [user, setUser]       = useState(null);

  useEffect(() => {
    if (!supabase) {
      // Dev mock
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Register / upsert user row when session is present
  useEffect(() => {
    if (!session) { setUser(null); return; }
    api.post('/api/auth/register', {}).then(setUser).catch(console.error);
  }, [session?.access_token]);

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email, password, name) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (name) {
      // register will be called by onAuthStateChange; pass name on next tick
      setTimeout(() => api.post('/api/auth/register', { name }).then(setUser).catch(console.error), 500);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user, signInWithEmail, signUpWithEmail, signOut, loading: session === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
