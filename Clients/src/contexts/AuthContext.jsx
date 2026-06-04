import { createContext, useContext, useState, useCallback } from 'react';
import { setCurrentUser, clearCurrentUser, getCurrentUser } from '../data/loginDb';

const AuthContext = createContext(null);

/**
 * Wraps the whole app. Provides user identity and auth actions to any
 * descendant via useAuth() — no prop drilling needed.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  const login = useCallback((userData) => {
    setCurrentUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearCurrentUser();
    window.history.replaceState(null, '', '/');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
