// Shared API address for web + Capacitor app. Demo only; not an authenticated API.
// On a phone, localhost is the phone itself, not your Windows PC.
export const API_STORAGE_KEY = 'smartgrowth_mobile_api_url';

export function getApiBase() {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(API_STORAGE_KEY);
      if (saved && /^https?:\/\/[^\s/]+/i.test(saved)) return saved.replace(/\/+$/, '');
    } catch (_) { /* localStorage may be blocked */ }
  }
  // When the app is opened in a PHONE BROWSER over a private Wi-Fi address,
  // connect to FastAPI on the same development PC. Never use this as an Internet URL.
  if (typeof window !== 'undefined' && window.location.protocol === 'http:') {
    const host = window.location.hostname;
    const privateLan = /^(?:10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(host);
    if (privateLan) return `http://${host}:8000`;
  }
  return (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
}

export function isValidApiUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/';
  } catch (_) { return false; }
}

export function saveApiBase(value) {
  const next = value.trim().replace(/\/+$/, '');
  if (!isValidApiUrl(next)) throw new Error('Enter a server address like https://api.example.com or http://192.168.1.10:8000');
  window.localStorage.setItem(API_STORAGE_KEY, next);
  window.dispatchEvent(new Event('smartgrowth-api-updated'));
  return next;
}
