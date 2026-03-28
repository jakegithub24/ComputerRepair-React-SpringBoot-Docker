import React, { createContext, useContext, useState } from 'react';

/**
 * Decode a JWT payload without verifying the signature.
 * Returns the parsed payload object, or null on failure.
 */
function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → decode
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  function login(newToken) {
    const payload = decodeJwt(newToken);
    if (!payload) return;
    setToken(newToken);
    setCurrentUser({
      id: payload.userId,
      username: payload.sub,
      role: payload.role,
    });
  }

  function logout() {
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
