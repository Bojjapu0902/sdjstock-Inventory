import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as svcLogin, logout as svcLogout, getStoredUser } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then((u) => { setUser(u); setLoading(false); });
  }, []);

  async function login(username, password) {
    const u = await svcLogin(username, password);
    setUser(u);
    return u;
  }

  async function logout() {
    await svcLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
