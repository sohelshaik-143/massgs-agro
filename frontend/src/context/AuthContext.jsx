import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('massgs_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalDefaultRole, setModalDefaultRole] = useState('ROLE_FARMER');

  const login = (authData) => {
    setUser(authData);
    if (authData.token) {
      localStorage.setItem('massgs_token', authData.token);
    }
    localStorage.setItem('massgs_user', JSON.stringify(authData));
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('massgs_token');
    localStorage.removeItem('massgs_user');
  };

  const openAuthModal = (role = 'ROLE_FARMER') => {
    setModalDefaultRole(role);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        modalDefaultRole,
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
