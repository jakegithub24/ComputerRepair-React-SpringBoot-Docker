import React, { createContext, useContext, useState } from 'react';

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

const SESSION_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(SESSION_KEY));
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    const payload = decodeJwt(saved);
    if (!payload) return null;
    return { id: payload.userId, username: payload.sub, role: payload.role };
  });

  function login(newToken) {
    const payload = decodeJwt(newToken);
    if (!payload) return null;
    const user = { id: payload.userId, username: payload.sub, role: payload.role };
    sessionStorage.setItem(SESSION_KEY, newToken);
    setToken(newToken);
    setCurrentUser(user);
    return user;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
