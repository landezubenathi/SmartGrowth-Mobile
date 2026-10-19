import { getApiBase } from './api';

const SESSION_KEY = 'smartgrowth_account_session_v2';

export function getSession() {
  try {
    const value = JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null');
    if (value?.token && value.expires_at > Math.floor(Date.now()/1000)) return value;
  } catch (_) { /* A corrupt or unavailable store should not bypass sign-in. */ }
  return null;
}
export function saveSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('smartgrowth-auth-changed'));
}
export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('smartgrowth-auth-changed'));
}

export async function authFetch(path, options={}) {
  const session = getSession();
  const headers = {...(options.headers||{})};
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  const response = await fetch(`${getApiBase()}${path}`, {...options, headers});
  if (response.status === 401 && !path.endsWith('/login') && !path.endsWith('/register')) {
    clearSession();
    window.dispatchEvent(new Event('smartgrowth-session-expired'));
  }
  return response;
}

export async function credentialsRequest(path, data) {
  let response;
  try {
    response = await authFetch(`/api/auth/${path}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  } catch (error) {
    throw new Error(`Could not connect to SmartGrowth. Check your backend server and My Journey connection settings.`);
  }
  const result = await response.json().catch(()=>({}));
  if (!response.ok) {
    const detail = result.detail;
    throw new Error(typeof detail==='string'?detail:(Array.isArray(detail)?detail.map(v=>v.msg).join('; '):'Request failed'));
  }
  return result;
}
