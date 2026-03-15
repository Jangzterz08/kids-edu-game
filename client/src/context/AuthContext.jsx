import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [user, setUser]       = useState(null);
  const [kidSession, setKidSession] = useState(null); // { kid, token } for PIN login

  // Restore kid session from sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('kidToken');
    const savedKid = sessionStorage.getItem('kidData');
    if (savedToken && savedKid) {
      try {
        setKidSession({ token: savedToken, kid: JSON.parse(savedKid) });
      } catch {
        sessionStorage.removeItem('kidToken');
        sessionStorage.removeItem('kidData');
      }
    }
  }, []);

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
    // Return the user row (with role) for redirect logic
    const u = await api.post('/api/auth/register', {});
    setUser(u);
    return u;
  }

  async function signUpWithEmail(email, password, name, role = 'parent') {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // Wait briefly for auth state to propagate, then register with role
    await new Promise(r => setTimeout(r, 500));
    const u = await api.post('/api/auth/register', { name, role });
    setUser(u);
    return u;
  }

  async function signInAsKid(kidId, pin) {
    const result = await api.public.post('/api/auth/kid-login', { kidId, pin });
    sessionStorage.setItem('kidToken', result.token);
    sessionStorage.setItem('kidData', JSON.stringify(result.kid));
    setKidSession({ token: result.token, kid: result.kid });
    return result.kid;
  }

  function signOutKid() {
    sessionStorage.removeItem('kidToken');
    sessionStorage.removeItem('kidData');
    setKidSession(null);
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async function signOut() {
    signOutKid();
    await supabase?.auth.signOut();
  }

  const loading = (session === undefined || (session !== null && user === null)) && !kidSession;

  return (
    <AuthContext.Provider value={{
      session, user, kidSession,
      signInWithEmail, signUpWithEmail, signInAsKid, signOutKid, signOut, resetPassword,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
