// Centralised fetch wrapper for all API calls.
// Reads JWT from sessionStorage and injects it as Bearer token.
import { handleDemoRequest } from './demoSandbox';


//const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE = process.env.REACT_APP_API_URL || 'https://sdjstock-inventory-api-9m1r.onrender.com/api'
const SESSION_KEY = 'adjmarine_current_user';

function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function request(method, path, body) {
  const session = getSession();

  // The demo user is sandboxed: requests are answered from a private copy of the
  // data in this browser and never reach the real server or database.
  if (session?.isDemo) return handleDemoRequest(method, path, body);

  const token = session?.token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),
};

export default api;
