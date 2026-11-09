// =====================================================
//  Login Authentication — MongoDB-backed via REST API
// =====================================================
import api from './api';
import { DEMO_USER, DEMO_USERNAME, DEMO_PASSWORD, DEMO_TOKEN } from './demoSandbox';

const SESSION_KEY = 'adjmarine_current_user';

/* ══════════════════════════════════════════════════
   AUTHENTICATION
   ══════════════════════════════════════════════════ */

/**
 * Validate credentials against the API.
 * Returns the matched user object (with token), or null for wrong credentials.
 * Anything else (deactivated account, server unreachable) is thrown so the
 * login page doesn't report it as a wrong password.
 */
export async function authenticate(username, password) {
  if (!username || !password) return null;

  // Demo account: validated locally, never sent to the server.
  if (username.trim().toLowerCase() === DEMO_USERNAME) {
    return password.trim() === DEMO_PASSWORD ? { ...DEMO_USER, token: DEMO_TOKEN } : null;
  }

  try {
    const { user, token } = await api.post('/auth/login', {
      username: username.trim().toLowerCase(),
      password: password.trim(),
    });
    return { ...user, token };
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
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

export function saveUsers() { /* no-op: API handles persistence */ }
export function clearUsers() { /* no-op */ }

/* ══════════════════════════════════════════════════
   PASSWORD RESET
   ══════════════════════════════════════════════════ */

export async function sendChangePasswordOtp() {
  return api.post('/auth/change-password/send-otp', {});
}

export async function confirmChangePassword(otp, newPassword) {
  return api.post('/auth/change-password/confirm', { otp: otp.trim(), newPassword });
}

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