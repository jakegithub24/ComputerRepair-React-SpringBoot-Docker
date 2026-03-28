import React from 'react';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div role="alert">
        <h1>403 Forbidden</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }
  return children;
}

export default AdminRoute;
