import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ChangePasswordModal from './ChangePasswordModal';

function Navbar({ title = 'TechFix' }) {
  const { currentUser, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [showChangePwd, setShowChangePwd] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <>
      <nav className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            <span className="font-bold text-lg text-slate-800 dark:text-white">{title}</span>
          </Link>

          <div className="flex items-center gap-3">
            {currentUser && (
              <span className="hidden sm:block text-sm text-slate-500 dark:text-slate-400">
                👤{' '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{currentUser.username}</span>
                {currentUser.role === 'ADMIN' && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded font-semibold">
                    ADMIN
                  </span>
                )}
              </span>
            )}

            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => setShowChangePwd(true)}
                  className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  🔑 Password
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {showChangePwd && <ChangePasswordModal onClose={() => setShowChangePwd(false)} />}
    </>
  );
}

export default Navbar;
