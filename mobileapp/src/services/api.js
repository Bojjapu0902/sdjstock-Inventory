import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '../config/api';

const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach JWT from secure storage on every request
client.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* noop */ }
  return config;
});

// Unwrap data; surface error.message from backend
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(msg));
  },
);

export default client;
