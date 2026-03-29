import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children, userOnly = false }) {
  const { token, currentUser } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If userOnly and the logged-in user is admin, redirect to admin panel
  if (userOnly && currentUser?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default PrivateRoute;
