import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const userRole = user.role.toUpperCase();
    const hasRole = allowedRoles.some(r => r.toUpperCase() === userRole || `ROLE_${r.toUpperCase()}` === userRole);
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
