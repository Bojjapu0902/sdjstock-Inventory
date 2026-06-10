// Centralised fetch wrapper for all API calls.
// Reads JWT from sessionStorage and injects it as Bearer token.

//const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE = process.env.REACT_APP_API_URL || 'https://sdjstock-inventory.onrender.com/api'
const SESSION_KEY = 'adjmarine_current_user';

function getToken() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw)?.token : null;
  } catch { return null; }
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),
};

export default api;
