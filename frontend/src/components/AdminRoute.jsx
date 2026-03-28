import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminRoute({ children }) {
  const { currentUser, token } = useAuth();

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Not Authenticated</h1>
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</Link>
        </div>
      </div>
    );
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">403 — Forbidden</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-4">You don't have permission to access this page.</p>
          <Link to="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return children;
}

export default AdminRoute;
