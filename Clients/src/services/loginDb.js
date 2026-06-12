// =====================================================
//  Login Authentication — MongoDB-backed via REST API
// =====================================================
import api from './api';

const SESSION_KEY = 'adjmarine_current_user';

/* ══════════════════════════════════════════════════
   AUTHENTICATION
   ══════════════════════════════════════════════════ */

/**
 * Validate credentials against the API.
 * Returns the matched user object (with token) or null.
 */
export async function authenticate(username, password) {
  if (!username || !password) return null;
  try {
    const { user, token } = await api.post('/auth/login', {
      username: username.trim().toLowerCase(),
      password: password.trim(),
    });
    return { ...user, token };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════
   SESSION  —  who is currently logged in
   ══════════════════════════════════════════════════ */

export function setCurrentUser(user) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* noop */ }
}

export function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearCurrentUser() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

/* ══════════════════════════════════════════════════
   USER MANAGEMENT  (admin panel)
   ══════════════════════════════════════════════════ */

export async function getUsers() {
  return api.get('/users');
}

export async function createUser(_users, formData) {
  try {
    const user = await api.post('/users', formData);
    return { updated: user, error: null };
  } catch (err) {
    return { updated: null, error: err.message };
  }
}

export async function deleteUser(_users, userId) {
  await api.delete(`/users/${userId}`);
}

export async function addProjectUser(_users, formData) {
  return api.post('/users', { ...formData, role: 'User' });
}

export async function updateProjectUser(_users, { projectId, projectName, username, password }) {
  const users = await getUsers();
  const existing = users.find((u) => u.projectId === projectId);
  if (!username && !password) {
    if (existing) await api.delete(`/users/${existing.id}`);
    return;
  }
  if (existing) {
    return api.put(`/users/${existing.id}`, {
      username: username || existing.username,
      password: password || undefined,
      name: projectName,
    });
  }
  return addProjectUser(null, { projectId, projectName: projectName, username, password });
}

export async function deleteProjectUser(_users, projectId) {
  const users = await getUsers();
  const user  = users.find((u) => u.projectId === projectId);
  if (user) await api.delete(`/users/${user.id}`);
}

export function saveUsers() { /* no-op: API handles persistence */ }
export function clearUsers() { /* no-op */ }

/* ══════════════════════════════════════════════════
   PASSWORD RESET
   ══════════════════════════════════════════════════ */

export async function forgotPassword(username) {
  try {
    return await api.post('/auth/forgot-password', { username: username.trim().toLowerCase() });
  } catch (err) {
    throw new Error(err.message || 'Failed to send OTP');
  }
}

export async function verifyOtp(username, otp) {
  try {
    return await api.post('/auth/verify-otp', {
      username: username.trim().toLowerCase(),
      otp: otp.trim(),
    });
  } catch (err) {
    throw new Error(err.message || 'OTP verification failed');
  }
}

export async function resetPassword(username, otp, newPassword) {
  try {
    return await api.post('/auth/reset-password', {
      username: username.trim().toLowerCase(),
      otp: otp.trim(),
      newPassword,
    });
  } catch (err) {
    throw new Error(err.message || 'Failed to reset password');
  }
}