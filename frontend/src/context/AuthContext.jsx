import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('massgs_user');
      const token = localStorage.getItem('massgs_token');
      if (savedUser && token) {
        const parsed = JSON.parse(savedUser);
        return { ...parsed, token: parsed.token || token };
      }
      return null;
    } catch (_) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalDefaultRole, setModalDefaultRole] = useState('ROLE_FARMER');
  const [modalDefaultMode, setModalDefaultMode] = useState('LOGIN');

  useEffect(() => {
    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('massgs:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('massgs:auth-expired', handleAuthExpired);
    };
  }, []);

  const login = (authData) => {
    if (!authData) return;
    const token = authData.token || localStorage.getItem('massgs_token');
    const enrichedUser = { ...authData, token };
    setUser(enrichedUser);
    if (token) {
      localStorage.setItem('massgs_token', token);
    }
    localStorage.setItem('massgs_user', JSON.stringify(enrichedUser));
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('massgs_token');
    localStorage.removeItem('massgs_user');
  };

  const openAuthModal = (role = 'ROLE_FARMER', initialMode = 'LOGIN') => {
    setModalDefaultRole(role);
    setModalDefaultMode(initialMode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const isAuthenticated = Boolean(user && (user.token || localStorage.getItem('massgs_token')));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        modalDefaultRole,
        modalDefaultMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
