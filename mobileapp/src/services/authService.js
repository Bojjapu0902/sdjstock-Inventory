import api from './api';
import * as SecureStore from 'expo-secure-store';

export async function login(username, password) {
  const data = await api.post('/auth/login', {
    username: username.trim().toLowerCase(),
    password: password.trim(),
  });
  await SecureStore.setItemAsync('auth_token', data.token);
  await SecureStore.setItemAsync('auth_user', JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('auth_user');
}

export async function getStoredUser() {
  try {
    const raw = await SecureStore.getItemAsync('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function forgotPassword(usernameOrEmail) {
  return api.post('/auth/forgot-password', {
    username: usernameOrEmail.trim().toLowerCase(),
  });
}

export async function verifyOtp(usernameOrEmail, otp) {
  return api.post('/auth/verify-otp', {
    username: usernameOrEmail.trim().toLowerCase(),
    otp: otp.trim(),
  });
}

export async function resetPassword(usernameOrEmail, otp, newPassword) {
  return api.post('/auth/reset-password', {
    username: usernameOrEmail.trim().toLowerCase(),
    otp: otp.trim(),
    newPassword,
  });
}

export async function changePassword(currentPassword, newPassword) {
  return api.put('/auth/change-password', { currentPassword, newPassword });
}
