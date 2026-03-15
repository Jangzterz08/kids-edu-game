import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Wake Railway server immediately on app load to avoid cold start on first real request
fetch(`${BASE_URL}/health`).catch(() => {});

async function getAuthHeader() {
  // Kid direct login token takes precedence
  const kidToken = sessionStorage.getItem('kidToken');
  if (kidToken) return { Authorization: `Bearer ${kidToken}` };

  // Fall back to Supabase session
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function request(method, path, body) {
  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeader()),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || 'Request failed');
  }

  return res.json();
}

// Public request (no auth header) for kid-lookup and kid-login
async function publicRequest(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
  public: {
    post: (path, body)  => publicRequest('POST', path, body),
  },
};
